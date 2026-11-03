/**
 * Backend settings sync: deciding who wins without trusting this device's clock (#251).
 *
 * The backend stamps every write with a revision (`updatedAt`, epoch ms) taken
 * from the server clock and strictly increasing per user. The extension never
 * compares that number with `Date.now()`; it only asks "is the server still at
 * the revision I last saw?" - an equality check that no clock skew can fool.
 *
 * Per device, in chrome.storage.local (never sync - each device has its own view):
 *   - `windom_settings_server_rev`  the server revision this device last agreed with
 *   - `windom_settings_dirty`       sections edited here and not yet acknowledged by
 *                                   the server, each with a local stamp. The stamp only
 *                                   orders writes between tabs of this one machine, so
 *                                   `Date.now()` is fine for it.
 *
 * On load:
 *   server empty                      -> push everything local
 *   server rev == ours                -> nobody else wrote: push our dirty sections
 *   server rev != ours                -> another device wrote: take the server copy,
 *                                        keep our dirty sections on top and push them
 * Conflicts on the same section therefore resolve by the order writes reach the
 * server, never by which device's clock runs faster.
 */
import { localStore } from './chrome-storage';
import { createLogger } from './logger';

const log = createLogger('settings-sync');

export const SERVER_REV_KEY = 'windom_settings_server_rev';
export const DIRTY_KEY = 'windom_settings_dirty';
/** Client-clock stamp written by extension versions before #251. Read once, to migrate. */
export const LEGACY_LOCAL_UPDATED_AT_KEY = 'windom_settings_updated_at';

/** A server revision; null when the server has none (no row yet, or a pre-#251 backend). */
export type ServerRev = number | null;

/** Shape of GET /settings and PUT /settings. `updatedAt` is absent on a pre-#251 backend. */
export interface SettingsResponse<T> {
  data: T | null;
  updatedAt?: number | null;
  previousUpdatedAt?: number | null;
}

export type DirtyMap = Record<string, number>;

export type SyncPlan =
  /** The server holds nothing: upload every local section. */
  | { kind: 'push-all' }
  /** The server is where we left it: upload only what changed here. */
  | { kind: 'push-dirty' }
  /** The server moved (or we cannot tell): adopt it, then re-apply and upload `keepLocal`. */
  | { kind: 'pull'; keepLocal: string[] };

export interface PlanInput {
  backendEmpty: boolean;
  /** Login: the account's copy replaces whatever this device had. */
  backendWins: boolean;
  serverRev: ServerRev | undefined;
  baseRev: ServerRev | undefined;
  dirtySections: string[];
  /** Pre-#251 client-clock stamp, consulted only when no base revision exists yet. */
  legacyLocalUpdatedAt: number;
  syncableSections: string[];
}

export function planSync(input: PlanInput): SyncPlan {
  const { backendEmpty, backendWins, serverRev, baseRev, dirtySections } = input;
  if (backendEmpty) return { kind: 'push-all' };
  if (backendWins) return { kind: 'pull', keepLocal: [] };

  // Pre-#251 backend: no revision to compare. Take the server copy but keep
  // what was edited here, so an unsynced local change is never thrown away.
  if (typeof serverRev !== 'number') return { kind: 'pull', keepLocal: dirtySections };

  if (typeof baseRev !== 'number') {
    // First sync since upgrading: there is no revision to compare with, only the
    // old client-clock stamp. This one comparison is skew-prone, but it happens
    // once, and it is strictly better than before, when the backend side always
    // read as 0 and any device with a local edit overwrote the account.
    if (input.legacyLocalUpdatedAt > serverRev) {
      return { kind: 'pull', keepLocal: input.syncableSections };
    }
    return { kind: 'pull', keepLocal: dirtySections };
  }

  if (serverRev === baseRev) return { kind: 'push-dirty' };
  return { kind: 'pull', keepLocal: dirtySections };
}

/**
 * The revision to record after a PUT. Only when the server confirms our write
 * landed directly on `expectedBase` do we know we have seen everything up to the
 * new revision; otherwise another device wrote in between, and keeping the old
 * base makes the next load notice and pull.
 */
export function revisionAfterPush(
  expectedBase: ServerRev | undefined,
  res: SettingsResponse<unknown> | undefined,
): number | undefined {
  if (!res || typeof res.updatedAt !== 'number') return undefined;
  const previous = res.previousUpdatedAt ?? null;
  return previous === (expectedBase ?? null) ? res.updatedAt : undefined;
}

// ── storage ──────────────────────────────────────────────────────────────────

export async function getBaseRev(): Promise<ServerRev | undefined> {
  const value = await localStore.get<unknown>(SERVER_REV_KEY, undefined);
  return typeof value === 'number' ? value : undefined;
}

export async function setBaseRev(rev: number): Promise<void> {
  if (!(await localStore.set(SERVER_REV_KEY, rev))) log.warn('Could not record the settings revision');
}

export async function getDirty(): Promise<DirtyMap> {
  const value = await localStore.get<unknown>(DIRTY_KEY, {});
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as DirtyMap) : {};
}

export async function markDirty(sections: string[]): Promise<void> {
  if (sections.length === 0) return;
  const dirty = await getDirty();
  const stamp = Date.now();
  for (const s of sections) dirty[s] = stamp;
  // Best effort: a missed mark means a change that misses its debounced push is
  // not retried on the next load.
  if (!(await localStore.set(DIRTY_KEY, dirty))) log.warn('Could not mark settings as unsynced');
}

/**
 * Clear the sections the server acknowledged - but only where the stamp is the
 * one that was sent, so an edit made in another tab meanwhile stays dirty.
 */
export async function clearDirty(sent: DirtyMap): Promise<void> {
  const dirty = await getDirty();
  let changed = false;
  for (const [s, stamp] of Object.entries(sent)) {
    if (dirty[s] === stamp) {
      delete dirty[s];
      changed = true;
    }
  }
  if (changed) await localStore.set(DIRTY_KEY, dirty);
}

export async function clearAllDirty(): Promise<void> {
  await localStore.set(DIRTY_KEY, {});
}

export async function getLegacyLocalUpdatedAt(): Promise<number> {
  const value = await localStore.get<unknown>(LEGACY_LOCAL_UPDATED_AT_KEY, 0);
  return typeof value === 'number' ? value : 0;
}
