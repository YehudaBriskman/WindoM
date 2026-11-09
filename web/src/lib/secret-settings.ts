/**
 * Third-party API keys live on this device only.
 *
 * chrome.storage.sync replicates to the user's Google account, and the settings
 * sections are also uploaded to the WindoM backend, so a key kept inside a
 * section would leave the device twice. Keys are therefore held in one
 * chrome.storage.local entry, stripped from every object written to sync or
 * the backend, and merged back into the in-memory settings at load.
 *
 * chrome.storage.local is not encrypted at rest by the extension.
 */
import { localStore } from './chrome-storage';
import { createLogger } from './logger';

const log = createLogger('secrets');

export const SECRETS_KEY = 'windom_secrets';

/** Settings fields that hold a key or secret, by section. */
export const SECRET_FIELDS = {
  background: ['unsplashApiKey'],
} as const;

/** Fields that no code reads any more; removed from sync on migration. */
const OBSOLETE_FIELDS: Record<string, readonly string[]> = {
  weather: ['apiKey'],
};

export type SecretsStore = Record<string, Record<string, string>>;

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** A copy of one section value without its secret (and obsolete) fields. */
export function stripSectionSecrets(section: string, value: unknown): unknown {
  if (!isObject(value)) return value;
  const drop = [
    ...((SECRET_FIELDS as Record<string, readonly string[]>)[section] ?? []),
    ...(OBSOLETE_FIELDS[section] ?? []),
  ];
  if (drop.length === 0 || !drop.some((f) => f in value)) return value;
  const copy = { ...value };
  for (const f of drop) delete copy[f];
  return copy;
}

/** A copy of a settings-shaped record safe for sync storage and the backend. */
export function stripSecrets<T extends object>(record: T): T {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, stripSectionSecrets(k, v)])) as T;
}

/** The secret fields present (as non-empty-or-empty strings) in a settings-shaped record. */
export function extractSecrets(record: Record<string, unknown>): SecretsStore {
  const out: SecretsStore = {};
  for (const [section, fields] of Object.entries(SECRET_FIELDS)) {
    const value = record[section];
    if (!isObject(value)) continue;
    for (const f of fields) {
      if (typeof value[f] === 'string') (out[section] ??= {})[f] = value[f] as string;
    }
  }
  return out;
}

export async function loadSecrets(): Promise<SecretsStore> {
  const stored = await localStore.get<unknown>(SECRETS_KEY, {});
  return isObject(stored) ? (stored as SecretsStore) : {};
}

/** Merge `secrets` into the local entry. Resolves false when the write failed. */
export async function saveSecrets(secrets: SecretsStore): Promise<boolean> {
  if (Object.keys(secrets).length === 0) return true;
  const current = await loadSecrets();
  const next: SecretsStore = { ...current };
  for (const [section, fields] of Object.entries(secrets)) next[section] = { ...current[section], ...fields };
  return localStore.set(SECRETS_KEY, next);
}

/** Overlay stored secrets onto settings loaded from sync. */
export function applySecrets<T extends object>(settings: T, secrets: SecretsStore): T {
  const out = { ...settings } as Record<string, unknown>;
  for (const [section, fields] of Object.entries(secrets)) {
    if (isObject(out[section])) out[section] = { ...(out[section] as object), ...fields };
  }
  return out as T;
}

/**
 * One-time, idempotent migration. If `syncRaw` (the whole of chrome.storage.sync)
 * holds a key, copy it to local storage and only then remove it from sync. A key
 * already present locally is kept (the device's own value wins). When the local
 * write fails the synced copy is left alone and the next load retries.
 * Resolves true when a synced key was moved or removed.
 */
export async function migrateSecretsFromSync(syncRaw: Record<string, unknown>): Promise<boolean> {
  const found = extractSecrets(syncRaw);
  const cleaned: Record<string, unknown> = {};
  for (const section of Object.keys(syncRaw)) {
    const stripped = stripSectionSecrets(section, syncRaw[section]);
    if (stripped !== syncRaw[section]) cleaned[section] = stripped;
  }
  if (Object.keys(cleaned).length === 0) return false;

  const local = await loadSecrets();
  const toSave: SecretsStore = {};
  for (const [section, fields] of Object.entries(found)) {
    for (const [f, v] of Object.entries(fields)) {
      if (v !== '' && !local[section]?.[f]) (toSave[section] ??= {})[f] = v;
    }
  }
  if (!(await saveSecrets(toSave))) {
    log.warn('Could not save API keys locally - leaving the synced copy for the next load');
    return false;
  }
  try {
    await chrome.storage.sync.set(cleaned);
  } catch (err) {
    log.warn('Could not remove API keys from sync:', err);
    return false;
  }
  return true;
}
