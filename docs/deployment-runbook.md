# Deployment runbook

How the backend (`windom-api` on Fly.io) is released, rolled back, and where its
logs live. The release pipeline itself is explained in
[ci-optimization-plan.md](ci-optimization-plan.md); this page is what to do
with it.

## Releasing

**Before tagging**, the latest **Release Rehearsal** run on `main` should be green
(Actions > Release Rehearsal; it runs every Monday and on any PR that touches the
release machinery, and can be started by hand). It runs everything below that can
run without touching production. If it is red, fix that first - it is the same
failure the release would hit.

Push a `v*` tag on `main`, or run the **Release** workflow by hand with an
existing tag. `.github/workflows/release.yml` then:

0. Runs the release gate and, in parallel, **Store login**: the Chrome Web Store
   credentials must work before anything ships. The backend never deploys unless
   the extension will be able to follow it.

Then job `deploy` (shown under the repo's **Deployments** as `production`):

1. Pushes the image the release gate scanned to `registry.fly.io/windom-api:release-<sha>`
   (`.github/scripts/push-image.sh`), and resolves the digest a machine will run:
   the linux/amd64 image manifest inside the OCI index `docker push` uploads.
2. Takes a Postgres backup (`flyctl postgres backup create`). No backup, no deploy.
3. Records the image production runs now (the rollback target).
4. `flyctl deploy --image ...`. Fly's `release_command` runs the migrations first.
5. Checks `https://windom-api.fly.dev/health/ready` (readiness, not liveness).
6. Checks that every started machine runs the pushed image (its manifest digest,
   or the index digest - both name exactly the scanned image).

The extension publishes only after all of that passed.

## Automatic rollback (#228)

If step 4, 5 or 6 fails, the step **Roll back to the previous image**:

- redeploys the image recorded in step 3 (its tag, then verifies its digest on
  the machines),
- re-checks readiness against the rolled-back app,
- writes what failed, what it rolled back to, and the result to the run's
  summary page,
- and fails the job either way. A rolled-back release is a failed release.

It skips the redeploy when it would change nothing: the new release never went
live (every machine is still on the previous digest), or the release was the
image already running. The decisions are in
`.github/scripts/deploy-rollback.mjs` with tests beside it.

**Migrations are not reverted.** They ran in step 4 and stay applied. The old
image's `release_command` re-runs during the rollback and applies nothing,
because drizzle only applies migrations newer than the newest one recorded in
the database. This is why every migration must be backward-compatible with the
previous release: see "Database migrations" in [CONTRIBUTING.md](../CONTRIBUTING.md).

**Rollback is unavailable** when step 3 could not record a single image: the
Fly API call failed, no machine was started, or machines ran different images
(an earlier deploy never finished). The deploy goes ahead anyway with a warning,
because a read of the Fly API failing makes the deploy no riskier than every
deploy before #228 was. If that deploy then fails, roll back by hand.

## Rolling back by hand

Code only, when the automatic rollback was unavailable or failed:

```sh
flyctl machine list --app windom-api --json  # .image_ref shows what is running
flyctl deploy --app windom-api --image registry.fly.io/windom-api:release-<good sha>
```

The last good image is the "Previous:" line of the failed run's **Deployment
summary** or the "Rollback target:" line of its **Record the image production
runs now** step; for any earlier release, its `release-<sha>` tag. Run the
deploy from `backend/` so it picks up `fly.toml`. Then confirm `/health/ready`
returns 200.

Database: each release's backup was taken in step 2; its time is in the run
log ("Backup at"). Restoring replaces data written since, so it is a decision,
not a reflex. Check the current restore procedure with
`flyctl postgres backup --help` and Fly's Postgres docs before relying on it;
this repo does not script a restore.

## Log retention (#255)

### Where logs are written

| Source | What it logs | Where it goes |
|---|---|---|
| Fastify request logger (`backend/src/app.ts`) | per request: id, method, **full URL including query string**, client IP (`remoteAddress`) | stdout, JSON (pino), level `info` in production |
| Service logger (`backend/src/lib/logger.ts`) | warnings and errors; some carry a `userId` or `sessionId` (e.g. `auth.service.ts`), and `email.ts` logs the recipient address when SMTP is not configured | stdout, JSON (pino) |
| `release_command` machine | migration output | stdout |
| Postgres app (`FLY_POSTGRES_APP`) | database server logs | Fly, as for any Fly app |

The serializer never logs `Authorization` headers or cookies. It does log the
URL, so the single-use tokens in `/auth/verify-email?token=` and
`/auth/reset-password?token=` links reach the logs.

### How long they are kept

- **Fly.io log search: 7 days.** Fly's logging overview states that log search
  "retains logs for 7 days" (<https://fly.io/docs/monitoring/logging-overview/>,
  read 2026-11-03). The repo cannot show which plan the org is on, or whether
  Fly has changed the figure since. Confirm in the Fly dashboard: the app's
  **Logs** page, and the org's plan under **Billing**. `flyctl logs` is a live
  tail, not an archive.
- **No export or archive.** Nothing in the repo ships logs anywhere else: no
  Fly Log Shipper app, no log or error-tracking SDK in `backend/package.json`,
  no logging section in `backend/fly.toml`. Logs therefore exist only inside
  Fly's retention window. If a log shipper is ever added, its retention becomes
  the real number and this section must change.
- **GitHub Actions run logs** (deploy output, no request logs): kept for the
  repository's configured retention, GitHub's default being 90 days. Check
  **Settings > Actions > General > Artifact and log retention**. Build artifacts
  set their own shorter `retention-days` (3-5 days) in the workflows.

### Policy

Logs are not archived. They age out of Fly after the retention above, which is
the window available for incident investigation. This is the current state,
recorded here; changing it (for example, shipping logs somewhere with a longer
or shorter window) is the owner's decision and must update this section.

### Erasure requests (GDPR)

Deleting an account (`Settings > Account > Delete account`) removes the user's
database rows immediately. It cannot remove log lines already written: request
logs carry the user's IP address, and some service logs carry their user id.
Nothing in the repo deletes individual log lines from Fly; they expire with the
retention window.

- **Decided 2026-11-03:** the privacy policy (en and he) says account data is
  deleted from the database immediately, and copies in server logs and database
  backups expire within **30 days**. That promise holds only while Fly log search
  stays at 7 days and the Postgres backup retention (set on the Fly Postgres app,
  not in this repo) stays at 30 days or less. Changing either means changing the
  policy first.
- If an erasure request must cover logs inside the window, Fly support is the
  only route the repo knows of.

## Chrome Web Store credentials

The store upload signs in to Google with three secrets in the **`chrome-store`
GitHub environment** (Settings > Environments > chrome-store). Environment
secrets override repository secrets of the same name, so always set them with
`--env chrome-store`; a repository-level copy is never read.

| Secret | What it is |
|---|---|
| `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET` | The OAuth client *WindoM - Chrome Web Store publishing* (Google Cloud > APIs & Services > Credentials). Used for nothing else. |
| `CHROME_REFRESH_TOKEN` | The store owner's consent for that client, scope `https://www.googleapis.com/auth/chromewebstore`. |
| `CHROME_EXTENSION_ID`, `CHROME_PUBLISHER_ID` | Identify the item; they do not expire. |

**Keep the publishing client separate from the app's own Google sign-in client.**
Google keeps about 100 refresh tokens per user per client and silently revokes
the oldest; a shared client loses the store's token to ordinary sign-ins.

**Test without releasing:** `gh workflow run store-status.yml` (read-only). The
weekly Release Rehearsal does the same.

**Renewing the token** (`invalid_grant` / `Token exchange failed: HTTP 400`):

1. https://developers.google.com/oauthplayground > gear icon > *Use your own OAuth
   credentials* with the publishing client's ID and secret. The client must list
   `https://developers.google.com/oauthplayground` as an authorized redirect URI.
2. Scope `https://www.googleapis.com/auth/chromewebstore` > *Authorize APIs* >
   sign in as the store owner > *Exchange authorization code for tokens*.
3. Verify before saving (prints only the verdict):
   ```zsh
   read -r "CID?Client ID: "; read -rs "CSEC?Client secret: "; echo; read -rs "RT?Refresh token: "; echo
   curl -s https://oauth2.googleapis.com/token -d client_id="$CID" -d client_secret="$CSEC" \
     -d refresh_token="$RT" -d grant_type=refresh_token \
     | jq -r 'if .access_token then "OK" else "FAILED: \(.error)" end'; unset CID CSEC RT
   ```
4. `gh secret set CHROME_REFRESH_TOKEN --env chrome-store`, then
   `gh workflow run store-status.yml`.

## Incident: v1.6.0 release, 2026-11-04

Three separate failures, each in code that had never run before release day.
Production was never broken: the first stopped before deploying, the second was
rolled back automatically to 1.5.1, the third left the server on 1.6.0 and the
extension on 1.5.1 until the token was renewed.

| # | What failed | Root cause | Why nothing caught it | Now prevented by |
|---|---|---|---|---|
| 1 | Gate > Container image > scan, twice, curl exit 6 | `aquasecurity/trivy-action`'s installer downloads only from `get.trivy.dev`, which stopped resolving | The gate runs only on a tag (or a manual rehearsal nobody ran) | Trivy installed from its GitHub release, SHA-256 pinned (#473); weekly rehearsal runs the whole gate |
| 2 | Deploy > "Production runs the image the gate scanned"; rolled back | Docker's containerd image store makes `docker push` upload an OCI **index** and report its digest; Fly records the **linux/amd64 manifest** inside it. The check compared the two, which can never be equal | The step first ran on this release (`release.yml` replaced the old deploy after 1.5.1); its unit tests used invented data in which both digests were the same | `runtime-digest.mjs` resolves the platform manifest from the registry's bytes, tested on the real v1.6.0 index (#474); the check accepts either digest of the pushed image; the push step is a shared script the rehearsal runs weekly against a local registry |
| 3 | Publish > upload, `invalid_grant` | The store's refresh token was revoked by Google. The consent screen was already in production, so not the 7-day testing expiry; most likely the client was shared with the app's Google sign-in and lost its token to the per-client limit | Store credentials were only used during a release, after the backend had deployed | A dedicated publishing client; **Store login** runs before the deploy, so a bad token stops the release with nothing shipped; the weekly rehearsal checks the token |

