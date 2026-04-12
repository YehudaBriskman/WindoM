import { localStore as chromeLocal } from './chrome-storage';

// Injected at build time via vite.config.ts define
declare const __BACKEND_URL__: string;
export const BASE_URL = typeof __BACKEND_URL__ !== 'undefined' ? __BACKEND_URL__ : 'http://localhost:8080';

const ACCESS_TOKEN_KEY = 'windom_access_token';
const REFRESH_TOKEN_KEY = 'windom_refresh_token';

// ── JWT expiry helper ───────────────────────────────────────────────────────

/** Decode the JWT payload (no signature verification) to read the exp claim. */
function parseJwtExpMs(token: string): number | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Returns true if the token is expired or will expire within the given buffer. */
function isTokenExpired(token: string, bufferMs = 30_000): boolean {
  const expMs = parseJwtExpMs(token);
  if (!expMs) return true; // can't parse → treat as expired
  return Date.now() > expMs - bufferMs;
}

// ── Token storage (chrome.storage.local only — never sync) ─────────────────

/**
 * Returns the stored access token only if it's still valid (not expired).
 * Returns null if missing or expired so callers know they need a refresh.
 */
export async function getAccessToken(): Promise<string | null> {
  const token = await chromeLocal.get<string | null>(ACCESS_TOKEN_KEY, null);
  if (!token) return null;

  if (isTokenExpired(token)) {
    console.log('[auth] Stored access token is expired — treating as null');
    return null;
  }

  return token;
}

export async function setAccessToken(token: string): Promise<void> {
  await chromeLocal.set(ACCESS_TOKEN_KEY, token);
}

export async function clearAccessToken(): Promise<void> {
  await chromeLocal.set(ACCESS_TOKEN_KEY, null);
}

export async function setRefreshToken(token: string): Promise<void> {
  await chromeLocal.set(REFRESH_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return chromeLocal.get<string | null>(REFRESH_TOKEN_KEY, null);
}

export async function clearRefreshToken(): Promise<void> {
  await chromeLocal.set(REFRESH_TOKEN_KEY, null);
}

// ── Refresh ─────────────────────────────────────────────────────────────────

const REFRESH_LOCK_KEY = 'windom_refresh_lock';
const REFRESH_LOCK_TTL_MS = 10_000; // 10s max — prevents stale locks

let refreshPromise: Promise<string | null> | null = null;

/**
 * Acquire a cross-tab refresh lock using chrome.storage.local.
 * Returns true if this tab won the lock, false if another tab already holds it.
 */
async function acquireRefreshLock(): Promise<boolean> {
  const now = Date.now();
  const existing = await chromeLocal.get<number | null>(REFRESH_LOCK_KEY, null);
  // If lock exists and is still fresh, another tab holds it
  if (existing && now - existing < REFRESH_LOCK_TTL_MS) return false;
  await chromeLocal.set(REFRESH_LOCK_KEY, now);
  // Read back to confirm we actually wrote it (last writer wins in storage.local)
  const written = await chromeLocal.get<number | null>(REFRESH_LOCK_KEY, null);
  return written === now;
}

async function releaseRefreshLock(): Promise<void> {
  await chromeLocal.set(REFRESH_LOCK_KEY, null);
}

async function doRefresh(): Promise<string | null> {
  // ── Cross-tab lock ──────────────────────────────────────────────────────
  // chrome.storage.local is shared across all tabs. If another tab is already
  // refreshing, wait for it to finish and use its token instead.
  const won = await acquireRefreshLock();
  if (!won) {
    console.log('[auth:refresh] Another tab holds the refresh lock — polling...');
    const POLL_MS = 200;
    const POLL_DEADLINE = Date.now() + REFRESH_LOCK_TTL_MS;
    while (Date.now() < POLL_DEADLINE) {
      await new Promise<void>((r) => setTimeout(r, POLL_MS));
      const stored = await chromeLocal.get<string | null>(ACCESS_TOKEN_KEY, null);
      if (stored && !isTokenExpired(stored)) {
        console.log('[auth:refresh] Using token stored by winning tab');
        return stored;
      }
      const lock = await chromeLocal.get<number | null>(REFRESH_LOCK_KEY, null);
      if (!lock) break; // Lock released — winning tab finished, check token once more
    }
    const stored = await chromeLocal.get<string | null>(ACCESS_TOKEN_KEY, null);
    if (stored && !isTokenExpired(stored)) return stored;
    // Winning tab failed — fall through and try ourselves
    console.warn('[auth:refresh] Winning tab did not produce a fresh token — proceeding');
  }

  console.log('[auth:refresh] Sending refresh request...');
  try {
    const storedRefreshToken = await getRefreshToken();
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      ...(storedRefreshToken ? {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      } : {}),
    });

    if (!res.ok) {
      console.warn(`[auth:refresh] Failed with HTTP ${res.status}`);

      // Another tab may have won a concurrent refresh (cookie already rotated).
      // Wait briefly then check storage for the fresh token it stored.
      if (res.status === 401) {
        await new Promise<void>((r) => setTimeout(r, 250));
        const stored = await chromeLocal.get<string | null>(ACCESS_TOKEN_KEY, null);
        if (stored && !isTokenExpired(stored)) {
          console.log('[auth:refresh] Found valid token stored by another tab — using it');
          return stored;
        }
      }

      try {
        const err = (await res.json()) as { code?: string };
        console.warn('[auth:refresh] Error code:', err.code);
        if (err.code === 'SESSION_LIMIT_REACHED') {
          window.dispatchEvent(new CustomEvent('windom-session-limit'));
        } else {
          window.dispatchEvent(new CustomEvent('windom-session-expired'));
        }
      } catch { /* ignore parse errors */ }

      // Do NOT call clearAccessToken() here — another tab may have just
      // stored a fresh token. The expired-token guard in getAccessToken()
      // handles cleanup on the next read.
      return null;
    }

    const data = (await res.json()) as { accessToken: string; refreshToken?: string };
    await setAccessToken(data.accessToken);
    if (data.refreshToken) await setRefreshToken(data.refreshToken);
    console.log('[auth:refresh] Success — new access token stored');
    return data.accessToken;
  } catch (err) {
    console.error('[auth:refresh] Network error:', err);
    return null;
  } finally {
    await releaseRefreshLock();
  }
}

/** Refresh the access token exactly once even if called concurrently within this tab. */
export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ── Core fetch wrapper ──────────────────────────────────────────────────────

type LogoutCallback = () => void;
let _onLogout: LogoutCallback | null = null;

export function setLogoutCallback(cb: LogoutCallback) {
  _onLogout = cb;
}

function triggerLogout() {
  clearAccessToken();
  _onLogout?.();
}

export async function apiFetch(path: string, options: RequestInit = {}, _retry = true): Promise<Response> {
  const token = await getAccessToken();

  const hasBody = options.body !== undefined && options.body !== null;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error('Network error — check your connection and try again.');
  }

  if (res.status === 401 && _retry) {
    console.warn(`[auth] 401 on ${path} — attempting token refresh`);
    const newToken = await refreshAccessToken();
    if (newToken) {
      console.log(`[auth] Refresh succeeded — retrying ${path}`);
      return apiFetch(path, options, false);
    }
    console.warn(`[auth] Refresh failed — triggering logout`);
    triggerLogout();
  }

  return res;
}

// ── Typed helpers ───────────────────────────────────────────────────────────

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) {
    const payload = await res.json().catch(() => ({})) as { message?: string; error?: string };
    throw new Error(payload.message ?? payload.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({})) as { message?: string; error?: string };
    throw new Error(payload.message ?? payload.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({})) as { message?: string; error?: string };
    throw new Error(payload.message ?? payload.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
