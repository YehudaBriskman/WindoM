/**
 * The one handle the app needs on the telemetry SDK: a bounded flush-and-shutdown.
 *
 * Dependency-free on purpose. The SDK itself lives in `instrumentation.ts`, which runs
 * before the app via `node --import` and registers its shutdown here; the app only ever
 * calls `shutdownTelemetry()`, which is a no-op when telemetry is off.
 */

/**
 * The one switch: OTEL_EXPORTER_OTLP_ENDPOINT set and non-blank, and the SDK not disabled
 * with the standard OTEL_SDK_DISABLED. Unset means off - no SDK, no exporter, no network.
 */
export function isTelemetryEnabled(env: Record<string, string | undefined>): boolean {
  return (
    Boolean(env['OTEL_EXPORTER_OTLP_ENDPOINT']?.trim()) && env['OTEL_SDK_DISABLED']?.trim().toLowerCase() !== 'true'
  );
}

/** Upper bound on any flush. Fly's default kill_timeout is 5 s; this leaves room to spare. */
export const SHUTDOWN_TIMEOUT_MS = 3_000;

let shutdownFn: (() => Promise<void>) | undefined;
let pending: Promise<void> | undefined;

export function setTelemetryShutdown(fn: (() => Promise<void>) | undefined): void {
  shutdownFn = fn;
  pending = undefined;
}

/**
 * Flushes and shuts the SDK down, resolving after at most `timeoutMs` whatever the
 * collector does. Never rejects. Idempotent: concurrent and repeated calls share one run.
 */
export function shutdownTelemetry(timeoutMs = SHUTDOWN_TIMEOUT_MS): Promise<void> {
  if (!shutdownFn) return Promise.resolve();
  if (!pending) {
    const fn = shutdownFn;
    pending = new Promise<void>((resolve) => {
      // Deliberately NOT unref'd: after SIGTERM nothing else may hold the event loop
      // open, and the process would end before the flush. The timer is the bound.
      const timer = setTimeout(resolve, timeoutMs);
      fn().then(
        () => {
          clearTimeout(timer);
          resolve();
        },
        () => {
          clearTimeout(timer);
          resolve();
        },
      );
    });
  }
  return pending;
}
