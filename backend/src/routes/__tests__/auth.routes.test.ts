import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { buildTestApp } from '../../test-utils/app.js';
import { truncateAll, closeDb } from '../../test-utils/db.js';

const app = await buildTestApp();

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await app.close();
  await closeDb();
});

// ── Helpers ───────────────────────────────────────────────────────────────

async function register(email = 'test@test.com', password = 'password123', name = 'Tester'): Promise<ReturnType<typeof app.inject>> {
  return app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email, password, name },
  });
}

async function login(email = 'test@test.com', password = 'password123'): Promise<ReturnType<typeof app.inject>> {
  return app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password },
  });
}

// ── POST /auth/register ───────────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('returns 200 with accessToken on valid registration', async () => {
    const res = await register();
    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string }>();
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(10);
  });

  it('sets the windom_refresh HttpOnly cookie', async () => {
    const res = await register();
    const cookies = res.cookies;
    const refresh = cookies.find((c) => c.name === 'windom_refresh');
    expect(refresh).toBeDefined();
    expect(refresh?.httpOnly).toBe(true);
  });

  it('returns 400 for invalid email', async () => {
    const res = await register('not-an-email');
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for password too short', async () => {
    const res = await register('a@b.com', 'short');
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 on duplicate email', async () => {
    await register();
    const res = await register();
    expect(res.statusCode).toBe(409);
  });
});

// ── POST /auth/login ──────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  it('returns 200 with accessToken for valid credentials', async () => {
    await register();
    const res = await login();
    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string }>();
    expect(typeof body.accessToken).toBe('string');
  });

  it('returns 401 for wrong password', async () => {
    await register();
    const res = await login('test@test.com', 'wrongpassword');
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    const res = await login('nobody@nowhere.com', 'password123');
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'bad', password: 'pass' } });
    expect(res.statusCode).toBe(400);
  });
});

// ── POST /auth/refresh ────────────────────────────────────────────────────

describe('POST /auth/refresh', () => {
  it('returns 200 with new accessToken when refresh cookie is valid', async () => {
    const regRes = await register();
    const cookie = regRes.cookies.find((c) => c.name === 'windom_refresh');

    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { windom_refresh: cookie?.value ?? '' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string }>();
    expect(typeof body.accessToken).toBe('string');
  });

  it('returns 401 when no refresh cookie is present', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/refresh' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for an invalid refresh token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { windom_refresh: 'totally-fake-token' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── POST /auth/logout ─────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
  it('returns 200 and clears the cookie', async () => {
    const regRes = await register();
    const cookie = regRes.cookies.find((c) => c.name === 'windom_refresh');

    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: { windom_refresh: cookie?.value ?? '' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ success: boolean }>().success).toBe(true);
  });

  it('returns 200 even without a cookie (idempotent)', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/logout' });
    expect(res.statusCode).toBe(200);
  });
});

// ── GET /me ───────────────────────────────────────────────────────────────

describe('GET /me', () => {
  it('returns user data for authenticated request', async () => {
    const regRes = await register('me@test.com', 'password123', 'Me User');
    const { accessToken } = regRes.json<{ accessToken: string }>();

    const res = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const user = res.json<{ email: string; name: string }>();
    expect(user.email).toBe('me@test.com');
    expect(user.name).toBe('Me User');
  });

  it('returns 401 with no token', async () => {
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(401);
  });
});

// ── GET+PUT /settings ─────────────────────────────────────────────────────

describe('settings', () => {
  it('GET /settings returns null data before any settings are saved', async () => {
    const { accessToken } = (await register('s@s.com', 'password123', 'S')).json<{ accessToken: string }>();
    const res = await app.inject({ method: 'GET', url: '/settings', headers: { Authorization: `Bearer ${accessToken}` } });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ data: null }>().data).toBeNull();
  });

  it('PUT /settings saves and returns data', async () => {
    const { accessToken } = (await register('s2@s.com', 'password123', 'S2')).json<{ accessToken: string }>();
    const payload = { theme: 'dark', language: 'en' };

    const putRes = await app.inject({ method: 'PUT', url: '/settings', headers: { Authorization: `Bearer ${accessToken}` }, payload });
    expect(putRes.statusCode).toBe(200);
    expect(putRes.json<{ data: typeof payload }>().data).toEqual(payload);

    const getRes = await app.inject({ method: 'GET', url: '/settings', headers: { Authorization: `Bearer ${accessToken}` } });
    expect(getRes.json<{ data: typeof payload }>().data).toEqual(payload);
  });
});

// ── GET /integrations ─────────────────────────────────────────────────────

describe('GET /integrations', () => {
  it('returns both providers as disconnected for a new user', async () => {
    const { accessToken } = (await register('i@i.com', 'password123', 'I')).json<{ accessToken: string }>();
    const res = await app.inject({ method: 'GET', url: '/integrations', headers: { Authorization: `Bearer ${accessToken}` } });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ google: { connected: boolean }; spotify: { connected: boolean } }>();
    expect(body.google.connected).toBe(false);
    expect(body.spotify.connected).toBe(false);
  });

  it('returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/integrations' });
    expect(res.statusCode).toBe(401);
  });
});

describe('DELETE /integrations/:provider', () => {
  it('returns 400 for invalid provider name', async () => {
    const { accessToken } = (await register('d@d.com', 'password123', 'D')).json<{ accessToken: string }>();
    const res = await app.inject({ method: 'DELETE', url: '/integrations/tiktok', headers: { Authorization: `Bearer ${accessToken}` } });
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 for valid provider even if not linked', async () => {
    const { accessToken } = (await register('d2@d.com', 'password123', 'D2')).json<{ accessToken: string }>();
    const res = await app.inject({ method: 'DELETE', url: '/integrations/google', headers: { Authorization: `Bearer ${accessToken}` } });
    expect(res.statusCode).toBe(200);
  });
});
