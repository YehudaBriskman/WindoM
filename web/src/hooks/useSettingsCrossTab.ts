/**
 * Cross-tab settings sync for SettingsProvider: applies section writes made in
 * other tabs (via chrome.storage.onChanged), ordering concurrent writes by a
 * per-section timestamp stored alongside them in chrome.storage.sync.
 *
 * The timestamps order writes between tabs only; backend conflicts use the
 * server revision (lib/settings-sync.ts).
 */
import { useCallback, useEffect, useRef } from 'react';
import { syncStorage } from '../lib/chrome-storage';
import type { SetSettings } from '../lib/settings-store';

export const KEY_TIMESTAMPS_STORAGE_KEY = 'windom_key_timestamps';

export interface SettingsCrossTab {
  /** Read the stored per-section timestamps (once, on load). */
  loadStamps: () => Promise<void>;
  /** Stamp `sections` with one `Date.now()`; returns a copy of all stamps to persist. */
  stamp: (sections: string[]) => Record<string, number>;
  /** Forget every stamp (on reset). */
  clearStamps: () => void;
}

export function useSettingsCrossTab(setSettings: SetSettings): SettingsCrossTab {
  const keyTimestampsRef = useRef<Record<string, number>>({});

  const loadStamps = useCallback(async () => {
    keyTimestampsRef.current = await syncStorage.get(KEY_TIMESTAMPS_STORAGE_KEY, {} as Record<string, number>);
  }, []);

  const stamp = useCallback((sections: string[]) => {
    const now = Date.now();
    for (const k of sections) keyTimestampsRef.current[k] = now;
    return { ...keyTimestampsRef.current };
  }, []);

  const clearStamps = useCallback(() => {
    keyTimestampsRef.current = {};
  }, []);

  // Apply remote section updates, resolving conflicts via section-level timestamps
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
  }, [setSettings]);

  return { loadStamps, stamp, clearStamps };
}
