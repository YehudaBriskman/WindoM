import { localStorage as chromeLocal } from './chrome-storage';

// Injected at build time via vite.config.ts define
declare const __BACKEND_URL__: string;
export const BASE_URL = typeof __BACKEND_URL__ !== 'undefined' ? __BACKEND_URL__ : 'http://localhost:8080';

const ACCESS_TOKEN_KEY = 'windom_access_token';

// ── Token storage (chrome.storage.local only — never sync) ─────────────────

export async function getAccessToken(): Promise<string | null> {
  return chromeLocal.get<string | null>(ACCESS_TOKEN_KEY, null);
}

export async function setAccessToken(token: string): Promise<void> {
  await chromeLocal.set(ACCESS_TOKEN_KEY, token);
}

export async function clearAccessToken(): Promise<void> {
  await chromeLocal.set(ACCESS_TOKEN_KEY, null);
}

// ── Refresh ─────────────────────────────────────────────────────────────────

let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      await clearAccessToken();
      return null;
    }
    const data = (await res.json()) as { accessToken: string };
    await setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

/** Refresh the access token exactly once even if called concurrently */
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

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401 && _retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch(path, options, false);
    }
    triggerLogout();
  }

  return res;
}

// ── Typed helpers ───────────────────────────────────────────────────────────

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: res.statusText }))) as { message?: string };
    throw new Error(err.message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}
