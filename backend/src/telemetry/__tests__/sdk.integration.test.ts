/**
 * The full telemetry pipeline (#476) with in-memory exporters: the real SDK, the real
 * instrumentations (http, @fastify/otel, pg, pino), the real scrubbers and the real app,
 * served over a real socket so the http instrumentation sees the traffic.
 *
 * The SDK starts BEFORE the app is imported - exactly what `node --import` does in
 * production - so pino, pg and Fastify are patched as they load.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Writable } from 'node:stream';
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import * as logs from '@opentelemetry/sdk-logs';
import * as metrics from '@opentelemetry/sdk-metrics';
import * as tracing from '@opentelemetry/sdk-trace';
import type { FastifyInstance } from 'fastify';
import { startTelemetry, type Telemetry } from '../sdk.js';
import {
  EVENT_DB_POOL_EXHAUSTED,
  EVENT_HTTP_SERVER_ERROR,
  EVENT_TOKEN_REUSE,
  METRIC_DB_POOL_EXHAUSTED,
  METRIC_TOKEN_REUSE,
} from '../events.js';

const SECRET_PASSWORD = 'hunter2-correct-horse';
const SECRET_EMAIL = 'alice.victim@example.com';
const SECRET_JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSJ9.c2lnbmF0dXJlLXZhbHVl';
const SECRET_QUERY_TOKEN = 'reset-token-in-query-123';
const SECRET_IP = '203.0.113.7';
const SECRET_UA = 'SecretAgent/9.9 (fingerprint)';

const spanExporter = new tracing.InMemorySpanExporter();
const logExporter = new logs.InMemoryLogRecordExporter();
const metricExporter = new metrics.InMemoryMetricExporter(metrics.AggregationTemporality.CUMULATIVE);

let telemetry: Telemetry;
let app: FastifyInstance;
let baseUrl: string;

/** What an OTLP exporter would read from each span, as plain data. */
function exportedSpans(): Array<{
  name: string;
  kind: SpanKind;
  traceId: string;
  status: { code: SpanStatusCode; message?: string };
  attributes: Record<string, unknown>;
  events: unknown[];
}> {
  return spanExporter.getFinishedSpans().map((s) => ({
    name: s.name,
    kind: s.kind,
    traceId: s.spanContext().traceId,
    status: s.status,
    attributes: { ...s.attributes },
    events: s.events.map((e) => ({ name: e.name, attributes: e.attributes })),
  }));
}

function exportedLogs(): Array<{
  body: unknown;
  eventName?: string;
  traceId?: string;
  spanId?: string;
  attributes: Record<string, unknown>;
}> {
  return logExporter.getFinishedLogRecords().map((r) => ({
    body: r.body,
    eventName: r.eventName,
    traceId: r.spanContext?.traceId,
    spanId: r.spanContext?.spanId,
    attributes: { ...r.attributes },
  }));
}

function logsWithEvent(name: string): ReturnType<typeof exportedLogs> {
  return exportedLogs().filter((l) => l.attributes['event.name'] === name);
}

/** Every data point of a metric across all exports so far (cumulative: the last wins). */
function metricPoints(name: string): Array<{ attributes: Record<string, unknown>; value: unknown }> {
  const exports = metricExporter.getMetrics();
  const last = exports[exports.length - 1];
  const points: Array<{ attributes: Record<string, unknown>; value: unknown }> = [];
  for (const scope of last?.scopeMetrics ?? []) {
    for (const m of scope.metrics) {
      if (m.descriptor.name !== name) continue;
      for (const dp of m.dataPoints) points.push({ attributes: { ...dp.attributes }, value: dp.value });
    }
  }
  return points;
}

beforeAll(async () => {
  telemetry = startTelemetry({
    env: {
      NODE_ENV: 'test',
      OTEL_SERVICE_NAME: 'windom-api',
      FLY_MACHINE_ID: 'machine-1',
      FLY_REGION: 'fra',
      FLY_IMAGE_REF: 'registry.fly.io/windom-api:release-0123456789abcdef0123',
    },
    spanExporter,
    logExporter,
    metricExporter,
    metricIntervalMs: 60_000,
  });

  // Imported only now, after the SDK, as `node --import` orders it in production.
  const { buildApp, requestLogSerializer } = await import('../../app.js');
  const sink = new Writable({ write: (_chunk, _enc, cb) => cb() });
  app = await buildApp({
    logger: { level: 'info', stream: sink, serializers: { req: requestLogSerializer } },
    skipRateLimit: true,
  });
  app.post('/__otel-test/boom', () => {
    throw new Error(`boom while handling ${SECRET_EMAIL}`);
  });
  app.get('/__otel-test/pool', () => {
    throw new Error('timeout expired');
  });
  app.get('/__otel-test/bad-gateway', async (_req, reply) => reply.status(502).send({ error: 'upstream' }));
  app.get('/__otel-test/bad-request', () => {
    throw Object.assign(new Error('nope'), { statusCode: 400 });
  });
  baseUrl = await app.listen({ port: 0, host: '127.0.0.1' });
});

afterAll(async () => {
  await app?.close();
  const { pool } = await import('../../db/client.js');
  await pool.end();
  await telemetry?.shutdown();
});

beforeEach(async () => {
  await telemetry.forceFlush();
  spanExporter.reset();
  logExporter.reset();
});

describe('resource', () => {
  it('carries the contract attributes', async () => {
    await fetch(`${baseUrl}/__otel-test/bad-request`);
    await telemetry.forceFlush();
    const span = spanExporter.getFinishedSpans()[0];
    expect(span?.resource.attributes).toMatchObject({
      'service.name': 'windom-api',
      'service.version': expect.stringMatching(/^\d+\.\d+\.\d+\+0123456789ab$/) as unknown,
      'deployment.environment.name': 'test',
      'service.instance.id': 'machine-1',
      'cloud.region': 'fra',
    });
  });
});

describe('a 5xx', () => {
  it('yields error-status spans, one http.server.error log in the trace, and a 500 in the HTTP histogram', async () => {
    const res = await fetch(`${baseUrl}/__otel-test/boom?token=${SECRET_QUERY_TOKEN}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${SECRET_JWT}`,
        cookie: `refresh_token=${SECRET_JWT}`,
        'x-forwarded-for': SECRET_IP,
        'user-agent': SECRET_UA,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: SECRET_EMAIL, password: SECRET_PASSWORD }),
    });
    expect(res.status).toBe(500);
    await telemetry.forceFlush();

    const spans = exportedSpans();
    const server = spans.find((s) => s.kind === SpanKind.SERVER);
    expect(server?.status.code).toBe(SpanStatusCode.ERROR);
    expect(server?.attributes).toMatchObject({
      'http.route': '/__otel-test/boom',
      'url.path': '/__otel-test/boom',
      'http.response.status_code': 500,
    });
    expect(server?.name).toBe('POST /__otel-test/boom');
    const fastifyRequest = spans.find((s) => s.name === 'request');
    expect(fastifyRequest?.status.code).toBe(SpanStatusCode.ERROR);

    const [errorLog, ...more] = logsWithEvent(EVENT_HTTP_SERVER_ERROR);
    expect(more).toHaveLength(0);
    expect(errorLog?.traceId).toBe(server?.traceId);
    expect(errorLog?.spanId).toMatch(/^[0-9a-f]{16}$/);
    expect(errorLog?.attributes).toMatchObject({ 'http.route': '/__otel-test/boom', statusCode: 500 });

    const durations = metricPoints('http.server.request.duration');
    expect(
      durations.some(
        (p) => p.attributes['http.response.status_code'] === 500 && p.attributes['http.route'] === '/__otel-test/boom',
      ),
    ).toBe(true);
  });

  it('a handler that answers 5xx itself still logs exactly one http.server.error', async () => {
    expect((await fetch(`${baseUrl}/__otel-test/bad-gateway`)).status).toBe(502);
    await telemetry.forceFlush();
    const events = logsWithEvent(EVENT_HTTP_SERVER_ERROR);
    expect(events).toHaveLength(1);
    expect(events[0]?.attributes).toMatchObject({ 'http.route': '/__otel-test/bad-gateway', statusCode: 502 });
  });

  it('a 4xx is neither an error span nor an alert event', async () => {
    expect((await fetch(`${baseUrl}/__otel-test/bad-request`)).status).toBe(400);
    await telemetry.forceFlush();
    expect(exportedSpans().find((s) => s.kind === SpanKind.SERVER)?.status.code).not.toBe(SpanStatusCode.ERROR);
    expect(logsWithEvent(EVENT_HTTP_SERVER_ERROR)).toHaveLength(0);
  });
});

describe('DB pool exhaustion', () => {
  it('logs db.pool_exhausted once and counts windom.db.pool_exhausted', async () => {
    const before = metricPoints(METRIC_DB_POOL_EXHAUSTED).reduce((n, p) => n + Number(p.value), 0);
    expect((await fetch(`${baseUrl}/__otel-test/pool`)).status).toBe(503);
    await telemetry.forceFlush();

    const events = logsWithEvent(EVENT_DB_POOL_EXHAUSTED);
    expect(events).toHaveLength(1);
    expect(events[0]?.attributes['pool']).toMatchObject({ total: expect.any(Number) as unknown });
    // The 503 is reported under its own event, not a second http.server.error.
    expect(logsWithEvent(EVENT_HTTP_SERVER_ERROR)).toHaveLength(0);

    const points = metricPoints(METRIC_DB_POOL_EXHAUSTED);
    expect(points.reduce((n, p) => n + Number(p.value), 0)).toBe(before + 1);
    expect(points.find((p) => p.attributes['http.route'] === '/__otel-test/pool')).toBeDefined();
  });

  it('exports the pool under the semconv names, from instrumentation-pg', async () => {
    // Make sure the pool has done some work, then read the last cumulative export.
    const { pool } = await import('../../db/client.js');
    await pool.query('select 1');
    await telemetry.forceFlush();

    const { config } = await import('../../config.js');
    const db = new URL(config.DATABASE_URL);
    const poolName = `${db.hostname}:${db.port || 5432}${db.pathname}`;
    const counts = metricPoints('db.client.connection.count');
    const states = counts.map((p) => p.attributes['db.client.connection.state']).sort();
    expect(states).toEqual(['idle', 'used']);
    for (const p of counts) expect(p.attributes['db.client.connection.pool.name']).toBe(poolName);
    const [pending] = metricPoints('db.client.connection.pending_requests');
    expect(pending?.attributes['db.client.connection.pool.name']).toBe(poolName);
    expect(typeof pending?.value).toBe('number');
    expect(metricPoints('db.client.connection.max')[0]?.value).toBe(5);
    // No app-owned duplicates.
    expect(metricPoints('windom.db.pool.total')).toHaveLength(0);
  });
});

describe('refresh-token reuse', () => {
  it('logs auth.token_reuse_detected and counts windom.security.token_reuse', async () => {
    const { truncateAll } = await import('../../test-utils/db.js');
    const { loginWithGoogle, refresh } = await import('../../services/auth.service.js');
    const { createSession, findSessionByToken } = await import('../../services/session.service.js');
    await truncateAll();

    const meta = { ip: SECRET_IP, userAgent: SECRET_UA };
    const tokens = await loginWithGoogle(SECRET_EMAIL, 'Alice', meta);
    const session = await findSessionByToken(tokens.rawRefreshToken);
    expect(session).not.toBeNull();
    // A child already rotated from this session means the old token is being replayed.
    if (session) await createSession(session.userId, meta, session.id);

    const result = await refresh(tokens.rawRefreshToken, meta);
    expect(result).toEqual({ ok: false, error: 'TOKEN_REUSE_DETECTED' });
    await telemetry.forceFlush();

    const [event, ...more] = logsWithEvent(EVENT_TOKEN_REUSE);
    expect(more).toHaveLength(0);
    expect(event?.attributes).toMatchObject({ userId: session?.userId, sessionId: session?.id });
    expect(metricPoints(METRIC_TOKEN_REUSE).reduce((n, p) => n + Number(p.value), 0)).toBe(1);

    // The pg instrumentation traced the queries, with parameters left out.
    const queries = exportedSpans().filter((s) => typeof s.attributes['db.query.text'] === 'string');
    expect(queries.length).toBeGreaterThan(0);
    expect(JSON.stringify(queries)).not.toContain(SECRET_EMAIL);
    await truncateAll();
  }, 30_000);
});

describe('log trace context', () => {
  it('rides in the LogRecord TraceId/SpanId fields, never as attributes', async () => {
    expect((await fetch(`${baseUrl}/__otel-test/boom`, { method: 'POST' })).status).toBe(500);
    await telemetry.forceFlush();
    const server = exportedSpans().find((s) => s.kind === SpanKind.SERVER);
    const records = exportedLogs();
    const inRequest = records.filter((r) => r.traceId === server?.traceId);
    // incoming request, the error event, request completed - at least.
    expect(inRequest.length).toBeGreaterThanOrEqual(3);
    for (const r of inRequest) expect(r.spanId).toMatch(/^[0-9a-f]{16}$/);
    // Loki derives trace_id/span_id from the record's own fields; an attribute of the same
    // name would collide with them and break Grafana's trace-to-logs link.
    for (const r of records) {
      for (const key of Object.keys(r.attributes)) {
        expect(key, JSON.stringify(r.body)).not.toMatch(
          /^(trace_id|span_id|trace_flags|traceId|spanId|trace\.id|span\.id)$/,
        );
      }
    }
  });
});

describe('privacy', () => {
  it('no span or log carries an email, IP, token, cookie, header, body or query value', async () => {
    await fetch(`${baseUrl}/auth/verify-email?token=${SECRET_QUERY_TOKEN}`, {
      headers: { 'x-forwarded-for': SECRET_IP, 'user-agent': SECRET_UA, authorization: `Bearer ${SECRET_JWT}` },
    });
    await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': SECRET_UA, cookie: `refresh_token=${SECRET_JWT}` },
      body: JSON.stringify({ email: SECRET_EMAIL, password: SECRET_PASSWORD }),
    });
    await fetch(`${baseUrl}/__otel-test/boom?token=${SECRET_QUERY_TOKEN}`, { method: 'POST' });
    await telemetry.forceFlush();

    const spans = exportedSpans();
    const records = exportedLogs();
    expect(spans.length).toBeGreaterThan(0);
    expect(records.length).toBeGreaterThan(0);

    const everything = JSON.stringify({ spans, records });
    for (const secret of [SECRET_EMAIL, SECRET_PASSWORD, SECRET_JWT, SECRET_QUERY_TOKEN, SECRET_IP, SECRET_UA]) {
      expect(everything, secret).not.toContain(secret);
    }
    // The loopback client address is PII-shaped too, and must be gone from attributes.
    for (const span of spans) {
      for (const key of ['client.address', 'network.peer.address', 'user_agent.original', 'user.email']) {
        expect(span.attributes[key], `${span.name} ${key}`).toBeUndefined();
      }
      expect(Object.keys(span.attributes).some((k) => k.startsWith('http.request.header.'))).toBe(false);
      expect(Object.keys(span.attributes).some((k) => k.startsWith('enduser.'))).toBe(false);
    }
    for (const record of records) {
      const req = record.attributes['req'] as Record<string, unknown> | undefined;
      if (req) expect(req['remoteAddress']).toBe('[Filtered]');
    }
    // Request spans name the route template, and the query keeps its names only.
    const verify = spans.find((s) => s.kind === SpanKind.SERVER && s.attributes['http.route'] === '/auth/verify-email');
    expect(verify?.attributes['url.query']).toBe('token=[redacted]');
  });
});
