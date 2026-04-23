import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  // chrome.storage.sync.get(null) — called directly in the mount effect
  vi.mocked(chrome.storage.sync.get).mockResolvedValue({});
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
    vi.mocked(chrome.storage.sync.get).mockResolvedValue({
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
    vi.mocked(chrome.storage.sync.get).mockResolvedValue({
      timeFormat: '24h',
      clockSize: 120,
    });

    await mountAndWait();

    expect(chrome.storage.sync.clear).toHaveBeenCalled();
    expect(syncStorage.setMultiple).toHaveBeenCalled();
  });

  it('stores the migrated focus section to localStore only', async () => {
    vi.mocked(chrome.storage.sync.get).mockResolvedValue({
      timeFormat: '24h',
      mainFocus: 'Finish tests',
      focusCompleted: false,
    });

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

  it('writes focus section to localStore only — never to sync storage', async () => {
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
        general: { userName: 'Eve' },
        weather: { unit: 'C' },
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
});
