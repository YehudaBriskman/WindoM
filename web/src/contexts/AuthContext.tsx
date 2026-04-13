import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiGet, apiPost, getAccessToken, setAccessToken, clearAccessToken, setRefreshToken, clearRefreshToken, refreshAccessToken, setLogoutCallback } from '../lib/api';

const AUTH_REFRESH_TIMEOUT_MS = 5_000;
const ME_TIMEOUT_MS = 5_000;

interface User {
  id: string;
  email: string | null;
  name: string;
  hasPassword: boolean;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  authLoading: boolean;
  sessionExpired: boolean;
  sessionLimitReached: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionLimitReached, setSessionLimitReached] = useState(false);

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout');
    } catch {
      // best effort
    }
    await clearAccessToken();
    await clearRefreshToken();
    setUser(null);
    setTokenState(null);
  }, []);

  // Register the logout callback so apiFetch can trigger it on 401
  useEffect(() => {
    setLogoutCallback(() => {
      console.warn('[auth] Logout triggered by failed token refresh (401)');
      clearRefreshToken();
      setUser(null);
      setTokenState(null);
      setSessionLimitReached(false);
    });
  }, []);

  // Listen for session hard-expiry (renewal cap reached) to show re-login message
  useEffect(() => {
    const handler = () => {
      console.warn('[auth] Session expired (renewal cap reached) — user must re-login');
      setUser(null);
      setTokenState(null);
      setSessionExpired(true);
    };
    window.addEventListener('windom-session-expired', handler);
    return () => window.removeEventListener('windom-session-expired', handler);
  }, []);

  // Listen for session limit reached — too many active sessions
  useEffect(() => {
    const handler = () => {
      console.warn('[auth] Session limit reached — user must sign out from another device');
      setUser(null);
      setTokenState(null);
      setSessionLimitReached(true);
    };
    window.addEventListener('windom-session-limit', handler);
    return () => window.removeEventListener('windom-session-limit', handler);
  }, []);

  // On mount: check if we already have a token or can refresh.
  // Uses a 5s timeout so a missing backend doesn't stall the Account tab.
  useEffect(() => {
    async function init() {
      console.log('[auth:init] Starting auth init...');
      try {
        let token = await getAccessToken();
        if (token) {
          console.log('[auth:init] Valid stored access token found');
        } else {
          console.log('[auth:init] No valid stored token — attempting silent refresh');
          // Try silent refresh — race against a 5s timeout
          token = await Promise.race([
            refreshAccessToken(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), AUTH_REFRESH_TIMEOUT_MS)),
          ]);
          if (token) {
            console.log('[auth:init] Silent refresh succeeded');
          } else {
            console.warn('[auth:init] Silent refresh failed or timed out — user stays unauthenticated');
          }
        }
        if (token) {
          setTokenState(token);
          try {
            const me = await Promise.race([
              apiGet<User>('/me'),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('me_timeout')), ME_TIMEOUT_MS)
              ),
            ]);
            setUser(me);
            console.log('[auth:init] User loaded:', me.email ?? me.name);
            window.dispatchEvent(new CustomEvent('windom-auth-login', { detail: { name: me.name } }));
          } catch (err) {
            console.error('[auth:init] /me failed — clearing token:', err);
            await clearAccessToken();
          }
        }
      } catch (err) {
        // Silently fail — user stays unauthenticated
        console.error('[auth:init] Unexpected error:', err);
      }
      setLoading(false);
      console.log('[auth:init] Done');
    }
    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost<{ accessToken: string; refreshToken: string }>('/auth/login', { email, password });
    await setAccessToken(data.accessToken);
    await setRefreshToken(data.refreshToken);
    setTokenState(data.accessToken);
    const me = await apiGet<User>('/me');
    setUser(me);
    setSessionExpired(false);
    setSessionLimitReached(false);
    window.dispatchEvent(new CustomEvent('windom-auth-login', { detail: { name: me.name } }));
  }, []);

  const loginWithTokens = useCallback(async (accessToken: string, refreshToken: string) => {
    await setAccessToken(accessToken);
    await setRefreshToken(refreshToken);
    setTokenState(accessToken);
    const me = await apiGet<User>('/me');
    setUser(me);
    setSessionExpired(false);
    setSessionLimitReached(false);
    window.dispatchEvent(new CustomEvent('windom-auth-login', { detail: { name: me.name } }));
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, authLoading: loading, sessionExpired, sessionLimitReached, login, loginWithTokens, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
