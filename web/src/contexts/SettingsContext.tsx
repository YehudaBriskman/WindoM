import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { syncStorage, localStore } from '../lib/chrome-storage';
import { type Settings, defaultSettings } from '../types/settings';
import { loadLocalSettings } from '../lib/settings-load';
import { subscribeToStore, notifyStore, getStoreSnapshot, pickSyncable, type SetSettings } from '../lib/settings-store';
import { useSettingsBackendSync } from '../hooks/useSettingsBackendSync';
import { useSettingsCrossTab, KEY_TIMESTAMPS_STORAGE_KEY } from '../hooks/useSettingsCrossTab';

// SettingsProvider is the state container: it owns the settings state and the
// write paths (`update`, `updateMultiple`, `reset`). What happens around a write
// lives in focused pieces:
//   lib/settings-load.ts            reading storage on startup, legacy migration
//   lib/settings-store.ts           the snapshot behind useSettingsSection
//   hooks/useSettingsCrossTab.ts    other tabs' writes via chrome.storage.onChanged
//   hooks/useSettingsBackendSync.ts debounced push, reconcile on load, re-sync on login

interface SettingsContextValue {
  settings: Settings;
  loaded: boolean;
  get: <S extends keyof Settings>(section: S) => Settings[S];
  /**
   * Resolves `true` once the write reached chrome.storage, `false` when it did
   * not (quota exceeded, storage unavailable). The in-memory state is updated
   * either way, so a `false` means "shown but not persisted".
   */
  update: <S extends keyof Settings>(section: S, patch: Partial<Settings[S]>) => Promise<boolean>;
  /** Same contract as `update`: `false` when the storage write failed. */
  updateMultiple: (patches: Partial<Settings>) => Promise<boolean>;
  reset: () => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsRaw] = useState<Settings>({ ...defaultSettings });
  const [loaded, setLoaded] = useState(false);

  // Wrap the setter so the external store is always updated in the same tick.
  const setSettings = useCallback<SetSettings>((next) => {
    setSettingsRaw((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      notifyStore(resolved);
      return resolved;
    });
  }, []);
  const settingsRef = useRef<Settings>({ ...defaultSettings });
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const { syncWithBackend, queuePush, markUnsynced } = useSettingsBackendSync(setSettings, settingsRef);
  const { loadStamps, stamp, clearStamps } = useSettingsCrossTab(setSettings);

  // Load settings on mount, running legacy migration if needed
  useEffect(() => {
    (async () => {
      const local = await loadLocalSettings();

      setSettings(local);
      await loadStamps();

      const isFirstInstall = await syncStorage.get('isFirstInstall', true);
      if (isFirstInstall) {
        await syncStorage.setMultiple({ ...defaultSettings, isFirstInstall: false } as unknown as Record<
          string,
          unknown
        >);
      }

      setLoaded(true);
      await syncWithBackend(local);
    })();
  }, [syncWithBackend, setSettings, loadStamps]);

  const get = useCallback(<S extends keyof Settings>(section: S): Settings[S] => settings[section], [settings]);

  const update = useCallback(
    async <S extends keyof Settings>(section: S, patch: Partial<Settings[S]>): Promise<boolean> => {
      // Focus is device-local - store in chrome.storage.local only, never sync or backend
      if (section === 'focus') {
        const next = { ...(settingsRef.current.focus as object), ...(patch as object) } as Settings['focus'];
        setSettings((prev) => ({ ...prev, focus: next }));
        return localStore.set('windom_focus', next);
      }

      const stamps = stamp([section as string]);

      const mergedSection = { ...(settingsRef.current[section] as object), ...(patch as object) } as Settings[S];

      setSettings((prev) => ({
        ...prev,
        [section]: { ...(prev[section] as object), ...(patch as object) },
      }));

      queuePush({ [section]: mergedSection } as Partial<Settings>);

      const [saved] = await Promise.all([
        syncStorage.setMultiple({
          [section]: mergedSection,
          [KEY_TIMESTAMPS_STORAGE_KEY]: stamps,
        } as Record<string, unknown>),
        markUnsynced([section as string]),
      ]);
      return saved;
    },
    [queuePush, markUnsynced, stamp, setSettings],
  );

  const updateMultiple = useCallback(
    async (patches: Partial<Settings>): Promise<boolean> => {
      const stamps = stamp(Object.keys(patches));

      setSettings((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(patches)) {
          if (v && typeof v === 'object') {
            (next as Record<string, unknown>)[k] = {
              ...(prev as unknown as Record<string, object>)[k],
              ...(v as object),
            };
          }
        }
        return next;
      });

      const storageUpdate: Record<string, unknown> = {
        [KEY_TIMESTAMPS_STORAGE_KEY]: stamps,
      };
      for (const [k, v] of Object.entries(patches)) {
        if (v && typeof v === 'object') {
          storageUpdate[k] = {
            ...(settingsRef.current as unknown as Record<string, object>)[k],
            ...(v as object),
          };
        }
      }

      queuePush(patches);

      const [saved] = await Promise.all([syncStorage.setMultiple(storageUpdate), markUnsynced(Object.keys(patches))]);
      return saved;
    },
    [queuePush, markUnsynced, stamp, setSettings],
  );

  const reset = useCallback(async () => {
    clearStamps();
    setSettings({ ...defaultSettings });
    await syncStorage.clear();
    await syncStorage.setMultiple(defaultSettings as unknown as Record<string, unknown>);
    await localStore.set('windom_focus', defaultSettings.focus);
    // A reset is an edit like any other: the next sync uploads the defaults.
    await markUnsynced(Object.keys(pickSyncable(defaultSettings)));
  }, [clearStamps, setSettings, markUnsynced]);

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

/**
 * Subscribe to a single settings section. Only re-renders when that section's
 * object reference changes - unrelated section updates are invisible to this hook.
 * Use instead of `useSettings().settings[section]` in performance-sensitive components.
 */
export function useSettingsSection<S extends keyof Settings>(section: S): Settings[S] {
  return useSyncExternalStore(subscribeToStore, () => getStoreSnapshot()[section]);
}
