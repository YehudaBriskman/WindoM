import { afterEach, describe, expect, it, vi } from 'vitest';
import Fastify from 'fastify';
import { drainHttp, gracefulShutdown, installShutdownHandlers, type ShutdownDeps } from '../shutdown.js';

const silentLog = { info: vi.fn(), error: vi.fn() };
const budget = { serverMs: 200, poolMs: 200, telemetryMs: 200 };

function deps(over: Partial<ShutdownDeps> = {}, order: string[] = []): ShutdownDeps {
  return {
    closeServer: () => Promise.resolve(void order.push('server')),
    closePool: () => Promise.resolve(void order.push('pool')),
    flushTelemetry: () => Promise.resolve(void order.push('telemetry')),
    log: silentLog,
    ...over,
  };
}

const never = () => new Promise<void>(() => {});

describe('gracefulShutdown', () => {
  it('closes the server, then the pool, then flushes telemetry, and exits 0', async () => {
    const order: string[] = [];
    await expect(gracefulShutdown(deps({}, order), 'SIGTERM', budget)).resolves.toBe(0);
    expect(order).toEqual(['server', 'pool', 'telemetry']);
  });

  it('bounds a step that hangs, still runs the later steps, and exits 1', async () => {
    const order: string[] = [];
    const started = Date.now();
    const code = await gracefulShutdown(deps({ closeServer: never }, order), 'SIGTERM', budget);
    expect(code).toBe(1);
    expect(order).toEqual(['pool', 'telemetry']);
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it('a step that throws is logged, the rest still run, and it exits 1', async () => {
    const order: string[] = [];
    const failing = deps({ closePool: () => Promise.reject(new Error('boom')) }, order);
    await expect(gracefulShutdown(failing, 'SIGTERM', budget)).resolves.toBe(1);
    expect(order).toEqual(['server', 'telemetry']);
  });

  it('lets an in-flight request finish, and refuses new ones while draining', async () => {
    const app = Fastify();
    let release!: () => void;
    const held = new Promise<void>((r) => (release = r));
    app.get('/slow', async () => {
      await held;
      return { ok: true };
    });
    app.get('/fast', () => ({ ok: true }));
    const address = await app.listen({ port: 0, host: '127.0.0.1' });

    const inFlight = fetch(`${address}/slow`);
    await new Promise((r) => setTimeout(r, 50)); // the request is now inside the handler

    const shutdown = gracefulShutdown(deps({ closeServer: () => drainHttp(app) }), 'SIGTERM', {
      ...budget,
      serverMs: 2_000,
    });
    await new Promise((r) => setTimeout(r, 50));
    const late = await fetch(`${address}/fast`).then(
      (r) => r.status,
      () => 'refused',
    );
    expect([503, 'refused']).toContain(late);

    release();
    const res = await inFlight;
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    await expect(shutdown).resolves.toBe(0);
  });
});

describe('installShutdownHandlers', () => {
  let remove: (() => void) | undefined;
  afterEach(() => remove?.());

  it('runs the sequence once on SIGTERM and ignores a second signal while draining', async () => {
    const closeServer = vi.fn(() => Promise.resolve());
    const exit = vi.fn();
    remove = installShutdownHandlers(deps({ closeServer }), { exit, budget });

    process.emit('SIGTERM', 'SIGTERM');
    process.emit('SIGINT', 'SIGINT');
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
    expect(closeServer).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });
});
