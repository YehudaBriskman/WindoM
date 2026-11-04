# Monitoring and security alerting (OpenTelemetry)

The backend emits **OpenTelemetry** (OTLP) logs, traces and metrics when
`OTEL_EXPORTER_OTLP_ENDPOINT` is set (issue #476). With it unset, nothing is started:
no SDK, no exporter, no network traffic, no signal handler. Local development and CI
run that way.

Nothing on the app side names a vendor. Where the telemetry goes is configuration:
OCI today (YehudaBriskman/oci-free#14 receives it and sends the alerts,
YehudaBriskman/Bothy#302 displays it), and any OTLP backend tomorrow.

This replaced Sentry (#204), which was never switched on, needed a third-party
account and was not portable. `@sentry/node` and its `SENTRY_*` variables are gone.

## Code

| File | Role |
|---|---|
| `backend/src/instrumentation.ts` | Bootstrap, loaded first by `node --import`. Checks the switch, starts the SDK, flushes on SIGTERM/SIGINT |
| `backend/src/telemetry/sdk.ts` | The SDK: OTLP/HTTP exporters, batch processors, instrumentations, resource. Imported only when telemetry is on |
| `backend/src/telemetry/scrub.ts` | The exporter-side scrubber every span and log record passes through |
| `backend/src/telemetry/events.ts` | The three `event.name` values and the two app counters. Depends on `@opentelemetry/api` only |
| `backend/src/telemetry/lifecycle.ts` | The on/off switch and the bounded flush |

`backend/entrypoint.sh` (the Docker `CMD`) runs
`node --import ./dist/instrumentation.js dist/index.js`; so does `npm start`. The Fly
`release_command` (`node dist/db/migrate.js`) deliberately does not load it: migrations
stay uninstrumented. `npm run dev` does not load it either; to try it locally run
`npm run build && OTEL_EXPORTER_OTLP_ENDPOINT=... npm start`.

The variables must be in the **process environment**. `.env` is read later, by
`config.ts`, after the bootstrap has already decided.

## The shared contract

Identical in this repo, oci-free#14 and Bothy#302. Changing any line here means
changing all three.

| | |
|---|---|
| Standard | **OpenTelemetry (OTLP)**. Nothing vendor-specific on the app side |
| Endpoint | `https://otel.yehudabriskman.com`, OTLP/HTTP (protobuf). Paths `/v1/logs`, `/v1/traces`, `/v1/metrics` (appended by the exporters) |
| Auth | `Authorization: Bearer <token>`. Fly secret `OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer%20<token>` (the value is URL-decoded); the same token is a k8s secret on OCI. Rotate by setting both |
| App config | Only the standard variables: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`, `OTEL_SERVICE_NAME=windom-api`. **Unset means off** |
| Resource | `service.name=windom-api`, `service.version=<package version>+<commit>`, `deployment.environment.name=production`, `service.instance.id=$FLY_MACHINE_ID`, `cloud.region=$FLY_REGION` |
| Signals | logs (every pino line, with trace/span ids); traces (HTTP server, outgoing HTTP, `pg`); metrics (HTTP server duration and count, DB pool `db.client.connection.*`, process) |
| Alert events | Log attribute `event.name`, never message text: `auth.token_reuse_detected` (page now), `db.pool_exhausted`, `http.server.error` (one per 5xx) |
| Privacy | No email, IP address, token, cookie, auth header, request/response body or query-string value in any attribute. The collector drops `client.address`, `http.client_ip`, `user.email`, `enduser.*` again. **Retention 30 days or less**: logs 14d, traces 7d, metrics 15d |

Resource details:

- `service.name` is `OTEL_SERVICE_NAME`, defaulting to `windom-api`.
- `service.version` is `backend/package.json`'s version plus the first 12 characters of
  the commit, read from Fly's `FLY_IMAGE_REF` (`registry.fly.io/windom-api:release-<sha>`,
  as `release.yml` pushes it). Example: `1.6.0+0123456789ab`.
- `deployment.environment.name` is `NODE_ENV` (`production` on Fly, from fly.toml).
- `service.instance.id` and `cloud.region` are present only on Fly.
- The default OTel detectors add `host.*` and `process.*` (pid, runtime) attributes.

## What is sent

### Traces

| Instrumentation | Spans |
|---|---|
| `@opentelemetry/instrumentation-http` | One SERVER span per request, named `<METHOD> <route template>`; outgoing `node:http` |
| `@fastify/otel` | A `request` span plus hook and handler spans under it; it also gives the HTTP span and metric their `http.route` |
| `@opentelemetry/instrumentation-undici` | Outgoing `fetch` (Google, Spotify, GitHub APIs) |
| `@opentelemetry/instrumentation-pg` | Every query, with the SQL text (parameters as `$1`; values are never attached) and pool connects |

`/health` is not traced (Fly's check would otherwise be most of the spans). A 5xx
marks the SERVER span and the `request` span with status `ERROR`.

**Why `@fastify/otel`:** `@opentelemetry/instrumentation-fastify` is deprecated on npm
("Deprecated in favor of @fastify/otel, maintained by the Fastify authors"); its last
release (0.57.0, May 2026) still declares `fastify >=3 <6` but gets no further work.
`@fastify/otel` is the Fastify organisation's own package, released alongside Fastify 5
(0.21.4, October 2026). It hooks every Fastify instance through the
`fastify.initialization` diagnostics channel, so no module patching or ESM loader is
involved, and it hands the route template to the HTTP span and metric.

### Logs

Every pino line, from Fastify's `app.log`/`req.log` and from `lib/logger.ts`, is also
emitted as an OTel log record through `@opentelemetry/instrumentation-pino`. Lines
written inside a request carry its trace context: in OTLP as the LogRecord's own
`TraceId`/`SpanId` fields (never as attributes - Loki derives `trace_id`/`span_id`
from those fields, and a same-named attribute would collide with them and break
Grafana's trace-to-logs link), and on stdout as `trace_id`, `span_id`, `trace_flags`
fields. Stdout is otherwise unchanged, so `flyctl logs` works as before.

`lib/logger.ts` loads pino with `require`, not `import`: the instrumentation wraps
pino's factory as it is required, and an ESM import of the CommonJS package would get
the unwrapped one, silently dropping that logger's lines from OTLP.

### Alert events

| `event.name` | Emitted by | Counted by | Alert |
|---|---|---|---|
| `auth.token_reuse_detected` | `refresh()` in `auth.service.ts`, the `TOKEN_REUSE_DETECTED` log line (level 50). Carries `userId` and `sessionId` only | `windom.security.token_reuse` (counter) | Page on the first one |
| `db.pool_exhausted` | Global error handler, the pool-timeout 503 (level 40). Carries `http.route` and `pool: {total, idle, waiting, max}` | `windom.db.pool_exhausted` (counter, attribute `http.route`) | Sustained occurrences |
| `http.server.error` | Global error handler for status >= 500, plus an `onResponse` fallback for handlers that answer 5xx themselves (level 50). Carries `http.route`, `http.request.method`, `statusCode` | `http.server.request.duration` with `http.response.status_code` >= 500 | Rate |

Every 5xx logs exactly one of `http.server.error` or `db.pool_exhausted`; the pool
503 is not reported twice. 4xx responses log no event.

The value is an **attribute** named `event.name`. Should a record ever name its event
only in the OTLP LogRecord's top-level `EventName` field, the scrubber copies it into
the attribute, so an alert never depends on which one a log call used.

### Metrics

Exported every 60 s (`OTEL_METRIC_EXPORT_INTERVAL` overrides), cumulative temporality.

| Metric | Source |
|---|---|
| `http.server.request.duration` (histogram, s; attributes `http.request.method`, `http.route`, `http.response.status_code`) | http instrumentation. Its count is the request count |
| `http.client.request.duration` | http / undici instrumentations |
| `db.client.operation.duration` (histogram, s) | pg instrumentation |
| `db.client.connection.count` (attribute `db.client.connection.state` = `idle` / `used`), `db.client.connection.pending_requests` (queued for a connection), `db.client.connection.max`; all with `db.client.connection.pool.name` = `host:port/database` | pg instrumentation, updated on every pool connect/acquire/release/remove. `db/client.ts` repeats host/port/database from `DATABASE_URL` in the pool options only so the pool has that name |
| `windom.security.token_reuse`, `windom.db.pool_exhausted` (counters) | `events.ts` |
| `process.memory.usage` (RSS, By), `process.cpu.time` (s, `cpu.mode`) | `sdk.ts` |
| `nodejs.eventloop.*`, `v8js.*` | `@opentelemetry/instrumentation-runtime-node` |

## What is never sent

The scrubber (`telemetry/scrub.ts`) wraps both exporters, so it applies to every span
and log record whatever produced it:

- **Spans:** `client.address`, `client.port`, `http.client_ip`, `network.peer.*`,
  `user_agent.original`, `user.email`/`name`, `enduser.*`, all `http.request.header.*`
  / `http.response.header.*` and body attributes are dropped, as is any key matching
  the sensitive-key pattern below. `url.full`, `url.query` and `http.target` keep
  query parameter names but every value becomes `[redacted]` (the same
  `redactUrlQuery` the request log serializer uses). A matched request's `url.path` is
  its route template (`/me/sessions/:id`), never the raw path.
- **Logs:** any key matching `authorization|cookie|passw|secret|token|email|api key|
  credential|ip|ip_address|remote_addr|x-forwarded-for|body|data|refresh|code`, at any
  depth, has its value replaced by `[Filtered]` (so `req.remoteAddress` is filtered in
  OTLP while stdout keeps it as before).
- **Both:** emails, JWTs and `Bearer`/`Basic` credentials inside any string become
  `[Filtered]`, and query strings inside free text keep their names only.
- The instrumentations collect no headers, bodies or SQL parameter values
  (`enhancedDatabaseReporting` is off).

The tests in `backend/src/telemetry/__tests__/` (successors of the Sentry scrubbing
tests) drive real requests carrying an email, password, JWT, cookie, query token,
`X-Forwarded-For` and user agent through the real SDK into in-memory exporters, and
assert none of them is exported.

## The collector is never on the request path

- Spans and logs go through batch processors (queue of 2048, dropped beyond that):
  a request never waits for an export.
- Each export times out after 5 s (`OTEL_EXPORTER_OTLP_TIMEOUT` overrides).
- Start-up opens no connection.
- On SIGTERM/SIGINT the bootstrap flushes for at most **3 s** (Fly's default
  `kill_timeout` is 5 s) and exits with 143/130. Measured against a black-holed
  endpoint: SIGTERM to exit in 3.0 s, request latency unchanged.
- Exporter failures are printed to stderr at ERROR level by the OTel diag logger, not
  through pino, so a failing log export cannot feed itself.

## Turning it on (owner)

Once the OCI receiver (oci-free#14) is up:

```sh
flyctl secrets set -a windom-api \
  OTEL_EXPORTER_OTLP_ENDPOINT=https://otel.yehudabriskman.com \
  OTEL_EXPORTER_OTLP_HEADERS='Authorization=Bearer%20<token>' \
  OTEL_SERVICE_NAME=windom-api
```

Setting secrets restarts the machines; nothing needs deploying. Check the first boot
with `flyctl logs -a windom-api`: an unreachable or rejecting collector shows as
export errors on stderr (for example `PeriodicExportingMetricReader: metrics export
timed out`), and the API keeps serving regardless.

## Pointing it somewhere else

Any OTLP/HTTP backend works by changing the same variables: Grafana Cloud's OTLP
gateway, SigNoz, Honeycomb, Uptrace, a self-hosted OpenTelemetry Collector, Bothy.

- `OTEL_EXPORTER_OTLP_ENDPOINT` is the base URL; the exporters append
  `/v1/traces`, `/v1/logs`, `/v1/metrics`.
- `OTEL_EXPORTER_OTLP_HEADERS` is `key=value` pairs, comma separated, URL-encoded
  (`Authorization=Basic%20<base64>` for Grafana Cloud, `x-honeycomb-team=<key>` for
  Honeycomb).
- The other standard variables work too: `OTEL_EXPORTER_OTLP_TIMEOUT`,
  `OTEL_METRIC_EXPORT_INTERVAL`, `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE`
  (set `delta` for backends that want it), `OTEL_RESOURCE_ATTRIBUTES`,
  `OTEL_SDK_DISABLED=true`.
- The privacy rules travel with the app: the scrubber runs before anything leaves the
  process. A new backend needs only the retention limits (30 days or less) and, ideally,
  the same attribute drop list as a second layer.

## Rollback

```sh
flyctl secrets unset -a windom-api OTEL_EXPORTER_OTLP_ENDPOINT OTEL_EXPORTER_OTLP_HEADERS
```

With the endpoint unset the bootstrap returns before importing the SDK, so the app
runs exactly as it would without OpenTelemetry. `OTEL_SDK_DISABLED=true` does the same
while keeping the other secrets in place.
