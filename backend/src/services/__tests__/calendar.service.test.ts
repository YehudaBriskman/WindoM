import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/client.js', () => ({ db: { select: vi.fn() } }));
vi.mock('../token-refresh.service.js', () => ({ getValidAccessToken: vi.fn() }));
vi.mock('../../config.js', () => ({
  config: { GOOGLE_CLIENT_ID: 'gid', GOOGLE_CLIENT_SECRET: 'gsecret' },
}));

import { db } from '../../db/client.js';
import { getValidAccessToken } from '../token-refresh.service.js';
import { getCalendarEvents } from '../calendar.service.js';

const mockDb = db as unknown as { select: ReturnType<typeof vi.fn> };
const mockGetToken = getValidAccessToken as ReturnType<typeof vi.fn>;

function mockAccount(): { id: string; userId: string; provider: string } {
  return { id: 'acct-1', userId: 'user-1', provider: 'google' };
}

function dbReturnsAccount(account: ReturnType<typeof mockAccount> | null): void {
  const limitMock = vi.fn().mockResolvedValue(account ? [account] : []);
  mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: limitMock }) }) });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('getCalendarEvents', () => {
  it('returns NOT_CONNECTED when no account exists', async () => {
    dbReturnsAccount(null);

    const result = await getCalendarEvents('user-1', 7);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NOT_CONNECTED');
  });

  it('returns TOKEN_REFRESH_FAILED when access token is unavailable', async () => {
    dbReturnsAccount(mockAccount());
    mockGetToken.mockResolvedValue(null);

    const result = await getCalendarEvents('user-1', 7);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('TOKEN_REFRESH_FAILED');
  });

  it('returns an empty array when all calendar fetches fail', async () => {
    dbReturnsAccount(mockAccount());
    mockGetToken.mockResolvedValue('access-token');

    // calendarList fails → falls back to primary; then primary events fetch fails
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const result = await getCalendarEvents('user-1', 7);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it('returns events from the primary calendar', async () => {
    dbReturnsAccount(mockAccount());
    mockGetToken.mockResolvedValue('access-token');

    const calListResponse = {
      ok: true,
      json: () =>
        Promise.resolve({ items: [{ id: 'primary', backgroundColor: '#ff0000' }] }),
    };
    const eventsResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            {
              id: 'evt-1',
              summary: 'Meeting',
              description: 'Stand-up',
              htmlLink: 'https://cal.google.com/e/1',
              start: { dateTime: '2026-03-20T10:00:00Z' },
            },
          ],
        }),
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(calListResponse).mockResolvedValueOnce(eventsResponse));

    const result = await getCalendarEvents('user-1', 7);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Meeting');
      expect(result.data[0].id).toBe('evt-1');
    }
  });

  it('deduplicates events appearing in multiple calendar responses', async () => {
    dbReturnsAccount(mockAccount());
    mockGetToken.mockResolvedValue('access-token');

    const calListResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            { id: 'cal-a', backgroundColor: '#aaa' },
            { id: 'cal-b', backgroundColor: '#bbb' },
          ],
        }),
    };

    const duplicateEvent = {
      id: 'shared-evt',
      summary: 'Shared',
      start: { dateTime: '2026-03-20T09:00:00Z' },
    };

    const eventResponse = {
      ok: true,
      json: () => Promise.resolve({ items: [duplicateEvent] }),
    };

    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(calListResponse)
        .mockResolvedValueOnce(eventResponse)
        .mockResolvedValueOnce(eventResponse),
    );

    const result = await getCalendarEvents('user-1', 7);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toHaveLength(1);
  });

  it('clamps days to MAX_CALENDAR_DAYS', async () => {
    dbReturnsAccount(mockAccount());
    mockGetToken.mockResolvedValue('access-token');

    const mockFetch = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', mockFetch);

    // Pass an absurdly large number — should not throw
    const result = await getCalendarEvents('user-1', 999);
    expect(result.ok).toBe(true);
  });
});
