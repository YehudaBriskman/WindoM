import Fastify, { type FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mocked so these tests need no Postgres: the point is the route's behaviour across
// database states, including states that are hard to reproduce against a real server.
// Hoisted so the mock function is addressable directly - referencing `pool.query` as a
// value instead would trip @typescript-eslint/unbound-method.
const queryMock = vi.hoisted(() => vi.fn());

vi.mock('../../db/client.js', () => ({
  pool: { query: queryMock },
  db: {},
}));

import { healthRoutes } from '../health.js';
import { registerSwagger } from '../../plugins/swagger.js';

let app: FastifyInstance;

/** Makes the mocked pool answer the probe as a writable primary. */
function dbWritable(): void {
  queryMock.mockResolvedValue({ rows: [{ read_only: 'off' }] });
}

/** Makes the mocked pool answer as reachable but refusing writes (archive recovery, disk-full). */
function dbReadOnly(): void {
  queryMock.mockResolvedValue({ rows: [{ read_only: 'on' }] });
}

/** Makes the mocked pool fail outright, as when the cluster is unreachable. */
function dbDown(message = 'connection refused'): void {
  queryMock.mockRejectedValue(new Error(message));
}

interface HealthBody {
  status: string;
  ts: string;
  db: { status: string; latencyMs: number; error?: string };
}

beforeAll(async () => {
  app = Fastify({ logger: false });
  await registerSwagger(app, false);
  healthRoutes(app);
  await app.ready();
});
afterAll(async () => app.close());
beforeEach(() => vi.clearAllMocks());

describe('GET /health (liveness)', () => {
  it('returns 200 and status ok when the database is writable', async () => {
    dbWritable();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json<HealthBody>();
    expect(body.status).toBe('ok');
    expect(body.db.status).toBe('up');
    expect(typeof body.ts).toBe('string');
  });

  // The crux of incident #307: liveness must never fail on database state, or Fly
  // replaces a machine that is merely degraded and a DB problem becomes an outage.
  it('still returns 200 when the database is read-only, reporting degraded', async () => {
    dbReadOnly();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json<HealthBody>();
    expect(body.status).toBe('degraded');
    expect(body.db.status).toBe('read-only');
  });

  it('still returns 200 when the database is unreachable, reporting degraded', async () => {
    dbDown();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json<HealthBody>();
    expect(body.status).toBe('degraded');
    expect(body.db.status).toBe('down');
  });

  it('probes write capability rather than mere connectivity', async () => {
    dbWritable();
    await app.inject({ method: 'GET', url: '/health' });
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('current_setting'), [
      'transaction_read_only',
    ]);
  });
});

describe('GET /health/ready (readiness)', () => {
  it('returns 200 and ready when the database is writable', async () => {
    dbWritable();
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json<HealthBody>().status).toBe('ready');
  });

  // A read-only cluster served reads correctly for four months while every write
  // failed. Readiness is the signal that would have caught that.
  it('returns 503 when the database is read-only', async () => {
    dbReadOnly();
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(503);
    const body = res.json<HealthBody>();
    expect(body.status).toBe('not-ready');
    expect(body.db.status).toBe('read-only');
  });

  it('returns 503 when the database is unreachable', async () => {
    dbDown();
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(503);
    expect(res.json<HealthBody>().db.status).toBe('down');
  });

  it('surfaces the failure reason for operators without leaking it as a 200', async () => {
    dbDown('FATAL: terminating connection due to administrator command');
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(503);
    expect(res.json<HealthBody>().db.error).toContain('administrator command');
  });
});
