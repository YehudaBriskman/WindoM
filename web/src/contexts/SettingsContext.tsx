import { createContext, useContext, useState, useEffect, useCallback, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { syncStorage, localStore } from '../lib/chrome-storage';
import { type Settings, defaultSettings } from '../types/settings';
import { migrateFlatToSectioned, isLegacySettings } from '../lib/migrateSettings';
import { getAccessToken, apiGet, apiPut } from '../lib/api';
import {
  type DirtyMap, type ServerRev, type SettingsResponse,
  planSync, revisionAfterPush, getBaseRev, setBaseRev, getDirty, markDirty, clearDirty,
  clearAllDirty, getLegacyLocalUpdatedAt,
} from '../lib/settings-sync';
import { createLogger } from '../lib/logger';

const log = createLogger('settings');

// ── External store for per-section subscriptions ──────────────────────────
// Holds a mutable snapshot of the current settings so useSyncExternalStore
// consumers can subscribe to individual sections without re-rendering on
// unrelated section changes. The Provider updates this alongside its own
// useState so both stay in sync.

type StoreListener = () => void;
const storeListeners = new Set<StoreListener>();
let storeSnapshot: Settings = { ...defaultSettings };

function subscribeToStore(listener: StoreListener): () => void {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
}

function notifyStore(next: Settings): void {
  storeSnapshot = next;
  for (const l of storeListeners) l();
}

// ── Settings sections excluded from backend sync ───────────────────────────
// Sections excluded from backend sync (ephemeral / device-specific state)
const SYNC_EXCLUDE = new Set<keyof Settings>(['focus']);

const KEY_TIMESTAMPS_STORAGE_KEY = 'windom_key_timestamps';

function pickSyncable(s: Partial<Settings>): Partial<Settings> {
  return Object.fromEntries(
    Object.entries(s).filter(([k]) => !SYNC_EXCLUDE.has(k as keyof Settings)),
  ) as Partial<Settings>;
}

function pickSections<T extends object>(source: T, keys: string[]): Partial<T> {
  const src = source as Record<string, unknown>;
  return Object.fromEntries(keys.filter((k) => k in src).map((k) => [k, src[k]])) as Partial<T>;
}

/**
 * Upload sections and, when the server confirms nothing else landed in between,
 * record its new revision. `sent` is the dirty-map snapshot for these sections.
 */
async function pushSections(
  sections: Partial<Settings>,
  expectedBase: ServerRev | undefined,
  sent: DirtyMap,
): Promise<void> {
  const res = await apiPut<SettingsResponse<Partial<Settings>>>('/settings', pickSyncable(sections));
  const rev = revisionAfterPush(expectedBase, res);
  if (rev !== undefined) await setBaseRev(rev);
  await clearDirty(sent);
}

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
  const setSettings = useCallback((next: Settings | ((prev: Settings) => Settings)) => {
    setSettingsRaw((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      notifyStore(resolved);
      return resolved;
    });
  }, []);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDeltaRef = useRef<Partial<Settings>>({});
  const settingsRef = useRef<Settings>({ ...defaultSettings });
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  const keyTimestampsRef = useRef<Record<string, number>>({});

  // Debounced push to backend - accumulates changed sections and pushes only the delta.
  // A push that never happens (tab closed, offline) leaves its sections dirty, and
  // the next load pushes them.
  const debouncedPush = useCallback((delta: Partial<Settings>) => {
    pendingDeltaRef.current = { ...pendingDeltaRef.current, ...delta };
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      const toSend = pickSyncable(pendingDeltaRef.current);
      pendingDeltaRef.current = {};
      if (Object.keys(toSend).length === 0) return;
      try {
        const token = await getAccessToken();
        if (!token) return;
        const [base, dirty] = await Promise.all([getBaseRev(), getDirty()]);
        await pushSections(toSend, base, pickSections(dirty, Object.keys(toSend)) as DirtyMap);
      } catch (err) {
        log.error('Failed to push settings to backend:', err);
      }
    }, 5000);
  }, []);

  /**
   * Reconcile with the backend. Who wins is decided by the server's revision
   * (see lib/settings-sync.ts), never by comparing this device's clock with it.
   */
  const syncWithBackend = useCallback(async (localSettings: Settings, backendWins = false) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const res = await apiGet<SettingsResponse<Partial<Settings> & { _updatedAt?: number }>>('/settings');
      const data = res.data;
      const serverRev = res.updatedAt;
      const syncableSections = Object.keys(pickSyncable(localSettings));
      const [baseRev, dirty, legacyLocalUpdatedAt] = await Promise.all([
        getBaseRev(), getDirty(), getLegacyLocalUpdatedAt(),
      ]);
      const dirtySections = Object.keys(dirty).filter((k) => syncableSections.includes(k));

      const plan = planSync({
        backendEmpty: !data || Object.keys(data).length === 0,
        backendWins,
        serverRev,
        baseRev,
        dirtySections,
        legacyLocalUpdatedAt,
        syncableSections,
      });

      if (plan.kind === 'push-all') {
        await pushSections(pickSyncable(localSettings), serverRev ?? null, dirty);
        return;
      }

      if (plan.kind === 'push-dirty') {
        if (dirtySections.length > 0) {
          await pushSections(pickSections(localSettings, dirtySections), serverRev, pickSections(dirty, dirtySections) as DirtyMap);
        }
        return;
      }

      // pull: adopt the server copy, except the sections this device must keep.
      const keepLocal = new Set(plan.keepLocal);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _updatedAt: _, ...rawBackendSettings } = data ?? {};
      const backendSettings = Object.fromEntries(
        Object.entries(rawBackendSettings).filter(([k]) => k in defaultSettings),
      ) as Partial<Settings>;

      // Deep-merge backend sections into local (backend wins on conflicts)
      const merged = { ...localSettings } as Settings;
      for (const [sectionKey, sectionVal] of Object.entries(backendSettings)) {
        if (sectionVal && typeof sectionVal === 'object' && sectionKey in merged) {
          const k = sectionKey as keyof Settings;
          if (!SYNC_EXCLUDE.has(k) && !keepLocal.has(sectionKey)) {
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

      // We have now seen everything up to serverRev.
      if (typeof serverRev === 'number') await setBaseRev(serverRev);
      if (backendWins) await clearAllDirty();

      if (keepLocal.size > 0) {
        const keys = [...keepLocal];
        await pushSections(pickSections(localSettings, keys), serverRev, pickSections(dirty, keys) as DirtyMap);
      }
    } catch (err) {
      log.warn('Backend sync failed - staying on local:', err);
    }
  }, [setSettings]);

  // Load settings on mount, running legacy migration if needed
  useEffect(() => {
    (async () => {
      let raw: Record<string, unknown>;
      try {
        raw = await chrome.storage.sync.get(null) as Record<string, unknown>;
      } catch (err) {
        // Fall back to defaults rather than leave the new tab blank.
        log.error('Could not read chrome.storage.sync - loading defaults:', err);
        raw = {};
      }

      let local: Settings;
      if (isLegacySettings(raw)) {
        // Legacy v1 flat shape detected - migrate and rewrite storage as sectioned
        local = migrateFlatToSectioned(raw);
        const { focus: migratedFocus, ...localWithoutFocus } = local;
        await chrome.storage.sync.clear();
        await syncStorage.setMultiple(localWithoutFocus as unknown as Record<string, unknown>);
        await localStore.set('windom_focus', migratedFocus);
      } else {
        const stored = await syncStorage.getMultiple(defaultSettings as unknown as Record<string, unknown>);
        // Deep-merge each section (2 levels) with defaults so new fields added after the user's
        // last save are not lost when a stored section object replaces the default entirely.
        local = { ...(stored as unknown as Settings) };
        for (const key of Object.keys(defaultSettings) as (keyof Settings)[]) {
          const storedVal = (stored as Record<string, unknown>)[key as string];
          const defaultVal = defaultSettings[key];
          if (
            storedVal !== undefined &&
            storedVal !== null &&
            typeof storedVal === 'object' &&
            !Array.isArray(storedVal) &&
            defaultVal !== null &&
            typeof defaultVal === 'object' &&
            !Array.isArray(defaultVal)
          ) {
            const defaultMap = defaultVal as unknown as Record<string, unknown>;
            const storedMap  = storedVal  as unknown as Record<string, unknown>;
            const sectionMerged: Record<string, unknown> = { ...defaultMap, ...storedMap };
            // Second pass: merge any nested objects within the section (e.g. integrations.spotify)
            for (const subKey of Object.keys(defaultMap)) {
              const subDefault = defaultMap[subKey];
              const subStored  = storedMap[subKey];
              if (
                subStored !== undefined &&
                subStored !== null &&
                typeof subStored === 'object' &&
                !Array.isArray(subStored) &&
                subDefault !== null &&
                typeof subDefault === 'object' &&
                !Array.isArray(subDefault)
              ) {
                sectionMerged[subKey] = { ...(subDefault as object), ...(subStored as object) };
              }
            }
            (local as unknown as Record<string, unknown>)[key as string] = sectionMerged;
          }
        }
        // Focus is device-local - load from chrome.storage.local, not sync
        const focusData = await localStore.get<Settings['focus']>('windom_focus', defaultSettings.focus);
        local = { ...local, focus: focusData };
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
        void markDirty(['general']);
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
    async <S extends keyof Settings>(section: S, patch: Partial<Settings[S]>): Promise<boolean> => {
      // Focus is device-local - store in chrome.storage.local only, never sync or backend
      if (section === 'focus') {
        const next = { ...(settingsRef.current.focus as object), ...(patch as object) } as Settings['focus'];
        setSettings(prev => ({ ...prev, focus: next }));
        return localStore.set('windom_focus', next);
      }

      // Orders writes between tabs only; backend conflicts use the server revision.
      keyTimestampsRef.current[section as string] = Date.now();

      const mergedSection = { ...(settingsRef.current[section] as object), ...(patch as object) } as Settings[S];

      setSettings((prev) => ({
        ...prev,
        [section]: { ...(prev[section] as object), ...(patch as object) },
      }));

      debouncedPush({ [section]: mergedSection } as Partial<Settings>);

      const [saved] = await Promise.all([
        syncStorage.setMultiple({
          [section]: mergedSection,
          [KEY_TIMESTAMPS_STORAGE_KEY]: { ...keyTimestampsRef.current },
        } as Record<string, unknown>),
        markDirty([section as string]),
      ]);
      return saved;
    },
    [debouncedPush],
  );

  const updateMultiple = useCallback(
    async (patches: Partial<Settings>): Promise<boolean> => {
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

      const [saved] = await Promise.all([
        syncStorage.setMultiple(storageUpdate),
        markDirty(Object.keys(pickSyncable(patches))),
      ]);
      return saved;
    },
    [debouncedPush],
  );

  const reset = useCallback(async () => {
    keyTimestampsRef.current = {};
    setSettings({ ...defaultSettings });
    await syncStorage.clear();
    await syncStorage.setMultiple(defaultSettings as unknown as Record<string, unknown>);
    await localStore.set('windom_focus', defaultSettings.focus);
    // A reset is an edit like any other: the next sync uploads the defaults.
    await markDirty(Object.keys(pickSyncable(defaultSettings)));
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

/**
 * Subscribe to a single settings section. Only re-renders when that section's
 * object reference changes - unrelated section updates are invisible to this hook.
 * Use instead of `useSettings().settings[section]` in performance-sensitive components.
 */
export function useSettingsSection<S extends keyof Settings>(section: S): Settings[S] {
  return useSyncExternalStore(
    subscribeToStore,
    () => storeSnapshot[section],
  );
}
