# Deployment runbook

How the backend (`windom-api` on Fly.io) is released, rolled back, and where its
logs live. The release pipeline itself is explained in
[ci-optimization-plan.md](ci-optimization-plan.md); this page is what to do
with it.

## Releasing

Push a `v*` tag on `main`, or run the **Release** workflow by hand with an
existing tag. `.github/workflows/release.yml`, job `deploy`, then:

1. Pushes the image the release gate scanned to `registry.fly.io/windom-api:release-<sha>`.
2. Takes a Postgres backup (`flyctl postgres backup create`). No backup, no deploy.
3. Records the image production runs now (the rollback target).
4. `flyctl deploy --image ...`. Fly's `release_command` runs the migrations first.
5. Checks `https://windom-api.fly.dev/health/ready` (readiness, not liveness).
6. Checks that every started machine runs the pushed digest.

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
retention window. Two things for the owner to decide:

- The privacy policy (`site/src/pages/Privacy.tsx`) says all data is deleted
  "permanently and immediately". Logs (up to the Fly window) and the pre-deploy
  Postgres backups (retention set on the Fly Postgres app, not in this repo) are
  not. Either state those windows in the policy or change what is kept.
- If an erasure request must cover logs inside the window, Fly support is the
  only route the repo knows of.
