# Contributing to WindoM

Thanks for your interest in contributing. Here is everything you need to know.

## Before you start

- Check the [open issues](https://github.com/YehudaBriskman/WindoM/issues) to see if someone is already working on the same thing.
- For large changes, open an issue first to discuss the approach before writing code.
- For small fixes (typos, minor bugs), just open a pull request directly.

## Setting up locally

Follow the [Local Setup Guide](https://windom.app/local-setup.html) to get the project running on your machine.

## Making changes

1. Fork the repository and create a branch from `main`.
2. Name your branch clearly - for example `fix/weather-refresh` or `feat/new-widget`.
3. Make your changes. Keep commits focused and readable.
4. Make sure the extension builds without errors: `cd web && npm run build`.
5. If you changed backend code, make sure it compiles: `cd backend && npm run build`.
6. Run the tests CI will run anyway: `npm test` in whichever package you touched. The backend suite needs Postgres - `docker compose up -d db` first.
7. Open a pull request against `main` with a clear description of what you changed and why.

## Project structure

```
web/        Chrome extension (React + Vite + TypeScript)
backend/    API server (Fastify + Drizzle + PostgreSQL)
site/       windom.app - Vite + React, deployed to GitHub Pages by workflow
```

## Code style

- TypeScript everywhere - no implicit `any`.
- Follow the existing patterns in each package. Both ship ESLint and Prettier: run `npm run lint` and `npm run format` in `web/` or `backend/`.
- For the extension, keep new components in `web/src/components/` and new hooks in `web/src/hooks/`.
- For CSS, use the existing classes from `globals.css`. Do not add Tailwind utility classes for backgrounds, borders, or shadows.

## Database migrations

Every migration must be **backward-compatible with the previous release**: the app version currently in production has to keep working against the migrated schema.

This is not a style preference. Migrations run in Fly's `release_command` *before* the new release's health check, and if that check fails the release workflow automatically redeploys the previous image ([#228](https://github.com/YehudaBriskman/WindoM/issues/228)). It does **not** revert migrations. So the previous image will run against your new schema.

- Allowed in one release: add a table, add a nullable column or one with a default, add an index, widen a type.
- Not allowed in one release: drop or rename a table or column, add `NOT NULL` without a default, narrow a type, change what an existing column means.
- Destructive changes take two releases (expand, then contract). Release 1 adds the new shape and code that works with both. Release 2, once release 1 is live and healthy, removes the old shape.

Generate migrations with `npx drizzle-kit generate` in `backend/` and commit the result. CI fails if `schema.ts` changed without a committed migration.

## Reporting bugs

Use the [bug report template](https://github.com/YehudaBriskman/WindoM/issues/new?template=bug_report.md).

## Suggesting features

Use the [feature request template](https://github.com/YehudaBriskman/WindoM/issues/new?template=feature_request.md).
