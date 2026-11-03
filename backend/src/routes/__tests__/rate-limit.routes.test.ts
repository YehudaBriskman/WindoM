import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { buildApp } from '../../app.js';
import { closeDb } from '../../test-utils/db.js';

/**
 * Proves the rate limiter enforces (#358). buildTestApp() skips the limiter so counts do
 * not leak between tests, which is also why nothing else in the suite would notice if it
 * stopped working. Each test here builds its own app with the limiter on, so every test
 * starts from an empty in-memory store.
 */

let app: FastifyInstance;

beforeEach(async () => {
  app = await buildApp({ logger: false });
});

afterEach(async () => {
  await app.close();
});

afterAll(async () => {
  await closeDb();
});

const CLIENT_A = '203.0.113.10';
const CLIENT_B = '203.0.113.20';

function login(ip = CLIENT_A): Promise<LightMyRequestResponse> {
  return app.inject({
    method: 'POST',
    url: '/auth/login',
    headers: { 'fly-client-ip': ip },
    payload: { email: 'nobody@windom.invalid', password: 'password123' },
  });
}

function forgotPassword(ip = CLIENT_A): Promise<LightMyRequestResponse> {
  return app.inject({
    method: 'POST',
    url: '/auth/forgot-password',
    headers: { 'fly-client-ip': ip },
    payload: { email: 'nobody@windom.invalid' },
  });
}

/** Sends `n` requests in sequence and returns their responses. */
async function times(n: number, send: () => Promise<LightMyRequestResponse>): Promise<LightMyRequestResponse[]> {
  const out: LightMyRequestResponse[] = [];
  for (let i = 0; i < n; i++) out.push(await send());
  return out;
}

describe('per-route override: POST /auth/login (max 5 / 15 minutes)', () => {
  it('lets the first 5 through and rejects the 6th with 429', async () => {
    const allowed = await times(5, () => login());
    for (const res of allowed) expect(res.statusCode).not.toBe(429);

    const blocked = await login();
    expect(blocked.statusCode).toBe(429);
  });

  // The message interpolates context.after. A major bump that renames it keeps the 429
  // and silently degrades the text to "Try again in undefined" - this is the catch.
  it('returns the custom error body in full, with the retry window interpolated', async () => {
    await times(5, () => login());
    const blocked = await login();

    expect(blocked.json()).toEqual({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Try again in 15 minutes.',
    });
    expect(blocked.body).not.toContain('undefined');
  });

  it('advertises the route limit in the rate-limit headers', async () => {
    const [first] = await times(1, () => login());
    expect(first?.headers['x-ratelimit-limit']).toBe('5');
    expect(first?.headers['x-ratelimit-remaining']).toBe('4');

    await times(4, () => login());
    const blocked = await login();
    expect(blocked.headers['x-ratelimit-limit']).toBe('5');
    expect(blocked.headers['x-ratelimit-remaining']).toBe('0');
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('keys on fly-client-ip, so one client exhausting its budget does not block another', async () => {
    await times(5, () => login(CLIENT_A));
    expect((await login(CLIENT_A)).statusCode).toBe(429);

    const other = await login(CLIENT_B);
    expect(other.statusCode).not.toBe(429);
    expect(other.headers['x-ratelimit-remaining']).toBe('4');
  });
});

describe('per-route override: POST /auth/forgot-password (max 3 / 15 minutes)', () => {
  it('rejects the 4th request with 429', async () => {
    const allowed = await times(3, () => forgotPassword());
    for (const res of allowed) expect(res.statusCode).not.toBe(429);

    const blocked = await forgotPassword();
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json<{ message: string }>().message).toBe('Rate limit exceeded. Try again in 15 minutes.');
  });
});

describe('global limit (100 / minute) on a route with no override', () => {
  it('rejects the 101st request to GET /health with 429', async () => {
    const health = (): Promise<LightMyRequestResponse> =>
      app.inject({ method: 'GET', url: '/health', headers: { 'fly-client-ip': CLIENT_A } });

    const allowed = await times(100, health);
    for (const res of allowed) expect(res.statusCode).not.toBe(429);
    expect(allowed[0]?.headers['x-ratelimit-limit']).toBe('100');

    const blocked = await health();
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json<{ message: string }>().message).toBe('Rate limit exceeded. Try again in 1 minute.');
  });
});
