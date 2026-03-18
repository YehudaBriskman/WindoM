import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { syncStorage } from '../lib/chrome-storage';
import { type Settings, defaultSettings } from '../types/settings';

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

  // Load settings on mount
  useEffect(() => {
    (async () => {
      const stored = await syncStorage.getMultiple(defaultSettings as unknown as Record<string, unknown>);
      setSettings(stored as unknown as Settings);

      // First install check
      const isFirstInstall = await syncStorage.get('isFirstInstall', true);
      if (isFirstInstall) {
        await syncStorage.setMultiple({ ...defaultSettings, isFirstInstall: false } as unknown as Record<string, unknown>);
      }

      setLoaded(true);
    })();
  }, []);

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
      setSettings((prev) => ({ ...prev, [key]: value }));
      await syncStorage.set(key, value);
    },
    [],
  );

  const updateMultiple = useCallback(
    async (updates: Partial<Settings>) => {
      setSettings((prev) => ({ ...prev, ...updates }));
      await syncStorage.setMultiple(updates as unknown as Record<string, unknown>);
    },
    [],
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
