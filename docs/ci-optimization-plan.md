# CI and release optimisation plan

Three PRs, each with one purpose. W1 must land first, because W2 builds on the
SHA it resolves.

| PR | Purpose | Status |
|---|---|---|
| W1 | The release gate checks the exact commit it ships, and fails closed | merged (#425) |
| W2 | One release orchestrator: the gate runs once; the ZIP and the image are built, validated and checksummed once, then deployed and published by digest | this branch |
| W3 | Component path filters, cancelling superseded PR runs, scoped caches and timeouts; one site validation on main | planned |

## W1 - what was wrong

Found by reading `release-gate.yml`, `deploy-backend.yml` and `publish-chrome.yml`
on main `5bc3f0c` (2026-11-02).

1. **The gate and the publish could check different commits.** Every gate job
   checked out the triggering ref. On a manual publish (`workflow_dispatch` with
   `inputs.tag`), that is the branch the dispatch ran from, but `publish` checked
   out and uploaded `inputs.tag`. The version check did not notice, because main
   and an older tag usually declare the same version.
2. **"Tagged commit must be on main" was skipped for every manual run**
   (`if: github.ref_type == 'tag'`). That includes the publish path, which is
   the one path that takes an arbitrary tag name. A missing tag was not checked
   either.
3. **A skipped gate job counted as a pass.** The summary failed only on
   `failure` or `cancelled`, so a `skipped` job let the release through.
4. **New, untracked migrations were invisible.** The drift check was
   `git diff --exit-code -- drizzle`, which ignores untracked files. That is the
   usual shape of drift: `drizzle-kit generate` writes a new `NNNN_name.sql`.

## W1 - what changed

- **`resolve` job** (`.github/scripts/resolve-release-ref.mjs`). It turns the
  tag into one SHA, then checks each of these:
  - the tag is version-shaped (checked before git sees it);
  - the tag exists;
  - the tag is on `origin/main`;
  - on a tag push, the tag is still the commit that triggered the run.

  Every gate job, the deploy and the publish then check out
  `needs.gate.outputs.sha`.
- **Rehearsal is kept.** A direct dispatch of `release-gate.yml` leaves the new
  `release` input null. A null input does not require the tag, so a version that
  is not tagged yet is rehearsed at the dispatch ref. A rehearsal never deploys
  or publishes anything.
- **The summary requires `success` from every job** and names any job that is
  missing from `needs` (`.github/scripts/check-gate-results.mjs`).
- **The drift check uses `git status --porcelain --untracked-files=all`**
  (`.github/scripts/check-migration-drift.mjs`).
- **`deploy-backend.yml` gets an explicit `permissions: contents: read`.**

All three scripts are pure decisions, with tests in the existing
`node --test .github/scripts/*.test.mjs` run. They run in CI on every PR
("Test release safeguards") and again in the gate's metadata job. Nothing in
W1 needs a tag, a deploy or a store upload to test.

**Verified locally against real git:**

| Case | Result |
|---|---|
| Tag push of `v1.5.1` | releases `c8904f5` |
| Manual publish of `v1.5.1` dispatched from main `5bc3f0c` | releases `c8904f5` (the tag), not main |
| Missing tag | refused |
| Rehearsal of an untagged `v1.6.0` | runs at the dispatch ref |
| Tag on an off-main commit, by push or by manual publish | refused |
| Untracked `drizzle/9999_probe.sql` | the new check exits 1; the old `git diff` exits 0 |

actionlint shows the same 7 pre-existing findings before and after the change.

## Deliberately not in W1

- **The publish job still rebuilds the extension** instead of shipping the
  gate's artifact, and Fly still builds the image remotely. Both are now built
  from the gate's SHA. Shipping the exact validated artifact or image digest
  is W2.
- **No concurrency changes on deploy or publish.** These must never be
  cancelled, and W2 replaces the two tag-triggered workflows with one
  orchestrator anyway.

## W2 - what was wrong

Found by reading `deploy-backend.yml`, `publish-chrome.yml` and `release-gate.yml`
on main `798f1e4` (2026-11-02).

1. **Every release ran the whole gate twice.** Both workflows triggered on the
   same tag, and each called `release-gate.yml`.
2. **Neither workflow shipped what the gate checked.**
   - The gate built and Trivy-scanned an image, then threw it away. The deploy
     ran `flyctl deploy --remote-only`, so Fly built the Dockerfile again.
   - The gate built and checked `web/dist`. The publish job then ran
     `npm ci && npm run build` again and uploaded that rebuild. Its backend
     origin also came from a different expression: the gate fell back to the
     production URL, while the publish used the secret alone.
3. **The deploy and the publish raced.** A failed deploy could still put an
   extension that needs the new API in front of users, and a store upload
   cannot be taken back.

## W2 - what changed

**`release.yml` replaces both workflows.** It triggers on a `v*` tag, or on a
manual run with `tag` and `targets` (`extension`, `backend` or `both`). It calls
the gate once, then:

- **Deploy backend**
  1. Download the gate's image and check its ID against the one the gate
     recorded.
  2. Push it to `registry.fly.io/windom-api:release-<sha>`, then confirm the
     registry resolves that tag to the digest the push reported. This proves
     registry access and the credential **before the backup**, so a registry
     problem changes nothing in production.
  3. Take the backup (unchanged).
  4. Run `flyctl deploy --image <that tag>`. `release_command` still runs the
     migrations, from the same image.
  5. Check readiness (unchanged).
  6. Check that every started app machine runs the pushed digest
     (`check-deployed-image.mjs`, reading `fly machine list --json`).
- **Publish extension**
  - It runs only after a **successful** deploy, or on a manual
    `targets: extension` run.
  - It downloads the gate's `extension.zip` and `release-info.json`, then
    refuses to upload unless all of these match (`release-package.mjs`):
    - the ZIP's sha256;
    - the commit;
    - the tag and manifest version;
    - the backend origin (against `VITE_BACKEND_URL`).
  - It no longer runs `npm ci` or a build.

**The gate now produces both artifacts:**
- The web job zips the dist it validated and writes `release-info.json` with
  `jq`. It uses no repo script, so a tag cut before W2 can still be released.
- The container job `docker save`s the image it scanned, uncompressed in the
  artifact store since it is already gzipped, with a 3-day retention.

**Release scripts come from the workflow's ref.** Deploy and publish read their
release scripts from a sparse checkout of the ref the workflow runs from, not
from the tag. A republish of an older tag therefore has every check.

**Concurrency:** `release-<tag>`, never cancelled.

**Verified locally:**

| Case | Result |
|---|---|
| `node --test .github/scripts/*.test.mjs` | 143 pass, including 17 new cases |
| The gate's packaging shell, run verbatim on a stand-in `dist`, then verified by `release-package.mjs` | the exact file passes; another backend, another tag, or one appended byte is refused |
| `docker save` → `gzip` → `docker load` | the image ID is identical |
| The push step's digest parsing, against a throwaway local `registry:2` | the digest from `docker push` equals `buildx imagetools inspect` |
| actionlint | no new findings; the two SC2086 findings left with `deploy-backend.yml` |

**Not verified:** a real push to registry.fly.io and a real deploy and publish.
They need production credentials and a tag. Fly documents
`fly deploy --image` for images CI pushes itself. **Deploying by `@sha256:`
digest is not documented, so W2 deploys the per-commit tag and verifies the
digest on the running machines afterwards.**

**First release after merge:**
1. Dispatch Release Gate with the candidate version (rehearsal). Both
   `release-extension-<sha>` and `release-image-<sha>` should appear as
   artifacts.
2. Tag the release. If the first push to registry.fly.io fails on access, the
   run stops before the backup.
