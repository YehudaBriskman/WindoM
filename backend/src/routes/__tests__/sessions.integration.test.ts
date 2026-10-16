import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../db/client.js';
import { refreshSessions, users } from '../../db/schema.js';
import { signAccessToken } from '../../lib/jwt.js';
import { createSession, findSessionByToken, rotateSessionAtomically } from '../../services/session.service.js';
import { buildTestApp } from '../../test-utils/app.js';
import { closeDb, truncateAll } from '../../test-utils/db.js';

const app = await buildTestApp();
let userId: string;
let otherUserId: string;
let authorization: string;

beforeEach(async () => {
  await truncateAll();
  userId = randomUUID();
  otherUserId = randomUUID();
  await db.insert(users).values([{ id: userId }, { id: otherUserId }]);
  authorization = `Bearer ${await signAccessToken({ sub: userId, email: 'test@example.com', name: '', emailVerified: true })}`;
});
afterEach(() => vi.useRealTimers());
afterAll(async () => { await app.close(); await closeDb(); });

async function seed(overrides: Partial<typeof refreshSessions.$inferInsert> = {}): Promise<string> {
  const id = randomUUID();
  await db.insert(refreshSessions).values({
    id, userId, tokenHash: 'private-token-hash', tokenLookup: randomUUID(),
    ip: 'private-ip-hash', userAgent: 'a'.repeat(64),
    expiresAt: new Date(Date.now() + 86_400_000), ...overrides,
  });
  return id;
}

function revoke(id: string): ReturnType<typeof app.inject> {
  return app.inject({ method: 'DELETE', url: `/me/sessions/${id}`, headers: { authorization } });
}

describe('session management with PostgreSQL and production routes', () => {
  it('lists only owned active rows and serializes an explicit privacy-safe payload', async () => {
    const id = await seed();
    await seed({ userId: otherUserId });
    await seed({ revokedAt: new Date() });
    await seed({ expiresAt: new Date(Date.now() - 1000) });
    const response = await app.inject({ method: 'GET', url: '/me/sessions', headers: { authorization } });
    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    const { sessions } = response.json<{ sessions: Record<string, unknown>[] }>();
    expect(sessions).toHaveLength(1);
    expect(Object.keys(sessions[0] ?? {}).sort()).toEqual(
      ['id', 'deviceId', 'createdAt', 'lastUsedAt', 'expiresAt', 'renewalCount'].sort(),
    );
    expect(sessions[0]).toMatchObject({ id, deviceId: 'a'.repeat(12), renewalCount: 0 });
    for (const field of ['createdAt', 'lastUsedAt', 'expiresAt']) {
      expect(typeof sessions[0]?.[field]).toBe('string');
      expect(Number.isFinite(Date.parse(sessions[0]?.[field] as string))).toBe(true);
    }
    expect(sessions[0]?.['lastUsedAt']).toBe(sessions[0]?.['createdAt']);
  });

  it('returns an empty list for an account without active sessions', async () => {
    const response = await app.inject({ method: 'GET', url: '/me/sessions', headers: { authorization } });
    expect(response.json()).toEqual({ sessions: [] });
  });

  it('does not disclose or revoke another account session', async () => {
    const id = await seed({ userId: otherUserId });
    const denied = await revoke(id);
    const missing = await revoke(randomUUID());
    expect(denied.statusCode).toBe(404);
    expect(denied.json()).toEqual(missing.json());
    const [row] = await db.select().from(refreshSessions).where(eq(refreshSessions.id, id));
    expect(row?.revokedAt).toBeNull();
  });

  it.each(['expired', 'revoked'] as const)('rejects an already %s session without changing it', async (state) => {
    const previous = new Date(Date.now() - 1000);
    const id = await seed(state === 'expired' ? { expiresAt: previous } : { revokedAt: previous });
    expect((await revoke(id)).statusCode).toBe(404);
    const [row] = await db.select().from(refreshSessions).where(eq(refreshSessions.id, id));
    expect(row?.revokedAt).toEqual(state === 'revoked' ? previous : null);
  });

  it('treats the exact expiration instant as inactive for both listing and revocation', async () => {
    const now = new Date();
    const id = await seed({ expiresAt: now });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(now);
    expect((await revoke(id)).statusCode).toBe(404);
    const response = await app.inject({ method: 'GET', url: '/me/sessions', headers: { authorization } });
    expect(response.json()).toEqual({ sessions: [] });
  });

  it('revokes only the selected session and permits only one concurrent winner', async () => {
    const id = await seed();
    const untouched = await seed();
    const results = await Promise.all([revoke(id), revoke(id)]);
    expect(results.map((result) => result.statusCode).sort()).toEqual([204, 404]);
    expect(results.find((result) => result.statusCode === 204)?.body).toBe('');
    const [row] = await db.select().from(refreshSessions).where(eq(refreshSessions.id, untouched));
    expect(row?.revokedAt).toBeNull();
  });

  it('prevents a revoked token from refreshing', async () => {
    const token = await createSession(userId, { ip: '127.0.0.1', userAgent: 'test' });
    const session = await findSessionByToken(token);
    expect(session).not.toBeNull();
    expect((await revoke(session!.id)).statusCode).toBe(204);
    const response = await app.inject({
      method: 'POST', url: '/auth/refresh', cookies: { windom_refresh: token },
    });
    expect(response.statusCode).toBe(401);
  });

  it('never reports successful revocation while a concurrent rotation survives', async () => {
    const id = await seed();
    const [revocation, rotation] = await Promise.all([
      revoke(id),
      rotateSessionAtomically(id, userId, { ip: '127.0.0.1', userAgent: 'test' }, 1),
    ]);
    if (revocation.statusCode === 204) {
      expect(rotation.ok).toBe(false);
    } else {
      expect(revocation.statusCode).toBe(404);
      expect(rotation.ok).toBe(true);
    }
  });
});
