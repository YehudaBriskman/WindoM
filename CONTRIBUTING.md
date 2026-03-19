# Contributing to WindoM

Thanks for your interest in contributing. Here is everything you need to know.

## Before you start

- Check the [open issues](https://github.com/YehudaBriskman/WindoM/issues) to see if someone is already working on the same thing.
- For large changes, open an issue first to discuss the approach before writing code.
- For small fixes (typos, minor bugs), just open a pull request directly.

## Setting up locally

Follow the [Local Setup Guide](https://yehudabriskman.github.io/WindoM/local-setup.html) to get the project running on your machine.

## Making changes

1. Fork the repository and create a branch from `main`.
2. Name your branch clearly — for example `fix/weather-refresh` or `feat/new-widget`.
3. Make your changes. Keep commits focused and readable.
4. Make sure the extension builds without errors: `cd web && npm run build`.
5. If you changed backend code, make sure it compiles: `cd backend && npm run build`.
6. Open a pull request against `main` with a clear description of what you changed and why.

## Project structure

```
web/        Chrome extension (React + Vite + TypeScript)
backend/    API server (Fastify + Drizzle + PostgreSQL)
docs/       GitHub Pages (privacy policy, setup guide)
```

## Code style

- TypeScript everywhere — no implicit `any`.
- Follow the existing patterns in each package. There is no linter config to fight with.
- For the extension, keep new components in `web/src/components/` and new hooks in `web/src/hooks/`.
- For CSS, use the existing classes from `globals.css`. Do not add Tailwind utility classes for backgrounds, borders, or shadows.

## Reporting bugs

Use the [bug report template](https://github.com/YehudaBriskman/WindoM/issues/new?template=bug_report.md).

## Suggesting features

Use the [feature request template](https://github.com/YehudaBriskman/WindoM/issues/new?template=feature_request.md).
