import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../config.js', async (importOriginal) => {
  const actual = await importOriginal<{ config: Record<string, unknown> }>();
  return {
    ...actual,
    config: {
      ...actual.config,
      GOOGLE_CLIENT_ID: 'google-client',
      GOOGLE_CLIENT_SECRET: 'google-secret',
      GOOGLE_OAUTH_REDIRECT_URI: 'https://link-extension.chromiumapp.org',
      EXTENSION_REDIRECT_BASE: 'https://link-extension.chromiumapp.org',
      SPOTIFY_CLIENT_ID: 'spotify-client',
      SPOTIFY_CLIENT_SECRET: 'spotify-secret',
      SPOTIFY_REDIRECT_URI: 'https://link-extension.chromiumapp.org',
    },
  };
});
// Capture the raw email tokens the service would have mailed.
vi.mock('../../lib/email.js', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendGoogleOnlyResetEmail: vi.fn(),
}));
// Only the provider round-trips are faked; state, storage and conflict checks run for real.
vi.mock('../../services/oauth.service.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  verifyAndConsumeOAuthState: vi.fn(),
  exchangeGoogleCode: vi.fn(),
  exchangeSpotifyCode: vi.fn(),
}));
vi.mock('../../services/github.service.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  storePat: vi.fn(),
}));

import { db } from '../../db/client.js';
import { auditLogs, refreshSessions, users } from '../../db/schema.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../../lib/email.js';
import { createSession } from '../../services/session.service.js';
import * as oauthService from '../../services/oauth.service.js';
import * as githubService from '../../services/github.service.js';
import { AUDIT_RETENTION_DAYS, purgeExpiredAuditLogs, recordAudit } from '../../services/audit.service.js';
import { buildTestApp } from '../../test-utils/app.js';
import { closeDb, truncateAll } from '../../test-utils/db.js';

const app = await buildTestApp();
afterAll(async () => { await app.close(); await closeDb(); });

const EMAIL = 'audit-me@example.com';
const PASSWORD = 'correct horse battery';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const IP = '203.0.113.77';
const client = { 'user-agent': UA, 'x-forwarded-for': IP };
const DEVICE = 'Chrome · Windows';

let userId: string;
let sid: string;
let authorization: string;

async function registerUser(): Promise<{ refreshToken: string }> {
  const res = await app.inject({
    method: 'POST', url: '/auth/register', headers: client, payload: { email: EMAIL, password: PASSWORD, name: 'Audit' },
  });
  expect(res.statusCode).toBe(200);
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, EMAIL));
  userId = user.id;
  const [session] = await db.select({ id: refreshSessions.id }).from(refreshSessions).where(eq(refreshSessions.userId, userId));
  sid = session.id;
  authorization = `Bearer ${res.json<{ accessToken: string }>().accessToken}`;
  return { refreshToken: res.cookies.find((c) => c.name === 'windom_refresh')!.value };
}

async function auditRows(): Promise<(typeof auditLogs.$inferSelect)[]> {
  return db.select().from(auditLogs).orderBy(auditLogs.createdAt);
}

async function only(action: string): Promise<typeof auditLogs.$inferSelect> {
  const rows = (await auditRows()).filter((r) => r.action === action);
  expect(rows, action).toHaveLength(1);
  return rows[0];
}

/** Every row, whatever the event: exactly the minimal columns, and nothing a client sent. */
async function expectNoSecrets(extra: string[] = []): Promise<void> {
  const rows = await auditRows();
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) {
    expect(Object.keys(row).sort()).toEqual(['action', 'createdAt', 'deviceLabel', 'id', 'sessionId', 'userId']);
  }
  const dump = JSON.stringify(rows);
  for (const secret of [EMAIL, PASSWORD, UA, IP, 'AppleWebKit', ...extra]) expect(dump).not.toContain(secret);
}

beforeEach(async () => {
  await truncateAll();
  vi.clearAllMocks();
});

describe('audit log: authentication events', () => {
  it('register writes account_created for the new session', async () => {
    const { refreshToken } = await registerUser();
    expect(await only('account_created')).toMatchObject({ userId, sessionId: sid, deviceLabel: DEVICE });
    await expectNoSecrets([refreshToken]);
  });

  it('sign-in writes sign_in with the session it created', async () => {
    await registerUser();
    const res = await app.inject({ method: 'POST', url: '/auth/login', headers: client, payload: { email: EMAIL, password: PASSWORD } });
    expect(res.statusCode).toBe(200);
    const row = await only('sign_in');
    expect(row).toMatchObject({ userId, deviceLabel: DEVICE });
    const [session] = await db.select().from(refreshSessions).where(eq(refreshSessions.id, row.sessionId!));
    expect(session?.userId).toBe(userId);
    await expectNoSecrets([res.cookies[0].value, res.json<{ accessToken: string }>().accessToken]);
  });

  it('a wrong password writes sign_in_failed against the account', async () => {
    await registerUser();
    const res = await app.inject({ method: 'POST', url: '/auth/login', headers: client, payload: { email: EMAIL, password: 'wrong-password' } });
    expect(res.statusCode).toBe(401);
    expect(await only('sign_in_failed')).toMatchObject({ userId, sessionId: null, deviceLabel: DEVICE });
    await expectNoSecrets(['wrong-password']);
  });

  it('an unknown email writes sign_in_failed with no user and no email', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/login', headers: client, payload: { email: 'nobody@example.com', password: 'whatever-pw' } });
    expect(res.statusCode).toBe(401);
    expect(await only('sign_in_failed')).toMatchObject({ userId: null, sessionId: null, deviceLabel: DEVICE });
    await expectNoSecrets(['nobody@example.com', 'whatever-pw']);
  });

  it('sign-out writes sign_out for the revoked session', async () => {
    const { refreshToken } = await registerUser();
    const res = await app.inject({ method: 'POST', url: '/auth/logout', headers: client, cookies: { windom_refresh: refreshToken } });
    expect(res.statusCode).toBe(200);
    expect(await only('sign_out')).toMatchObject({ userId, sessionId: sid, deviceLabel: DEVICE });
    await expectNoSecrets([refreshToken]);
  });

  it('refresh-token reuse writes token_reuse_detected', async () => {
    await registerUser();
    const raw = await createSession(userId, { ip: IP, userAgent: UA });
    const reused = (await db.select().from(refreshSessions).where(eq(refreshSessions.userId, userId))).find((s) => s.id !== sid)!;
    // A child already exists while the parent is still live: the token was replayed.
    await db.insert(refreshSessions).values({
      userId, tokenHash: 'x', tokenLookup: randomUUID(), rotatedFromId: reused.id, ip: 'x', expiresAt: new Date(Date.now() + 86_400_000),
    });
    const res = await app.inject({ method: 'POST', url: '/auth/refresh', headers: client, cookies: { windom_refresh: raw } });
    expect(res.statusCode).toBe(401);
    expect(await only('token_reuse_detected')).toMatchObject({ userId, sessionId: reused.id, deviceLabel: DEVICE });
    await expectNoSecrets([raw]);
  });

  it('Google sign-in writes sign_in_google', async () => {
    const { loginWithGoogle } = await import('../../services/auth.service.js');
    await loginWithGoogle(EMAIL, 'Audit', { ip: IP, userAgent: UA });
    const row = await only('sign_in_google');
    expect(row.userId).not.toBeNull();
    expect(row.sessionId).not.toBeNull();
    await expectNoSecrets();
  });
});

describe('audit log: account events', () => {
  it('password change writes password_changed', async () => {
    await registerUser();
    const res = await app.inject({
      method: 'PATCH', url: '/me', headers: { ...client, authorization }, payload: { currentPassword: PASSWORD, newPassword: 'brand-new-secret' },
    });
    expect(res.statusCode).toBe(200);
    expect(await only('password_changed')).toMatchObject({ userId, sessionId: sid, deviceLabel: DEVICE });
    await expectNoSecrets(['brand-new-secret']);
  });

  it('forgot + reset password write password_reset_requested and password_reset', async () => {
    await registerUser();
    await app.inject({ method: 'POST', url: '/auth/forgot-password', headers: client, payload: { email: EMAIL } });
    expect(await only('password_reset_requested')).toMatchObject({ userId, deviceLabel: DEVICE });
    const token = vi.mocked(sendPasswordResetEmail).mock.calls[0][2];

    const res = await app.inject({ method: 'POST', url: '/auth/reset-password', headers: client, payload: { token, newPassword: 'reset-new-secret' } });
    expect(res.statusCode).toBe(200);
    expect(await only('password_reset')).toMatchObject({ userId, sessionId: null, deviceLabel: DEVICE });
    await expectNoSecrets([token, 'reset-new-secret']);
  });

  it('a forgot-password request for an unknown email writes nothing', async () => {
    await app.inject({ method: 'POST', url: '/auth/forgot-password', headers: client, payload: { email: 'ghost@example.com' } });
    expect(await auditRows()).toEqual([]);
  });

  it('email verification writes email_verified', async () => {
    await registerUser();
    const token = vi.mocked(sendVerificationEmail).mock.calls[0][2];
    const res = await app.inject({ method: 'GET', url: `/auth/verify-email?token=${token}`, headers: client });
    expect(res.statusCode).toBe(200);
    expect(await only('email_verified')).toMatchObject({ userId, deviceLabel: DEVICE });
    await expectNoSecrets([token]);
  });

  it('revoking one session writes session_revoked for that session', async () => {
    await registerUser();
    await createSession(userId, { ip: IP, userAgent: UA });
    const other = (await db.select().from(refreshSessions).where(eq(refreshSessions.userId, userId))).find((s) => s.id !== sid)!;
    const res = await app.inject({ method: 'DELETE', url: `/me/sessions/${other.id}`, headers: { ...client, authorization } });
    expect(res.statusCode).toBe(204);
    expect(await only('session_revoked')).toMatchObject({ userId, sessionId: other.id, deviceLabel: DEVICE });
    await expectNoSecrets();
  });

  it('signing out all others writes sessions_revoked_others for the kept session', async () => {
    await registerUser();
    const res = await app.inject({ method: 'DELETE', url: '/me/sessions?others=true', headers: { ...client, authorization } });
    expect(res.statusCode).toBe(200);
    expect(await only('sessions_revoked_others')).toMatchObject({ userId, sessionId: sid, deviceLabel: DEVICE });
    await expectNoSecrets();
  });

  it('a data export writes data_exported, and the export carries the security log', async () => {
    await registerUser();
    const res = await app.inject({ method: 'GET', url: '/me/export', headers: { ...client, authorization } });
    expect(res.statusCode).toBe(200);
    const log = res.json<{ securityLog: Record<string, unknown>[] }>().securityLog;
    expect(log.map((e) => e['action'])).toEqual(['account_created']);
    expect(Object.keys(log[0]).sort()).toEqual(['action', 'createdAt', 'deviceLabel', 'sessionId']);
    expect(await only('data_exported')).toMatchObject({ userId, sessionId: sid, deviceLabel: DEVICE });
    await expectNoSecrets();
  });

  it('account deletion erases the user\'s rows and leaves an anonymous tombstone', async () => {
    await registerUser();
    const res = await app.inject({ method: 'DELETE', url: '/me', headers: { ...client, authorization }, payload: { password: PASSWORD } });
    expect(res.statusCode).toBe(204);
    const rows = await auditRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ action: 'account_deleted', userId: null, sessionId: null, deviceLabel: null });
    await expectNoSecrets();
  });
});

describe('audit log: integrations', () => {
  const redirectUri = 'https://link-extension.chromiumapp.org';

  it('linking Google writes integration_connected_google', async () => {
    await registerUser();
    vi.mocked(oauthService.verifyAndConsumeOAuthState).mockResolvedValue({ ok: true, data: { id: 's', userId, provider: 'google', purpose: 'link', clientId: null } });
    vi.mocked(oauthService.exchangeGoogleCode).mockResolvedValue({
      ok: true,
      data: { tokens: { access_token: 'google-access-SECRET', refresh_token: 'google-refresh-SECRET', expires_in: 3600, scope: 'openid' }, userInfo: { sub: 'g-1', email: EMAIL, name: 'A' } },
    });
    const res = await app.inject({
      method: 'POST', url: '/oauth/google/exchange', headers: { ...client, authorization }, payload: { code: 'c', state: 's', redirectUri },
    });
    expect(res.statusCode).toBe(200);
    expect(await only('integration_connected_google')).toMatchObject({ userId, deviceLabel: DEVICE });
    await expectNoSecrets(['google-access-SECRET', 'google-refresh-SECRET']);
  });

  it('linking Spotify writes integration_connected_spotify', async () => {
    await registerUser();
    vi.mocked(oauthService.verifyAndConsumeOAuthState).mockResolvedValue({ ok: true, data: { id: 's', userId, provider: 'spotify', purpose: 'link', clientId: null } });
    vi.mocked(oauthService.exchangeSpotifyCode).mockResolvedValue({
      ok: true, data: { access_token: 'spotify-access-SECRET', refresh_token: 'spotify-refresh-SECRET', expires_in: 3600, scope: 'user-read-playback-state', providerUserId: 'sp-1' },
    });
    const res = await app.inject({
      method: 'POST', url: '/oauth/spotify/exchange', headers: { ...client, authorization }, payload: { code: 'c', state: 's', redirectUri },
    });
    expect(res.statusCode).toBe(200);
    expect(await only('integration_connected_spotify')).toMatchObject({ userId, deviceLabel: DEVICE });
    await expectNoSecrets(['spotify-access-SECRET', 'spotify-refresh-SECRET']);
  });

  it('saving a GitHub PAT writes integration_connected_github', async () => {
    await registerUser();
    vi.mocked(githubService.storePat).mockResolvedValue({ ok: true, data: { username: 'octo' } });
    const res = await app.inject({
      method: 'POST', url: '/integrations/github/pat', headers: { ...client, authorization }, payload: { pat: 'ghp_SECRETPAT' },
    });
    expect(res.statusCode).toBe(200);
    expect(await only('integration_connected_github')).toMatchObject({ userId, sessionId: sid, deviceLabel: DEVICE });
    await expectNoSecrets(['ghp_SECRETPAT']);
  });

  it.each(['google', 'spotify', 'github'] as const)('disconnecting %s writes integration_disconnected_%s', async (provider) => {
    await registerUser();
    const res = await app.inject({ method: 'DELETE', url: `/integrations/${provider}`, headers: { ...client, authorization } });
    expect(res.statusCode).toBe(200);
    expect(await only(`integration_disconnected_${provider}`)).toMatchObject({ userId, sessionId: sid, deviceLabel: DEVICE });
    await expectNoSecrets();
  });
});

describe('audit log: failure isolation and retention', () => {
  it('a failing audit write never breaks the action it records', async () => {
    await registerUser();
    const insert = db.insert.bind(db);
    const spy = vi.spyOn(db, 'insert').mockImplementation(((table: Parameters<typeof db.insert>[0]) => {
      if (table === auditLogs) throw new Error('audit table unavailable');
      return insert(table);
    }));
    try {
      const res = await app.inject({ method: 'POST', url: '/auth/login', headers: client, payload: { email: EMAIL, password: PASSWORD } });
      expect(res.statusCode).toBe(200);
    } finally {
      spy.mockRestore();
    }
    expect((await auditRows()).filter((r) => r.action === 'sign_in')).toEqual([]);
  });

  it('recordAudit swallows a database error (unknown user FK)', async () => {
    await expect(recordAudit('sign_in', { userId: randomUUID() })).resolves.toBeUndefined();
    expect(await auditRows()).toEqual([]);
  });

  it(`purges rows older than ${AUDIT_RETENTION_DAYS} days and keeps newer ones`, async () => {
    await registerUser();
    const day = 86_400_000;
    await db.insert(auditLogs).values([
      { userId, action: 'sign_in', createdAt: new Date(Date.now() - (AUDIT_RETENTION_DAYS + 1) * day) },
      { userId, action: 'sign_out', createdAt: new Date(Date.now() - (AUDIT_RETENTION_DAYS - 1) * day) },
    ]);
    expect(await purgeExpiredAuditLogs()).toBe(1);
    expect((await auditRows()).map((r) => r.action).sort()).toEqual(['account_created', 'sign_out']);
  });
});

describe('GET /me/activity', () => {
  it('requires authentication', async () => {
    expect((await app.inject({ method: 'GET', url: '/me/activity' })).statusCode).toBe(401);
  });

  it('lists the caller\'s own events newest first, within retention, honouring limit', async () => {
    await registerUser();
    const otherId = randomUUID();
    await db.insert(users).values({ id: otherId });
    const now = Date.now();
    await db.insert(auditLogs).values([
      { userId, action: 'sign_in', createdAt: new Date(now + 1000), deviceLabel: DEVICE },
      { userId, action: 'sign_out', createdAt: new Date(now + 2000) },
      { userId, action: 'password_changed', createdAt: new Date(now - (AUDIT_RETENTION_DAYS + 1) * 86_400_000) },
      { userId: otherId, action: 'sign_in', createdAt: new Date(now + 3000) },
    ]);

    const res = await app.inject({ method: 'GET', url: '/me/activity', headers: { authorization } });
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    const { events } = res.json<{ events: Record<string, unknown>[] }>();
    expect(events.map((e) => e['action'])).toEqual(['sign_out', 'sign_in', 'account_created']);
    expect(Object.keys(events[0]).sort()).toEqual(['action', 'createdAt', 'device', 'sessionId']);
    expect(events[1]).toMatchObject({ device: DEVICE, sessionId: null });

    const limited = await app.inject({ method: 'GET', url: '/me/activity?limit=1', headers: { authorization } });
    expect(limited.json<{ events: unknown[] }>().events).toHaveLength(1);
    expect((await app.inject({ method: 'GET', url: '/me/activity?limit=0', headers: { authorization } })).statusCode).toBe(400);
  });
});
