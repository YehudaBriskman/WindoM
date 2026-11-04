/**
 * What may leave the process, decided at the exporter (#476).
 *
 * Every span and log record passes through `ScrubbingSpanExporter` /
 * `ScrubbingLogRecordExporter` on its way to OTLP, so no instrumentation, library
 * default or careless log field can ship an email, IP address, token, cookie, auth
 * header, body or query-string value on its own. The collector drops `client.address`,
 * `http.client_ip`, `user.email` and `enduser.*` again as a second layer; this is the
 * first, and the only one this repository controls.
 *
 * - Spans: client/peer addresses, user agents, user identity and headers are removed;
 *   URLs keep their query NAMES but lose every value (`redactUrlQuery`); a request span's
 *   `url.path` becomes its route template (`/me/sessions/:id`).
 * - Logs: values under sensitive keys (`remoteAddress`, `email`, `password`, `token`,
 *   `cookie`, `authorization`, ...) become `[Filtered]`, and free text loses emails, JWTs,
 *   bearer credentials and query strings. Pino's own output to stdout is untouched.
 *
 * The records handed on are prototype-linked views with the scrubbed fields shadowed,
 * so the SDK's originals are never mutated.
 */
import type { logs, tracing } from '@opentelemetry/sdk-node';
import type { Attributes, AttributeValue } from '@opentelemetry/api';
import { redactUrlQuery } from '../lib/redact.js';

export const FILTERED = '[Filtered]';

/** Keys whose values never leave the process, matched at any depth of a log record. */
export const SENSITIVE_KEY =
  /authorization|cookie|passw|secret|token|email|e-mail|api[-_]?key|credential|^ip$|ip_?address|remote_?addr|x-forwarded-for|^body$|^data$|refresh|^code$/i;

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const JWT_PATTERN = /\beyJ[\w-]{5,}\.[\w-]{5,}\.[\w-]*/g;
const BEARER_PATTERN = /\b(Bearer|Basic)\s+[\w.~+/=-]+/gi;
// A query string inside free text (`GET /reset?token=...`): reset, verify and OAuth
// callback URLs all carry one-time secrets there.
const QUERY_PATTERN = /\?[^\s"'<>)]+/g;

/** Removes emails, JWTs and bearer/basic credentials from text, leaving the rest intact. */
export function scrubSecrets(value: string): string {
  return value
    .replace(BEARER_PATTERN, `$1 ${FILTERED}`)
    .replace(JWT_PATTERN, FILTERED)
    .replace(EMAIL_PATTERN, FILTERED);
}

/**
 * Removes emails, JWTs and bearer/basic credentials from free text, and every value of
 * any URL query string in it - keeping the parameter names, as the stdout logs do.
 */
export function scrubString(value: string): string {
  return scrubSecrets(value.replace(QUERY_PATTERN, (query) => redactUrlQuery(query)));
}

// ── Spans ────────────────────────────────────────────────────────────────────

/** Attributes dropped from every span: who the client is, never what the app did. */
const DROPPED_SPAN_KEYS = new Set([
  'client.address',
  'client.port',
  'http.client_ip',
  'network.peer.address',
  'network.peer.port',
  'net.peer.ip',
  'net.sock.peer.addr',
  'user_agent.original',
  'http.user_agent',
  'user.email',
  'user.name',
  'user.full_name',
]);
const DROPPED_SPAN_PREFIXES = [
  'enduser.',
  'http.request.header.',
  'http.response.header.',
  'http.request.body',
  'http.response.body',
];

/** Attributes holding a URL or a bare query string: query values are replaced, names kept. */
const URL_KEYS = new Set(['url.full', 'http.url', 'http.target', 'url.original']);

function isDroppedSpanKey(key: string): boolean {
  return DROPPED_SPAN_KEYS.has(key) || DROPPED_SPAN_PREFIXES.some((p) => key.startsWith(p)) || SENSITIVE_KEY.test(key);
}

function scrubSpanValue(value: AttributeValue): AttributeValue {
  if (typeof value === 'string') return scrubString(value);
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === 'string' ? scrubString(v) : v)) as AttributeValue;
  }
  return value;
}

/** Returns a scrubbed copy of a span's (or span event's) attributes. */
export function scrubSpanAttributes(attributes: Attributes): Attributes {
  const out: Attributes = {};
  const route = typeof attributes['http.route'] === 'string' ? attributes['http.route'] : undefined;
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || isDroppedSpanKey(key)) continue;
    if (URL_KEYS.has(key) && typeof value === 'string') {
      out[key] = scrubSecrets(redactUrlQuery(value));
    } else if (key === 'url.query' && typeof value === 'string') {
      out[key] = redactUrlQuery(`?${value}`).slice(1);
    } else if (key === 'url.path' && typeof value === 'string') {
      // The route template when the router matched one; otherwise the bare path,
      // without any query string some instrumentations leave on it.
      out[key] = route ?? scrubSecrets(value.split(/[?#]/, 1)[0] ?? '');
    } else {
      out[key] = scrubSpanValue(value);
    }
  }
  return out;
}

function scrubSpan(span: tracing.ReadableSpan): tracing.ReadableSpan {
  const status = span.status.message ? { ...span.status, message: scrubString(span.status.message) } : span.status;
  return Object.create(span, {
    attributes: { value: scrubSpanAttributes(span.attributes), enumerable: true },
    events: {
      value: span.events.map((e) => (e.attributes ? { ...e, attributes: scrubSpanAttributes(e.attributes) } : e)),
      enumerable: true,
    },
    status: { value: status, enumerable: true },
  }) as tracing.ReadableSpan;
}

/** Wraps a span exporter so only scrubbed spans reach it. */
export class ScrubbingSpanExporter implements tracing.SpanExporter {
  constructor(private readonly inner: tracing.SpanExporter) {}

  export(spans: tracing.ReadableSpan[], resultCallback: Parameters<tracing.SpanExporter['export']>[1]): void {
    this.inner.export(spans.map(scrubSpan), resultCallback);
  }

  shutdown(): Promise<void> {
    return this.inner.shutdown();
  }

  forceFlush(): Promise<void> {
    return this.inner.forceFlush?.() ?? Promise.resolve();
  }
}

// ── Logs ─────────────────────────────────────────────────────────────────────

type LogValue = logs.ReadableLogRecord['body'];

function scrubLogValue(value: LogValue, depth: number): LogValue {
  if (typeof value === 'string') return scrubString(value);
  if (depth > 6 || value === null || value === undefined || typeof value !== 'object') return value;
  if (value instanceof Uint8Array) return value;
  if (Array.isArray(value)) return value.map((v: LogValue) => scrubLogValue(v, depth + 1));
  const out: Record<string, LogValue> = {};
  for (const [key, v] of Object.entries(value as Record<string, LogValue>)) {
    out[key] = SENSITIVE_KEY.test(key) ? FILTERED : scrubLogValue(v, depth + 1);
  }
  return out;
}

/**
 * Returns scrubbed log attributes. The alert contract matches the `event.name`
 * ATTRIBUTE. Pino's `event.name` field arrives as exactly that; a record that names its
 * event only in the LogRecord's top-level EventName field (OTLP 1.5+, which the pino
 * bridge fills from an `otel.event.name` field) gets the attribute too, so an alert
 * never depends on which of the two a log call used.
 */
export function scrubLogAttributes(
  attributes: logs.ReadableLogRecord['attributes'],
  eventName?: string,
): logs.ReadableLogRecord['attributes'] {
  const out = scrubLogValue(attributes, 0) as logs.ReadableLogRecord['attributes'];
  if (eventName && out['event.name'] === undefined) out['event.name'] = eventName;
  return out;
}

function scrubLogRecord(record: logs.ReadableLogRecord): logs.ReadableLogRecord {
  return Object.create(record, {
    attributes: { value: scrubLogAttributes(record.attributes, record.eventName), enumerable: true },
    body: { value: scrubLogValue(record.body, 0), enumerable: true },
  }) as logs.ReadableLogRecord;
}

/** Wraps a log record exporter so only scrubbed records reach it. */
export class ScrubbingLogRecordExporter implements logs.LogRecordExporter {
  constructor(private readonly inner: logs.LogRecordExporter) {}

  export(records: logs.ReadableLogRecord[], resultCallback: Parameters<logs.LogRecordExporter['export']>[1]): void {
    this.inner.export(records.map(scrubLogRecord), resultCallback);
  }

  shutdown(): Promise<void> {
    return this.inner.shutdown();
  }

  forceFlush(): Promise<void> {
    return this.inner.forceFlush?.() ?? Promise.resolve();
  }
}
