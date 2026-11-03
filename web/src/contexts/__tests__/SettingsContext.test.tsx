import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// chrome-storage wrappers: get/getMultiple return their defaultValue / keys argument
// so tests see an empty store by default (same behaviour as real chrome storage with no data).
vi.mock('../../lib/chrome-storage', () => ({
  syncStorage: {
    get: vi.fn().mockImplementation((_k: unknown, def: unknown) => Promise.resolve(def)),
    getMultiple: vi.fn().mockImplementation((keys: Record<string, unknown>) => Promise.resolve({ ...keys })),
    set: vi.fn().mockResolvedValue(true),
    setMultiple: vi.fn().mockResolvedValue(true),
    clear: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
    onChange: vi.fn().mockReturnValue(() => {}),
  },
  localStore: {
    get: vi.fn().mockImplementation((_k: unknown, def: unknown) => Promise.resolve(def)),
    set: vi.fn().mockResolvedValue(true),
    clear: vi.fn().mockResolvedValue(true),
  },
}));

// No access token → syncWithBackend returns early without touching the API.
vi.mock('../../lib/api', () => ({
  getAccessToken: vi.fn().mockResolvedValue(null),
  apiGet: vi.fn(),
  apiPut: vi.fn(),
}));

import { syncStorage, localStore } from '../../lib/chrome-storage';
import { SettingsProvider, useSettings, useSettingsSection } from '../SettingsContext';
import { defaultSettings } from '../../types/settings';
import { getAccessToken, apiGet, apiPut } from '../../lib/api';
import { SERVER_REV_KEY, DIRTY_KEY, LEGACY_LOCAL_UPDATED_AT_KEY } from '../../lib/settings-sync';

// ── Helpers ───────────────────────────────────────────────────────────────────

// @types/chrome types chrome.storage.sync.get as returning void (callback API).
// Our stub returns a Promise, so cast to access vi mock methods without TS errors.
function mockSyncGet(value: Record<string, unknown>) {
  (chrome.storage.sync.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(value);
}

function wrapper({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}

/** Wait for the provider to finish its async mount (storage load). */
async function mountAndWait() {
  const hook = renderHook(() => useSettings(), { wrapper });
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
}

beforeEach(() => {
  // chrome.storage.sync.get(null) - called directly in the mount effect
  mockSyncGet({});
  // Restore wrapper defaults (clearAllMocks resets call history but not implementations)
  vi.mocked(syncStorage.get).mockImplementation((_k, def) => Promise.resolve(def));
  vi.mocked(syncStorage.getMultiple).mockImplementation((keys) => Promise.resolve({ ...keys }));
  vi.mocked(syncStorage.onChange).mockReturnValue(() => {});
  vi.mocked(localStore.get).mockImplementation((_k, def) => Promise.resolve(def));
});

// ── load on mount ─────────────────────────────────────────────────────────────

describe('load on mount', () => {
  it('exposes defaultSettings when sync storage is empty', async () => {
    const { result } = await mountAndWait();

    expect(result.current.settings.general).toEqual(defaultSettings.general);
    expect(result.current.settings.clock).toEqual(defaultSettings.clock);
  });

  it('loads persisted settings from sync storage', async () => {
    const stored = {
      ...defaultSettings,
      general: { ...defaultSettings.general, userName: 'Alice', searchEngine: 'bing' as const },
    };
    vi.mocked(syncStorage.getMultiple).mockResolvedValueOnce(stored as unknown as Record<string, unknown>);

    const { result } = await mountAndWait();

    expect(result.current.settings.general.userName).toBe('Alice');
    expect(result.current.settings.general.searchEngine).toBe('bing');
  });

  it('merges focus from chrome.storage.local (device-local)', async () => {
    vi.mocked(localStore.get).mockImplementation((key, def) =>
      Promise.resolve(key === 'windom_focus' ? { mainFocus: 'Ship it', completed: false } : def),
    );

    const { result } = await mountAndWait();

    expect(result.current.settings.focus.mainFocus).toBe('Ship it');
  });

  it('sets loaded to true after async init completes', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    // Starts false, becomes true after storage read
    await waitFor(() => expect(result.current.loaded).toBe(true));
  });
});

// ── legacy migration ──────────────────────────────────────────────────────────

describe('legacy migration', () => {
  it('migrates v1 flat settings to v2 sectioned shape', async () => {
    mockSyncGet({
      clockSize: 140,
      timeFormat: '24h',
      userName: 'Bob',
      backgroundSource: 'local',
      temperatureUnit: 'C',
      calendarDays: 14,
    });

    const { result } = await mountAndWait();

    expect(result.current.settings.clock.size).toBe(140);
    expect(result.current.settings.clock.timeFormat).toBe('24h');
    expect(result.current.settings.general.userName).toBe('Bob');
    expect(result.current.settings.weather.unit).toBe('C');
    expect(result.current.settings.integrations.calendar.days).toBe(14);
  });

  it('clears sync storage and rewrites in sectioned shape during migration', async () => {
    mockSyncGet({ timeFormat: '24h', clockSize: 120 });

    await mountAndWait();

    expect(chrome.storage.sync.clear).toHaveBeenCalled();
    expect(syncStorage.setMultiple).toHaveBeenCalled();
  });

  it('stores the migrated focus section to localStore only', async () => {
    mockSyncGet({ timeFormat: '24h', mainFocus: 'Finish tests', focusCompleted: false });

    await mountAndWait();

    expect(localStore.set).toHaveBeenCalledWith(
      'windom_focus',
      expect.objectContaining({ mainFocus: 'Finish tests' }),
    );
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe('update', () => {
  it('merges a section patch into settings state', async () => {
    const { result } = await mountAndWait();

    await act(async () => {
      await result.current.update('general', { userName: 'Charlie' });
    });

    expect(result.current.settings.general.userName).toBe('Charlie');
    // Other fields of the section are preserved
    expect(result.current.settings.general.searchEngine).toBe(defaultSettings.general.searchEngine);
  });

  it('writes the updated section to sync storage', async () => {
    const { result } = await mountAndWait();

    await act(async () => {
      await result.current.update('general', { userName: 'Dana' });
    });

    expect(syncStorage.setMultiple).toHaveBeenCalledWith(
      expect.objectContaining({
        general: expect.objectContaining({ userName: 'Dana' }),
      }),
    );
  });

  it('writes focus section to localStore only - never to sync storage', async () => {
    const { result } = await mountAndWait();
    vi.mocked(syncStorage.setMultiple).mockClear();

    await act(async () => {
      await result.current.update('focus', { mainFocus: 'Build something great' });
    });

    expect(result.current.settings.focus.mainFocus).toBe('Build something great');
    expect(localStore.set).toHaveBeenCalledWith(
      'windom_focus',
      expect.objectContaining({ mainFocus: 'Build something great' }),
    );
    // setMultiple must not have been called for the focus update
    const setMultipleCalls = vi.mocked(syncStorage.setMultiple).mock.calls;
    for (const [arg] of setMultipleCalls) {
      expect(arg).not.toHaveProperty('focus');
    }
  });
});

// ── updateMultiple ────────────────────────────────────────────────────────────

describe('updateMultiple', () => {
  it('applies patches to multiple sections in one call', async () => {
    const { result } = await mountAndWait();

    await act(async () => {
      await result.current.updateMultiple({
        general: { ...defaultSettings.general, userName: 'Eve' },
        weather: { ...defaultSettings.weather, unit: 'C' as const },
      });
    });

    expect(result.current.settings.general.userName).toBe('Eve');
    expect(result.current.settings.weather.unit).toBe('C');
  });
});

// ── reset ─────────────────────────────────────────────────────────────────────

describe('reset', () => {
  it('restores defaultSettings and clears sync storage', async () => {
    const { result } = await mountAndWait();

    // First, change something
    await act(async () => {
      await result.current.update('general', { userName: 'Temp' });
    });
    expect(result.current.settings.general.userName).toBe('Temp');

    await act(async () => { await result.current.reset(); });

    expect(result.current.settings.general.userName).toBe(defaultSettings.general.userName);
    expect(result.current.settings.clock).toEqual(defaultSettings.clock);
    expect(syncStorage.clear).toHaveBeenCalled();
  });

  it('rewrites defaultSettings to sync storage after reset', async () => {
    const { result } = await mountAndWait();
    vi.mocked(syncStorage.setMultiple).mockClear();

    await act(async () => { await result.current.reset(); });

    expect(syncStorage.setMultiple).toHaveBeenCalledWith(
      expect.objectContaining({ general: defaultSettings.general }),
    );
  });
});

// ── cross-tab sync (onChanged) ────────────────────────────────────────────────

describe('cross-tab sync', () => {
  it('applies incoming section changes from another tab', async () => {
    let capturedCb: ((changes: Record<string, { newValue: unknown }>) => void) | null = null;
    vi.mocked(syncStorage.onChange).mockImplementation((cb) => {
      capturedCb = cb as (changes: Record<string, { newValue: unknown }>) => void;
      return () => {};
    });

    const { result } = await mountAndWait();

    act(() => {
      capturedCb!({
        general: { newValue: { ...defaultSettings.general, userName: 'Remote' } },
      });
    });

    await waitFor(() => expect(result.current.settings.general.userName).toBe('Remote'));
  });

  it('ignores changes whose remote timestamp is behind the local timestamp', async () => {
    let capturedCb: ((changes: Record<string, { newValue: unknown; oldValue?: unknown }>) => void) | null = null;
    vi.mocked(syncStorage.onChange).mockImplementation((cb) => {
      capturedCb = cb as typeof capturedCb;
      return () => {};
    });

    const { result } = await mountAndWait();

    // Make a local update (sets a local timestamp for 'general')
    await act(async () => {
      await result.current.update('general', { userName: 'Local' });
    });

    const localTs = Date.now();

    // Remote change with an older timestamp
    act(() => {
      capturedCb!({
        windom_key_timestamps: { newValue: { general: localTs - 1000 } },
        general: { newValue: { ...defaultSettings.general, userName: 'Stale' } },
      });
    });

    // Local value should win
    expect(result.current.settings.general.userName).toBe('Local');
  });
});

// ── get helper ────────────────────────────────────────────────────────────────

describe('get', () => {
  it('returns the requested section', async () => {
    const { result } = await mountAndWait();

    expect(result.current.get('general')).toEqual(result.current.settings.general);
    expect(result.current.get('clock')).toEqual(result.current.settings.clock);
  });
});

// ── useSettingsSection ────────────────────────────────────────────────────────

describe('useSettingsSection', () => {
  it('returns the current value of the subscribed section', async () => {
    const { result } = renderHook(
      () => ({ section: useSettingsSection('general'), ctx: useSettings() }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.ctx.loaded).toBe(true));
    expect(result.current.section).toEqual(defaultSettings.general);
  });

  it('reflects updates to the subscribed section', async () => {
    const { result } = renderHook(
      () => ({ section: useSettingsSection('general'), ctx: useSettings() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.ctx.loaded).toBe(true));

    await act(async () => {
      await result.current.ctx.update('general', { userName: 'Felix' });
    });

    expect(result.current.section.userName).toBe('Felix');
  });

  // #260: the integration hooks (useGmail, useSpotify, useCalendar) rely on this.
  it('does not re-render a subscriber when an unrelated section changes', async () => {
    const ctx = await mountAndWait();
    let renders = 0;
    // No wrapper: the subscriber reads the shared store, so the provider's own
    // re-renders cannot reach it - only a store notification for its section can.
    const sub = renderHook(() => {
      renders += 1;
      return useSettingsSection('integrations');
    });
    const before = renders;

    await act(async () => {
      await ctx.result.current.update('clock', { timeFormat: '24h' });
    });
    expect(renders).toBe(before);

    await act(async () => {
      await ctx.result.current.update('integrations', {
        calendar: { ...defaultSettings.integrations.calendar, days: 14 },
      });
    });
    expect(renders).toBeGreaterThan(before);
    expect(sub.result.current.calendar.days).toBe(14);
  });
});

// ── write result (#437) ───────────────────────────────────────────────────────
// The chrome-storage helpers report a failed write by resolving `false`, not by
// throwing. update/updateMultiple pass that on so the UI can say "Couldn't save".

describe('write result', () => {
  it('update resolves true when the sync write succeeds', async () => {
    const { result } = await mountAndWait();
    let saved: boolean | undefined;
    await act(async () => {
      saved = await result.current.update('general', { userName: 'Gil' });
    });
    expect(saved).toBe(true);
  });

  it('update resolves false when the sync write fails', async () => {
    const { result } = await mountAndWait();
    vi.mocked(syncStorage.setMultiple).mockResolvedValueOnce(false);
    let saved: boolean | undefined;
    await act(async () => {
      saved = await result.current.update('general', { userName: 'Gil' });
    });
    expect(saved).toBe(false);
  });

  it('update resolves false when the device-local focus write fails', async () => {
    const { result } = await mountAndWait();
    vi.mocked(localStore.set).mockResolvedValueOnce(false);
    let saved: boolean | undefined;
    await act(async () => {
      saved = await result.current.update('focus', { mainFocus: 'Ship it' });
    });
    expect(saved).toBe(false);
  });

  it('updateMultiple resolves true when the sync write succeeds', async () => {
    const { result } = await mountAndWait();
    let saved: boolean | undefined;
    await act(async () => {
      saved = await result.current.updateMultiple({ general: { ...defaultSettings.general, userName: 'Hen' } });
    });
    expect(saved).toBe(true);
  });

  it('updateMultiple resolves false when the sync write fails', async () => {
    const { result } = await mountAndWait();
    vi.mocked(syncStorage.setMultiple).mockResolvedValueOnce(false);
    let saved: boolean | undefined;
    await act(async () => {
      saved = await result.current.updateMultiple({ general: { ...defaultSettings.general, userName: 'Hen' } });
    });
    expect(saved).toBe(false);
  });
});

// ── backend sync uses server revisions, not this device's clock (#251) ────────
// Each test plays one device whose clock is hours off. The backend is a fake
// that assigns its own revisions, exactly as the real one does.

describe('backend sync under clock skew (#251)', () => {
  const HOUR = 60 * 60 * 1000;
  const SERVER_NOW = 1_800_000_000_000;
  let local: Map<string, unknown>;
  let server: { data: Record<string, unknown> | null; updatedAt: number | null };
  let puts: Record<string, unknown>[];

  beforeEach(() => {
    local = new Map();
    server = { data: null, updatedAt: null };
    puts = [];
    vi.mocked(localStore.get).mockImplementation((k, def) =>
      Promise.resolve(local.has(k) ? local.get(k) : def) as never);
    vi.mocked(localStore.set).mockImplementation((k, v) => { local.set(k, v); return Promise.resolve(true); });
    vi.mocked(getAccessToken).mockResolvedValue('token');
    vi.mocked(apiGet).mockImplementation(() => Promise.resolve({ ...server }));
    vi.mocked(apiPut).mockImplementation((_path, body) => {
      const sections = body as Record<string, Record<string, unknown>>;
      puts.push(sections);
      const previousUpdatedAt = server.updatedAt;
      const data: Record<string, unknown> = { ...(server.data ?? {}) };
      for (const [k, v] of Object.entries(sections)) data[k] = { ...(data[k] as object), ...v };
      // Server clock: its own, untouched by the device's skew.
      server = { data, updatedAt: Math.max(SERVER_NOW, (previousUpdatedAt ?? 0) + 1) };
      return Promise.resolve({ ...server, previousUpdatedAt });
    });
  });

  afterEach(() => {
    vi.mocked(getAccessToken).mockResolvedValue(null);
    vi.mocked(apiGet).mockReset();
    vi.mocked(apiPut).mockReset();
    vi.mocked(localStore.set).mockResolvedValue(true);
    vi.restoreAllMocks();
  });

  function storeLocal(general: Partial<typeof defaultSettings.general>) {
    vi.mocked(syncStorage.getMultiple).mockResolvedValueOnce({
      ...defaultSettings, general: { ...defaultSettings.general, ...general },
    } as unknown as Record<string, unknown>);
  }

  it('a device whose clock is hours AHEAD still takes a newer write from another device', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(SERVER_NOW + 5 * HOUR);
    // This device last agreed with the server at rev 100 and has nothing unsynced.
    // Its legacy stamp claims "edited 5 hours from now" - the old code let that win.
    local.set(SERVER_REV_KEY, 100);
    local.set(LEGACY_LOCAL_UPDATED_AT_KEY, SERVER_NOW + 5 * HOUR);
    storeLocal({ userName: 'Stale' });
    // Another device wrote since: the server is at a newer revision.
    server = { data: { general: { userName: 'Newer' } }, updatedAt: 200 };

    const { result } = await mountAndWait();

    await waitFor(() => expect(result.current.settings.general.userName).toBe('Newer'));
    await waitFor(() => expect(local.get(SERVER_REV_KEY)).toBe(200));
    expect(puts).toEqual([]);
  });

  it('a device whose clock is hours BEHIND still uploads its own unsynced edit', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(SERVER_NOW - 5 * HOUR);
    // The edit was made here and never reached the server; nobody else wrote since.
    local.set(SERVER_REV_KEY, 100);
    local.set(DIRTY_KEY, { general: SERVER_NOW - 5 * HOUR });
    storeLocal({ userName: 'Mine' });
    server = { data: { general: { userName: 'Old' } }, updatedAt: 100 };

    const { result } = await mountAndWait();

    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0]).toEqual({ general: expect.objectContaining({ userName: 'Mine' }) });
    expect(result.current.settings.general.userName).toBe('Mine');
    expect((server.data as { general: { userName: string } }).general.userName).toBe('Mine');
    // The server confirmed the write landed on rev 100, so this device is in step again.
    await waitFor(() => expect(local.get(SERVER_REV_KEY)).toBe(server.updatedAt));
    expect(local.get(DIRTY_KEY)).toEqual({});
  });

  it('both sides changed: other sections come from the server, the edited one stays local', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(SERVER_NOW - 5 * HOUR);
    local.set(SERVER_REV_KEY, 100);
    local.set(DIRTY_KEY, { general: 1 });
    vi.mocked(syncStorage.getMultiple).mockResolvedValueOnce({
      ...defaultSettings,
      general: { ...defaultSettings.general, userName: 'Mine' },
      clock: { ...defaultSettings.clock, timeFormat: '12h' },
    } as unknown as Record<string, unknown>);
    server = { data: { general: { userName: 'Theirs' }, clock: { timeFormat: '24h' } }, updatedAt: 200 };

    const { result } = await mountAndWait();

    await waitFor(() => expect(result.current.settings.clock.timeFormat).toBe('24h'));
    expect(result.current.settings.general.userName).toBe('Mine');
    await waitFor(() => expect(puts).toHaveLength(1));
    expect(Object.keys(puts[0])).toEqual(['general']);
  });

  it('upgrading from a pre-#251 version: a device with no local edits takes the server copy', async () => {
    storeLocal({ userName: 'Local' });
    server = { data: { general: { userName: 'Account' } }, updatedAt: SERVER_NOW };

    const { result } = await mountAndWait();

    await waitFor(() => expect(result.current.settings.general.userName).toBe('Account'));
    await waitFor(() => expect(local.get(SERVER_REV_KEY)).toBe(SERVER_NOW));
    expect(puts).toEqual([]);
  });

  it('upgrading from a pre-#251 version: a device with a newer local edit keeps and uploads it', async () => {
    local.set(LEGACY_LOCAL_UPDATED_AT_KEY, SERVER_NOW + 1000);
    storeLocal({ userName: 'Local' });
    server = { data: { general: { userName: 'Account' } }, updatedAt: SERVER_NOW };

    const { result } = await mountAndWait();

    await waitFor(() => expect(puts).toHaveLength(1));
    expect(result.current.settings.general.userName).toBe('Local');
    expect((server.data as { general: { userName: string } }).general.userName).toBe('Local');
  });

  it('against a pre-#251 backend (no revision): keeps unsynced local edits', async () => {
    local.set(DIRTY_KEY, { general: 1 });
    storeLocal({ userName: 'Mine' });
    vi.mocked(apiGet).mockResolvedValue({ data: { general: { userName: 'Old' } } });
    vi.mocked(apiPut).mockImplementation((_path, body) => {
      puts.push(body as Record<string, unknown>);
      return Promise.resolve({ data: body });
    });

    const { result } = await mountAndWait();

    await waitFor(() => expect(puts).toHaveLength(1));
    expect(result.current.settings.general.userName).toBe('Mine');
    expect(local.has(SERVER_REV_KEY)).toBe(false);
  });

  it('an edit marks its section dirty so it survives a push that never happens', async () => {
    const { result } = await mountAndWait();
    await act(async () => { await result.current.update('clock', { timeFormat: '24h' }); });
    expect(Object.keys(local.get(DIRTY_KEY) as object)).toEqual(['clock']);
  });
});
