import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { syncStorage } from '../lib/chrome-storage';
import { type Settings, defaultSettings } from '../types/settings';
import { migrateFlatToSectioned, isLegacySettings } from '../lib/migrateSettings';
import { SettingsContext } from '../contexts/SettingsContext';

/** Settings provider for content scripts - reads and writes via chrome.storage.sync */
export function ContentSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({ ...defaultSettings });
  const [loaded, setLoaded] = useState(false);

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
        local = migrateFlatToSectioned(raw);
      } else {
        const stored = await syncStorage.getMultiple(defaultSettings as unknown as Record<string, unknown>);
        local = stored as unknown as Settings;
      }

      setSettings(local);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    const unsub = syncStorage.onChange((changes) => {
      setSettings((prev) => {
        const next = { ...prev };
        for (const [key, change] of Object.entries(changes)) {
          if (key in next && change.newValue && typeof change.newValue === 'object') {
            (next as Record<string, unknown>)[key] = {
              ...((prev as unknown as Record<string, object>)[key]),
              ...(change.newValue as object),
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

  const update = useCallback(async <S extends keyof Settings>(section: S, patch: Partial<Settings[S]>) => {
    const merged = { ...(settings[section] as object), ...(patch as object) } as Settings[S];
    await syncStorage.set(section as string, merged);
  }, [settings]);

  const updateMultiple = useCallback(async (patches: Partial<Settings>) => {
    const storageUpdate: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patches)) {
      if (v && typeof v === 'object') {
        storageUpdate[k] = { ...((settings as unknown as Record<string, object>)[k]), ...(v as object) };
      }
    }
    await syncStorage.setMultiple(storageUpdate);
  }, [settings]);

  const reset = useCallback(async () => {}, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded, get, update, updateMultiple, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}
