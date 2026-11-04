/**
 * The OpenTelemetry SDK for windom-api (#476). Loaded only by `instrumentation.ts`, and
 * only when OTEL_EXPORTER_OTLP_ENDPOINT is set, so with telemetry off none of this
 * module's dependencies are even imported.
 *
 * Everything about the destination comes from the standard variables, read by the OTLP
 * exporters themselves: OTEL_EXPORTER_OTLP_ENDPOINT (`/v1/traces|logs|metrics` appended),
 * OTEL_EXPORTER_OTLP_HEADERS (URL-decoded, so `Authorization=Bearer%20<token>`) and
 * OTEL_EXPORTER_OTLP_PROTOCOL-independent http/protobuf. Pointing it elsewhere is a
 * config change; this file names no vendor.
 *
 * The collector is never on the request path: spans and logs go through bounded batch
 * processors that drop rather than block when full, exports time out after 5 s, and
 * nothing here contacts the network during start-up.
 */
import { readFileSync } from 'node:fs';
import { DiagConsoleLogger, DiagLogLevel, diag, metrics as metricsApi, type Attributes } from '@opentelemetry/api';
import { NodeSDK, logs, metrics, resources, tracing } from '@opentelemetry/sdk-node';
import type { Instrumentation } from '@opentelemetry/instrumentation';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { FastifyOtelInstrumentation } from '@fastify/otel';
import { ScrubbingLogRecordExporter, ScrubbingSpanExporter } from './scrub.js';
import { METER_NAME } from './events.js';

type Env = Record<string, string | undefined>;

export const DEFAULT_SERVICE_NAME = 'windom-api';
const DEFAULT_EXPORT_TIMEOUT_MS = 5_000;
const DEFAULT_METRIC_INTERVAL_MS = 60_000;

/** Paths that are never traced: Fly's health check would otherwise be most of the spans. */
const UNTRACED_PATHS = new Set(['/health']);

function readPackageVersion(): string | undefined {
  try {
    // src/telemetry/sdk.ts and dist/telemetry/sdk.js both sit two levels below package.json.
    const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
      version?: string;
    };
    return pkg.version;
  } catch {
    return undefined;
  }
}

/**
 * `<package version>+<commit>`. The commit comes from Fly's FLY_IMAGE_REF, which
 * release.yml pushes as `registry.fly.io/windom-api:release-<sha>`.
 */
export function resolveServiceVersion(
  env: Env,
  version: string | undefined = readPackageVersion(),
): string | undefined {
  const sha = env['FLY_IMAGE_REF']?.match(/:release-([0-9a-f]{7,40})$/i)?.[1]?.slice(0, 12);
  if (version && sha) return `${version}+${sha}`;
  return version ?? sha;
}

/** The resource attributes of the shared contract (#476). */
export function buildResourceAttributes(env: Env, version?: string): Attributes {
  const attrs: Attributes = {
    'service.name': env['OTEL_SERVICE_NAME'] || DEFAULT_SERVICE_NAME,
    'deployment.environment.name': env['NODE_ENV'] || 'development',
  };
  const serviceVersion = resolveServiceVersion(env, version);
  if (serviceVersion) attrs['service.version'] = serviceVersion;
  if (env['FLY_MACHINE_ID']) attrs['service.instance.id'] = env['FLY_MACHINE_ID'];
  if (env['FLY_REGION']) attrs['cloud.region'] = env['FLY_REGION'];
  return attrs;
}

function positiveNumber(value: string | undefined): number | undefined {
  const n = Number(value);
  return value && Number.isFinite(n) && n > 0 ? n : undefined;
}

function pathOf(url: string | undefined): string {
  return (url ?? '').split(/[?#]/, 1)[0] ?? '';
}

/** The instrumentations, configured for privacy: no headers, bodies or SQL parameter values. */
export function createInstrumentations(): Instrumentation[] {
  return [
    new HttpInstrumentation({
      ignoreIncomingRequestHook: (req) => UNTRACED_PATHS.has(pathOf(req.url)),
    }),
    // Outgoing `fetch` (Google, Spotify, GitHub APIs) goes through undici, not node:http.
    new UndiciInstrumentation(),
    new FastifyOtelInstrumentation({
      registerOnInitialization: true,
      ignorePaths: (route) => UNTRACED_PATHS.has(route.url),
    }),
    // enhancedDatabaseReporting would attach query parameter values (emails, hashes).
    new PgInstrumentation({ enhancedDatabaseReporting: false }),
    new PinoInstrumentation(),
    new RuntimeNodeInstrumentation(),
  ];
}

export interface TelemetryOptions {
  env?: Env;
  /** Overrides for tests (in-memory exporters). Production uses OTLP/HTTP for all three. */
  spanExporter?: tracing.SpanExporter;
  logExporter?: logs.LogRecordExporter;
  metricExporter?: metrics.PushMetricExporter;
  /** Defaults to OTEL_METRIC_EXPORT_INTERVAL, else 60 s. */
  metricIntervalMs?: number;
  instrumentations?: Instrumentation[];
}

export interface Telemetry {
  sdk: NodeSDK;
  /** Exports everything buffered now. Used by tests; production relies on the batch timers. */
  forceFlush(): Promise<void>;
  /** Flushes and stops every processor and instrumentation. */
  shutdown(): Promise<void>;
}

/** Builds (does not start) the SDK: batch processors, scrubbing exporters, resource. */
export function createTelemetry(options: TelemetryOptions = {}): Telemetry {
  const env = options.env ?? process.env;
  // Exporters read the endpoint and headers from the environment. The timeout is only
  // shortened when OTEL_EXPORTER_OTLP_TIMEOUT does not set one: a slow collector
  // must cost the process 5 s of background time at most, never a request.
  const timeout = positiveNumber(env['OTEL_EXPORTER_OTLP_TIMEOUT']) ? {} : { timeoutMillis: DEFAULT_EXPORT_TIMEOUT_MS };
  const interval =
    options.metricIntervalMs ?? positiveNumber(env['OTEL_METRIC_EXPORT_INTERVAL']) ?? DEFAULT_METRIC_INTERVAL_MS;

  // Batch processors queue at most 2048 items and drop beyond that: a backed-up
  // collector costs telemetry, never a request.
  const spanProcessor = new tracing.BatchSpanProcessor(
    new ScrubbingSpanExporter(options.spanExporter ?? new OTLPTraceExporter(timeout)),
    { exportTimeoutMillis: DEFAULT_EXPORT_TIMEOUT_MS },
  );
  const logProcessor = new logs.BatchLogRecordProcessor({
    exporter: new ScrubbingLogRecordExporter(options.logExporter ?? new OTLPLogExporter(timeout)),
    exportTimeoutMillis: DEFAULT_EXPORT_TIMEOUT_MS,
  });
  const metricReader = new metrics.PeriodicExportingMetricReader({
    exporter: options.metricExporter ?? new OTLPMetricExporter(timeout),
    exportIntervalMillis: interval,
    exportTimeoutMillis: Math.min(interval, DEFAULT_EXPORT_TIMEOUT_MS),
  });

  const sdk = new NodeSDK({
    resource: resources.resourceFromAttributes(buildResourceAttributes(env)),
    spanProcessors: [spanProcessor],
    logRecordProcessors: [logProcessor],
    metricReaders: [metricReader],
    instrumentations: options.instrumentations ?? createInstrumentations(),
  });

  return {
    sdk,
    forceFlush: async () => {
      await Promise.all([spanProcessor.forceFlush(), logProcessor.forceFlush(), metricReader.forceFlush()]);
    },
    shutdown: () => sdk.shutdown(),
  };
}

/** `process.memory.usage` and `process.cpu.time`, the process half of the metrics contract. */
export function registerProcessMetrics(): void {
  const meter = metricsApi.getMeter(METER_NAME);
  meter
    .createObservableGauge('process.memory.usage', { description: 'Resident set size', unit: 'By' })
    .addCallback((result) => result.observe(process.memoryUsage.rss()));
  meter
    .createObservableCounter('process.cpu.time', { description: 'CPU time consumed', unit: 's' })
    .addCallback((result) => {
      const { user, system } = process.cpuUsage();
      result.observe(user / 1e6, { 'cpu.mode': 'user' });
      result.observe(system / 1e6, { 'cpu.mode': 'system' });
    });
}

/**
 * Starts the SDK and returns it. Exporter failures are reported on stderr at ERROR level
 * (never through pino, so a failing log export cannot feed itself) and never thrown.
 */
export function startTelemetry(options: TelemetryOptions = {}): Telemetry {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);
  const telemetry = createTelemetry(options);
  telemetry.sdk.start();
  registerProcessMetrics();
  return telemetry;
}
