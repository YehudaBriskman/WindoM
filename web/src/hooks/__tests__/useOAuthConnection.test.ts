import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../lib/api', () => ({ apiPost: vi.fn(), apiFetch: vi.fn() }));

import { apiFetch, apiPost } from '../../lib/api';
import { useOAuthConnection, type OAuthConnectionConfig } from '../useOAuthConnection';
import { GOOGLE_CALENDAR_OAUTH, GOOGLE_GMAIL_OAUTH } from '../../lib/google-oauth';
import { mapIntegrationError, WEB_AUTH_TIMEOUT_MS } from '../../lib/oauth-connection';
import {
  SPOTIFY_CLIENT_ID_KEY,
  SPOTIFY_OAUTH,
  clearSpotifyClientId,
  loadSpotifyClientId,
  mapSpotifyConnectError,
  saveSpotifyClientId,
} from '../../lib/spotify-oauth';

const REDIRECT = 'https://abcdef.chromiumapp.org/';
const AUTH_URL = 'https://accounts.example.com/auth?client_id=x&state=s-123';

type FlowCallback = (redirectUrl?: string) => void;
let launch: ReturnType<typeof vi.fn>;
let lastError: { message: string } | undefined;

/** Makes launchWebAuthFlow answer with `redirect` (or a runtime error). */
function answerWith(redirect: string | undefined, error?: string) {
  launch.mockImplementation((_opts: unknown, cb: FlowCallback) => {
    lastError = error ? { message: error } : undefined;
    cb(redirect);
    lastError = undefined;
  });
}

beforeEach(() => {
  launch = vi.fn();
  lastError = undefined;
  const g = globalThis as unknown as { chrome: Record<string, unknown> };
  g.chrome.identity = { getRedirectURL: () => REDIRECT, launchWebAuthFlow: launch };
  g.chrome.runtime = {
    get lastError() {
      return lastError;
    },
  };
  (g.chrome.storage as { local: Record<string, unknown> }).local.remove = vi.fn().mockResolvedValue(undefined);
  sessionStorage.clear();
  vi.mocked(apiPost).mockImplementation(async (path: string) => {
    if (path.includes('/start')) return { authUrl: AUTH_URL };
    return { status: 'linked' };
  });
  vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));
});

afterEach(() => {
  vi.useRealTimers();
});

function setup<A>(overrides: Partial<OAuthConnectionConfig<A>> & Pick<OAuthConnectionConfig<A>, 'provider'>) {
  const config: OAuthConnectionConfig<A> = {
    onConnected: vi.fn(),
    onDisconnected: vi.fn(),
    mapConnectError: mapIntegrationError,
    disconnectFailedMessage: 'Failed to disconnect',
    ...overrides,
  };
  const hook = renderHook(() => useOAuthConnection<A>(config));
  return { config, hook };
}

describe('useOAuthConnection - connect', () => {
  it('runs the Google Calendar flow: start URL, launch, state check, exchange', async () => {
    answerWith(`${REDIRECT}?code=c-1&state=s-123`);
    const { config, hook } = setup({ provider: GOOGLE_CALENDAR_OAUTH });

    await act(() => hook.result.current.connect());

    expect(apiPost).toHaveBeenNthCalledWith(
      1,
      `/oauth/google/start?redirectUri=${encodeURIComponent(REDIRECT)}`,
      undefined,
    );
    expect(launch).toHaveBeenCalledWith({ url: AUTH_URL, interactive: true }, expect.any(Function));
    expect(apiPost).toHaveBeenNthCalledWith(2, '/oauth/google/exchange', {
      code: 'c-1',
      state: 's-123',
      redirectUri: REDIRECT,
    });
    expect(config.onConnected).toHaveBeenCalledTimes(1);
    expect(hook.result.current.error).toBe('');
    expect(hook.result.current.busy).toBe(false);
    expect(sessionStorage.getItem('windom_oauth_state_google')).toBeNull();
  });

  it('asks for the Gmail feature in the Gmail start URL', async () => {
    answerWith(`${REDIRECT}?code=c-1&state=s-123`);
    const { hook } = setup({ provider: GOOGLE_GMAIL_OAUTH });

    await act(() => hook.result.current.connect());

    expect(apiPost).toHaveBeenNthCalledWith(
      1,
      `/oauth/google/start?redirectUri=${encodeURIComponent(REDIRECT)}&features=gmail`,
      undefined,
    );
  });

  it('runs Spotify with the client ID and a PKCE pair, and sends the verifier to the exchange', async () => {
    answerWith(`${REDIRECT}?code=c-1&state=s-123`);
    const { config, hook } = setup<string>({ provider: SPOTIFY_OAUTH });

    await act(() => hook.result.current.connect('client-abc'));

    const [startPath, startBody] = vi.mocked(apiPost).mock.calls[0];
    expect(startPath).toBe('/oauth/spotify/start');
    expect(startBody).toEqual({
      clientId: 'client-abc',
      codeChallenge: expect.any(String),
      codeChallengeMethod: 'S256',
      redirectUri: REDIRECT,
    });
    const [exchangePath, exchangeBody] = vi.mocked(apiPost).mock.calls[1];
    expect(exchangePath).toBe('/oauth/spotify/exchange');
    const body = exchangeBody as Record<string, string>;
    expect(Object.keys(body)).toEqual(['code', 'state', 'redirectUri', 'codeVerifier']);
    expect(body.codeVerifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    expect(config.onConnected).toHaveBeenCalledWith('client-abc');
  });

  it('rejects a callback whose state does not match', async () => {
    answerWith(`${REDIRECT}?code=c-1&state=forged`);
    const { config, hook } = setup({ provider: GOOGLE_CALENDAR_OAUTH });

    await act(() => hook.result.current.connect());

    expect(hook.result.current.error).toBe('OAuth state mismatch');
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(config.onConnected).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('windom_oauth_state_google')).toBeNull();
  });

  it('maps an ?error= in the redirect before looking for a code', async () => {
    answerWith(`${REDIRECT}?error=access_denied&state=s-123`);
    const { hook } = setup({ provider: GOOGLE_CALENDAR_OAUTH });

    await act(() => hook.result.current.connect());

    expect(hook.result.current.error).toBe('You declined the sign-in request. Please try again and allow access.');
  });

  it('reports a redirect with no code', async () => {
    answerWith(`${REDIRECT}?state=s-123`);
    const { hook } = setup({ provider: GOOGLE_CALENDAR_OAUTH });

    await act(() => hook.result.current.connect());

    expect(hook.result.current.error).toBe('No auth code returned');
  });

  it('reports a non-linked exchange status', async () => {
    answerWith(`${REDIRECT}?code=c-1&state=s-123`);
    vi.mocked(apiPost).mockImplementation(async (path: string) =>
      path.includes('/start') ? { authUrl: AUTH_URL } : { status: 'pending' },
    );
    const { config, hook } = setup({ provider: GOOGLE_CALENDAR_OAUTH });

    await act(() => hook.result.current.connect());

    expect(hook.result.current.error).toBe('Linking failed');
    expect(config.onConnected).not.toHaveBeenCalled();
  });

  it('maps a closed consent window through chrome.runtime.lastError', async () => {
    answerWith(undefined, 'The user did not approve access.');
    const { hook } = setup({ provider: GOOGLE_CALENDAR_OAUTH });

    await act(() => hook.result.current.connect());

    expect(hook.result.current.error).toBe('Sign-in was cancelled.');
  });

  it('gives up after the web-auth timeout and ignores a late answer', async () => {
    vi.useFakeTimers();
    let late: FlowCallback | undefined;
    launch.mockImplementation((_opts: unknown, cb: FlowCallback) => {
      late = cb;
    });
    const { config, hook } = setup({ provider: GOOGLE_CALENDAR_OAUTH });

    let pending!: Promise<void>;
    act(() => {
      pending = hook.result.current.connect();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(WEB_AUTH_TIMEOUT_MS);
      await pending;
    });

    expect(hook.result.current.error).toBe('Sign-in timed out. Please try again.');
    late?.(`${REDIRECT}?code=c-1&state=s-123`);
    expect(config.onConnected).not.toHaveBeenCalled();
  });

  it('ignores a second connect while one is in flight', async () => {
    let finish: FlowCallback | undefined;
    launch.mockImplementation((_opts: unknown, cb: FlowCallback) => {
      finish = cb;
    });
    const { hook } = setup({ provider: GOOGLE_CALENDAR_OAUTH });

    let first!: Promise<void>;
    await act(async () => {
      first = hook.result.current.connect();
      void hook.result.current.connect();
      await Promise.resolve();
    });
    expect(hook.result.current.busy).toBe(true);

    await act(async () => {
      await vi.waitFor(() => expect(finish).toBeDefined());
      finish?.(`${REDIRECT}?code=c-1&state=s-123`);
      await first;
    });
    expect(launch).toHaveBeenCalledTimes(1);
    expect(hook.result.current.busy).toBe(false);
  });

  it('shows the provider mapping for a failed start request', async () => {
    vi.mocked(apiPost).mockRejectedValue(new Error('Failed to fetch'));
    const { hook } = setup({ provider: GOOGLE_CALENDAR_OAUTH });

    await act(() => hook.result.current.connect());

    expect(hook.result.current.error).toBe('Connection failed. Check your internet and try again.');
    expect(launch).not.toHaveBeenCalled();
  });
});

describe('useOAuthConnection - disconnect', () => {
  it('deletes /integrations/<id> and then runs onDisconnected', async () => {
    const { config, hook } = setup<string>({ provider: SPOTIFY_OAUTH });

    await act(() => hook.result.current.disconnect());

    expect(apiFetch).toHaveBeenCalledWith('/integrations/spotify', { method: 'DELETE' });
    expect(config.onDisconnected).toHaveBeenCalledTimes(1);
    expect(hook.result.current.error).toBe('');
  });

  it('shows the configured message on a non-2xx and keeps local state', async () => {
    vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 500 }));
    const { config, hook } = setup({
      provider: GOOGLE_CALENDAR_OAUTH,
      disconnectFailedMessage: 'Failed to disconnect Google Calendar',
    });

    await act(() => hook.result.current.disconnect());

    expect(apiFetch).toHaveBeenCalledWith('/integrations/google', { method: 'DELETE' });
    expect(hook.result.current.error).toBe('Failed to disconnect Google Calendar');
    expect(config.onDisconnected).not.toHaveBeenCalled();
  });
});

describe('Spotify service', () => {
  it('maps Spotify-specific failures before the shared ones', () => {
    expect(mapSpotifyConnectError(new Error('Sign-in was cancelled.'), true)).toBe('Connection cancelled.');
    expect(mapSpotifyConnectError(new Error('INVALID_CLIENT: Invalid client'), true)).toBe(
      'Invalid Client ID - check your app settings at developer.spotify.com.',
    );
    expect(mapSpotifyConnectError(new Error('Request failed (401)'), false)).toBe(
      'You must be signed in to connect Spotify.',
    );
    expect(mapSpotifyConnectError(new Error('Request failed (401)'), true)).toBe('Request failed (401)');
    expect(mapSpotifyConnectError(new Error('Failed to fetch'), true)).toBe(
      'Connection failed. Check your internet and try again.',
    );
  });

  it('keeps the client ID under the same chrome.storage.local key', async () => {
    const local = chrome.storage.local as unknown as Record<string, ReturnType<typeof vi.fn>>;
    local.get.mockResolvedValue({ [SPOTIFY_CLIENT_ID_KEY]: 'saved-id' });

    expect(SPOTIFY_CLIENT_ID_KEY).toBe('windom_spotify_client_id');
    await expect(loadSpotifyClientId()).resolves.toBe('saved-id');
    await saveSpotifyClientId('new-id');
    expect(local.set).toHaveBeenCalledWith({ windom_spotify_client_id: 'new-id' });
    await clearSpotifyClientId();
    expect(local.remove).toHaveBeenCalledWith('windom_spotify_client_id');

    local.get.mockResolvedValue({});
    await expect(loadSpotifyClientId()).resolves.toBe('');
  });
});
