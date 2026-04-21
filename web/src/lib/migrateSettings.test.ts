import { describe, it, expect } from 'vitest';
import { isLegacySettings, migrateFlatToSectioned } from './migrateSettings';
import { defaultSettings, type LegacySettings } from '../types/settings';

describe('isLegacySettings', () => {
  it('returns true for a flat v1 settings object', () => {
    expect(isLegacySettings({ clockSize: 120, timeFormat: '24h' })).toBe(true);
  });

  it('returns false for a sectioned v2 settings object', () => {
    expect(isLegacySettings(defaultSettings)).toBe(false);
  });
});

describe('migrateFlatToSectioned', () => {
  it('maps all known flat fields to correct sections', () => {
    const legacy: LegacySettings = {
      userName: 'Alice',
      timeFormat: '24h',
      showSeconds: true,
      clockLeadingZero: false,
      clockStyle: 'glass',
      clockColor: '#fff',
      clockSize: 140,
      clockWeight: 400,
      showDate: true,
      dateFormat: 'short',
      backgroundSource: 'unsplash',
      unsplashApiKey: 'key123',
      unsplashCollectionId: '',
      localBackground: '',
      temperatureUnit: 'C',
      location: 'Tel Aviv',
      calendarConnected: true,
      calendarDays: 14,
      spotifyConnected: false,
      quickLinks: [],
      quotesEnabled: true,
      quoteSource: 'local',
      mainFocus: 'Ship it',
      focusCompleted: false,
      showWeather: true,
      showLinks: true,
      showFocus: true,
      showGreeting: true,
      searchEngine: 'google',
      tabSidebarSide: 'left',
    };
    const result = migrateFlatToSectioned(legacy);
    expect(result.general.userName).toBe('Alice');
    expect(result.clock.timeFormat).toBe('24h');
    expect(result.clock.size).toBe(140);
    expect(result.background.source).toBe('unsplash');
    expect(result.weather.unit).toBe('C');
    expect(result.integrations.calendar.days).toBe(14);
    expect(result.focus.mainFocus).toBe('Ship it');
  });

  it('applies section defaults for missing or invalid fields', () => {
    const result = migrateFlatToSectioned({} as LegacySettings);
    expect(result.clock.timeFormat).toBe(defaultSettings.clock.timeFormat);
    expect(result.general.searchEngine).toBe(defaultSettings.general.searchEngine);
  });
});
