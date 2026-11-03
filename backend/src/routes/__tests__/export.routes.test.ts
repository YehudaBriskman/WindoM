import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../db/client.js';
import { emailTokens, oauthAccounts, oauthStates, refreshSessions, userSettings, users } from '../../db/schema.js';
import { signAccessToken } from '../../lib/jwt.js';
import { buildTestApp } from '../../test-utils/app.js';
import { closeDb, truncateAll } from '../../test-utils/db.js';

const app = await buildTestApp();
let userId: string;
let otherUserId: string;
let authorization: string;

// Every secret seeded below carries this marker, so one substring check over the raw
// body proves none of them reached the export, whatever key it might have landed under.
const SECRET = 'SECRET-MARKER';

beforeEach(async () => {
  await truncateAll();
  userId = randomUUID();
  otherUserId = randomUUID();
  await db.insert(users).values([
    { id: userId, email: 'me@example.com', name: 'Me', passwordHash: `${SECRET}-bcrypt`, emailVerified: true },
    { id: otherUserId, email: 'other@example.com', name: 'Other' },
  ]);
  authorization = `Bearer ${await signAccessToken({ sub: userId, email: 'me@example.com', name: 'Me', emailVerified: true })}`;
});
afterAll(async () => { await app.close(); await closeDb(); });

function exportMe(headers: Record<string, string> = { authorization }): ReturnType<typeof app.inject> {
  return app.inject({ method: 'GET', url: '/me/export', headers });
}

async function seedEverything(): Promise<void> {
  await db.insert(refreshSessions).values([
    { userId, tokenHash: `${SECRET}-th`, tokenLookup: `${SECRET}-tl`, ip: `${SECRET}-ip`, userAgent: 'abcdef0123456789' + SECRET, expiresAt: new Date(Date.now() + 86_400_000) },
    { userId: otherUserId, tokenHash: 'x', tokenLookup: 'other-lookup', ip: 'x', expiresAt: new Date(Date.now() + 86_400_000) },
  ]);
  await db.insert(oauthAccounts).values({
    userId, provider: 'google', providerUserId: 'g-123', accessTokenEnc: `${SECRET}-at`, refreshTokenEnc: `${SECRET}-rt`, scopes: ['openid'],
  });
  await db.insert(oauthStates).values({
    state: `${SECRET}-state`, userId, provider: 'google', purpose: 'link', expiresAt: new Date(Date.now() + 60_000),
  });
  await db.insert(emailTokens).values({
    userId, token: `${SECRET}-tok`, tokenHash: `${SECRET}-tokh`, tokenLookup: `${SECRET}-tokl`, type: 'verify_email', expiresAt: new Date(Date.now() + 60_000),
  });
  await db.insert(userSettings).values({
    userId,
    data: {
      general: { userName: 'Me', searchEngine: 'google' },
      background: { source: 'unsplash', unsplashApiKey: `${SECRET}-unsplash`, unsplashCollectionId: '42' },
      weather: { unit: 'C', apiKey: `${SECRET}-weather` },
      widgets: { quickLinks: [{ name: 'Docs', url: 'https://example.com' }] },
    },
  });
}

describe('GET /me/export', () => {
  it('requires authentication', async () => {
    const res = await exportMe({});
    expect(res.statusCode).toBe(401);
  });

  it('returns a JSON download with the caller\'s data and no secrets', async () => {
    await seedEverything();
    const res = await exportMe();
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/^application\/json/);
    expect(res.headers['content-disposition']).toMatch(/^attachment; filename="windom-export-\d{4}-\d{2}-\d{2}\.json"$/);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).not.toContain(SECRET);
    expect(res.body).not.toContain('other@example.com');
    expect(res.body).not.toContain('other-lookup');

    const body = res.json<Record<string, unknown>>();
    expect(body['format']).toBe('windom-export/1');
    expect(body['profile']).toMatchObject({ id: userId, email: 'me@example.com', name: 'Me', emailVerified: true, hasPassword: true });
    expect(Object.keys(body['profile'] as object).sort()).toEqual(
      ['id', 'email', 'name', 'emailVerified', 'createdAt', 'hasPassword'].sort(),
    );

    const sessions = body['sessions'] as Record<string, unknown>[];
    expect(sessions).toHaveLength(1);
    expect(Object.keys(sessions[0] ?? {}).sort()).toEqual(
      ['id', 'createdAt', 'expiresAt', 'revokedAt', 'renewalCount', 'deviceLabel', 'deviceId'].sort(),
    );
    expect(sessions[0]?.['deviceId']).toBe('abcdef012345');

    const integrations = body['integrations'] as Record<string, unknown>[];
    expect(integrations).toEqual([
      expect.objectContaining({ provider: 'google', providerUserId: 'g-123', scopes: ['openid'] }),
    ]);
    expect(Object.keys(integrations[0] ?? {})).not.toContain('accessTokenEnc');

    const tokens = body['emailTokens'] as Record<string, unknown>[];
    expect(tokens).toHaveLength(1);
    expect(Object.keys(tokens[0] ?? {}).sort()).toEqual(['type', 'createdAt', 'expiresAt', 'usedAt'].sort());

    const settings = body['settings'] as { data: Record<string, Record<string, unknown>> };
    expect(settings.data['background']).toEqual({ source: 'unsplash', unsplashCollectionId: '42' });
    expect(settings.data['weather']).toEqual({ unit: 'C' });
    expect(settings.data['widgets']).toEqual({ quickLinks: [{ name: 'Docs', url: 'https://example.com' }] });

    const withheld = body['withheld'] as string[];
    expect(withheld.some((w) => w.startsWith('users.passwordHash'))).toBe(true);
    expect(withheld.some((w) => w.startsWith('settings.weather.apiKey'))).toBe(true);
  });

  it('exports an account with nothing but a profile', async () => {
    const res = await exportMe();
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ sessions: [], integrations: [], emailTokens: [], settings: null });
    expect(res.json<{ profile: { hasPassword: boolean } }>().profile.hasPassword).toBe(true);
  });

  it('returns 404 when the token belongs to a deleted account', async () => {
    const ghost = `Bearer ${await signAccessToken({ sub: randomUUID(), email: 'g@example.com', name: '', emailVerified: true })}`;
    const res = await exportMe({ authorization: ghost });
    expect(res.statusCode).toBe(404);
  });
});
