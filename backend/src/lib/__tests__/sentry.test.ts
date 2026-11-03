/**
 * Sentry integration (#204).
 *
 * Nothing here touches the network: the enabled tests replace the transport with one
 * that records the serialised envelope, so the assertions are made on the exact bytes
 * that would have been sent to Sentry.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as Sentry from '@sentry/node';
import type { ErrorEvent } from '@sentry/node';
import type { FastifyInstance } from 'fastify';
import {
  captureTokenReuse,
  closeSentry,
  FINGERPRINT_DB_POOL_EXHAUSTED,
  FINGERPRINT_TOKEN_REUSE,
  initSentry,
  isSentryEnabled,
  resolveRelease,
  scrubEvent,
} from '../sentry.js';
import { buildTestApp } from '../../test-utils/app.js';

const DUMMY_DSN = 'https://public@o0.ingest.sentry.io/0';

const SECRET_PASSWORD = 'hunter2-correct-horse';
const SECRET_EMAIL = 'alice.victim@example.com';
const SECRET_JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSJ9.c2lnbmF0dXJlLXZhbHVl';
const SECRET_COOKIE = 'refresh_token=rt-secret-cookie-value';
const SECRET_QUERY_TOKEN = 'reset-token-in-query-123';

// ── Envelope capture ────────────────────────────────────────────────────────

const sentBodies: string[] = [];

function recordingTransport(options: Parameters<typeof Sentry.createTransport>[0]) {
  return Sentry.createTransport(options, (request) => {
    sentBodies.push(typeof request.body === 'string' ? request.body : new TextDecoder().decode(request.body));
    return Promise.resolve({ statusCode: 200 });
  });
}

/** Returns the event payloads of every envelope sent so far. */
function sentEvents(): ErrorEvent[] {
  const events: ErrorEvent[] = [];
  for (const body of sentBodies) {
    const lines = body.split('\n').filter(Boolean);
    for (let i = 1; i < lines.length - 1; i++) {
      const header = JSON.parse(lines[i] ?? '{}') as { type?: string };
      if (header.type === 'event') events.push(JSON.parse(lines[i + 1] ?? '{}') as ErrorEvent);
    }
  }
  return events;
}

function assertNoSecrets(): void {
  const all = sentBodies.join('\n');
  expect(all).not.toContain(SECRET_PASSWORD);
  expect(all).not.toContain(SECRET_EMAIL);
  expect(all).not.toContain(SECRET_JWT);
  expect(all).not.toContain('rt-secret-cookie-value');
  expect(all).not.toContain(SECRET_QUERY_TOKEN);
  expect(all).not.toContain('203.0.113.7');
}

// ── Disabled: no DSN ────────────────────────────────────────────────────────

describe('Sentry without SENTRY_DSN', () => {
  it('never initialises a client', () => {
    expect(initSentry({ NODE_ENV: 'test', SENTRY_TRACES_SAMPLE_RATE: 0 })).toBe(false);
    expect(isSentryEnabled()).toBe(false);
    expect(Sentry.getClient()).toBeUndefined();
  });

  it('treats capture calls as no-ops', () => {
    expect(() => captureTokenReuse({ userId: 'u1', sessionId: 's1' })).not.toThrow();
    expect(Sentry.getClient()).toBeUndefined();
  });
});

// ── scrubEvent on a hand-built worst case ──────────────────────────────────

describe('scrubEvent', () => {
  it('removes bodies, cookies, credentials, query strings, emails and IPs', () => {
    const event = scrubEvent({
      message: `login failed for ${SECRET_EMAIL}`,
      request: {
        url: `https://windom-api.fly.dev/auth/reset?token=${SECRET_QUERY_TOKEN}`,
        method: 'POST',
        query_string: `token=${SECRET_QUERY_TOKEN}`,
        data: { email: SECRET_EMAIL, password: SECRET_PASSWORD },
        cookies: { refresh_token: 'rt-secret-cookie-value' },
        headers: {
          authorization: `Bearer ${SECRET_JWT}`,
          cookie: SECRET_COOKIE,
          'x-forwarded-for': '203.0.113.7',
          'content-type': 'application/json',
        },
        env: { REMOTE_ADDR: '203.0.113.7' },
      },
      user: { id: 'u1', email: SECRET_EMAIL, ip_address: '203.0.113.7', username: 'alice' },
      exception: {
        values: [
          {
            type: 'Error',
            value: `duplicate key (email)=(${SECRET_EMAIL}) token ${SECRET_JWT}`,
            stacktrace: { frames: [{ function: 'login', vars: { password: SECRET_PASSWORD } }] },
          },
        ],
      },
      extra: {
        password: SECRET_PASSWORD,
        accessToken: SECRET_JWT,
        nested: { userEmail: SECRET_EMAIL, note: `hi ${SECRET_EMAIL}` },
      },
      contexts: { auth: { refreshToken: 'x', ip: '203.0.113.7' } },
      breadcrumbs: [
        {
          message: `GET /x?token=${SECRET_QUERY_TOKEN}`,
          data: { url: `https://api.example/cb?code=${SECRET_QUERY_TOKEN}` },
        },
      ],
    });

    const serialised = JSON.stringify(event);
    for (const secret of [
      SECRET_PASSWORD,
      SECRET_EMAIL,
      SECRET_JWT,
      'rt-secret-cookie-value',
      SECRET_QUERY_TOKEN,
      '203.0.113.7',
    ]) {
      expect(serialised).not.toContain(secret);
    }
    expect(event.request?.headers).toEqual({ 'content-type': 'application/json' });
    expect(event.request?.url).toBe('https://windom-api.fly.dev/auth/reset');
    expect(event.request?.data).toBeUndefined();
    expect(event.request?.cookies).toBeUndefined();
    expect(event.user).toEqual({ id: 'u1' });
  });
});

describe('resolveRelease', () => {
  it('prefers SENTRY_RELEASE, then the Fly image commit, then the package version', () => {
    expect(resolveRelease({ SENTRY_RELEASE: 'custom' }, '1.5.1')).toBe('custom');
    expect(resolveRelease({ FLY_IMAGE_REF: 'registry.fly.io/windom-api:release-0123456789abcdef0123' }, '1.5.1')).toBe(
      'windom-backend@1.5.1+0123456789ab',
    );
    expect(resolveRelease({ FLY_IMAGE_REF: 'registry.fly.io/windom-api:deployment-01ABC' }, '1.5.1')).toBe(
      'windom-backend@1.5.1',
    );
    expect(resolveRelease({})).toMatch(/^windom-backend@\d+\.\d+\.\d+/);
  });
});

// ── Enabled: dummy DSN, recording transport ─────────────────────────────────

describe('Sentry with SENTRY_DSN (recording transport)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const ok = initSentry(
      {
        SENTRY_DSN: DUMMY_DSN,
        NODE_ENV: 'test',
        SENTRY_ENVIRONMENT: 'ci',
        SENTRY_RELEASE: 'test-release',
        SENTRY_TRACES_SAMPLE_RATE: 0,
      },
      { transport: recordingTransport },
    );
    expect(ok).toBe(true);

    app = await buildTestApp();
    app.post('/__sentry-test/boom', () => {
      throw new Error(`boom while handling ${SECRET_EMAIL}`);
    });
    app.get('/__sentry-test/pool', () => {
      throw new Error('timeout expired');
    });
    app.get('/__sentry-test/bad-request', () => {
      throw Object.assign(new Error('nope'), { statusCode: 400 });
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeSentry();
  });

  beforeEach(() => {
    sentBodies.length = 0;
  });

  it('captures a 5xx with release and environment, and sends no request data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/__sentry-test/boom?token=${SECRET_QUERY_TOKEN}`,
      headers: {
        authorization: `Bearer ${SECRET_JWT}`,
        cookie: SECRET_COOKIE,
        'x-forwarded-for': '203.0.113.7',
        'content-type': 'application/json',
      },
      payload: { email: SECRET_EMAIL, password: SECRET_PASSWORD },
    });
    expect(res.statusCode).toBe(500);
    await Sentry.flush(2_000);

    const [event, ...rest] = sentEvents();
    expect(rest).toHaveLength(0);
    expect(event?.release).toBe('test-release');
    expect(event?.environment).toBe('ci');
    expect(event?.level).toBe('error');
    expect(event?.tags).toMatchObject({
      'http.status_code': '500',
      'http.method': 'POST',
      'http.route': '/__sentry-test/boom',
    });
    expect(event?.exception?.values?.[0]?.value).toBe('boom while handling [Filtered]');
    expect(event?.request).toBeUndefined();
    assertNoSecrets();
  });

  it('does not report 4xx responses', async () => {
    const res = await app.inject({ method: 'GET', url: '/__sentry-test/bad-request' });
    expect(res.statusCode).toBe(400);
    await Sentry.flush(2_000);
    expect(sentEvents()).toHaveLength(0);
  });

  it('reports DB pool exhaustion under a stable fingerprint', async () => {
    const res = await app.inject({ method: 'GET', url: '/__sentry-test/pool' });
    expect(res.statusCode).toBe(503);
    await Sentry.flush(2_000);

    const [event] = sentEvents();
    expect(event?.fingerprint).toEqual(FINGERPRINT_DB_POOL_EXHAUSTED);
    expect(event?.tags).toMatchObject({ infra: 'db_pool_exhausted' });
    const poolCtx = event?.contexts?.['db_pool'];
    expect(typeof poolCtx?.['total']).toBe('number');
    expect(typeof poolCtx?.['waiting']).toBe('number');
  });

  it('reports token reuse as fatal with a fixed fingerprint, tag and only opaque ids', async () => {
    captureTokenReuse({ userId: 'user-123', sessionId: 'session-456' });
    await Sentry.flush(2_000);

    const [event] = sentEvents();
    expect(event?.level).toBe('fatal');
    expect(event?.fingerprint).toEqual(FINGERPRINT_TOKEN_REUSE);
    expect(event?.tags).toMatchObject({ security: 'token_reuse' });
    expect(event?.user).toEqual({ id: 'user-123' });
    expect(event?.contexts?.['session']).toEqual({ sessionId: 'session-456' });
    assertNoSecrets();
  });
});
