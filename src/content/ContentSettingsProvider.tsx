import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { syncStorage } from '../lib/chrome-storage';
import { type Settings, defaultSettings } from '../types/settings';
import { SettingsContext } from '../contexts/SettingsContext';

/** Read-only settings provider for content scripts — writes are no-ops */
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

  // No-op stubs — content scripts are read-only consumers of settings
  const update = useCallback(async <K extends keyof Settings>(_key: K, _value: Settings[K]) => {}, []);
  const updateMultiple = useCallback(async (_updates: Partial<Settings>) => {}, []);
  const reset = useCallback(async () => {}, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded, get, update, updateMultiple, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}
