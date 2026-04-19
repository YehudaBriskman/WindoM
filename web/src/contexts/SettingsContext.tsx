import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { syncStorage } from '../lib/chrome-storage';
import { type Settings, defaultSettings } from '../types/settings';
import { migrateFlatToSectioned, isLegacySettings } from '../lib/migrateSettings';
import { getAccessToken, apiGet, apiPut } from '../lib/api';

// Sections excluded from backend sync (ephemeral / device-specific state)
const SYNC_EXCLUDE = new Set<keyof Settings>(['focus']);

const LOCAL_UPDATED_AT_KEY = 'windom_settings_updated_at';
const KEY_TIMESTAMPS_STORAGE_KEY = 'windom_key_timestamps';

function pickSyncable(s: Partial<Settings>): Partial<Settings> {
  return Object.fromEntries(
    Object.entries(s).filter(([k]) => !SYNC_EXCLUDE.has(k as keyof Settings)),
  ) as Partial<Settings>;
}

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
  get: <S extends keyof Settings>(section: S) => Settings[S];
  update: <S extends keyof Settings>(section: S, patch: Partial<Settings[S]>) => Promise<void>;
  updateMultiple: (patches: Partial<Settings>) => Promise<void>;
  reset: () => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({ ...defaultSettings });
  const [loaded, setLoaded] = useState(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDeltaRef = useRef<Partial<Settings>>({});
  const settingsRef = useRef<Settings>({ ...defaultSettings });
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  const keyTimestampsRef = useRef<Record<string, number>>({});

  // Debounced push to backend - accumulates changed sections and pushes only the delta.
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

  const syncWithBackend = useCallback(async (localSettings: Settings, backendWins = false) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const { data } = await apiGet<{ data: (Partial<Settings> & { _updatedAt?: number }) | null }>('/settings');

      if (!data || Object.keys(data).length === 0) {
        await apiPut('/settings', withTimestamp(pickSyncable(localSettings)));
        return;
      }

      const localUpdatedAt = await getLocalUpdatedAt();
      const backendUpdatedAt = data._updatedAt ?? 0;

      if (!backendWins && localUpdatedAt > backendUpdatedAt) {
        await apiPut('/settings', withTimestamp(pickSyncable(localSettings)));
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _updatedAt: _, ...rawBackendSettings } = data;
      const backendSettings = Object.fromEntries(
        Object.entries(rawBackendSettings).filter(([k]) => k in defaultSettings),
      ) as Partial<Settings>;

      // Deep-merge backend sections into local (backend wins on conflicts)
      const merged = { ...localSettings } as Settings;
      for (const [sectionKey, sectionVal] of Object.entries(backendSettings)) {
        if (sectionVal && typeof sectionVal === 'object' && sectionKey in merged) {
          const k = sectionKey as keyof Settings;
          if (!SYNC_EXCLUDE.has(k)) {
            (merged as unknown as Record<string, unknown>)[k] = {
              ...(localSettings as unknown as Record<string, object>)[k],
              ...(sectionVal as object),
            };
          }
        }
      }

      setSettings((prev) => {
        const result = { ...merged } as Settings;
        // Keep SYNC_EXCLUDE sections from current state (not from merged backend)
        for (const key of SYNC_EXCLUDE) {
          (result as unknown as Record<string, unknown>)[key] = prev[key];
        }
        return result;
      });

      const storable = Object.fromEntries(
        Object.entries(merged).filter(([k]) => !SYNC_EXCLUDE.has(k as keyof Settings)),
      );
      await syncStorage.setMultiple(storable as unknown as Record<string, unknown>);
    } catch (err) {
      console.error('[settings] Backend sync failed - staying on local:', err);
    }
  }, []);

  // Load settings on mount, running legacy migration if needed
  useEffect(() => {
    (async () => {
      let raw: Record<string, unknown>;
      try {
        raw = await chrome.storage.sync.get(null) as Record<string, unknown>;
      } catch {
        raw = {};
      }

      let local: Settings;
      if (isLegacySettings(raw)) {
        // Legacy v1 flat shape detected - migrate and rewrite storage as sectioned
        local = migrateFlatToSectioned(raw);
        await chrome.storage.sync.clear();
        await syncStorage.setMultiple(local as unknown as Record<string, unknown>);
      } else {
        const stored = await syncStorage.getMultiple(defaultSettings as unknown as Record<string, unknown>);
        local = stored as unknown as Settings;
      }

      setSettings(local);
      keyTimestampsRef.current = await syncStorage.get(KEY_TIMESTAMPS_STORAGE_KEY, {} as Record<string, number>);

      const isFirstInstall = await syncStorage.get('isFirstInstall', true);
      if (isFirstInstall) {
        await syncStorage.setMultiple({ ...defaultSettings, isFirstInstall: false } as unknown as Record<string, unknown>);
      }

      setLoaded(true);
      await syncWithBackend(local);
    })();
  }, [syncWithBackend]);

  // Re-sync on login - backend always wins to overwrite local state with account's settings
  useEffect(() => {
    const handler = async (e: Event) => {
      const authName = (e as CustomEvent<{ name?: string }>).detail?.name ?? '';
      await syncWithBackend(settingsRef.current, true);
      if (!authName) return;
      setSettings((s) => {
        if (s.general.userName !== defaultSettings.general.userName) return s;
        const firstName = authName.split(' ')[0];
        void syncStorage.set('general', { ...s.general, userName: firstName });
        void setLocalUpdatedAt();
        return { ...s, general: { ...s.general, userName: firstName } };
      });
    };
    window.addEventListener('windom-auth-login', handler);
    return () => window.removeEventListener('windom-auth-login', handler);
  }, [syncWithBackend]);

  // Cross-tab sync: apply remote section updates, resolving conflicts via section-level timestamps
  useEffect(() => {
    const unsub = syncStorage.onChange((changes) => {
      const remoteTimestamps = changes[KEY_TIMESTAMPS_STORAGE_KEY]?.newValue as Record<string, number> | undefined;

      const toApply: Record<string, unknown> = {};
      for (const [key, change] of Object.entries(changes)) {
        if (key === KEY_TIMESTAMPS_STORAGE_KEY) continue;
        const localTs = keyTimestampsRef.current[key] ?? 0;
        const remoteTs = remoteTimestamps?.[key] ?? 0;
        if (remoteTs >= localTs) {
          toApply[key] = change.newValue;
          keyTimestampsRef.current[key] = remoteTs;
        }
      }

      if (Object.keys(toApply).length === 0) return;

      setSettings((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(toApply)) {
          if (key in next && value && typeof value === 'object') {
            (next as Record<string, unknown>)[key] = {
              ...((prev as unknown as Record<string, object>)[key]),
              ...(value as object),
            };
          }
        }
        return next;
      });
    });
    return unsub;
  }, []);

  const get = useCallback(
    <S extends keyof Settings>(section: S): Settings[S] => settings[section],
    [settings],
  );

  const update = useCallback(
    async <S extends keyof Settings>(section: S, patch: Partial<Settings[S]>) => {
      keyTimestampsRef.current[section as string] = Date.now();

      const mergedSection = { ...(settingsRef.current[section] as object), ...(patch as object) } as Settings[S];

      setSettings((prev) => ({
        ...prev,
        [section]: { ...(prev[section] as object), ...(patch as object) },
      }));

      debouncedPush({ [section]: mergedSection } as Partial<Settings>);

      await Promise.all([
        syncStorage.setMultiple({
          [section]: mergedSection,
          [KEY_TIMESTAMPS_STORAGE_KEY]: { ...keyTimestampsRef.current },
        } as Record<string, unknown>),
        setLocalUpdatedAt(),
      ]);
    },
    [debouncedPush],
  );

  const updateMultiple = useCallback(
    async (patches: Partial<Settings>) => {
      const now = Date.now();
      for (const k of Object.keys(patches)) keyTimestampsRef.current[k] = now;

      setSettings((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(patches)) {
          if (v && typeof v === 'object') {
            (next as Record<string, unknown>)[k] = {
              ...((prev as unknown as Record<string, object>)[k]),
              ...(v as object),
            };
          }
        }
        return next;
      });

      const storageUpdate: Record<string, unknown> = {
        [KEY_TIMESTAMPS_STORAGE_KEY]: { ...keyTimestampsRef.current },
      };
      for (const [k, v] of Object.entries(patches)) {
        if (v && typeof v === 'object') {
          storageUpdate[k] = {
            ...((settingsRef.current as unknown as Record<string, object>)[k]),
            ...(v as object),
          };
        }
      }

      debouncedPush(patches);

      await Promise.all([
        syncStorage.setMultiple(storageUpdate),
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
