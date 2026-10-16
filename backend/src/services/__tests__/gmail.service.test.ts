import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../db/client.js', () => ({ db: { select: vi.fn() } }));
vi.mock('../token-refresh.service.js', () => ({ getValidAccessToken: vi.fn() }));
vi.mock('../../config.js', () => ({
  config: { GOOGLE_CLIENT_ID: 'google-id', GOOGLE_CLIENT_SECRET: 'google-secret' },
}));

import { db } from '../../db/client.js';
import { getValidAccessToken } from '../token-refresh.service.js';
import { clearGmailCacheForTest, getGmailSummary } from '../gmail.service.js';

const mockDb = db as unknown as { select: ReturnType<typeof vi.fn> };
const mockGetToken = getValidAccessToken as ReturnType<typeof vi.fn>;

function account(scopes = ['openid', 'https://www.googleapis.com/auth/gmail.readonly']) {
  return { id: 'account-1', userId: 'user-1', provider: 'google', scopes };
}

function dbReturns(value: ReturnType<typeof account> | null): void {
  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(value ? [value] : []),
      }),
    }),
  });
}

function response(status: number, body: object = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  clearGmailCacheForTest();
});

describe('getGmailSummary', () => {
  it('returns NOT_CONNECTED without a Google account', async () => {
    dbReturns(null);
    await expect(getGmailSummary('user-1')).resolves.toEqual({ ok: false, error: 'NOT_CONNECTED' });
  });

  it('rejects an account without a Gmail scope before refreshing or fetching', async () => {
    dbReturns(account(['openid', 'calendar.readonly']));
    await expect(getGmailSummary('user-1')).resolves.toEqual({ ok: false, error: 'INSUFFICIENT_SCOPES' });
    expect(mockGetToken).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'TOKEN_REFRESH_REVOKED'],
    [403, 'GMAIL_API_FORBIDDEN'],
    [429, 'TOKEN_REFRESH_NETWORK_ERROR'],
    [500, 'TOKEN_REFRESH_NETWORK_ERROR'],
  ] as const)('maps Gmail HTTP %s to %s', async (status, error) => {
    dbReturns(account());
    mockGetToken.mockResolvedValue({ ok: true, data: 'access-token' });
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response(status))
      .mockResolvedValueOnce(response(200, { messages: [] })));
    await expect(getGmailSummary('user-1')).resolves.toEqual({ ok: false, error });
  });

  it('propagates token refresh errors without calling Gmail', async () => {
    dbReturns(account());
    mockGetToken.mockResolvedValue({ ok: false, error: 'TOKEN_REFRESH_REVOKED' });
    vi.stubGlobal('fetch', vi.fn());
    await expect(getGmailSummary('user-1')).resolves.toEqual({ ok: false, error: 'TOKEN_REFRESH_REVOKED' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('normalizes headers and defaults missing message fields', async () => {
    dbReturns(account());
    mockGetToken.mockResolvedValue({ ok: true, data: 'access-token' });
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response(200, { messagesUnread: 7 }))
      .mockResolvedValueOnce(response(200, { messages: [{ id: 'message-1' }, { id: 'message-2' }] }))
      .mockResolvedValueOnce(response(200, {
        id: 'message-1',
        snippet: 'Preview',
        payload: { headers: [
          { name: 'from', value: 'Alice Example <alice@example.com>' },
          { name: 'SUBJECT', value: 'Hello' },
          { name: 'Date', value: 'Thu, 16 Oct 2026 10:00:00 GMT' },
        ] },
      }))
      .mockResolvedValueOnce(response(200, { id: 'message-2' })));

    await expect(getGmailSummary('user-1')).resolves.toEqual({
      ok: true,
      data: {
        unreadCount: 7,
        messages: [
          {
            id: 'message-1',
            from: 'Alice Example <alice@example.com>',
            subject: 'Hello',
            snippet: 'Preview',
            date: 'Thu, 16 Oct 2026 10:00:00 GMT',
          },
          { id: 'message-2', from: '', subject: '(No subject)', snippet: '', date: '' },
        ],
      },
    });
  });

  it('keeps successful messages when another metadata request fails', async () => {
    dbReturns(account());
    mockGetToken.mockResolvedValue({ ok: true, data: 'access-token' });
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response(200, { messagesUnread: 2 }))
      .mockResolvedValueOnce(response(200, { messages: [{ id: 'good' }, { id: 'failed' }] }))
      .mockResolvedValueOnce(response(200, { id: 'good', payload: { headers: [] } }))
      .mockRejectedValueOnce(new Error('metadata network failure')));

    const result = await getGmailSummary('user-1');
    expect(result.ok && result.data.messages.map((message) => message.id)).toEqual(['good']);
  });

  it('uses the cache within its TTL and refetches after expiry', async () => {
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    dbReturns(account());
    mockGetToken.mockResolvedValue({ ok: true, data: 'access-token' });
    const fetchMock = vi.fn().mockResolvedValue(response(200, { messages: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await getGmailSummary('user-1');
    await getGmailSummary('user-1');
    expect(mockDb.select).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    now += 45_001;
    await getGmailSummary('user-1');
    expect(mockDb.select).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
