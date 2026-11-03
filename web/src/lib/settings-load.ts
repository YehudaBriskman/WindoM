/**
 * Read this device's settings from chrome storage on startup: run the legacy
 * v1 -> v2 migration when needed, otherwise deep-merge what is stored with the
 * defaults. Focus is device-local and comes from chrome.storage.local.
 */
import { syncStorage, localStore } from './chrome-storage';
import { type Settings, defaultSettings } from '../types/settings';
import { migrateFlatToSectioned, isLegacySettings } from './migrateSettings';
import { createLogger } from './logger';

const log = createLogger('settings');

function isPlainObject(value: unknown): value is object {
  return value !== undefined && value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep-merge each stored section (2 levels) with defaults so new fields added after
 * the user's last save are not lost when a stored section object replaces the default
 * entirely.
 */
export function mergeWithDefaults(stored: Record<string, unknown>): Settings {
  const local = { ...(stored as unknown as Settings) };
  for (const key of Object.keys(defaultSettings) as (keyof Settings)[]) {
    const storedVal = stored[key as string];
    const defaultVal = defaultSettings[key];
    if (isPlainObject(storedVal) && isPlainObject(defaultVal)) {
      const defaultMap = defaultVal as unknown as Record<string, unknown>;
      const storedMap = storedVal as unknown as Record<string, unknown>;
      const sectionMerged: Record<string, unknown> = { ...defaultMap, ...storedMap };
      // Second pass: merge any nested objects within the section (e.g. integrations.spotify)
      for (const subKey of Object.keys(defaultMap)) {
        const subDefault = defaultMap[subKey];
        const subStored = storedMap[subKey];
        if (isPlainObject(subStored) && isPlainObject(subDefault)) {
          sectionMerged[subKey] = { ...subDefault, ...subStored };
        }
      }
      (local as unknown as Record<string, unknown>)[key as string] = sectionMerged;
    }
  }
  return local;
}

export async function loadLocalSettings(): Promise<Settings> {
  let raw: Record<string, unknown>;
  try {
    raw = (await chrome.storage.sync.get(null)) as Record<string, unknown>;
  } catch (err) {
    // Fall back to defaults rather than leave the new tab blank.
    log.error('Could not read chrome.storage.sync - loading defaults:', err);
    raw = {};
  }

  if (isLegacySettings(raw)) {
    // Legacy v1 flat shape detected - migrate and rewrite storage as sectioned
    const local = migrateFlatToSectioned(raw);
    const { focus: migratedFocus, ...localWithoutFocus } = local;
    await chrome.storage.sync.clear();
    await syncStorage.setMultiple(localWithoutFocus as unknown as Record<string, unknown>);
    await localStore.set('windom_focus', migratedFocus);
    return local;
  }

  const stored = await syncStorage.getMultiple(defaultSettings as unknown as Record<string, unknown>);
  const local = mergeWithDefaults(stored as Record<string, unknown>);
  // Focus is device-local - load from chrome.storage.local, not sync
  const focusData = await localStore.get<Settings['focus']>('windom_focus', defaultSettings.focus);
  return { ...local, focus: focusData };
}
