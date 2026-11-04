/**
 * The alerting events and app-owned metrics (#476).
 *
 * This module depends on `@opentelemetry/api` only, never on the SDK. With no SDK
 * started (OTEL_EXPORTER_OTLP_ENDPOINT unset) the API hands out no-op meters, so every
 * call below costs a property lookup and nothing leaves the process.
 *
 * Alerts match the `event.name` log attribute, never message text, so the three values
 * below are a contract shared with the receiver (oci-free#14) and the viewer (Bothy#302).
 * Renaming one silently disables its alert.
 */
import { metrics, type Counter, type MeterProvider } from '@opentelemetry/api';

export const EVENT_TOKEN_REUSE = 'auth.token_reuse_detected';
export const EVENT_DB_POOL_EXHAUSTED = 'db.pool_exhausted';
export const EVENT_HTTP_SERVER_ERROR = 'http.server.error';

/** The pino field that becomes the OTel `event.name`. Dotted on purpose: it is the attribute key. */
export const EVENT_NAME_KEY = 'event.name';

export const METER_NAME = 'windom-api';
export const METRIC_TOKEN_REUSE = 'windom.security.token_reuse';
export const METRIC_DB_POOL_EXHAUSTED = 'windom.db.pool_exhausted';
/*
 * The pg pool gauges are NOT defined here: @opentelemetry/instrumentation-pg already emits
 * them under the semconv names the receiver's dashboard reads -
 * `db.client.connection.count` {db.client.connection.state=idle|used},
 * `db.client.connection.pending_requests` and `db.client.connection.max`, each with
 * `db.client.connection.pool.name`. A second, app-owned copy would only disagree with it.
 */

interface Counters {
  provider: MeterProvider;
  tokenReuse: Counter;
  poolExhausted: Counter;
}

let counters: Counters | undefined;

/**
 * Counters are created lazily and re-created if the global MeterProvider changed, so a
 * module imported before the SDK registered its provider still records into the real one.
 */
function getCounters(): Counters {
  const provider = metrics.getMeterProvider();
  if (counters?.provider !== provider) {
    const meter = provider.getMeter(METER_NAME);
    counters = {
      provider,
      tokenReuse: meter.createCounter(METRIC_TOKEN_REUSE, {
        description: 'Refresh tokens replayed after rotation; every session of the user was revoked',
        unit: '{event}',
      }),
      poolExhausted: meter.createCounter(METRIC_DB_POOL_EXHAUSTED, {
        description: 'Requests answered 503 because no DB connection could be acquired in time',
        unit: '{event}',
      }),
    };
  }
  return counters;
}

/** Counts one refresh-token reuse. No attributes: the user and session ids stay in the log line. */
export function recordTokenReuse(): void {
  getCounters().tokenReuse.add(1);
}

/** Counts one pool-exhaustion 503. `route` is the route template, never the raw URL. */
export function recordPoolExhausted(route: string | undefined): void {
  getCounters().poolExhausted.add(1, route ? { 'http.route': route } : {});
}
