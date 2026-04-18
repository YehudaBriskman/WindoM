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
const KEY_TIMESTAMPS_STORAGE_KEY = 'windom_key_timestamps';

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
  // Accumulates only the keys that changed since the last backend push
  const pendingDeltaRef = useRef<Partial<Settings>>({});
  // Ref so async callbacks can read the latest settings without stale closures
  const settingsRef = useRef<Settings>({ ...defaultSettings });
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  // Per-key write timestamps — used to resolve same-key conflicts across tabs
  const keyTimestampsRef = useRef<Record<string, number>>({});

  // Debounced push to backend — accumulates changed keys and pushes only the delta.
  // Sending just the changed keys prevents a tab from overwriting another tab's
  // concurrent changes to different keys (last-write-wins blast radius reduced).
  const debouncedPush = useCallback((delta: Partial<Settings>) => {
    pendingDeltaRef.current = { ...pendingDeltaRef.current, ...delta };
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      const toSend = pendingDeltaRef.current;
      pendingDeltaRef.current = {};
      try {
        const token = await getAccessToken();
        if (token) await apiPut('/settings', withTimestamp(pickSyncable(toSend)));
      } catch (err) {
        console.error('[settings] Failed to push settings to backend:', err);
      }
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
      const { _updatedAt: _, ...rawBackendSettings } = data;
      // Strip unknown keys — only keep keys that exist in defaultSettings to prevent
      // a compromised or malformed backend response from injecting unknown state.
      const backendSettings = Object.fromEntries(
        Object.entries(rawBackendSettings).filter(([k]) => k in defaultSettings),
      ) as Partial<Settings>;
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
    } catch (err) {
      console.error('[settings] Backend sync failed — staying on local:', err);
    }
  }, []);

  // Load settings on mount, then attempt backend sync
  useEffect(() => {
    (async () => {
      const stored = await syncStorage.getMultiple(defaultSettings as unknown as Record<string, unknown>);
      const local = stored as unknown as Settings;
      setSettings(local);

      // Load per-key write timestamps for cross-tab conflict resolution
      keyTimestampsRef.current = await syncStorage.get(KEY_TIMESTAMPS_STORAGE_KEY, {} as Record<string, number>);

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
  // After sync, auto-populate userName from the auth name if it's still the default.
  useEffect(() => {
    const handler = async (e: Event) => {
      const authName = (e as CustomEvent<{ name?: string }>).detail?.name ?? '';
      await syncWithBackend(settingsRef.current, true);
      if (!authName) return;
      setSettings((s) => {
        if (s.userName !== defaultSettings.userName) return s;
        const firstName = authName.split(' ')[0];
        void syncStorage.set('userName', firstName);
        void setLocalUpdatedAt();
        return { ...s, userName: firstName };
      });
    };
    window.addEventListener('windom-auth-login', handler);
    return () => window.removeEventListener('windom-auth-login', handler);
  }, [syncWithBackend]);

  // Listen for cross-tab changes.
  // Per-key timestamps prevent a stale tab from silently overwriting a more
  // recent change made in another tab to the same key (last-write-wins removed).
  useEffect(() => {
    const unsub = syncStorage.onChange((changes) => {
      const remoteTimestamps = changes[KEY_TIMESTAMPS_STORAGE_KEY]?.newValue as Record<string, number> | undefined;

      // Determine which keys to apply before entering the state updater
      // so we can mutate keyTimestampsRef without side-effects inside a pure fn.
      const toApply: Record<string, unknown> = {};
      for (const [key, change] of Object.entries(changes)) {
        if (key === KEY_TIMESTAMPS_STORAGE_KEY) continue;
        const localTs = keyTimestampsRef.current[key] ?? 0;
        const remoteTs = remoteTimestamps?.[key] ?? 0;
        if (remoteTs >= localTs) {
          toApply[key] = change.newValue;
          keyTimestampsRef.current[key] = remoteTs;
        }
        // Remote is older than our local write — discard silently.
      }

      if (Object.keys(toApply).length === 0) return;

      setSettings((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(toApply)) {
          if (key in next) (next as Record<string, unknown>)[key] = value;
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
      keyTimestampsRef.current[key as string] = Date.now();
      setSettings((prev) => ({ ...prev, [key]: value }));
      debouncedPush({ [key]: value } as Partial<Settings>);
      await Promise.all([
        syncStorage.setMultiple({
          [key]: value,
          [KEY_TIMESTAMPS_STORAGE_KEY]: { ...keyTimestampsRef.current },
        } as Record<string, unknown>),
        setLocalUpdatedAt(),
      ]);
    },
    [debouncedPush],
  );

  const updateMultiple = useCallback(
    async (updates: Partial<Settings>) => {
      const now = Date.now();
      for (const k of Object.keys(updates)) keyTimestampsRef.current[k] = now;
      setSettings((prev) => ({ ...prev, ...updates }));
      debouncedPush(updates);
      await Promise.all([
        syncStorage.setMultiple({
          ...updates as Record<string, unknown>,
          [KEY_TIMESTAMPS_STORAGE_KEY]: { ...keyTimestampsRef.current },
        }),
        setLocalUpdatedAt(),
      ]);
    },
    [debouncedPush],
  );

  const reset = useCallback(async () => {
    keyTimestampsRef.current = {};
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
