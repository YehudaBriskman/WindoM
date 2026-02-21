import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiGet, apiPost, getAccessToken, setAccessToken, clearAccessToken, refreshAccessToken, setLogoutCallback } from '../lib/api';

interface User {
  id: string;
  email: string | null;
  name: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout');
    } catch {
      // best effort
    }
    await clearAccessToken();
    setUser(null);
    setTokenState(null);
  }, []);

  // Register the logout callback so apiFetch can trigger it on 401
  useEffect(() => {
    setLogoutCallback(() => {
      setUser(null);
      setTokenState(null);
    });
  }, []);

  // On mount: check if we already have a token or can refresh.
  // Uses a 5s timeout so a missing backend doesn't stall the Account tab.
  useEffect(() => {
    async function init() {
      try {
        let token = await getAccessToken();
        if (!token) {
          // Try silent refresh — race against a 5s timeout
          token = await Promise.race([
            refreshAccessToken(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
          ]);
        }
        if (token) {
          setTokenState(token);
          try {
            const me = await apiGet<User>('/me');
            setUser(me);
          } catch {
            await clearAccessToken();
          }
        }
      } catch {
        // Silently fail — user stays unauthenticated
      }
      setLoading(false);
    }
    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost<{ accessToken: string }>('/auth/login', { email, password });
    await setAccessToken(data.accessToken);
    setTokenState(data.accessToken);
    const me = await apiGet<User>('/me');
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
