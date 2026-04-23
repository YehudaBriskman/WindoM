import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('../../lib/api', () => ({
  getAccessToken: vi.fn().mockResolvedValue(null),
  setAccessToken: vi.fn().mockResolvedValue(undefined),
  clearAccessToken: vi.fn().mockResolvedValue(undefined),
  setRefreshToken: vi.fn().mockResolvedValue(undefined),
  clearRefreshToken: vi.fn().mockResolvedValue(undefined),
  refreshAccessToken: vi.fn().mockResolvedValue(null),
  setLogoutCallback: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  setRefreshToken,
  clearRefreshToken,
  refreshAccessToken,
  setLogoutCallback,
  apiGet,
  apiPost,
} from '../../lib/api';
import { AuthProvider, useAuth } from '../AuthContext';

const mockUser = {
  id: 'u1',
  email: 'a@a.com',
  name: 'Alice',
  hasPassword: true,
  emailVerified: true,
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  vi.mocked(getAccessToken).mockResolvedValue(null);
  vi.mocked(refreshAccessToken).mockResolvedValue(null);
});

// ── on mount ──────────────────────────────────────────────────────────────────

describe('on mount', () => {
  it('stays unauthenticated when no stored token and refresh fails', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.authLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('loads user when a valid stored token is present', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('stored-token');
    vi.mocked(apiGet).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).toEqual(mockUser));
    expect(result.current.accessToken).toBe('stored-token');
    expect(result.current.authLoading).toBe(false);
  });

  it('silently refreshes and loads user when no stored token', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue('refreshed-token');
    vi.mocked(apiGet).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).toEqual(mockUser));
  });

  it('stays unauthenticated and clears token when /me fails', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('stored-token');
    vi.mocked(apiGet).mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.authLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(clearAccessToken).toHaveBeenCalled();
  });

  it('dispatches windom-auth-login event with user name on successful load', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('stored-token');
    vi.mocked(apiGet).mockResolvedValue(mockUser);

    const received: string[] = [];
    const listener = (e: Event) => received.push((e as CustomEvent<{ name: string }>).detail.name);
    window.addEventListener('windom-auth-login', listener);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toBeTruthy());

    window.removeEventListener('windom-auth-login', listener);
    expect(received).toContain('Alice');
  });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe('login', () => {
  it('stores tokens, sets user, and clears session flags', async () => {
    vi.mocked(apiPost).mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });
    vi.mocked(apiGet).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authLoading).toBe(false));

    await act(async () => { await result.current.login('a@a.com', 'pass'); });

    expect(setAccessToken).toHaveBeenCalledWith('at');
    expect(setRefreshToken).toHaveBeenCalledWith('rt');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.sessionExpired).toBe(false);
    expect(result.current.sessionLimitReached).toBe(false);
  });

  it('dispatches windom-auth-login event with user name', async () => {
    vi.mocked(apiPost).mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });
    vi.mocked(apiGet).mockResolvedValue(mockUser);

    const received: string[] = [];
    const listener = (e: Event) => received.push((e as CustomEvent<{ name: string }>).detail.name);
    window.addEventListener('windom-auth-login', listener);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authLoading).toBe(false));
    await act(async () => { await result.current.login('a@a.com', 'pass'); });

    window.removeEventListener('windom-auth-login', listener);
    expect(received).toContain('Alice');
  });
});

// ── loginWithTokens ───────────────────────────────────────────────────────────

describe('loginWithTokens', () => {
  it('stores provided tokens and loads user', async () => {
    vi.mocked(apiGet).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authLoading).toBe(false));

    await act(async () => { await result.current.loginWithTokens('at', 'rt'); });

    expect(setAccessToken).toHaveBeenCalledWith('at');
    expect(setRefreshToken).toHaveBeenCalledWith('rt');
    expect(result.current.user).toEqual(mockUser);
  });
});

// ── logout ────────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('calls POST /auth/logout and clears user + tokens', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('stored-token');
    vi.mocked(apiGet).mockResolvedValue(mockUser);
    vi.mocked(apiPost).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    await act(async () => { await result.current.logout(); });

    expect(apiPost).toHaveBeenCalledWith('/auth/logout');
    expect(clearAccessToken).toHaveBeenCalled();
    expect(clearRefreshToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('still clears state even when POST /auth/logout throws', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('stored-token');
    vi.mocked(apiGet).mockResolvedValue(mockUser);
    vi.mocked(apiPost).mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    await act(async () => { await result.current.logout(); });

    expect(result.current.user).toBeNull();
    expect(clearAccessToken).toHaveBeenCalled();
  });
});

// ── updateUser ────────────────────────────────────────────────────────────────

describe('updateUser', () => {
  it('patches specific user fields without replacing the whole object', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('stored-token');
    vi.mocked(apiGet).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    act(() => { result.current.updateUser({ name: 'Bob' }); });

    expect(result.current.user?.name).toBe('Bob');
    expect(result.current.user?.email).toBe('a@a.com'); // unchanged
  });

  it('does nothing when user is null', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => { result.current.updateUser({ name: 'Bob' }); });

    expect(result.current.user).toBeNull();
  });
});

// ── session events ────────────────────────────────────────────────────────────

describe('session events', () => {
  it('clears user and sets sessionExpired on windom-session-expired', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authLoading).toBe(false));

    act(() => { window.dispatchEvent(new CustomEvent('windom-session-expired')); });

    expect(result.current.sessionExpired).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('clears user and sets sessionLimitReached on windom-session-limit', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authLoading).toBe(false));

    act(() => { window.dispatchEvent(new CustomEvent('windom-session-limit')); });

    expect(result.current.sessionLimitReached).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('clears user when the 401 logout callback registered via setLogoutCallback is fired', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('stored-token');
    vi.mocked(apiGet).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    // Retrieve the callback that AuthProvider registered with the api module
    const [registeredCb] = vi.mocked(setLogoutCallback).mock.calls[0] as [() => void];

    act(() => { registeredCb(); });

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('clears sessionExpired flag after successful login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authLoading).toBe(false));

    act(() => { window.dispatchEvent(new CustomEvent('windom-session-expired')); });
    expect(result.current.sessionExpired).toBe(true);

    vi.mocked(apiPost).mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });
    vi.mocked(apiGet).mockResolvedValue(mockUser);

    await act(async () => { await result.current.login('a@a.com', 'pass'); });

    expect(result.current.sessionExpired).toBe(false);
  });
});
