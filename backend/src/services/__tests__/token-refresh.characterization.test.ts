/**
 * Characterization tests for provider OAuth token refresh (#246).
 *
 * These pin the observable behaviour of a refresh end to end - through the real
 * provider services (calendar, gmail, spotify), the real token-refresh service,
 * real token encryption and a real Postgres row - with only the network stubbed.
 * They were written against the pre-strategy implementation and must pass
 * unchanged on both sides of the TokenRefreshStrategy refactor: the exact token
 * request each provider sends (URL, headers, form body and its field order), the
 * DB write on success, and the error mapping and untouched row on failure.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../config.js', async (importOriginal) => {
  const actual = await importOriginal<{ config: Record<string, unknown> }>();
  return {
    ...actual,
    config: {
      ...actual.config,
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      SPOTIFY_CLIENT_ID: 'spotify-client-id',
      SPOTIFY_CLIENT_SECRET: 'spotify-client-secret',
    },
  };
});

import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { oauthAccounts, users } from '../../db/schema.js';
import { decryptToken, encryptToken } from '../../lib/crypto.js';
import { truncateAll, closeDb } from '../../test-utils/db.js';
import { GOOGLE_TOKEN_URL, SPOTIFY_TOKEN_URL } from '../../types/constants.js';
import { getCalendarEvents, clearCalendarCacheForTest } from '../calendar.service.js';
import { getGmailSummary, clearGmailCacheForTest } from '../gmail.service.js';
import { getNowPlaying, clearNowPlayingCacheForTest } from '../spotify.service.js';

const FORM = 'application/x-www-form-urlencoded';
const SPOTIFY_BASIC = `Basic ${Buffer.from('spotify-client-id:spotify-client-secret').toString('base64')}`;

interface CapturedRequest {
  url: string;
  method: string | undefined;
  headers: Record<string, string>;
  body: string;
}

type TokenReply = { status: number; json?: unknown } | 'throw';

/**
 * Stubs global fetch. Token-endpoint calls are captured and answered with `reply`;
 * every other call (the provider's data API) gets a 500, which is irrelevant here.
 */
function stubFetch(reply: TokenReply): CapturedRequest[] {
  const tokenCalls: CapturedRequest[] = [];
  vi.stubGlobal('fetch', vi.fn((input: string, init: RequestInit = {}) => {
    const url = String(input);
    if (url === GOOGLE_TOKEN_URL || url === SPOTIFY_TOKEN_URL) {
      tokenCalls.push({
        url,
        method: init.method,
        headers: { ...(init.headers as Record<string, string>) },
        body: (init.body as URLSearchParams).toString(),
      });
      if (reply === 'throw') return Promise.reject(new TypeError('fetch failed'));
      return Promise.resolve({
        ok: reply.status >= 200 && reply.status < 300,
        status: reply.status,
        json: () => Promise.resolve(reply.json),
      });
    }
    return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
  }));
  return tokenCalls;
}

async function seed(opts: {
  provider: 'google' | 'spotify';
  expiresAt: Date | null;
  refreshToken?: string | null;
  providerClientId?: string | null;
  scopes?: string[];
}) {
  const [user] = await db.insert(users).values({ email: `u-${Math.random()}@example.test` }).returning();
  const [row] = await db.insert(oauthAccounts).values({
    userId: user.id,
    provider: opts.provider,
    providerUserId: `${opts.provider}-${user.id}`,
    accessTokenEnc: await encryptToken('old-access'),
    refreshTokenEnc: opts.refreshToken === null ? null : await encryptToken(opts.refreshToken ?? 'stored-refresh'),
    tokenExpiresAt: opts.expiresAt,
    scopes: opts.scopes ?? [],
    providerClientId: opts.providerClientId ?? null,
    updatedAt: new Date('2020-01-01T00:00:00Z'),
  }).returning();
  return { userId: user.id, row };
}

async function readRow(id: string) {
  const [row] = await db.select().from(oauthAccounts).where(eq(oauthAccounts.id, id));
  return row;
}

const EXPIRED = () => new Date(Date.now() - 60_000);

/** Each provider path, with the exact token request it is expected to send. */
const PROVIDERS = [
  {
    name: 'google via calendar',
    provider: 'google' as const,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    providerClientId: null,
    call: (userId: string) => getCalendarEvents(userId, 1),
    expected: {
      url: GOOGLE_TOKEN_URL,
      headers: { 'Content-Type': FORM },
      body: 'grant_type=refresh_token&refresh_token=stored-refresh&client_id=google-client-id&client_secret=google-client-secret',
    },
  },
  {
    name: 'google via gmail',
    provider: 'google' as const,
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    providerClientId: null,
    call: (userId: string) => getGmailSummary(userId),
    expected: {
      url: GOOGLE_TOKEN_URL,
      headers: { 'Content-Type': FORM },
      body: 'grant_type=refresh_token&refresh_token=stored-refresh&client_id=google-client-id&client_secret=google-client-secret',
    },
  },
  {
    name: 'spotify shared app (Basic auth)',
    provider: 'spotify' as const,
    scopes: ['user-read-currently-playing'],
    providerClientId: null,
    call: (userId: string) => getNowPlaying(userId),
    expected: {
      url: SPOTIFY_TOKEN_URL,
      headers: { 'Content-Type': FORM, Authorization: SPOTIFY_BASIC },
      body: 'grant_type=refresh_token&refresh_token=stored-refresh',
    },
  },
  {
    name: 'spotify PKCE / BYOA (client_id in body, no Authorization)',
    provider: 'spotify' as const,
    scopes: ['user-read-currently-playing'],
    providerClientId: 'users-own-client-id',
    call: (userId: string) => getNowPlaying(userId),
    expected: {
      url: SPOTIFY_TOKEN_URL,
      headers: { 'Content-Type': FORM },
      body: 'grant_type=refresh_token&refresh_token=stored-refresh&client_id=users-own-client-id',
    },
  },
];

beforeEach(async () => {
  vi.unstubAllGlobals();
  clearCalendarCacheForTest();
  clearGmailCacheForTest();
  clearNowPlayingCacheForTest();
  await truncateAll();
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await truncateAll();
  await closeDb();
});

describe.each(PROVIDERS)('provider token refresh characterization: $name', (p) => {
  it('sends the exact token request and persists the new encrypted access token', async () => {
    const { userId, row } = await seed({ provider: p.provider, expiresAt: EXPIRED(), scopes: p.scopes, providerClientId: p.providerClientId });
    const calls = stubFetch({ status: 200, json: { access_token: 'fresh-access', expires_in: 3600 } });

    const before = Date.now();
    await p.call(userId);
    const after = Date.now();

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ ...p.expected, method: 'POST' });

    const updated = await readRow(row.id);
    expect(await decryptToken(updated.accessTokenEnc)).toBe('fresh-access');
    // The refresh token is not rotated, and is left exactly as stored.
    expect(updated.refreshTokenEnc).toBe(row.refreshTokenEnc);
    expect(updated.tokenExpiresAt!.getTime()).toBeGreaterThanOrEqual(before + 3600_000 - 1000);
    expect(updated.tokenExpiresAt!.getTime()).toBeLessThanOrEqual(after + 3600_000 + 1000);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
    // Nothing else on the row changes.
    expect({ ...updated, accessTokenEnc: null, tokenExpiresAt: null, updatedAt: null })
      .toEqual({ ...row, accessTokenEnc: null, tokenExpiresAt: null, updatedAt: null });
  });

  it('does not call the token endpoint while the access token is still valid', async () => {
    const { userId, row } = await seed({
      provider: p.provider, expiresAt: new Date(Date.now() + 60 * 60_000), scopes: p.scopes, providerClientId: p.providerClientId,
    });
    const calls = stubFetch({ status: 200, json: { access_token: 'fresh-access', expires_in: 3600 } });

    await p.call(userId);

    expect(calls).toHaveLength(0);
    expect(await readRow(row.id)).toEqual(row);
  });

  it.each([
    { label: '401 -> revoked', reply: { status: 401 }, error: 'TOKEN_REFRESH_REVOKED' },
    { label: '403 -> revoked', reply: { status: 403 }, error: 'TOKEN_REFRESH_REVOKED' },
    { label: '400 -> network error', reply: { status: 400 }, error: 'TOKEN_REFRESH_NETWORK_ERROR' },
    { label: '503 -> network error', reply: { status: 503 }, error: 'TOKEN_REFRESH_NETWORK_ERROR' },
    { label: 'fetch throws -> network error', reply: 'throw', error: 'TOKEN_REFRESH_NETWORK_ERROR' },
    { label: 'malformed body -> failed', reply: { status: 200, json: { access_token: 'x' } }, error: 'TOKEN_REFRESH_FAILED' },
  ])('maps $label and leaves the row untouched', async ({ reply, error }) => {
    const { userId, row } = await seed({ provider: p.provider, expiresAt: EXPIRED(), scopes: p.scopes, providerClientId: p.providerClientId });
    const calls = stubFetch(reply);

    const result = await p.call(userId);

    expect(calls).toHaveLength(1);
    expect(result).toEqual({ ok: false, error });
    expect(await readRow(row.id)).toEqual(row);
  });

  it('fails with TOKEN_REFRESH_FAILED and no network call when no refresh token is stored', async () => {
    const { userId, row } = await seed({
      provider: p.provider, expiresAt: EXPIRED(), refreshToken: null, scopes: p.scopes, providerClientId: p.providerClientId,
    });
    const calls = stubFetch({ status: 200, json: { access_token: 'fresh-access', expires_in: 3600 } });

    const result = await p.call(userId);

    expect(calls).toHaveLength(0);
    expect(result).toEqual({ ok: false, error: 'TOKEN_REFRESH_FAILED' });
    expect(await readRow(row.id)).toEqual(row);
  });
});
