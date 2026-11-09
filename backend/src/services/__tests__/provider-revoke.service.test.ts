import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../db/client.js', () => ({ db: { select: vi.fn(), delete: vi.fn() } }));
vi.mock('../../lib/crypto.js', () => ({
  decryptToken: vi.fn((v: string) => Promise.resolve(`plain:${v}`)),
}));
const warn = vi.fn();
vi.mock('../../lib/logger.js', () => ({
  logger: {
    warn: (...a: unknown[]) => {
      warn(...a);
    },
    error: vi.fn(),
  },
}));

import { db } from '../../db/client.js';
import { revokeAtProvider, revokeAccounts, GOOGLE_REVOKE_URL } from '../provider-revoke.service.js';
import { unlinkProvider } from '../integrations.service.js';
import { deleteAccount } from '../me.service.js';

const mockDb = db as unknown as { select: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
});
afterEach(() => vi.unstubAllGlobals());

describe('revokeAtProvider', () => {
  it('posts the refresh token to Google', async () => {
    await revokeAtProvider({ provider: 'google', accessTokenEnc: 'a', refreshTokenEnc: 'r' });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(GOOGLE_REVOKE_URL);
    expect(init.method).toBe('POST');
    expect(init.body).toBe('token=plain%3Ar');
  });

  it('falls back to the access token when there is no refresh token', async () => {
    await revokeAtProvider({ provider: 'google', accessTokenEnc: 'a', refreshTokenEnc: null });
    expect((fetchMock.mock.calls[0] as [string, RequestInit])[1].body).toBe('token=plain%3Aa');
  });

  it('does nothing for spotify and github', async () => {
    await revokeAtProvider({ provider: 'spotify', accessTokenEnc: 'a', refreshTokenEnc: 'r' });
    await revokeAtProvider({ provider: 'github', accessTokenEnc: 'a', refreshTokenEnc: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never throws and never logs the token when fetch fails', async () => {
    fetchMock.mockRejectedValue(new Error('boom plain:r'));
    await expect(
      revokeAtProvider({ provider: 'google', accessTokenEnc: 'a', refreshTokenEnc: 'r' }),
    ).resolves.toBeUndefined();
    expect(JSON.stringify(warn.mock.calls)).not.toContain('plain:');
  });

  it('logs a non-2xx response without throwing', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 400 }));
    await revokeAccounts([{ provider: 'google', accessTokenEnc: 'a', refreshTokenEnc: 'r' }]);
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('disconnect and delete call the revoke endpoint', () => {
  const rows = [{ provider: 'google', accessTokenEnc: 'a', refreshTokenEnc: 'r' }];

  it('unlinkProvider revokes after deleting, and succeeds even if revoke fails', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(rows) }) });
    mockDb.delete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(unlinkProvider('u1', 'google')).resolves.toBeUndefined();
    expect(mockDb.delete).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('deleteAccount revokes stored grants', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(rows) }) });
    mockDb.delete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    // revokeAllUserSessions uses db.update
    (db as unknown as { update: unknown }).update = vi
      .fn()
      .mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

    await deleteAccount('u1');
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
