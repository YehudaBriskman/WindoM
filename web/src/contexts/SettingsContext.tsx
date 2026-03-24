import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { syncStorage } from '../lib/chrome-storage';
import { type Settings, defaultSettings } from '../types/settings';
import { getAccessToken, apiGet, apiPut } from '../lib/api';

// These fields are ephemeral or device-specific — never synced to backend
const SYNC_EXCLUDE = new Set<keyof Settings>([
  'localBackground',   // device file / potentially huge data URL
  'mainFocus',         // ephemeral daily state
  'focusCompleted',    // ephemeral daily state
  'calendarConnected', // derived from OAuth, not a user setting
  'spotifyConnected',  // derived from OAuth, not a user setting
]);

const LOCAL_UPDATED_AT_KEY = 'windom_settings_updated_at';

function pickSyncable(s: Partial<Settings>): Partial<Settings> {
  return Object.fromEntries(
    Object.entries(s).filter(([k]) => !SYNC_EXCLUDE.has(k as keyof Settings)),
  ) as Partial<Settings>;
}

/** Attach a timestamp to every backend push so sync can detect which side is newer. */
function withTimestamp(s: Partial<Settings>): Partial<Settings> & { _updatedAt: number } {
  return { ...s, _updatedAt: Date.now() };
}

async function getLocalUpdatedAt(): Promise<number> {
  try {
    const result = await chrome.storage.local.get([LOCAL_UPDATED_AT_KEY]);
    return (result[LOCAL_UPDATED_AT_KEY] as number | undefined) ?? 0;
  } catch { return 0; }
}

async function setLocalUpdatedAt(): Promise<void> {
  try {
    await chrome.storage.local.set({ [LOCAL_UPDATED_AT_KEY]: Date.now() });
  } catch { /* best-effort */ }
}

interface SettingsContextValue {
  settings: Settings;
  loaded: boolean;
  get: <K extends keyof Settings>(key: K) => Settings[K];
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  updateMultiple: (updates: Partial<Settings>) => Promise<void>;
  reset: () => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({ ...defaultSettings });
  const [loaded, setLoaded] = useState(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced push to backend — resets the 5s timer on every change
  const debouncedPush = useCallback((data: Partial<Settings>) => {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      try {
        const token = await getAccessToken();
        if (token) await apiPut('/settings', withTimestamp(pickSyncable(data)));
      } catch { /* best-effort */ }
    }, 5000);
  }, []);

  // Sync with backend: fetch remote settings and merge intelligently.
  // - If backend has no data: push local to bootstrap the account.
  // - backendWins=false (background sync): timestamp comparison — local wins if it's newer.
  // - backendWins=true (sign-in event): backend always wins, overwriting local regardless of timestamps.
  const syncWithBackend = useCallback(async (localSettings: Settings, backendWins = false) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const { data } = await apiGet<{ data: (Partial<Settings> & { _updatedAt?: number }) | null }>('/settings');

      if (!data || Object.keys(data).length === 0) {
        // New account — push existing local settings to bootstrap
        await apiPut('/settings', withTimestamp(pickSyncable(localSettings)));
        return;
      }

      const localUpdatedAt = await getLocalUpdatedAt();
      const backendUpdatedAt = data._updatedAt ?? 0;

      if (!backendWins && localUpdatedAt > backendUpdatedAt) {
        // Background sync: local changes are newer — push local to backend, keep local state
        await apiPut('/settings', withTimestamp(pickSyncable(localSettings)));
        return;
      }

      // Backend wins — apply to local (either forced by sign-in, or backend is genuinely newer)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _updatedAt: _, ...backendSettings } = data;
      const merged = { ...localSettings, ...backendSettings };
      // Server-derived keys (SYNC_EXCLUDE) are not in backendSettings, but they
      // ARE in localSettings which may be stale. Use the current React state for
      // these keys so a concurrent useIntegrationSync update is never clobbered.
      setSettings((prev) => {
        const result = { ...merged } as Settings;
        for (const key of SYNC_EXCLUDE) (result as unknown as Record<string, unknown>)[key] = prev[key];
        return result;
      });
      // Don't write server-derived keys back to storage via this path
      const storable = Object.fromEntries(
        Object.entries(merged).filter(([k]) => !SYNC_EXCLUDE.has(k as keyof Settings)),
      );
      await syncStorage.setMultiple(storable as unknown as Record<string, unknown>);
    } catch { /* backend unreachable — stay on local */ }
  }, []);

  // Load settings on mount, then attempt backend sync
  useEffect(() => {
    (async () => {
      const stored = await syncStorage.getMultiple(defaultSettings as unknown as Record<string, unknown>);
      const local = stored as unknown as Settings;
      setSettings(local);

      // First install check
      const isFirstInstall = await syncStorage.get('isFirstInstall', true);
      if (isFirstInstall) {
        await syncStorage.setMultiple({ ...defaultSettings, isFirstInstall: false } as unknown as Record<string, unknown>);
      }

      setLoaded(true);
      await syncWithBackend(local);
    })();
  }, [syncWithBackend]);

  // Re-sync when user logs in — backend always wins so the account's saved settings
  // overwrite whatever was in local storage on this device.
  useEffect(() => {
    const handler = () => {
      setSettings((current) => {
        syncWithBackend(current, true);
        return current;
      });
    };
    window.addEventListener('windom-auth-login', handler);
    return () => window.removeEventListener('windom-auth-login', handler);
  }, [syncWithBackend]);

  // Listen for cross-tab changes
  useEffect(() => {
    const unsub = syncStorage.onChange((changes) => {
      setSettings((prev) => {
        const next = { ...prev };
        for (const [key, change] of Object.entries(changes)) {
          if (key in next) {
            (next as Record<string, unknown>)[key] = change.newValue;
          }
        }
        return next;
      });
    });
    return unsub;
  }, []);

  const get = useCallback(
    <K extends keyof Settings>(key: K): Settings[K] => settings[key],
    [settings],
  );

  const update = useCallback(
    async <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        debouncedPush(next);
        return next;
      });
      await Promise.all([
        syncStorage.set(key, value),
        setLocalUpdatedAt(),
      ]);
    },
    [debouncedPush],
  );

  const updateMultiple = useCallback(
    async (updates: Partial<Settings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates };
        debouncedPush(next);
        return next;
      });
      await Promise.all([
        syncStorage.setMultiple(updates as unknown as Record<string, unknown>),
        setLocalUpdatedAt(),
      ]);
    },
    [debouncedPush],
  );

  const reset = useCallback(async () => {
    setSettings({ ...defaultSettings });
    await syncStorage.clear();
    await syncStorage.setMultiple(defaultSettings as unknown as Record<string, unknown>);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded, get, update, updateMultiple, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
