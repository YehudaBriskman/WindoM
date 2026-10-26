import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, isProviderRoute, setLogoutCallback } from '../api';

/**
 * Covers the two faults that turned a successful Google sign-in into an
 * immediate logout: a provider's 401 driving a session refresh, and a throttled
 * refresh being read as an expired session.
 */

function freshToken(): string {
  const payload = { exp: Math.floor(Date.now() / 1000) + 3600 };
  return `h.${btoa(JSON.stringify(payload)).replace(/=/g, '')}.s`;
}

const token = freshToken();

beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(chrome.storage.local.get).mockResolvedValue({ windom_access_token: token } as never);
  vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined as never);
});

describe('isProviderRoute', () => {
  it.each(['/calendar/events', '/spotify/now-playing', '/gmail/summary', '/github/prs'])(
    'treats %s as the provider\'s own',
    (p) => expect(isProviderRoute(p)).toBe(true),
  );

  it.each(['/me', '/settings', '/auth/refresh', '/integrations', '/oauth/google/start'])(
    'treats %s as ours',
    (p) => expect(isProviderRoute(p)).toBe(false),
  );

  it('ignores the query string', () => {
    expect(isProviderRoute('/calendar/events?limit=5')).toBe(true);
  });

  it('does not match a route that merely shares a prefix', () => {
    expect(isProviderRoute('/calendarium')).toBe(false);
  });
});

describe('a 401 from a provider route', () => {
  it('does not attempt a session refresh', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await apiFetch('/calendar/events');

    expect(res.status).toBe(401);
    // One call only: the original. A refresh would add a POST to /auth/refresh.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.every(([url]) => !String(url).includes('/auth/refresh'))).toBe(true);
  });

  it('does not log the user out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    const logout = vi.fn();
    setLogoutCallback(logout);

    await apiFetch('/gmail/summary');

    expect(logout).not.toHaveBeenCalled();
  });
});

describe('a rate-limited refresh', () => {
  it('keeps the session rather than logging out', async () => {
    // Our own route 401s, so a refresh is correct here - but it comes back 429.
    const fetchMock = vi.fn(async (url: string) =>
      String(url).includes('/auth/refresh')
        ? new Response(JSON.stringify({ error: 'Too Many Requests' }), { status: 429 })
        : new Response('{}', { status: 401 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(chrome.storage.local.get).mockResolvedValue({} as never); // no valid token
    const logout = vi.fn();
    setLogoutCallback(logout);

    const res = await apiFetch('/settings');

    expect(res.status).toBe(401);
    expect(logout).not.toHaveBeenCalled();
  });

  it('still logs out when the refresh genuinely fails', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      String(url).includes('/auth/refresh')
        ? new Response(JSON.stringify({ code: 'INVALID_REFRESH' }), { status: 401 })
        : new Response('{}', { status: 401 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(chrome.storage.local.get).mockResolvedValue({} as never);
    const logout = vi.fn();
    setLogoutCallback(logout);

    await apiFetch('/settings');

    expect(logout).toHaveBeenCalled();
  });
});
