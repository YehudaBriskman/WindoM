/**
 * The exporter-side scrubber (#476) on hand-built worst cases. Successor of the Sentry
 * `scrubEvent` tests: the same secrets, now checked on span and log attributes.
 */
import { describe, it, expect } from 'vitest';
import { FILTERED, scrubLogAttributes, scrubSpanAttributes, scrubString } from '../scrub.js';

const SECRET_PASSWORD = 'hunter2-correct-horse';
const SECRET_EMAIL = 'alice.victim@example.com';
const SECRET_JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSJ9.c2lnbmF0dXJlLXZhbHVl';
const SECRET_COOKIE = 'refresh_token=rt-secret-cookie-value';
const SECRET_QUERY_TOKEN = 'reset-token-in-query-123';
const SECRET_IP = '203.0.113.7';

const ALL_SECRETS = [
  SECRET_PASSWORD,
  SECRET_EMAIL,
  SECRET_JWT,
  'rt-secret-cookie-value',
  SECRET_QUERY_TOKEN,
  SECRET_IP,
];

function expectNoSecrets(value: unknown): void {
  const serialised = JSON.stringify(value);
  for (const secret of ALL_SECRETS) expect(serialised).not.toContain(secret);
}

describe('scrubString', () => {
  it('removes emails, JWTs, bearer credentials and query values, keeping query names', () => {
    expect(scrubString(`login failed for ${SECRET_EMAIL}`)).toBe(`login failed for ${FILTERED}`);
    expect(scrubString(`Authorization: Bearer ${SECRET_JWT}`)).toBe(`Authorization: Bearer ${FILTERED}`);
    expect(scrubString(`token ${SECRET_JWT} expired`)).toBe(`token ${FILTERED} expired`);
    expect(scrubString(`GET /auth/reset-password?token=${SECRET_QUERY_TOKEN}&x=1 failed`)).toBe(
      'GET /auth/reset-password?token=[redacted]&x=[redacted] failed',
    );
    expect(scrubString('nothing to see')).toBe('nothing to see');
  });
});

describe('scrubSpanAttributes', () => {
  it('drops client identity and headers, redacts URL query values and uses the route template', () => {
    const out = scrubSpanAttributes({
      'http.request.method': 'GET',
      'http.route': '/me/sessions/:id',
      'url.path': '/me/sessions/7d1c5e0a-1111-2222-3333-444455556666',
      'url.query': `token=${SECRET_QUERY_TOKEN}&state=abc`,
      'url.full': `https://windom-api.fly.dev/auth/reset?token=${SECRET_QUERY_TOKEN}`,
      'http.target': `/auth/reset?token=${SECRET_QUERY_TOKEN}`,
      'client.address': SECRET_IP,
      'http.client_ip': SECRET_IP,
      'network.peer.address': SECRET_IP,
      'user_agent.original': 'Mozilla/5.0 (fingerprint)',
      'user.email': SECRET_EMAIL,
      'enduser.id': 'u1',
      'http.request.header.authorization': [`Bearer ${SECRET_JWT}`],
      'http.request.header.cookie': [SECRET_COOKIE],
      'exception.message': `duplicate key (email)=(${SECRET_EMAIL})`,
      'http.response.status_code': 500,
    });

    expectNoSecrets(out);
    expect(out).toEqual({
      'http.request.method': 'GET',
      'http.route': '/me/sessions/:id',
      'url.path': '/me/sessions/:id',
      'url.query': 'token=[redacted]&state=[redacted]',
      'url.full': 'https://windom-api.fly.dev/auth/reset?token=[redacted]',
      'http.target': '/auth/reset?token=[redacted]',
      'exception.message': `duplicate key (email)=(${FILTERED})`,
      'http.response.status_code': 500,
    });
  });

  it('keeps an unmatched path but never its query string', () => {
    expect(scrubSpanAttributes({ 'url.path': `/nope?token=${SECRET_QUERY_TOKEN}` })).toEqual({ 'url.path': '/nope' });
  });
});

describe('scrubLogAttributes', () => {
  it('filters sensitive keys at any depth and scrubs free text', () => {
    const out = scrubLogAttributes({
      req: { id: 'req-1', method: 'POST', url: `/auth/reset?token=${SECRET_QUERY_TOKEN}`, remoteAddress: SECRET_IP },
      email: SECRET_EMAIL,
      password: SECRET_PASSWORD,
      headers: { authorization: `Bearer ${SECRET_JWT}`, cookie: SECRET_COOKIE, 'x-forwarded-for': SECRET_IP },
      err: { type: 'Error', message: `no user ${SECRET_EMAIL}`, stack: `Error: no user ${SECRET_EMAIL}\n at x` },
      nested: { deeper: { refreshToken: 'x', ip: SECRET_IP, note: `hi ${SECRET_EMAIL}` } },
      userId: 'u1',
      'event.name': 'http.server.error',
    });

    expectNoSecrets(out);
    expect(out['req']).toEqual({
      id: 'req-1',
      method: 'POST',
      url: '/auth/reset?token=[redacted]',
      remoteAddress: FILTERED,
    });
    expect(out['email']).toBe(FILTERED);
    expect(out['userId']).toBe('u1');
    expect(out['event.name']).toBe('http.server.error');
  });

  it('copies the record EventName into the event.name attribute the alerts match', () => {
    expect(scrubLogAttributes({ userId: 'u1' }, 'auth.token_reuse_detected')).toEqual({
      userId: 'u1',
      'event.name': 'auth.token_reuse_detected',
    });
    expect(scrubLogAttributes({})).toEqual({});
  });
});
