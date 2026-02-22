import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { syncStorage } from '../lib/chrome-storage';
import { type Settings, defaultSettings } from '../types/settings';
import { SettingsContext } from '../contexts/SettingsContext';

/** Settings provider for content scripts — reads and writes via chrome.storage.sync */
export function ContentSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({ ...defaultSettings });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await syncStorage.getMultiple(defaultSettings as unknown as Record<string, unknown>);
      setSettings(stored as unknown as Settings);
      setLoaded(true);
    })();
  }, []);

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

  const update = useCallback(async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    await syncStorage.set(key as string, value);
  }, []);

  const updateMultiple = useCallback(async (updates: Partial<Settings>) => {
    await syncStorage.setMultiple(updates as Record<string, unknown>);
  }, []);

  // Resetting to defaults from a content script is intentionally a no-op.
  const reset = useCallback(async () => {}, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded, get, update, updateMultiple, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}
