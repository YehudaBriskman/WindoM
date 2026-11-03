import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

type ChangeCb = (changes: Record<string, { newValue?: unknown }>) => void;
let onChangeCb: ChangeCb | null = null;

vi.mock('../../lib/chrome-storage', () => ({
  syncStorage: {
    get: vi.fn(),
    onChange: vi.fn((cb: ChangeCb) => {
      onChangeCb = cb;
      return () => {
        onChangeCb = null;
      };
    }),
  },
}));

import { syncStorage } from '../../lib/chrome-storage';
import { useSettingsCrossTab, KEY_TIMESTAMPS_STORAGE_KEY } from '../useSettingsCrossTab';
import { defaultSettings, type Settings } from '../../types/settings';

function setup() {
  let state: Settings = { ...defaultSettings };
  const setSettings = vi.fn((next: Settings | ((prev: Settings) => Settings)) => {
    state = typeof next === 'function' ? next(state) : next;
  });
  const hook = renderHook(() => useSettingsCrossTab(setSettings));
  return { hook, setSettings, current: () => state };
}

beforeEach(() => {
  vi.mocked(syncStorage.get).mockResolvedValue({});
});

describe('useSettingsCrossTab', () => {
  it('merges a newer remote section into state', () => {
    const { current } = setup();
    act(() =>
      onChangeCb?.({
        general: { newValue: { userName: 'Remote' } },
        [KEY_TIMESTAMPS_STORAGE_KEY]: { newValue: { general: 10 } },
      }),
    );
    expect(current().general.userName).toBe('Remote');
    expect(current().general.searchEngine).toBe(defaultSettings.general.searchEngine);
  });

  it("ignores a remote write older than this tab's stamp", () => {
    const { hook, setSettings } = setup();
    act(() => {
      hook.result.current.stamp(['general']);
    });
    act(() =>
      onChangeCb?.({
        general: { newValue: { userName: 'Stale' } },
        [KEY_TIMESTAMPS_STORAGE_KEY]: { newValue: { general: 1 } },
      }),
    );
    expect(setSettings).not.toHaveBeenCalled();
  });

  it('stamp gives every section one time and returns a copy of all stamps', () => {
    const { hook } = setup();
    vi.spyOn(Date, 'now').mockReturnValue(42);
    const stamps = hook.result.current.stamp(['general', 'weather']);
    expect(stamps).toEqual({ general: 42, weather: 42 });
    stamps.general = 0;
    expect(hook.result.current.stamp([])).toEqual({ general: 42, weather: 42 });
    vi.restoreAllMocks();
  });

  it('loadStamps reads stored stamps and clearStamps forgets them', async () => {
    vi.mocked(syncStorage.get).mockResolvedValue({ general: 99 });
    const { hook } = setup();
    await act(() => hook.result.current.loadStamps());
    expect(syncStorage.get).toHaveBeenCalledWith(KEY_TIMESTAMPS_STORAGE_KEY, {});
    expect(hook.result.current.stamp([])).toEqual({ general: 99 });
    hook.result.current.clearStamps();
    expect(hook.result.current.stamp([])).toEqual({});
  });

  it('unsubscribes on unmount', () => {
    const { hook } = setup();
    expect(onChangeCb).not.toBeNull();
    hook.unmount();
    expect(onChangeCb).toBeNull();
  });
});
