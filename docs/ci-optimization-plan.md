# CI and release optimisation plan

Three PRs, each with one purpose. W1 must land first, because W2 builds on the
SHA it resolves.

| PR | Purpose | Status |
|---|---|---|
| W1 | The release gate checks the exact commit it ships, and fails closed | this branch |
| W2 | One release orchestrator: the gate runs once; the ZIP and the image are built, validated and checksummed once, then deployed and published by digest | planned |
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
