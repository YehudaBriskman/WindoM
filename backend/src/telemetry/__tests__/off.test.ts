/**
 * Telemetry is OFF unless OTEL_EXPORTER_OTLP_ENDPOINT is set (#476): the bootstrap then
 * starts nothing, registers no provider, installs no signal handler, and the event
 * helpers are harmless no-ops.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { metrics, trace, ProxyTracerProvider } from '@opentelemetry/api';
import { isTelemetryEnabled, setTelemetryShutdown, shutdownTelemetry } from '../lifecycle.js';
import { recordPoolExhausted, recordTokenReuse } from '../events.js';

describe('isTelemetryEnabled', () => {
  it('is on only with a non-blank endpoint and the SDK not disabled', () => {
    expect(isTelemetryEnabled({})).toBe(false);
    expect(isTelemetryEnabled({ OTEL_EXPORTER_OTLP_ENDPOINT: '' })).toBe(false);
    expect(isTelemetryEnabled({ OTEL_EXPORTER_OTLP_ENDPOINT: '   ' })).toBe(false);
    expect(isTelemetryEnabled({ OTEL_SERVICE_NAME: 'windom-api' })).toBe(false);
    expect(isTelemetryEnabled({ OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otel.example' })).toBe(true);
    expect(isTelemetryEnabled({ OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otel.example', OTEL_SDK_DISABLED: 'true' })).toBe(
      false,
    );
  });
});

describe('the bootstrap with OTEL_EXPORTER_OTLP_ENDPOINT unset', () => {
  let sigtermBefore: number;

  beforeAll(async () => {
    delete process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];
    sigtermBefore = process.listenerCount('SIGTERM');
    await import('../../instrumentation.js');
  });

  it('registers no tracer or meter provider', () => {
    const tracerProvider = trace.getTracerProvider();
    expect(tracerProvider).toBeInstanceOf(ProxyTracerProvider);
    // A proxy with no delegate hands out non-recording spans.
    const span = trace.getTracer('t').startSpan('s');
    expect(span.isRecording()).toBe(false);
    span.end();
    expect(metrics.getMeterProvider().constructor.name).toBe('NoopMeterProvider');
  });

  it('installs no signal handler and has nothing to flush', async () => {
    expect(process.listenerCount('SIGTERM')).toBe(sigtermBefore);
    const started = Date.now();
    await shutdownTelemetry();
    expect(Date.now() - started).toBeLessThan(50);
  });

  it('leaves the event helpers as safe no-ops', () => {
    expect(() => {
      recordTokenReuse();
      recordPoolExhausted('/x');
    }).not.toThrow();
  });
});

describe('shutdownTelemetry', () => {
  it('gives up after its bound when the SDK never finishes, and never rejects', async () => {
    setTelemetryShutdown(() => new Promise<void>(() => undefined));
    const started = Date.now();
    await shutdownTelemetry(200);
    expect(Date.now() - started).toBeGreaterThanOrEqual(190);
    expect(Date.now() - started).toBeLessThan(1_000);

    setTelemetryShutdown(() => Promise.reject(new Error('collector down')));
    await expect(shutdownTelemetry(200)).resolves.toBeUndefined();
    setTelemetryShutdown(undefined);
  });
});
