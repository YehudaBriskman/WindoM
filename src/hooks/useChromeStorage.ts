import { useState, useEffect, useCallback } from 'react';
import { syncStorage } from '../lib/chrome-storage';

/**
 * React hook for syncing state with chrome.storage.sync.
 * Listens for cross-tab changes automatically.
 */
export function useChromeStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  // Load initial value
  useEffect(() => {
    syncStorage.get(key, defaultValue).then((stored) => {
      setValue(stored);
      setLoaded(true);
    });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for cross-tab changes
  useEffect(() => {
    const unsub = syncStorage.onChange((changes) => {
      if (changes[key]) {
        setValue(changes[key].newValue as T);
      }
    });
    return unsub;
  }, [key]);

  const update = useCallback(
    async (newValue: T) => {
      setValue(newValue);
      await syncStorage.set(key, newValue);
    },
    [key],
  );

  return [value, update, loaded] as const;
}
