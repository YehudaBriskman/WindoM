/**
 * A dead collector (#476): the real OTLP/HTTP exporters pointed at a closed port. Start-up
 * must not fail or wait, requests must not slow down, and the exit flush must give up
 * within its bound.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { trace } from '@opentelemetry/api';
import type { FastifyInstance } from 'fastify';
import { startTelemetry, type Telemetry } from '../sdk.js';
import { setTelemetryShutdown, shutdownTelemetry } from '../lifecycle.js';

let telemetry: Telemetry | undefined;
let app: FastifyInstance | undefined;

afterAll(async () => {
  await app?.close();
  const { pool } = await import('../../db/client.js');
  await pool.end();
});

describe('with OTEL_EXPORTER_OTLP_ENDPOINT unreachable', () => {
  it('starts, serves and shuts down without waiting on the collector', async () => {
    const env = {
      ...process.env,
      // Port 1 on loopback: connection refused, every export fails.
      OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:1',
      OTEL_EXPORTER_OTLP_HEADERS: 'Authorization=Bearer%20test-token',
    };
    process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] = env.OTEL_EXPORTER_OTLP_ENDPOINT;
    process.env['OTEL_EXPORTER_OTLP_HEADERS'] = env.OTEL_EXPORTER_OTLP_HEADERS;

    let started = performance.now();
    telemetry = startTelemetry({ env, metricIntervalMs: 200 });
    expect(performance.now() - started).toBeLessThan(500);
    const t = telemetry;
    setTelemetryShutdown(() => t.shutdown());

    const { buildTestApp } = await import('../../test-utils/app.js');
    app = await buildTestApp();
    await app.ready();

    // Let a few metric exports and a span batch fail in the background first.
    trace.getTracer('test').startSpan('warm-up').end();
    await new Promise((r) => setTimeout(r, 600));

    const timings: number[] = [];
    for (let i = 0; i < 20; i++) {
      started = performance.now();
      const res = await app.inject({ method: 'GET', url: '/__no-such-route' });
      timings.push(performance.now() - started);
      expect(res.statusCode).toBe(404);
    }
    expect(Math.max(...timings)).toBeLessThan(250);

    started = performance.now();
    await shutdownTelemetry(1_000);
    const shutdownMs = performance.now() - started;
    expect(shutdownMs).toBeLessThan(1_500);

    delete process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];
    delete process.env['OTEL_EXPORTER_OTLP_HEADERS'];
  }, 15_000);
});
