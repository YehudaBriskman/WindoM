/**
 * Settings <-> backend sync for SettingsProvider: the debounced push of edited
 * sections, the reconcile on load, and the backend-wins re-sync on login.
 *
 * Who wins is decided by the server's revision (see lib/settings-sync.ts),
 * never by comparing this device's clock with it.
 */
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { syncStorage } from '../lib/chrome-storage';
import { type Settings, defaultSettings } from '../types/settings';
import { getAccessToken, apiGet, apiPut } from '../lib/api';
import {
  type DirtyMap,
  type ServerRev,
  type SettingsResponse,
  planSync,
  revisionAfterPush,
  getBaseRev,
  setBaseRev,
  getDirty,
  markDirty,
  clearDirty,
  clearAllDirty,
  getLegacyLocalUpdatedAt,
} from '../lib/settings-sync';
import { SYNC_EXCLUDE, pickSyncable, pickSections, type SetSettings } from '../lib/settings-store';
import { stripSecrets, stripSectionSecrets } from '../lib/secret-settings';
import { createLogger } from '../lib/logger';

const log = createLogger('settings');

const PUSH_DEBOUNCE_MS = 5000;

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

export interface SettingsBackendSync {
  /** Reconcile `localSettings` with the backend; `backendWins` on login. */
  syncWithBackend: (localSettings: Settings, backendWins?: boolean) => Promise<void>;
  /** Queue sections for the debounced upload. */
  queuePush: (delta: Partial<Settings>) => void;
  /** Record sections as edited here and not yet acknowledged by the server. */
  markUnsynced: (sections: string[]) => Promise<void>;
}

export function useSettingsBackendSync(
  setSettings: SetSettings,
  settingsRef: RefObject<Settings>,
): SettingsBackendSync {
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDeltaRef = useRef<Partial<Settings>>({});

  // Debounced push to backend - accumulates changed sections and pushes only the delta.
  // A push that never happens (tab closed, offline) leaves its sections dirty, and
  // the next load pushes them.
  const queuePush = useCallback((delta: Partial<Settings>) => {
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
    }, PUSH_DEBOUNCE_MS);
  }, []);

  const markUnsynced = useCallback(
    (sections: string[]) => markDirty(sections.filter((k) => !SYNC_EXCLUDE.has(k as keyof Settings))),
    [],
  );

  const syncWithBackend = useCallback(
    async (localSettings: Settings, backendWins = false) => {
      try {
        const token = await getAccessToken();
        if (!token) return;

        const res = await apiGet<SettingsResponse<Partial<Settings> & { _updatedAt?: number }>>('/settings');
        const data = res.data;
        const serverRev = res.updatedAt;
        const syncableSections = Object.keys(pickSyncable(localSettings));
        const [baseRev, dirty, legacyLocalUpdatedAt] = await Promise.all([
          getBaseRev(),
          getDirty(),
          getLegacyLocalUpdatedAt(),
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
            await pushSections(
              pickSections(localSettings, dirtySections),
              serverRev,
              pickSections(dirty, dirtySections) as DirtyMap,
            );
          }
          return;
        }

        // pull: adopt the server copy, except the sections this device must keep.
        const keepLocal = new Set(plan.keepLocal);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _updatedAt: _, ...rawBackendSettings } = data ?? {};
        const backendSettings = Object.fromEntries(
          Object.entries(rawBackendSettings)
            .filter(([k]) => k in defaultSettings)
            .map(([k, v]) => [k, stripSectionSecrets(k, v)]), // an old server copy must not overwrite the local key
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

        const storable = stripSecrets(
          Object.fromEntries(Object.entries(merged).filter(([k]) => !SYNC_EXCLUDE.has(k as keyof Settings))),
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
    },
    [setSettings],
  );

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
  }, [syncWithBackend, setSettings, settingsRef]);

  return { syncWithBackend, queuePush, markUnsynced };
}
