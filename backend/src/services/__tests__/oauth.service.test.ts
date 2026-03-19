import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/client.js', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('../../lib/crypto.js', () => ({
  encryptToken: vi.fn().mockResolvedValue('encrypted'),
}));
vi.mock('../../config.js', () => ({
  config: {
    SPOTIFY_CLIENT_ID: 'spot-id',
    SPOTIFY_CLIENT_SECRET: 'spot-secret',
  },
}));

import { db } from '../../db/client.js';
import { createOAuthState, verifyAndConsumeOAuthState, storeOAuthTokens, exchangeGoogleCode, exchangeSpotifyCode } from '../oauth.service.js';

const mockDb = db as unknown as {
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

// ── createOAuthState ───────────────────────────────────────────────────────

describe('createOAuthState', () => {
  it('inserts a state record and returns the state string', async () => {
    const valuesMock = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: valuesMock });

    const state = await createOAuthState('google', 'login');

    expect(typeof state).toBe('string');
    expect(state.length).toBeGreaterThan(10);
    expect(mockDb.insert).toHaveBeenCalledOnce();
    expect(valuesMock).toHaveBeenCalledOnce();
  });

  it('passes userId when provided', async () => {
    const valuesMock = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: valuesMock });

    await createOAuthState('spotify', 'link', 'user-42');

    const inserted = valuesMock.mock.calls[0][0] as { userId: string; provider: string; purpose: string };
    expect(inserted.userId).toBe('user-42');
    expect(inserted.provider).toBe('spotify');
    expect(inserted.purpose).toBe('link');
  });
});

// ── verifyAndConsumeOAuthState ─────────────────────────────────────────────

describe('verifyAndConsumeOAuthState', () => {
  it('returns STATE_INVALID when no row is found', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) });

    const result = await verifyAndConsumeOAuthState('bad-state', 'google', 'login');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('STATE_INVALID');
  });

  it('returns STATE_EXPIRED when the state is past expiry', async () => {
    const expiredRow = {
      id: 'state-1',
      state: 'abc',
      provider: 'google',
      purpose: 'login',
      used: false,
      userId: null,
      expiresAt: new Date(Date.now() - 1000), // expired
    };
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([expiredRow]) }) }) });

    const result = await verifyAndConsumeOAuthState('abc', 'google', 'login');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('STATE_EXPIRED');
  });

  it('returns STATE_INVALID when purpose does not match', async () => {
    const row = {
      id: 'state-2',
      state: 'abc',
      provider: 'google',
      purpose: 'link', // mismatch — caller expects 'login'
      used: false,
      userId: null,
      expiresAt: new Date(Date.now() + 60_000),
    };
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([row]) }) }) });

    const result = await verifyAndConsumeOAuthState('abc', 'google', 'login');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('STATE_INVALID');
  });

  it('marks state as used and returns the record on success', async () => {
    const row = {
      id: 'state-3',
      state: 'valid',
      provider: 'google',
      purpose: 'login',
      used: false,
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60_000),
    };
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([row]) }) }) });

    const whereMock = vi.fn().mockResolvedValue(undefined);
    mockDb.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: whereMock }) });

    const result = await verifyAndConsumeOAuthState('valid', 'google', 'login');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.userId).toBe('user-1');
      expect(result.data.provider).toBe('google');
      expect(result.data.purpose).toBe('login');
    }
    expect(whereMock).toHaveBeenCalledOnce();
  });
});

// ── storeOAuthTokens ───────────────────────────────────────────────────────

describe('storeOAuthTokens', () => {
  it('upserts encrypted tokens into the DB', async () => {
    const onConflictMock = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictMock }) });

    await storeOAuthTokens('user-1', 'google', {
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 3600,
      scope: 'calendar.readonly',
      providerUserId: 'google-uid',
    });

    expect(mockDb.insert).toHaveBeenCalledOnce();
    expect(onConflictMock).toHaveBeenCalledOnce();
  });

  it('handles missing refresh token (no refreshTokenEnc)', async () => {
    const onConflictMock = vi.fn().mockResolvedValue(undefined);
    const valuesMock = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictMock });
    mockDb.insert.mockReturnValue({ values: valuesMock });

    await storeOAuthTokens('user-1', 'spotify', {
      accessToken: 'at',
      expiresIn: 3600,
      providerUserId: 'spotify-uid',
    });

    const inserted = valuesMock.mock.calls[0][0] as { refreshTokenEnc: string | null };
    expect(inserted.refreshTokenEnc).toBeNull();
  });
});

// ── exchangeGoogleCode ─────────────────────────────────────────────────────

describe('exchangeGoogleCode', () => {
  it('returns TOKEN_EXCHANGE_FAILED when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const result = await exchangeGoogleCode('code', 'http://redirect', 'id', 'secret');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('TOKEN_EXCHANGE_FAILED');
  });

  it('returns TOKEN_EXCHANGE_FAILED when token response has no access_token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ error: 'invalid_grant' }),
    }));

    const result = await exchangeGoogleCode('code', 'http://redirect', 'id', 'secret');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('TOKEN_EXCHANGE_FAILED');
  });

  it('returns USERINFO_FAILED when userinfo fetch throws', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'at', expires_in: 3600, scope: '' }) })
      .mockRejectedValueOnce(new Error('userinfo error'));
    vi.stubGlobal('fetch', mockFetch);

    const result = await exchangeGoogleCode('code', 'http://redirect', 'id', 'secret');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('USERINFO_FAILED');
  });

  it('returns tokens and userInfo on success', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'at', expires_in: 3600, scope: 'profile' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ sub: 'g-uid', email: 'user@gmail.com', name: 'User' }) });
    vi.stubGlobal('fetch', mockFetch);

    const result = await exchangeGoogleCode('code', 'http://redirect', 'id', 'secret');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.tokens.access_token).toBe('at');
      expect(result.data.userInfo.email).toBe('user@gmail.com');
    }
  });
});

// ── exchangeSpotifyCode ────────────────────────────────────────────────────

describe('exchangeSpotifyCode', () => {
  it('returns TOKEN_EXCHANGE_FAILED when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    const result = await exchangeSpotifyCode('code', 'http://redirect');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('TOKEN_EXCHANGE_FAILED');
  });

  it('returns TOKEN_EXCHANGE_FAILED when token response has no access_token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ error: 'invalid_code' }),
    }));

    const result = await exchangeSpotifyCode('code', 'http://redirect');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('TOKEN_EXCHANGE_FAILED');
  });

  it('returns tokens and providerUserId on success', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'sat', refresh_token: 'srt', expires_in: 3600, scope: 'user-read-currently-playing' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'spotify-uid' }) });
    vi.stubGlobal('fetch', mockFetch);

    const result = await exchangeSpotifyCode('code', 'http://redirect');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.access_token).toBe('sat');
      expect(result.data.providerUserId).toBe('spotify-uid');
    }
  });
});
