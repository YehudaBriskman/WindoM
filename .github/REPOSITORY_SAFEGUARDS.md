# Repository and release safeguards

## Main branch

Verified in GitHub on 2026-10-16:

- Pull requests require one approving review; code-owner review remains enabled.
- New commits dismiss stale approvals.
- Branches must be up to date and pass both GitHub Actions checks:
  - `Backend - lint / typecheck / test`
  - `Web - lint / typecheck / build`
- Force pushes and branch deletion are blocked.
- The existing administrator bypass is retained. Administrators should use the same PR/check workflow; these protections do not prevent an administrator override.

These are repository settings, not settings applied automatically by this document.
If CI job names change, update the required checks in GitHub at the same time.
Inspect the live configuration with:

```sh
gh api repos/YehudaBriskman/WindoM/branches/main/protection
```

## Dependency updates

Dependabot checks backend npm, web npm, and GitHub Actions dependencies weekly.
Compatible minor/patch version updates are grouped per ecosystem/package directory;
major version updates stay separate for review. npm security updates have separate
groups when Dependabot security updates are enabled in repository settings.
Dependency PRs run the same required CI checks. There is no automatic merge.

## Release validation and artifacts

Chrome publishing validates all five required secrets before installing dependencies:
`CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`,
`CHROME_REFRESH_TOKEN`, and `VITE_BACKEND_URL`. Missing/blank values fail together
with names-only diagnostics. The backend URL must use HTTPS without embedded
credentials. This verifies configuration shape, not credential validity at Google.

CI retains the built extension directory, and the publishing workflow retains the
exact ZIP before uploading it to the store. Both artifacts expire after five days
and can be downloaded from the workflow run's Artifacts section. A later store
upload failure does not remove the previously uploaded ZIP artifact.

The Fly backup step passes the app name through a quoted environment variable and
does not explicitly print it. Fly CLI output is still subject to GitHub's normal
secret masking. No release/deployment is triggered by a pull request; production
workflows remain tag-triggered and Chrome publishing uses the `chrome-store` environment.

Run the preflight tests locally:

```sh
node --test .github/scripts/validate-publish-env.test.mjs
```
