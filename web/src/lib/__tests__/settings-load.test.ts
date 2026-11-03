import { describe, it, expect } from 'vitest';
import { mergeWithDefaults } from '../settings-load';
import { defaultSettings } from '../../types/settings';

describe('mergeWithDefaults', () => {
  it('returns defaults for an empty store', () => {
    expect(mergeWithDefaults({ ...defaultSettings } as unknown as Record<string, unknown>)).toEqual(defaultSettings);
  });

  it('keeps fields added to a section after the user last saved it', () => {
    const merged = mergeWithDefaults({ ...defaultSettings, general: { userName: 'Ada' } } as unknown as Record<
      string,
      unknown
    >);
    expect(merged.general.userName).toBe('Ada');
    expect(merged.general.searchEngine).toBe('google');
    expect(merged.general.searchEngine).toBe(defaultSettings.general.searchEngine);
  });

  it('merges one level deeper (integrations.spotify)', () => {
    const merged = mergeWithDefaults({
      ...defaultSettings,
      integrations: { spotify: { connected: true } },
    } as unknown as Record<string, unknown>);
    expect(merged.integrations.spotify).toEqual({ ...defaultSettings.integrations.spotify, connected: true });
    expect(merged.integrations.gmail).toEqual(defaultSettings.integrations.gmail);
  });
});
