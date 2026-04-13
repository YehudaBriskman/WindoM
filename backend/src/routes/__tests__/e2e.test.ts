/**
 * End-to-end test suite — full user journeys from HTTP request to DB.
 *
 * Every test uses app.inject() (no real port), hits the full Fastify stack
 * (auth middleware, services, Drizzle ORM) against a real PostgreSQL test DB.
 *
 * Journeys covered:
 *  1. Complete auth lifecycle (register → refresh → logout → reuse detection)
 *  2. Email verification (token read from DB, verify, resend, expiry)
 *  3. Password reset (forgot → read token → reset → old password rejected)
 *  4. Profile management (name + password update, Google-only account guard)
 *  5. Settings isolation and persistence (cross-user, overwrite, bootstrap)
 *  6. Account deletion and DB cleanup (all cascades verified)
 *  7. Refresh token reuse detection — security invariant
 *  8. Multi-session management (parallel sessions, selective logout)
 *  9. Integration lifecycle (seed OAuth account → list → disconnect)
 * 10. Cross-service: settings survive auth events; isolation across users
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { eq, and } from 'drizzle-orm';
import { buildTestApp } from '../../test-utils/app.js';
import { truncateAll, closeDb } from '../../test-utils/db.js';
import { db } from '../../db/client.js';
import {
  users,
  emailTokens,
  oauthAccounts,
  refreshSessions,
  userSettings,
} from '../../db/schema.js';
import { encryptToken } from '../../lib/crypto.js';

// Mock email transport so tests don't need a live SMTP server
vi.mock('../../lib/email.js', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendGoogleOnlyResetEmail: vi.fn().mockResolvedValue(undefined),
}));

// ── App singleton (shared across all tests in this file) ──────────────────

const app = await buildTestApp();

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await app.close();
  await closeDb();
});

// ── HTTP helpers ──────────────────────────────────────────────────────────

type InjectResult = Awaited<ReturnType<typeof app.inject>>;

async function register(
  email = 'user@e2e.test',
  password = 'Password123!',
  name = 'E2E User',
): Promise<InjectResult> {
  return app.inject({ method: 'POST', url: '/auth/register', payload: { email, password, name } });
}

async function login(email = 'user@e2e.test', password = 'Password123!'): Promise<InjectResult> {
  return app.inject({ method: 'POST', url: '/auth/login', payload: { email, password } });
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function refreshCookie(res: InjectResult): string {
  return res.cookies.find((c) => c.name === 'windom_refresh')?.value ?? '';
}

async function fullRegister(email = 'user@e2e.test', password = 'Password123!', name = 'E2E User') {
  const res = await register(email, password, name);
  const { accessToken } = res.json<{ accessToken: string }>();
  const cookie = refreshCookie(res);
  return { accessToken, cookie, res };
}

/** Read the most-recent email token for a user from the DB. */
async function getLatestEmailToken(userId: string, type: 'verify_email' | 'password_reset') {
  const rows = await db
    .select()
    .from(emailTokens)
    .where(and(eq(emailTokens.userId, userId), eq(emailTokens.type, type)))
    .orderBy(emailTokens.createdAt);
  return rows.at(-1) ?? null;
}

/**
 * Poll for an email token to appear in DB (up to `maxMs`).
 * Required after register(): the verification token is written by a fire-and-forget
 * promise that may not have resolved before the test reads the DB on slow CI runners.
 */
async function waitForEmailToken(
  userId: string,
  type: 'verify_email' | 'password_reset',
  maxMs = 1000,
) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const token = await getLatestEmailToken(userId, type);
    if (token) return token;
    await new Promise<void>((resolve) => setTimeout(resolve, 30));
  }
  return null;
}

/** Get a user row from DB by email. */
async function getUserByEmail(email: string) {
  const rows = await db.select().from(users).where(eq(users.email, email));
  return rows[0] ?? null;
}

// ══════════════════════════════════════════════════════════════════════════
// 1. COMPLETE AUTH LIFECYCLE
// ══════════════════════════════════════════════════════════════════════════

describe('Journey 1 — auth lifecycle', () => {
  it('register → GET /me → refresh → logout → refresh fails', async () => {
    // Register
    const { accessToken, cookie } = await fullRegister();
    expect(accessToken).toBeTruthy();
    expect(cookie).toBeTruthy();

    // GET /me returns correct data
    const meRes = await app.inject({ method: 'GET', url: '/me', headers: authHeader(accessToken) });
    expect(meRes.statusCode).toBe(200);
    const me = meRes.json<{ email: string; name: string; emailVerified: boolean; hasPassword: boolean }>();
    expect(me.email).toBe('user@e2e.test');
    expect(me.name).toBe('E2E User');
    expect(me.emailVerified).toBe(false);
    expect(me.hasPassword).toBe(true);

    // Refresh returns a new access token
    const refreshRes = await app.inject({
      method: 'POST', url: '/auth/refresh',
      cookies: { windom_refresh: cookie },
    });
    expect(refreshRes.statusCode).toBe(200);
    const newToken = refreshRes.json<{ accessToken: string }>().accessToken;
    expect(newToken).toBeTruthy();

    // New refresh cookie is issued (even if access token payload is identical within the same second)
    const newCookie = refreshCookie(refreshRes);
    expect(newCookie).toBeTruthy();
    expect(newCookie).not.toBe(cookie); // refresh cookie must always rotate

    // Logout with new cookie
    const logoutRes = await app.inject({
      method: 'POST', url: '/auth/logout',
      cookies: { windom_refresh: newCookie },
    });
    expect(logoutRes.statusCode).toBe(200);

    // After logout, refresh fails
    const afterLogout = await app.inject({
      method: 'POST', url: '/auth/refresh',
      cookies: { windom_refresh: newCookie },
    });
    expect(afterLogout.statusCode).toBe(401);
  });

  it('login returns the same user data as registration', async () => {
    await register();
    const loginRes = await login();
    expect(loginRes.statusCode).toBe(200);
    const { accessToken } = loginRes.json<{ accessToken: string }>();
    const meRes = await app.inject({ method: 'GET', url: '/me', headers: authHeader(accessToken) });
    const me = meRes.json<{ email: string }>();
    expect(me.email).toBe('user@e2e.test');
  });

  it('access token from registration is accepted immediately', async () => {
    const { accessToken } = await fullRegister();
    const res = await app.inject({ method: 'GET', url: '/me', headers: authHeader(accessToken) });
    expect(res.statusCode).toBe(200);
  });

  it('tampered access token is rejected', async () => {
    const { accessToken } = await fullRegister();
    const tampered = accessToken.slice(0, -5) + 'XXXXX';
    const res = await app.inject({ method: 'GET', url: '/me', headers: authHeader(tampered) });
    expect(res.statusCode).toBe(401);
  });

  it('completely invalid token is rejected', async () => {
    const res = await app.inject({ method: 'GET', url: '/me', headers: authHeader('not.a.jwt.token') });
    expect(res.statusCode).toBe(401);
  });

  it('missing Authorization header is rejected', async () => {
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 2. EMAIL VERIFICATION LIFECYCLE
// ══════════════════════════════════════════════════════════════════════════

describe('Journey 2 — email verification', () => {
  it('new user has emailVerified=false; token exists in DB; verify succeeds; flag flips to true', async () => {
    const { accessToken } = await fullRegister();

    // Unverified by default
    const me1 = (await app.inject({ method: 'GET', url: '/me', headers: authHeader(accessToken) }))
      .json<{ emailVerified: boolean }>();
    expect(me1.emailVerified).toBe(false);

    // Token written to DB (fire-and-forget from register — poll until it appears)
    const user = await getUserByEmail('user@e2e.test');
    expect(user).toBeTruthy();
    const emailToken = await waitForEmailToken(user.id, 'verify_email');
    expect(emailToken).toBeTruthy();
    expect(emailToken!.usedAt).toBeNull();

    // Click the verification link
    const verifyRes = await app.inject({
      method: 'GET',
      url: `/auth/verify-email?token=${emailToken!.token}`,
    });
    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.headers['content-type']).toContain('text/html');
    expect(verifyRes.body).toContain('verified');

    // Token is now marked as used in DB
    const usedToken = await getLatestEmailToken(user.id, 'verify_email');
    expect(usedToken!.usedAt).not.toBeNull();

    // Refresh access token — new token carries emailVerified=true
    const newLoginRes = await login();
    const newToken = newLoginRes.json<{ accessToken: string }>().accessToken;
    const me2 = (await app.inject({ method: 'GET', url: '/me', headers: authHeader(newToken) }))
      .json<{ emailVerified: boolean }>();
    expect(me2.emailVerified).toBe(true);
  });

  it('expired verification token is rejected with error page', async () => {
    await fullRegister();
    const user = await getUserByEmail('user@e2e.test');
    const emailToken = await waitForEmailToken(user.id, 'verify_email');

    // Expire the token directly in DB
    await db.update(emailTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(emailTokens.id, emailToken!.id));

    const res = await app.inject({
      method: 'GET', url: `/auth/verify-email?token=${emailToken!.token}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('invalid');
  });

  it('already-used token is rejected', async () => {
    await fullRegister();
    const user = await getUserByEmail('user@e2e.test');
    const emailToken = await waitForEmailToken(user.id, 'verify_email');

    // Use it once
    await app.inject({ method: 'GET', url: `/auth/verify-email?token=${emailToken!.token}` });
    // Use it again
    const res = await app.inject({ method: 'GET', url: `/auth/verify-email?token=${emailToken!.token}` });
    expect(res.body).toContain('invalid');
  });

  it('missing token query param returns error page', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/verify-email' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('Missing');
  });

  it('resend verification creates a new token and old one still exists', async () => {
    const { accessToken } = await fullRegister();
    const user = await getUserByEmail('user@e2e.test');
    const firstToken = await waitForEmailToken(user.id, 'verify_email');

    const resendRes = await app.inject({
      method: 'POST', url: '/auth/resend-verification',
      headers: authHeader(accessToken),
    });
    expect(resendRes.statusCode).toBe(200);

    const secondToken = await getLatestEmailToken(user.id, 'verify_email');
    expect(secondToken!.token).not.toBe(firstToken!.token);
  });

  it('resend returns 400 if email already verified', async () => {
    await fullRegister();
    const user = await getUserByEmail('user@e2e.test');
    const emailToken = await waitForEmailToken(user.id, 'verify_email');

    // Verify first
    await app.inject({ method: 'GET', url: `/auth/verify-email?token=${emailToken!.token}` });

    // Re-login to get a token with emailVerified=true
    const newToken = (await login()).json<{ accessToken: string }>().accessToken;

    const res = await app.inject({
      method: 'POST', url: '/auth/resend-verification',
      headers: authHeader(newToken),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe('ALREADY_VERIFIED');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 3. PASSWORD RESET LIFECYCLE
// ══════════════════════════════════════════════════════════════════════════

describe('Journey 3 — password reset', () => {
  it('full flow: forgot → read DB token → reset → old password rejected → new works', async () => {
    await register();
    const user = await getUserByEmail('user@e2e.test');

    // Request reset (always 200 — no user enumeration)
    const forgotRes = await app.inject({
      method: 'POST', url: '/auth/forgot-password',
      payload: { email: 'user@e2e.test' },
    });
    expect(forgotRes.statusCode).toBe(200);

    // Token written to DB
    const resetToken = await getLatestEmailToken(user.id, 'password_reset');
    expect(resetToken).toBeTruthy();
    expect(resetToken!.usedAt).toBeNull();

    // GET reset page renders HTML form
    const pageRes = await app.inject({
      method: 'GET', url: `/auth/reset-password?token=${resetToken!.token}`,
    });
    expect(pageRes.statusCode).toBe(200);
    expect(pageRes.headers['content-type']).toContain('text/html');
    expect(pageRes.body).toContain('form');

    // POST form with new password
    const newPassword = 'NewSecure456!';
    const resetRes = await app.inject({
      method: 'POST', url: '/auth/reset-password',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: `token=${resetToken!.token}&newPassword=${newPassword}`,
    });
    expect(resetRes.statusCode).toBe(200);
    expect(resetRes.body).toContain('updated');

    // Token marked as used in DB
    const used = await getLatestEmailToken(user.id, 'password_reset');
    expect(used!.usedAt).not.toBeNull();

    // Old password is rejected
    const oldLoginRes = await login('user@e2e.test', 'Password123!');
    expect(oldLoginRes.statusCode).toBe(401);

    // New password works
    const newLoginRes = await login('user@e2e.test', newPassword);
    expect(newLoginRes.statusCode).toBe(200);
    expect(newLoginRes.json<{ accessToken: string }>().accessToken).toBeTruthy();
  });

  it('forgot password for unknown email still returns 200 (no enumeration)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/forgot-password',
      payload: { email: 'nobody@nowhere.test' },
    });
    expect(res.statusCode).toBe(200);
    // No token created
    const rows = await db.select().from(emailTokens).where(eq(emailTokens.type, 'password_reset'));
    expect(rows).toHaveLength(0);
  });

  it('used reset token cannot be replayed', async () => {
    await register();
    const user = await getUserByEmail('user@e2e.test');
    await app.inject({ method: 'POST', url: '/auth/forgot-password', payload: { email: 'user@e2e.test' } });
    const resetToken = await getLatestEmailToken(user.id, 'password_reset');

    await app.inject({
      method: 'POST', url: '/auth/reset-password',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: `token=${resetToken!.token}&newPassword=FirstReset123!`,
    });

    // Replay
    const replayRes = await app.inject({
      method: 'POST', url: '/auth/reset-password',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: `token=${resetToken!.token}&newPassword=HackAttempt999!`,
    });
    expect(replayRes.body).toContain('invalid');

    // Verify second password was NOT applied
    const res = await login('user@e2e.test', 'HackAttempt999!');
    expect(res.statusCode).toBe(401);
  });

  it('expired reset token is rejected', async () => {
    await register();
    const user = await getUserByEmail('user@e2e.test');
    await app.inject({ method: 'POST', url: '/auth/forgot-password', payload: { email: 'user@e2e.test' } });
    const resetToken = await getLatestEmailToken(user.id, 'password_reset');

    await db.update(emailTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(emailTokens.id, resetToken!.id));

    const res = await app.inject({
      method: 'POST', url: '/auth/reset-password',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: `token=${resetToken!.token}&newPassword=ShouldNotWork1!`,
    });
    expect(res.body).toContain('invalid');
  });

  it('password reset revokes ALL existing sessions', async () => {
    await register();
    // Create two sessions
    const session1Cookie = refreshCookie(await login());
    const session2Cookie = refreshCookie(await login());
    const user = await getUserByEmail('user@e2e.test');

    await app.inject({ method: 'POST', url: '/auth/forgot-password', payload: { email: 'user@e2e.test' } });
    const resetToken = await getLatestEmailToken(user.id, 'password_reset');
    await app.inject({
      method: 'POST', url: '/auth/reset-password',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: `token=${resetToken!.token}&newPassword=AfterReset123!`,
    });

    // Both old sessions should now be invalid
    const r1 = await app.inject({ method: 'POST', url: '/auth/refresh', cookies: { windom_refresh: session1Cookie } });
    const r2 = await app.inject({ method: 'POST', url: '/auth/refresh', cookies: { windom_refresh: session2Cookie } });
    expect(r1.statusCode).toBe(401);
    expect(r2.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. PROFILE MANAGEMENT (PATCH /me)
// ══════════════════════════════════════════════════════════════════════════

describe('Journey 4 — profile management', () => {
  it('PATCH name → GET /me reflects updated name', async () => {
    const { accessToken } = await fullRegister();

    const patchRes = await app.inject({
      method: 'PATCH', url: '/me',
      headers: authHeader(accessToken),
      payload: { name: 'Updated Name' },
    });
    expect(patchRes.statusCode).toBe(200);

    const me = (await app.inject({ method: 'GET', url: '/me', headers: authHeader(accessToken) }))
      .json<{ name: string }>();
    expect(me.name).toBe('Updated Name');
  });

  it('PATCH password → new password accepted; old password rejected', async () => {
    const { accessToken } = await fullRegister();

    const patchRes = await app.inject({
      method: 'PATCH', url: '/me',
      headers: authHeader(accessToken),
      payload: { currentPassword: 'Password123!', newPassword: 'BrandNew456!' },
    });
    expect(patchRes.statusCode).toBe(200);

    expect((await login('user@e2e.test', 'Password123!')).statusCode).toBe(401);
    expect((await login('user@e2e.test', 'BrandNew456!')).statusCode).toBe(200);
  });

  it('PATCH password with wrong currentPassword returns 403', async () => {
    const { accessToken } = await fullRegister();

    const res = await app.inject({
      method: 'PATCH', url: '/me',
      headers: authHeader(accessToken),
      payload: { currentPassword: 'WRONG_PASSWORD', newPassword: 'NewPass456!' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('PATCH name and password in separate requests both persist', async () => {
    const { accessToken } = await fullRegister();

    await app.inject({
      method: 'PATCH', url: '/me', headers: authHeader(accessToken),
      payload: { name: 'New Name' },
    });
    await app.inject({
      method: 'PATCH', url: '/me', headers: authHeader(accessToken),
      payload: { currentPassword: 'Password123!', newPassword: 'New456Pass!' },
    });

    const me = (await app.inject({ method: 'GET', url: '/me', headers: authHeader(accessToken) }))
      .json<{ name: string }>();
    expect(me.name).toBe('New Name');
    expect((await login('user@e2e.test', 'New456Pass!')).statusCode).toBe(200);
  });

  it('unauthenticated PATCH /me returns 401', async () => {
    const res = await app.inject({ method: 'PATCH', url: '/me', payload: { name: 'Hacker' } });
    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. SETTINGS ISOLATION AND PERSISTENCE
// ══════════════════════════════════════════════════════════════════════════

describe('Journey 5 — settings persistence and cross-user isolation', () => {
  it('GET /settings returns null for new user', async () => {
    const { accessToken } = await fullRegister();
    const res = await app.inject({ method: 'GET', url: '/settings', headers: authHeader(accessToken) });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ data: null }>().data).toBeNull();
  });

  it('PUT then GET round-trips JSON data using valid settings fields', async () => {
    const { accessToken } = await fullRegister();
    const payload = { theme: 'dark', language: 'en', quotesEnabled: true };

    await app.inject({ method: 'PUT', url: '/settings', headers: authHeader(accessToken), payload });
    const res = await app.inject({ method: 'GET', url: '/settings', headers: authHeader(accessToken) });
    expect(res.json<{ data: typeof payload }>().data).toEqual(payload);
  });

  it('PUT overwrites previous settings completely', async () => {
    const { accessToken } = await fullRegister();

    await app.inject({ method: 'PUT', url: '/settings', headers: authHeader(accessToken), payload: { theme: 'dark', language: 'en' } });
    await app.inject({ method: 'PUT', url: '/settings', headers: authHeader(accessToken), payload: { userName: 'Override' } });

    const res = await app.inject({ method: 'GET', url: '/settings', headers: authHeader(accessToken) });
    const data = res.json<{ data: Record<string, unknown> }>().data;
    // Old keys gone after full overwrite
    expect(data).toEqual({ userName: 'Override' });
  });

  it('user A settings are not visible to user B', async () => {
    const a = await fullRegister('a@e2e.test');
    const b = await fullRegister('b@e2e.test');

    await app.inject({ method: 'PUT', url: '/settings', headers: authHeader(a.accessToken), payload: { userName: 'user-a-data' } });

    const bRes = await app.inject({ method: 'GET', url: '/settings', headers: authHeader(b.accessToken) });
    expect(bRes.json<{ data: null }>().data).toBeNull();
  });

  it('settings survive a logout + login cycle', async () => {
    const { accessToken: tok1, cookie } = await fullRegister();
    await app.inject({ method: 'PUT', url: '/settings', headers: authHeader(tok1), payload: { spotifyConnected: true } });

    // Logout then log back in
    await app.inject({ method: 'POST', url: '/auth/logout', cookies: { windom_refresh: cookie } });
    const newToken = (await login()).json<{ accessToken: string }>().accessToken;

    const res = await app.inject({ method: 'GET', url: '/settings', headers: authHeader(newToken) });
    expect(res.json<{ data: { spotifyConnected: boolean } }>().data?.spotifyConnected).toBe(true);
  });

  it('settings row is written to DB with correct userId', async () => {
    const { accessToken } = await fullRegister();
    const user = await getUserByEmail('user@e2e.test');

    await app.inject({ method: 'PUT', url: '/settings', headers: authHeader(accessToken), payload: { userName: 'val' } });

    const rows = await db.select().from(userSettings).where(eq(userSettings.userId, user.id));
    expect(rows).toHaveLength(1);
    expect((rows[0].data as Record<string, string>)['userName']).toBe('val');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. ACCOUNT DELETION AND CASCADING DB CLEANUP
// ══════════════════════════════════════════════════════════════════════════

describe('Journey 6 — account deletion', () => {
  it('DELETE /me removes user and all related DB rows', async () => {
    const { accessToken, cookie } = await fullRegister();
    const user = await getUserByEmail('user@e2e.test');

    // Create some related data
    await app.inject({ method: 'PUT', url: '/settings', headers: authHeader(accessToken), payload: { spotifyConnected: true } });
    await app.inject({ method: 'POST', url: '/auth/forgot-password', payload: { email: 'user@e2e.test' } });

    // Delete account
    const deleteRes = await app.inject({
      method: 'DELETE', url: '/me',
      headers: authHeader(accessToken),
      payload: { password: 'Password123!' },
    });
    expect(deleteRes.statusCode).toBe(204);

    // Verify DB cleanup
    const userRows = await db.select().from(users).where(eq(users.id, user.id));
    expect(userRows).toHaveLength(0);

    const sessionRows = await db.select().from(refreshSessions).where(eq(refreshSessions.userId, user.id));
    expect(sessionRows).toHaveLength(0);

    const settingsRows = await db.select().from(userSettings).where(eq(userSettings.userId, user.id));
    expect(settingsRows).toHaveLength(0);

    const tokenRows = await db.select().from(emailTokens).where(eq(emailTokens.userId, user.id));
    expect(tokenRows).toHaveLength(0);

    // Access token JWT is still valid but user no longer exists — 404
    const meRes = await app.inject({ method: 'GET', url: '/me', headers: authHeader(accessToken) });
    expect(meRes.statusCode).toBe(404);

    // Refresh token no longer works
    const refreshRes = await app.inject({ method: 'POST', url: '/auth/refresh', cookies: { windom_refresh: cookie } });
    expect(refreshRes.statusCode).toBe(401);

    // Cannot log in again
    const loginRes = await login();
    expect(loginRes.statusCode).toBe(401);
  });

  it('DELETE /me with wrong password returns 403 and does NOT delete account', async () => {
    const { accessToken } = await fullRegister();

    const res = await app.inject({
      method: 'DELETE', url: '/me',
      headers: authHeader(accessToken),
      payload: { password: 'WRONG_PASS' },
    });
    expect(res.statusCode).toBe(403);

    // Account still exists
    const user = await getUserByEmail('user@e2e.test');
    expect(user).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. REFRESH TOKEN REUSE DETECTION (SECURITY INVARIANT)
// ══════════════════════════════════════════════════════════════════════════

describe('Journey 7 — refresh token reuse detection', () => {
  it('replaying a used (stale) refresh token is rejected; new rotated token still valid', async () => {
    const { cookie: originalCookie } = await fullRegister();

    // Use the original token once — this rotates it (revokes original, issues new)
    const firstRefresh = await app.inject({
      method: 'POST', url: '/auth/refresh',
      cookies: { windom_refresh: originalCookie },
    });
    expect(firstRefresh.statusCode).toBe(200);
    const rotatedCookie = refreshCookie(firstRefresh);

    // Attacker replays the ORIGINAL (now stale/revoked) token — must be rejected
    const replayRes = await app.inject({
      method: 'POST', url: '/auth/refresh',
      cookies: { windom_refresh: originalCookie },
    });
    expect(replayRes.statusCode).toBe(401);

    // The legitimately-rotated token remains valid — sequential replay doesn't nuke the family
    const legitimateRes = await app.inject({
      method: 'POST', url: '/auth/refresh',
      cookies: { windom_refresh: rotatedCookie },
    });
    expect(legitimateRes.statusCode).toBe(200);
  });

  it('a fresh token cannot be used after logout even if not yet expired', async () => {
    const { cookie } = await fullRegister();

    await app.inject({ method: 'POST', url: '/auth/logout', cookies: { windom_refresh: cookie } });

    const res = await app.inject({ method: 'POST', url: '/auth/refresh', cookies: { windom_refresh: cookie } });
    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. MULTI-SESSION MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════

describe('Journey 8 — multi-session management', () => {
  it('multiple parallel sessions all work independently', async () => {
    await register();
    const s1 = refreshCookie(await login());
    const s2 = refreshCookie(await login());
    const s3 = refreshCookie(await login());

    // All three are valid simultaneously
    const r1 = await app.inject({ method: 'POST', url: '/auth/refresh', cookies: { windom_refresh: s1 } });
    const r2 = await app.inject({ method: 'POST', url: '/auth/refresh', cookies: { windom_refresh: s2 } });
    const r3 = await app.inject({ method: 'POST', url: '/auth/refresh', cookies: { windom_refresh: s3 } });

    expect(r1.statusCode).toBe(200);
    expect(r2.statusCode).toBe(200);
    expect(r3.statusCode).toBe(200);
  });

  it('logging out one session does not affect other sessions', async () => {
    await register();
    const s1 = refreshCookie(await login());
    const s2 = refreshCookie(await login());

    // Log out session 1
    await app.inject({ method: 'POST', url: '/auth/logout', cookies: { windom_refresh: s1 } });

    // Session 1 is revoked
    expect((await app.inject({ method: 'POST', url: '/auth/refresh', cookies: { windom_refresh: s1 } })).statusCode).toBe(401);

    // Session 2 still works
    expect((await app.inject({ method: 'POST', url: '/auth/refresh', cookies: { windom_refresh: s2 } })).statusCode).toBe(200);
  });

  it('three sessions all tracked in DB separately', async () => {
    await register();
    await login();
    await login();
    await login();

    const user = await getUserByEmail('user@e2e.test');
    const sessions = await db.select().from(refreshSessions)
      .where(eq(refreshSessions.userId, user.id));
    // At least 3 sessions (register also creates one)
    expect(sessions.length).toBeGreaterThanOrEqual(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 9. INTEGRATION LIFECYCLE (SEEDED OAUTH ACCOUNTS)
// ══════════════════════════════════════════════════════════════════════════

describe('Journey 9 — integration lifecycle', () => {
  async function seedOAuthAccount(userId: string, provider: 'spotify' | 'google') {
    await db.insert(oauthAccounts).values({
      userId,
      provider,
      providerUserId: `test_${provider}_${Date.now()}`,
      accessTokenEnc: await encryptToken(`fake_access_${provider}`),
      refreshTokenEnc: await encryptToken(`fake_refresh_${provider}`),
      tokenExpiresAt: new Date(Date.now() + 3_600_000),
      scopes: provider === 'spotify' ? ['user-read-currently-playing'] : ['calendar.readonly'],
    });
  }

  it('GET /integrations returns false for both providers on new user', async () => {
    const { accessToken } = await fullRegister();
    const res = await app.inject({ method: 'GET', url: '/integrations', headers: authHeader(accessToken) });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ google: { connected: boolean }; spotify: { connected: boolean } }>();
    expect(body.google.connected).toBe(false);
    expect(body.spotify.connected).toBe(false);
  });

  it('seeded Spotify account is reflected in GET /integrations', async () => {
    const { accessToken } = await fullRegister();
    const user = await getUserByEmail('user@e2e.test');
    await seedOAuthAccount(user.id, 'spotify');

    const res = await app.inject({ method: 'GET', url: '/integrations', headers: authHeader(accessToken) });
    const body = res.json<{ google: { connected: boolean }; spotify: { connected: boolean } }>();
    expect(body.spotify.connected).toBe(true);
    expect(body.google.connected).toBe(false);
  });

  it('seeded Google account is reflected in GET /integrations', async () => {
    const { accessToken } = await fullRegister();
    const user = await getUserByEmail('user@e2e.test');
    await seedOAuthAccount(user.id, 'google');

    const res = await app.inject({ method: 'GET', url: '/integrations', headers: authHeader(accessToken) });
    const body = res.json<{ google: { connected: boolean }; spotify: { connected: boolean } }>();
    expect(body.google.connected).toBe(true);
    expect(body.spotify.connected).toBe(false);
  });

  it('DELETE /integrations/spotify removes the DB row and reflects in GET /integrations', async () => {
    const { accessToken } = await fullRegister();
    const user = await getUserByEmail('user@e2e.test');
    await seedOAuthAccount(user.id, 'spotify');

    // Verify connected
    const before = await app.inject({ method: 'GET', url: '/integrations', headers: authHeader(accessToken) });
    expect(before.json<{ spotify: { connected: boolean } }>().spotify.connected).toBe(true);

    // Disconnect
    const deleteRes = await app.inject({ method: 'DELETE', url: '/integrations/spotify', headers: authHeader(accessToken) });
    expect(deleteRes.statusCode).toBe(200);

    // Verify removed from DB
    const rows = await db.select().from(oauthAccounts)
      .where(and(eq(oauthAccounts.userId, user.id), eq(oauthAccounts.provider, 'spotify')));
    expect(rows).toHaveLength(0);

    // Verify reflected in API
    const after = await app.inject({ method: 'GET', url: '/integrations', headers: authHeader(accessToken) });
    expect(after.json<{ spotify: { connected: boolean } }>().spotify.connected).toBe(false);
  });

  it('DELETE /integrations/google leaves Spotify unaffected', async () => {
    const { accessToken } = await fullRegister();
    const user = await getUserByEmail('user@e2e.test');
    await seedOAuthAccount(user.id, 'google');
    await seedOAuthAccount(user.id, 'spotify');

    await app.inject({ method: 'DELETE', url: '/integrations/google', headers: authHeader(accessToken) });

    const res = await app.inject({ method: 'GET', url: '/integrations', headers: authHeader(accessToken) });
    const body = res.json<{ google: { connected: boolean }; spotify: { connected: boolean } }>();
    expect(body.google.connected).toBe(false);
    expect(body.spotify.connected).toBe(true);
  });

  it('disconnect is idempotent — DELETE on non-linked provider returns 200', async () => {
    const { accessToken } = await fullRegister();
    const res = await app.inject({ method: 'DELETE', url: '/integrations/spotify', headers: authHeader(accessToken) });
    expect(res.statusCode).toBe(200);
  });

  it('integrations from user A are not visible to user B', async () => {
    await fullRegister('a@e2e.test');
    const b = await fullRegister('b@e2e.test');
    const userA = await getUserByEmail('a@e2e.test');
    await seedOAuthAccount(userA.id, 'spotify');

    const bRes = await app.inject({ method: 'GET', url: '/integrations', headers: authHeader(b.accessToken) });
    expect(bRes.json<{ spotify: { connected: boolean } }>().spotify.connected).toBe(false);
  });

  it('DELETE /integrations/:provider with invalid provider returns 400', async () => {
    const { accessToken } = await fullRegister();
    const res = await app.inject({ method: 'DELETE', url: '/integrations/tiktok', headers: authHeader(accessToken) });
    expect(res.statusCode).toBe(400);
  });

  it('GET and DELETE /integrations require authentication', async () => {
    const getRes = await app.inject({ method: 'GET', url: '/integrations' });
    const delRes = await app.inject({ method: 'DELETE', url: '/integrations/spotify' });
    expect(getRes.statusCode).toBe(401);
    expect(delRes.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 10. CROSS-SERVICE: SETTINGS + AUTH INTERACTION
// ══════════════════════════════════════════════════════════════════════════

describe('Journey 10 — cross-service interactions', () => {
  it('settings are preserved when password is changed mid-session', async () => {
    const { accessToken } = await fullRegister();

    // Save settings
    await app.inject({ method: 'PUT', url: '/settings', headers: authHeader(accessToken), payload: { mainFocus: 'clock' } });

    // Change password
    await app.inject({
      method: 'PATCH', url: '/me', headers: authHeader(accessToken),
      payload: { currentPassword: 'Password123!', newPassword: 'Updated456!' },
    });

    // Settings still there after re-login with new password
    const newToken = (await login('user@e2e.test', 'Updated456!')).json<{ accessToken: string }>().accessToken;
    const res = await app.inject({ method: 'GET', url: '/settings', headers: authHeader(newToken) });
    expect(res.json<{ data: { mainFocus: string } }>().data?.mainFocus).toBe('clock');
  });

  it('OAuth accounts deleted when user account is deleted', async () => {
    const { accessToken } = await fullRegister();
    const user = await getUserByEmail('user@e2e.test');

    await db.insert(oauthAccounts).values({
      userId: user.id,
      provider: 'spotify',
      providerUserId: 'spotify_cascade_test',
      accessTokenEnc: await encryptToken('tok'),
      scopes: [],
    });

    await app.inject({
      method: 'DELETE', url: '/me', headers: authHeader(accessToken),
      payload: { password: 'Password123!' },
    });

    const rows = await db.select().from(oauthAccounts).where(eq(oauthAccounts.userId, user.id));
    expect(rows).toHaveLength(0);
  });

  it('two users with same name are fully independent', async () => {
    const a = await fullRegister('a@same.test', 'Password123!', 'Alex');
    const b = await fullRegister('b@same.test', 'Password123!', 'Alex');

    await app.inject({ method: 'PUT', url: '/settings', headers: authHeader(a.accessToken), payload: { mainFocus: 'focus-a' } });
    await app.inject({ method: 'PUT', url: '/settings', headers: authHeader(b.accessToken), payload: { mainFocus: 'focus-b' } });

    const aSettings = (await app.inject({ method: 'GET', url: '/settings', headers: authHeader(a.accessToken) }))
      .json<{ data: { mainFocus: string } }>().data;
    const bSettings = (await app.inject({ method: 'GET', url: '/settings', headers: authHeader(b.accessToken) }))
      .json<{ data: { mainFocus: string } }>().data;

    expect(aSettings?.mainFocus).toBe('focus-a');
    expect(bSettings?.mainFocus).toBe('focus-b');
  });

  it('name update via PATCH /me persists in DB', async () => {
    const { accessToken } = await fullRegister();
    const user = await getUserByEmail('user@e2e.test');

    await app.inject({
      method: 'PATCH', url: '/me', headers: authHeader(accessToken),
      payload: { name: 'DB Persisted' },
    });

    const updated = await getUserByEmail('user@e2e.test');
    expect(updated.name).toBe('DB Persisted');
    // Unchanged fields not affected
    expect(updated.id).toBe(user.id);
  });

  it('health endpoint is always reachable without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
  });

  it('all protected endpoints return 401 without auth', async () => {
    const protectedRoutes = [
      { method: 'GET', url: '/me' },
      { method: 'PATCH', url: '/me' },
      { method: 'GET', url: '/settings' },
      { method: 'PUT', url: '/settings' },
      { method: 'GET', url: '/integrations' },
      { method: 'DELETE', url: '/integrations/spotify' },
      { method: 'POST', url: '/auth/resend-verification' },
    ] as const;

    for (const { method, url } of protectedRoutes) {
      const res = await app.inject({ method, url });
      expect(res.statusCode, `${method} ${url} should require auth`).toBe(401);
    }
  });
});
