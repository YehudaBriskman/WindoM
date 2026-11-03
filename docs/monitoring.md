# Monitoring and security alerting (Sentry)

The backend reports errors to Sentry when `SENTRY_DSN` is set (issue #204). With no
DSN, `initSentry()` never calls `Sentry.init()`: there is no client, no transport and
no network traffic. Local development and CI run that way.

Code: `backend/src/lib/sentry.ts`. Wiring: `backend/src/index.ts` (init),
`backend/src/app.ts` (global error handler), `backend/src/services/auth.service.ts`
(token reuse).

## What is reported

| Signal | Level | Fingerprint | Tag | Source |
|---|---|---|---|---|
| Any response with status >= 500 | `error` | Sentry default (per stack) | `http.status_code`, `http.route`, `http.method` | global error handler |
| Uncaught exception / unhandled rejection | `fatal` / `error` | Sentry default | - | SDK integrations |
| DB pool exhaustion (the 503 path) | `error` | `infra` + `db-pool-exhausted` | `infra=db_pool_exhausted` | global error handler, with pool `total/idle/waiting/max` |
| Refresh-token reuse (`TOKEN_REUSE_DETECTED`) | `fatal` | `security` + `token-reuse-detected` | `security=token_reuse` | `refresh()` in auth.service |

4xx responses are not reported.

## What is never sent

Two layers, so either alone is enough:

1. `dataCollection` (the @sentry/node v11 replacement for `sendDefaultPii: false` -
   its defaults are permissive, so it is set explicitly): no user info, cookies, request
   or response bodies, query strings, DB query data or stack-frame local variables;
   request headers limited to `content-type`, `content-length`, `accept`, `accept-encoding`.
2. `beforeSend` / `beforeBreadcrumb` (`scrubEvent`, `scrubBreadcrumb`): deletes
   `request.data`, `request.cookies`, `request.query_string`, `request.env`, strips query
   strings from URLs, keeps only allowlisted headers, reduces `user` to `{ id }`, removes
   frame `vars`, redacts any key matching password/token/secret/authorization/cookie/
   email/ip/api key/credential/refresh/code, and replaces emails, JWTs, `Bearer`/`Basic`
   credentials and `?query` strings inside messages and exception values with `[Filtered]`.

The default integrations are disabled; no console or pino log capture is installed,
because log lines carry emails. `src/lib/__tests__/sentry.test.ts` asserts on the
serialised envelope bytes that none of these values leave the process.

## Release and environment

- `environment` = `SENTRY_ENVIRONMENT`, else `NODE_ENV` (`production` on Fly, from fly.toml).
- `release` = `SENTRY_RELEASE`, else `windom-backend@<package.json version>+<commit>`, the
  commit being read from `FLY_IMAGE_REF`, which Fly sets on every machine and which
  `release.yml` tags as `registry.fly.io/windom-api:release-<sha>`.

## Turning it on (owner)

1. Create a Sentry project, platform **Node.js**. In *Project Settings > Security & Privacy*
   enable **Prevent Storing of IP Addresses** and keep **Data Scrubber** on (belt and braces).
2. Copy the DSN, then:
   ```sh
   flyctl secrets set SENTRY_DSN='https://<key>@o<org>.ingest.<region>.sentry.io/<project>' -a windom-api
   ```
   Setting a secret restarts the machines; nothing else needs deploying.
3. Optional: `flyctl secrets set SENTRY_TRACES_SAMPLE_RATE=0.05 -a windom-api` for
   performance tracing. Leave it unset (0) for errors only.
4. Create the alert rules below.

Rollback: `flyctl secrets unset SENTRY_DSN -a windom-api`.

## Alert rules

**Token reuse - page immediately.** *Alerts > Create Alert > Issues*:
- When: *A new issue is created* **or** *The issue changes state from resolved to unresolved*
  **or** *An event is seen* (choose the last for one notification per occurrence).
- If: *The event's tags match* `security` equals `token_reuse`.
- Then: notify the on-call channel / email / PagerDuty. Action interval: 5 minutes.

**Error rate - sustained above 5%.** *Alerts > Create Alert > Metric > Failure Rate*
(needs tracing on, `SENTRY_TRACES_SAMPLE_RATE` > 0): `failure_rate()` over 10 minutes,
critical above 5%, warning above 2%. Without tracing, use *Number of Errors* instead:
`count()` of `event.type:error` over 5 minutes above a baseline (start at 20).

**DB pool exhaustion.** *Alerts > Create Alert > Issues*: *The issue is seen more than
5 times in 5 minutes*, filtered by tag `infra` equals `db_pool_exhausted`. Each event
carries the pool's `total/idle/waiting/max` in the `db_pool` context.
