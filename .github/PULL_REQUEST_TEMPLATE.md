<!--
Security vulnerabilities do not belong in a pull request - see SECURITY.md.
-->

## What changed

<!-- One or two sentences. Which package: web/, backend/ or site/. -->

## Why

<!-- The problem this solves. Link the issue if there is one. -->

## How it was verified

<!-- The commands you ran and what you saw. A screenshot for anything visual. -->

## Checklist

- [ ] `npm run lint` and `npm run format:check` pass in every package I touched
- [ ] `npm test` passes in every package I touched (the backend suite needs `docker compose up -d db`)
- [ ] The extension builds - `cd web && npm run build`
- [ ] If I changed `backend/src/db/schema.ts`, the migration is committed and backward-compatible with the previous release (see CONTRIBUTING.md)
- [ ] User-visible changes are described above, so the next CHANGELOG entry can carry them
