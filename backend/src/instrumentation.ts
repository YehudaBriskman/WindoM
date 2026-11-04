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
import { isTelemetryEnabled, setTelemetryShutdown, shutdownTelemetry } from './telemetry/lifecycle.js';

if (isTelemetryEnabled(process.env)) {
  try {
    const { startTelemetry } = await import('./telemetry/sdk.js');
    const sdk = startTelemetry();
    setTelemetryShutdown(() => sdk.shutdown());

    // Flush on the way out, bounded by SHUTDOWN_TIMEOUT_MS so a dead collector cannot
    // hold the exit. Exit codes match what the signal would have produced.
    for (const [signal, code] of [
      ['SIGTERM', 143],
      ['SIGINT', 130],
    ] as const) {
      process.once(signal, () => {
        void shutdownTelemetry().then(() => process.exit(code));
      });
    }
  } catch (err) {
    // Telemetry must never stop the API from starting.
    console.error('OpenTelemetry failed to start; continuing without it:', err);
  }
}
