import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/client.js', () => ({ db: { update: vi.fn() } }));
vi.mock('../../lib/crypto.js', () => ({
  decryptToken: vi.fn(),
  encryptToken: vi.fn(),
}));

import { db } from '../../db/client.js';
import { decryptToken, encryptToken } from '../../lib/crypto.js';
import { getValidAccessToken } from '../token-refresh.service.js';
import {
  githubPatStrategy,
  parseStandardTokenResponse,
  type RefreshableTokenStrategy,
} from '../token-refresh.strategies.js';
import { TOKEN_REFRESH_BUFFER_MS } from '../../types/constants.js';

const mockDb = db as unknown as { update: ReturnType<typeof vi.fn> };
const mockDecrypt = decryptToken as ReturnType<typeof vi.fn>;
const mockEncrypt = encryptToken as ReturnType<typeof vi.fn>;

// Minimal account row shape used across tests
function makeAccount(overrides: Record<string, unknown> = {}): Parameters<typeof getValidAccessToken>[0] {
  return {
    id: 'acct-1',
    userId: 'user-1',
    provider: 'google',
    accessTokenEnc: 'encrypted-access',
    refreshTokenEnc: 'encrypted-refresh',
    tokenExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min from now (valid)
    ...overrides,
  } as Parameters<typeof getValidAccessToken>[0];
}

// A generic test strategy - the service must not care which provider it is.
const strategy: RefreshableTokenStrategy = {
  provider: 'google',
  refreshable: true,
  refreshUrl: 'https://example.com/token',
  buildHeaders: () => ({}),
  buildBody: (refreshToken) =>
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: 'id',
      client_secret: 'secret',
    }),
  parseResponse: parseStandardTokenResponse,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('getValidAccessToken', () => {
  it('returns decrypted access token when still valid', async () => {
    mockDecrypt.mockResolvedValue('plain-access-token');

    const result = await getValidAccessToken(makeAccount(), strategy);

    expect(result).toEqual({ ok: true, data: 'plain-access-token' });
    expect(mockDecrypt).toHaveBeenCalledWith('encrypted-access');
    // Should NOT call fetch when token is valid
    expect(vi.isMockFunction(global.fetch)).toBe(false);
  });

  it('returns TOKEN_REFRESH_FAILED when token is expired and no refresh token', async () => {
    const account = makeAccount({
      tokenExpiresAt: new Date(Date.now() - 1000), // expired
      refreshTokenEnc: null,
    });

    const result = await getValidAccessToken(account, strategy);

    expect(result).toEqual({ ok: false, error: 'TOKEN_REFRESH_FAILED' });
  });

  it('returns TOKEN_REFRESH_FAILED when token expires within buffer and no refresh token', async () => {
    const account = makeAccount({
      tokenExpiresAt: new Date(Date.now() + TOKEN_REFRESH_BUFFER_MS / 2), // within buffer
      refreshTokenEnc: null,
    });

    const result = await getValidAccessToken(account, strategy);

    expect(result).toEqual({ ok: false, error: 'TOKEN_REFRESH_FAILED' });
  });

  it('refreshes and returns new access token when expired', async () => {
    const account = makeAccount({ tokenExpiresAt: new Date(Date.now() - 5000) });

    mockDecrypt.mockResolvedValue('old-refresh-token');
    mockEncrypt.mockResolvedValue('new-encrypted-access');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: 'new-access-token', expires_in: 3600 }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const setBuildMock = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    mockDb.update.mockReturnValue({ set: setBuildMock });

    const result = await getValidAccessToken(account, strategy);

    expect(result).toEqual({ ok: true, data: 'new-access-token' });
    expect(mockDecrypt).toHaveBeenCalledWith('encrypted-refresh');
    expect(mockEncrypt).toHaveBeenCalledWith('new-access-token');
    expect(mockDb.update).toHaveBeenCalledOnce();
  });

  it('returns TOKEN_REFRESH_REVOKED when provider returns 401', async () => {
    const account = makeAccount({ tokenExpiresAt: new Date(Date.now() - 5000) });

    mockDecrypt.mockResolvedValue('old-refresh-token');

    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal('fetch', mockFetch);

    const result = await getValidAccessToken(account, strategy);

    expect(result).toEqual({ ok: false, error: 'TOKEN_REFRESH_REVOKED' });
  });

  it('returns TOKEN_REFRESH_NETWORK_ERROR when provider returns 5xx', async () => {
    const account = makeAccount({ tokenExpiresAt: new Date(Date.now() - 5000) });

    mockDecrypt.mockResolvedValue('old-refresh-token');

    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', mockFetch);

    const result = await getValidAccessToken(account, strategy);

    expect(result).toEqual({ ok: false, error: 'TOKEN_REFRESH_NETWORK_ERROR' });
  });

  it('returns TOKEN_REFRESH_FAILED when tokenExpiresAt is null and no refresh token', async () => {
    const account = makeAccount({ tokenExpiresAt: null, refreshTokenEnc: null });

    const result = await getValidAccessToken(account, strategy);

    expect(result).toEqual({ ok: false, error: 'TOKEN_REFRESH_FAILED' });
  });

  it('sends the strategy headers alongside the form Content-Type', async () => {
    const account = makeAccount({ tokenExpiresAt: new Date(Date.now() - 5000) });

    mockDecrypt.mockResolvedValue('refresh-token');
    mockEncrypt.mockResolvedValue('enc');

    let capturedHeaders: Record<string, string> = {};
    const mockFetch = vi.fn().mockImplementation((_url: string, opts: { headers: Record<string, string> }) => {
      capturedHeaders = opts.headers;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: 'tok', expires_in: 3600 }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    mockDb.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

    await getValidAccessToken(account, { ...strategy, buildHeaders: () => ({ Authorization: 'Basic abc123' }) });

    expect(capturedHeaders).toEqual({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic abc123',
    });
  });

  it('posts the strategy body to the strategy URL', async () => {
    const account = makeAccount({ tokenExpiresAt: new Date(Date.now() - 5000) });
    mockDecrypt.mockResolvedValue('refresh-token');
    mockEncrypt.mockResolvedValue('enc');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: 'tok', expires_in: 3600 }),
    });
    vi.stubGlobal('fetch', mockFetch);
    mockDb.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
    const buildBody = vi.fn((refreshToken: string) => strategy.buildBody(refreshToken));

    await getValidAccessToken(account, { ...strategy, buildBody });

    expect(buildBody).toHaveBeenCalledWith('refresh-token');
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.com/token');
    expect(init.method).toBe('POST');
    expect((init.body as URLSearchParams).toString()).toBe(
      'grant_type=refresh_token&refresh_token=refresh-token&client_id=id&client_secret=secret',
    );
  });

  it('writes the encrypted token and an expiry from the strategy-parsed lifetime', async () => {
    const account = makeAccount({ tokenExpiresAt: new Date(Date.now() - 5000) });
    mockDecrypt.mockResolvedValue('refresh-token');
    mockEncrypt.mockResolvedValue('enc-custom');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ whatever: true }) }));
    const set = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    mockDb.update.mockReturnValue({ set });

    const before = Date.now();
    const result = await getValidAccessToken(account, {
      ...strategy,
      parseResponse: () => ({ accessToken: 'custom-token', expiresInSec: 60 }),
    });

    expect(result).toEqual({ ok: true, data: 'custom-token' });
    expect(mockEncrypt).toHaveBeenCalledWith('custom-token');
    const written = set.mock.calls[0][0] as { accessTokenEnc: string; tokenExpiresAt: Date; updatedAt: Date };
    expect(Object.keys(written).sort()).toEqual(['accessTokenEnc', 'tokenExpiresAt', 'updatedAt']);
    expect(written.accessTokenEnc).toBe('enc-custom');
    expect(written.tokenExpiresAt.getTime()).toBeGreaterThanOrEqual(before + 60_000);
    expect(written.tokenExpiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 60_000);
  });

  it('fails a non-refreshable strategy without decrypting or calling the network', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    const account = makeAccount({ provider: 'github', tokenExpiresAt: null, refreshTokenEnc: 'encrypted-refresh' });

    const result = await getValidAccessToken(account, githubPatStrategy);

    expect(result).toEqual({ ok: false, error: 'TOKEN_REFRESH_FAILED' });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockDecrypt).not.toHaveBeenCalled();
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('still returns the stored token for a non-refreshable strategy while it is unexpired', async () => {
    mockDecrypt.mockResolvedValue('plain-pat');

    const result = await getValidAccessToken(makeAccount({ provider: 'github' }), githubPatStrategy);

    expect(result).toEqual({ ok: true, data: 'plain-pat' });
  });

  it('deduplicates concurrent refreshes for the same account', async () => {
    const account = makeAccount({ tokenExpiresAt: new Date(Date.now() - 5000) });
    mockDecrypt.mockResolvedValue('refresh-token');
    mockEncrypt.mockResolvedValue('encrypted-new-token');

    let resolveFetch!: (value: { ok: boolean; json: () => Promise<object> }) => void;
    const fetchResult = new Promise<{ ok: boolean; json: () => Promise<object> }>((resolve) => {
      resolveFetch = resolve;
    });
    const mockFetch = vi.fn().mockReturnValue(fetchResult);
    vi.stubGlobal('fetch', mockFetch);
    mockDb.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

    const first = getValidAccessToken(account, strategy);
    const second = getValidAccessToken(account, strategy);
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());

    resolveFetch({
      ok: true,
      json: () => Promise.resolve({ access_token: 'shared-token', expires_in: 3600 }),
    });

    await expect(Promise.all([first, second])).resolves.toEqual([
      { ok: true, data: 'shared-token' },
      { ok: true, data: 'shared-token' },
    ]);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockDb.update).toHaveBeenCalledOnce();
  });

  it.each([
    {},
    { expires_in: 3600 },
    { access_token: 'token' },
    { access_token: '', expires_in: 3600 },
    { access_token: 'token', expires_in: 0 },
    { access_token: 'token', expires_in: -1 },
  ])('rejects malformed provider token response %#', async (payload) => {
    const account = makeAccount({ tokenExpiresAt: new Date(Date.now() - 5000) });
    mockDecrypt.mockResolvedValue('refresh-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(payload),
      }),
    );

    await expect(getValidAccessToken(account, strategy)).resolves.toEqual({
      ok: false,
      error: 'TOKEN_REFRESH_FAILED',
    });
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('maps a timeout during token exchange to a retryable network error', async () => {
    const account = makeAccount({ tokenExpiresAt: new Date(Date.now() - 5000) });
    mockDecrypt.mockResolvedValue('refresh-token');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('timed out', 'TimeoutError')));

    await expect(getValidAccessToken(account, strategy)).resolves.toEqual({
      ok: false,
      error: 'TOKEN_REFRESH_NETWORK_ERROR',
    });
  });

  it('does not deduplicate refreshes for different accounts', async () => {
    mockDecrypt.mockResolvedValue('refresh-token');
    mockEncrypt.mockResolvedValue('encrypted-new-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: 'token', expires_in: 3600 }),
      }),
    );
    mockDb.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

    await Promise.all([
      getValidAccessToken(makeAccount({ id: 'account-a', tokenExpiresAt: new Date(0) }), strategy),
      getValidAccessToken(makeAccount({ id: 'account-b', tokenExpiresAt: new Date(0) }), strategy),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
