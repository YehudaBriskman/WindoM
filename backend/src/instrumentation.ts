/**
 * OpenTelemetry bootstrap (#476). Runs before the app:
 *
 *     node --import ./dist/instrumentation.js dist/index.js
 *
 * It has to run first because the instrumentations patch `pg`, `pino` and `node:http`
 * as they are loaded; anything imported earlier stays uninstrumented.
 *
 * Off unless OTEL_EXPORTER_OTLP_ENDPOINT is set (or when OTEL_SDK_DISABLED=true): then
 * this module imports nothing else, starts nothing and opens no connection. Only the
 * real process environment counts - `.env` is loaded later, by config.ts.
 */
import { isTelemetryEnabled, setTelemetryShutdown } from './telemetry/lifecycle.js';

if (isTelemetryEnabled(process.env)) {
  try {
    const { startTelemetry } = await import('./telemetry/sdk.js');
    const sdk = startTelemetry();
    // No signal handler here (#478): index.ts owns SIGTERM/SIGINT and flushes telemetry
    // as the last step, after the HTTP server has drained, so the drain's own log lines
    // are exported too.
    setTelemetryShutdown(() => sdk.shutdown());
  } catch (err) {
    // Telemetry must never stop the API from starting.
    console.error('OpenTelemetry failed to start; continuing without it:', err);
  }
}
