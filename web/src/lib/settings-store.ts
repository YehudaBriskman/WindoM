/**
 * Module-level snapshot of the current settings, for `useSettingsSection`.
 *
 * useSyncExternalStore consumers subscribe to individual sections through it
 * without re-rendering on unrelated section changes. SettingsProvider writes it
 * in the same tick as its own state (see `setSettings` there), so both agree.
 */
import { type Settings, defaultSettings } from '../types/settings';
import { stripSecrets } from './secret-settings';

type StoreListener = () => void;
const storeListeners = new Set<StoreListener>();
let storeSnapshot: Settings = { ...defaultSettings };

export function subscribeToStore(listener: StoreListener): () => void {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
}

export function notifyStore(next: Settings): void {
  storeSnapshot = next;
  for (const l of storeListeners) l();
}

export function getStoreSnapshot(): Settings {
  return storeSnapshot;
}

// ── Which sections reach the backend ─────────────────────────────────────────

/** Sections excluded from backend sync (ephemeral / device-specific state). */
export const SYNC_EXCLUDE = new Set<keyof Settings>(['focus']);

export function pickSyncable(s: Partial<Settings>): Partial<Settings> {
  // API keys are device-only: never part of what reaches the backend.
  return stripSecrets(
    Object.fromEntries(Object.entries(s).filter(([k]) => !SYNC_EXCLUDE.has(k as keyof Settings))),
  ) as Partial<Settings>;
}

export function pickSections<T extends object>(source: T, keys: string[]): Partial<T> {
  const src = source as Record<string, unknown>;
  return Object.fromEntries(keys.filter((k) => k in src).map((k) => [k, src[k]])) as Partial<T>;
}

/** The setter SettingsProvider hands to its sub-hooks: updates React state and the store. */
export type SetSettings = (next: Settings | ((prev: Settings) => Settings)) => void;
