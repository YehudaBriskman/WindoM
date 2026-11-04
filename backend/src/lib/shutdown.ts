import { SHUTDOWN_TIMEOUT_MS } from '../telemetry/lifecycle.js';

/**
 * Graceful shutdown on SIGTERM / SIGINT (#478).
 *
 * Fly sends SIGTERM on every deploy, restart and scale-down, then SIGKILLs after
 * `kill_timeout` (fly.toml). Before #478 nothing handled the signal, so every deploy
 * cut off in-flight requests and the process died by SIGKILL (exit 137).
 *
 * The sequence, each step bounded so one that hangs cannot eat the others' time:
 *   1. close the HTTP server - stop accepting, let in-flight requests finish
 *      (Fastify answers new ones 503 while closing and drops idle keep-alives);
 *   2. end the pg pool;
 *   3. flush telemetry (no-op when it is off; it has its own 3 s bound).
 * The total stays well inside fly.toml's `kill_timeout`.
 */

export interface ShutdownDeps {
  closeServer: () => Promise<unknown>;
  closePool: () => Promise<unknown>;
  flushTelemetry: () => Promise<unknown>;
  log: {
    info: (obj: object, msg: string) => void;
    error: (obj: object, msg: string) => void;
  };
}

export interface ShutdownBudget {
  serverMs: number;
  poolMs: number;
  telemetryMs: number;
}

/**
 * Closes a Fastify app so it actually finishes. `app.close()` drops the connections that
 * are idle *when it is called*, but a keep-alive connection whose request was still
 * running goes idle afterwards and then stays open for Fastify's keepAliveTimeout
 * (72 s) - Fly's proxy holds exactly such connections - so close() would never
 * resolve in time. Sweeping idle connections while draining fixes that.
 */
export async function drainHttp(
  app: { close: () => PromiseLike<unknown>; server: { closeIdleConnections?: () => void } },
  everyMs = 100,
): Promise<void> {
  const sweep = setInterval(() => app.server.closeIdleConnections?.(), everyMs);
  try {
    await app.close();
  } finally {
    clearInterval(sweep);
  }
}

/**
 * 5 + 1 + 3.5 = 9.5 s, against fly.toml's kill_timeout of 15 s. The telemetry step's
 * limit sits above lifecycle.ts's own SHUTDOWN_TIMEOUT_MS (3 s), so that bound decides
 * first: with the two equal, an unreachable collector made the exit code a coin toss.
 */
export const DEFAULT_BUDGET: ShutdownBudget = {
  serverMs: 5_000,
  poolMs: 1_000,
  telemetryMs: SHUTDOWN_TIMEOUT_MS + 500,
};

type StepResult = 'done' | 'timeout' | 'failed';

async function step(
  name: string,
  fn: () => Promise<unknown>,
  ms: number,
  log: ShutdownDeps['log'],
): Promise<StepResult> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<StepResult>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), ms);
  });
  const run = (async (): Promise<StepResult> => {
    try {
      await fn();
      return 'done';
    } catch (err) {
      log.error({ err, step: name }, `shutdown: ${name} failed`);
      return 'failed';
    }
  })();
  const result = await Promise.race([run, timeout]);
  clearTimeout(timer);
  if (result === 'timeout') log.error({ step: name, timeoutMs: ms }, `shutdown: ${name} timed out`);
  return result;
}

/** Runs the sequence and returns the exit code: 0 if every step finished, else 1. */
export async function gracefulShutdown(
  deps: ShutdownDeps,
  signal: string,
  budget: ShutdownBudget = DEFAULT_BUDGET,
): Promise<number> {
  const started = Date.now();
  deps.log.info({ signal }, 'shutdown: signal received, draining');
  const results = [
    await step('server', deps.closeServer, budget.serverMs, deps.log),
    await step('pool', deps.closePool, budget.poolMs, deps.log),
    await step('telemetry', deps.flushTelemetry, budget.telemetryMs, deps.log),
  ];
  const code = results.every((r) => r === 'done') ? 0 : 1;
  deps.log.info({ signal, code, durationMs: Date.now() - started }, 'shutdown: complete');
  return code;
}

/**
 * Installs the handlers. A second signal while draining is ignored rather than
 * restarting the sequence. Returns a function that removes them (for tests).
 */
export function installShutdownHandlers(
  deps: ShutdownDeps,
  opts: { exit?: (code: number) => void; budget?: ShutdownBudget } = {},
): () => void {
  const exit = opts.exit ?? ((code: number) => process.exit(code));
  let draining = false;
  const handler = (signal: NodeJS.Signals): void => {
    if (draining) return;
    draining = true;
    void gracefulShutdown(deps, signal, opts.budget).then(exit);
  };
  process.on('SIGTERM', handler);
  process.on('SIGINT', handler);
  return () => {
    process.off('SIGTERM', handler);
    process.off('SIGINT', handler);
  };
}
