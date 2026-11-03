/**
 * Sentry error monitoring and security alerting (#204).
 *
 * Off unless SENTRY_DSN is set. With no DSN, `initSentry()` returns before calling
 * `Sentry.init()`, so there is no client, no transport and no network traffic, and
 * every capture helper below is a cheap early return.
 *
 * What may leave the process is decided twice, deliberately:
 *
 * 1. `dataCollection` tells the SDK not to collect user info, cookies, bodies, query
 *    strings, request headers (bar a short allowlist), DB query data or local variables.
 *    In @sentry/node v11 this option replaced `sendDefaultPii`, and its defaults are
 *    PERMISSIVE - leaving it unset would collect cookies and request bodies.
 * 2. `scrubEvent()` runs as `beforeSend` and strips the same things again, plus emails
 *    and JWT/bearer-shaped strings inside messages, so a future integration, SDK default
 *    change or careless `extra` cannot leak a secret on its own.
 *
 * No Fastify/HTTP auto-instrumentation is installed for errors: the app's own error
 * handler calls `captureRequestError()` for 5xx responses, which keeps capture explicit
 * and keeps the request object (body, cookies, headers) out of Sentry entirely.
 */
import { readFileSync } from 'node:fs';
import * as Sentry from '@sentry/node';
import type { Breadcrumb, ErrorEvent, Event, NodeOptions } from '@sentry/node';

export interface SentryEnv {
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  SENTRY_RELEASE?: string;
  SENTRY_TRACES_SAMPLE_RATE: number;
  NODE_ENV: string;
}

/** Stable fingerprints - alert rules and issue grouping depend on these never changing. */
export const FINGERPRINT_TOKEN_REUSE = ['security', 'token-reuse-detected'];
export const FINGERPRINT_DB_POOL_EXHAUSTED = ['infra', 'db-pool-exhausted'];

const FILTERED = '[Filtered]';

/** Request headers that carry no credentials or identity. Everything else is dropped. */
const SAFE_REQUEST_HEADERS = ['content-type', 'content-length', 'accept', 'accept-encoding'];

/** Keys whose values are never sent, matched anywhere in `extra`, `contexts`, `tags` and breadcrumb data. */
const SENSITIVE_KEY =
  /authorization|cookie|passw|secret|token|email|e-mail|api[-_]?key|credential|^ip$|ip_?address|remote_?addr|x-forwarded-for|^body$|^data$|refresh|^code$/i;

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const JWT_PATTERN = /\beyJ[\w-]{5,}\.[\w-]{5,}\.[\w-]*/g;
const BEARER_PATTERN = /\b(Bearer|Basic)\s+[\w.~+/=-]+/gi;
// A query string inside free text (`GET /reset?token=...`): reset, verify and OAuth
// callback URLs all carry one-time secrets there.
const QUERY_PATTERN = /\?[^\s"'<>)]+/g;

let enabled = false;

/** True once `initSentry()` has initialised a client. */
export function isSentryEnabled(): boolean {
  return enabled;
}

/** Removes emails, JWTs, bearer/basic credentials and URL query strings from free text. */
export function scrubString(value: string): string {
  return value
    .replace(QUERY_PATTERN, `?${FILTERED}`)
    .replace(BEARER_PATTERN, `$1 ${FILTERED}`)
    .replace(JWT_PATTERN, FILTERED)
    .replace(EMAIL_PATTERN, FILTERED);
}

function scrubValue(value: unknown, depth: number): unknown {
  if (typeof value === 'string') return scrubString(value);
  if (depth > 6 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key) ? FILTERED : scrubValue(v, depth + 1);
  }
  return out;
}

function scrubRecord<T>(record: T | undefined): T | undefined {
  return record === undefined ? undefined : (scrubValue(record, 0) as T);
}

function stripQuery(url: string): string {
  const i = url.search(/[?#]/);
  return i === -1 ? url : url.slice(0, i);
}

/**
 * The `beforeSend` scrubber. Exported so it can be tested on hand-built events.
 * Mutates and returns the event.
 */
export function scrubEvent<E extends Event>(event: E): E {
  if (event.request) {
    const req = event.request;
    delete req.data;
    delete req.cookies;
    delete req.query_string;
    delete req.env;
    if (req.url) req.url = stripQuery(req.url);
    if (req.headers) {
      const kept: Record<string, string> = {};
      for (const [name, value] of Object.entries(req.headers)) {
        if (SAFE_REQUEST_HEADERS.includes(name.toLowerCase())) kept[name] = value;
      }
      req.headers = kept;
    }
  }

  // Only an opaque user id is allowed - never email, username or IP.
  if (event.user) {
    event.user = event.user.id !== undefined ? { id: event.user.id } : {};
  }

  if (event.message) event.message = scrubString(event.message);
  if (event.logentry?.message) event.logentry.message = scrubString(event.logentry.message);
  for (const ex of event.exception?.values ?? []) {
    if (ex.value) ex.value = scrubString(ex.value);
    for (const frame of ex.stacktrace?.frames ?? []) delete frame.vars;
  }

  event.extra = scrubRecord(event.extra);
  event.contexts = scrubRecord(event.contexts);
  event.tags = scrubRecord(event.tags);
  if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);
  return event;
}

/** The `beforeBreadcrumb` scrubber: strips query strings from URLs and sensitive keys from data. */
export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb {
  if (crumb.message) crumb.message = scrubString(crumb.message);
  if (crumb.data) {
    const data = scrubRecord(crumb.data) ?? {};
    if (typeof data['url'] === 'string') data['url'] = stripQuery(data['url']);
    crumb.data = data;
  }
  return crumb;
}

/**
 * The release to tag events with, most specific first:
 * SENTRY_RELEASE → the commit in Fly's FLY_IMAGE_REF (`registry.fly.io/windom-api:release-<sha>`,
 * as pushed by release.yml) → package.json version.
 */
export function resolveRelease(
  env: { SENTRY_RELEASE?: string; FLY_IMAGE_REF?: string },
  version: string | undefined = readPackageVersion(),
): string | undefined {
  if (env.SENTRY_RELEASE) return env.SENTRY_RELEASE;
  const sha = env.FLY_IMAGE_REF?.match(/:release-([0-9a-f]{7,40})$/i)?.[1];
  if (version && sha) return `windom-backend@${version}+${sha.slice(0, 12)}`;
  if (version) return `windom-backend@${version}`;
  return sha;
}

function readPackageVersion(): string | undefined {
  try {
    // src/lib/sentry.ts and dist/lib/sentry.js both sit two levels below package.json.
    const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
      version?: string;
    };
    return pkg.version;
  } catch {
    return undefined;
  }
}

/**
 * Initialises Sentry when SENTRY_DSN is set; otherwise does nothing at all.
 * `overrides` exists for tests (a recording transport) and is never used in production.
 */
export function initSentry(env: SentryEnv, overrides: Partial<NodeOptions> = {}): boolean {
  if (!env.SENTRY_DSN) return false;

  const tracing = env.SENTRY_TRACES_SAMPLE_RATE > 0;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    release: resolveRelease({ SENTRY_RELEASE: env.SENTRY_RELEASE, FLY_IMAGE_REF: process.env['FLY_IMAGE_REF'] }),
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    // An explicit, short integration list instead of the defaults: no console/pino
    // log capture (logs carry emails), no outgoing-HTTP breadcrumbs unless tracing is
    // on, and no automatic request-data collection.
    defaultIntegrations: false,
    integrations: [
      Sentry.eventFiltersIntegration(),
      Sentry.functionToStringIntegration(),
      Sentry.linkedErrorsIntegration(),
      Sentry.dedupeIntegration(),
      Sentry.onUncaughtExceptionIntegration(),
      Sentry.onUnhandledRejectionIntegration(),
      Sentry.nodeContextIntegration(),
      Sentry.contextLinesIntegration(),
      ...(tracing ? [Sentry.httpIntegration()] : []),
    ],
    // v11 replaced `sendDefaultPii: false` with this; its defaults collect everything.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: { allow: SAFE_REQUEST_HEADERS }, response: false },
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    },
    beforeSend: (event: ErrorEvent) => scrubEvent(event),
    beforeBreadcrumb: (crumb: Breadcrumb) => scrubBreadcrumb(crumb),
    ...overrides,
  });
  enabled = true;
  return true;
}

/** Flushes pending events and shuts the client down. Safe to call when disabled. */
export async function closeSentry(timeoutMs = 2_000): Promise<void> {
  if (!enabled) return;
  enabled = false;
  await Sentry.close(timeoutMs);
}

export interface RequestErrorContext {
  method: string;
  /** The route PATTERN (`/users/:id`), never the raw URL - raw URLs can carry tokens in the query. */
  route?: string;
  statusCode: number;
  requestId?: string;
}

/** Reports an error that produced a 5xx response. */
export function captureRequestError(error: unknown, ctx: RequestErrorContext): void {
  if (!enabled) return;
  Sentry.withScope((scope) => {
    scope.setLevel('error');
    scope.setTag('http.status_code', String(ctx.statusCode));
    scope.setTag('http.method', ctx.method);
    if (ctx.route) scope.setTag('http.route', ctx.route);
    if (ctx.requestId) scope.setTag('request_id', ctx.requestId);
    scope.setTransactionName(`${ctx.method} ${ctx.route ?? '<unmatched>'}`);
    Sentry.captureException(error);
  });
}

export interface PoolStats {
  total: number;
  idle: number;
  waiting: number;
  max: number;
}

/**
 * Reports a request that failed because no DB connection could be acquired (the 503
 * path in the global error handler). Grouped under one fingerprint so an alert rule
 * can count occurrences regardless of which route hit it.
 */
export function captureDbPoolExhausted(
  error: unknown,
  ctx: Omit<RequestErrorContext, 'statusCode'>,
  pool?: PoolStats,
): void {
  if (!enabled) return;
  Sentry.withScope((scope) => {
    scope.setLevel('error');
    scope.setFingerprint(FINGERPRINT_DB_POOL_EXHAUSTED);
    scope.setTag('infra', 'db_pool_exhausted');
    scope.setTag('http.method', ctx.method);
    if (ctx.route) scope.setTag('http.route', ctx.route);
    if (pool) scope.setContext('db_pool', { ...pool });
    Sentry.captureException(error);
  });
}

/**
 * Reports a replayed refresh token - the session-hijack signal (#204). Level `fatal`,
 * a fixed fingerprint and the `security=token_reuse` tag let an alert rule page on the
 * first occurrence. Only opaque ids are attached: no email, IP or user agent.
 */
export function captureTokenReuse(ctx: { userId: string; sessionId: string }): void {
  if (!enabled) return;
  Sentry.withScope((scope) => {
    scope.setLevel('fatal');
    scope.setFingerprint(FINGERPRINT_TOKEN_REUSE);
    scope.setTag('security', 'token_reuse');
    scope.setUser({ id: ctx.userId });
    scope.setContext('session', { sessionId: ctx.sessionId });
    Sentry.captureMessage('TOKEN_REUSE_DETECTED: refresh token replayed, all sessions for the user revoked');
  });
}
