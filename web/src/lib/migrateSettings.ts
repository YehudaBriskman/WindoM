import {
  type Settings,
  type LegacySettings,
  defaultSettings,
  defaultLegacySettings,
} from '../types/settings';

/**
 * Returns true if `raw` looks like a v1 flat settings object.
 * Detection heuristic: has flat string keys like `clockSize`, `timeFormat`, etc.
 * rather than the new sectioned shape (`general`, `clock`, etc.).
 */
export function isLegacySettings(raw: unknown): raw is LegacySettings {
  if (typeof raw !== 'object' || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  // A sectioned object has `general` / `clock` sub-objects
  if (typeof obj.general === 'object' && typeof obj.clock === 'object') return false;
  // A legacy flat object has at least one of the known flat keys
  return (
    'clockSize' in obj ||
    'timeFormat' in obj ||
    'backgroundSource' in obj ||
    'tabSidebarSide' in obj
  );
}

/**
 * Converts a v1 flat LegacySettings object to the v2 sectioned Settings shape.
 * Pure function — no side effects, no storage access.
 * Falls back to section defaults for any missing or invalid legacy field.
 */
export function migrateFlatToSectioned(legacy: LegacySettings): Settings {
  const d = defaultSettings;
  const l: LegacySettings = { ...defaultLegacySettings, ...legacy };

  return {
    general: {
      userName:     typeof l.userName === 'string'     ? l.userName     : d.general.userName,
      searchEngine: isValidSearchEngine(l.searchEngine) ? l.searchEngine : d.general.searchEngine,
      sidebarSide:  isValidSidebarSide(l.tabSidebarSide) ? l.tabSidebarSide : d.general.sidebarSide,
      showGreeting: typeof l.showGreeting === 'boolean' ? l.showGreeting : d.general.showGreeting,
    },
    clock: {
      timeFormat:  isValidTimeFormat(l.timeFormat)   ? l.timeFormat   : d.clock.timeFormat,
      showSeconds: typeof l.showSeconds === 'boolean' ? l.showSeconds  : d.clock.showSeconds,
      leadingZero: typeof l.clockLeadingZero === 'boolean' ? l.clockLeadingZero : d.clock.leadingZero,
      style:       isValidClockStyle(l.clockStyle)   ? l.clockStyle   : d.clock.style,
      color:       typeof l.clockColor === 'string'  ? l.clockColor   : d.clock.color,
      size:        typeof l.clockSize === 'number'   ? l.clockSize    : d.clock.size,
      weight:      isValidClockWeight(l.clockWeight) ? l.clockWeight  : d.clock.weight,
      showDate:    typeof l.showDate === 'boolean'   ? l.showDate     : d.clock.showDate,
      dateFormat:  isValidDateFormat(l.dateFormat)   ? l.dateFormat   : d.clock.dateFormat,
    },
    background: {
      source:               isValidBgSource(l.backgroundSource) ? l.backgroundSource : d.background.source,
      unsplashApiKey:       typeof l.unsplashApiKey === 'string'       ? l.unsplashApiKey       : d.background.unsplashApiKey,
      unsplashCollectionId: typeof l.unsplashCollectionId === 'string' ? l.unsplashCollectionId : d.background.unsplashCollectionId,
    },
    weather: {
      show:     typeof l.showWeather === 'boolean' ? l.showWeather : d.weather.show,
      unit:     isValidTempUnit(l.temperatureUnit) ? l.temperatureUnit : d.weather.unit,
      location: typeof l.location === 'string'     ? l.location     : d.weather.location,
      apiKey:   d.weather.apiKey, // legacy had no weather apiKey field
    },
    widgets: {
      showLinks:  typeof l.showLinks === 'boolean'  ? l.showLinks  : d.widgets.showLinks,
      showFocus:  typeof l.showFocus === 'boolean'  ? l.showFocus  : d.widgets.showFocus,
      showQuotes: typeof l.quotesEnabled === 'boolean' ? l.quotesEnabled : d.widgets.showQuotes,
      quoteSource: isValidQuoteSource(l.quoteSource) ? l.quoteSource : d.widgets.quoteSource,
      quickLinks:  Array.isArray(l.quickLinks) ? l.quickLinks : d.widgets.quickLinks,
    },
    focus: {
      mainFocus: typeof l.mainFocus === 'string'      ? l.mainFocus    : d.focus.mainFocus,
      completed: typeof l.focusCompleted === 'boolean' ? l.focusCompleted : d.focus.completed,
    },
    integrations: {
      calendar: {
        days: isValidCalendarDays(l.calendarDays) ? l.calendarDays : d.integrations.calendar.days,
      },
      spotify: {},
      finance: { ...d.integrations.finance },
    },
  };
}

/**
 * Extracts `localBackground` from a legacy flat settings object.
 * Returns null if absent or empty — callers should write it to chrome.storage.local.
 */
export function extractLocalBackground(legacy: LegacySettings): string | null {
  const bg = legacy.localBackground;
  return typeof bg === 'string' && bg.length > 0 ? bg : null;
}

// ─── Private validators ───────────────────────────────────────────────────────

function isValidSearchEngine(v: unknown): v is LegacySettings['searchEngine'] {
  return v === 'google' || v === 'bing' || v === 'duckduckgo' || v === 'brave';
}

function isValidSidebarSide(v: unknown): v is LegacySettings['tabSidebarSide'] {
  return v === 'left' || v === 'right';
}

function isValidTimeFormat(v: unknown): v is LegacySettings['timeFormat'] {
  return v === '12h' || v === '24h';
}

function isValidClockStyle(v: unknown): v is LegacySettings['clockStyle'] {
  return v === 'default' || v === 'glass' || v === 'outline';
}

function isValidClockWeight(v: unknown): v is LegacySettings['clockWeight'] {
  return v === 100 || v === 200 || v === 400 || v === 600;
}

function isValidDateFormat(v: unknown): v is LegacySettings['dateFormat'] {
  return v === 'long' || v === 'short' || v === 'numeric';
}

function isValidBgSource(v: unknown): v is LegacySettings['backgroundSource'] {
  return v === 'unsplash' || v === 'local';
}

function isValidTempUnit(v: unknown): v is LegacySettings['temperatureUnit'] {
  return v === 'F' || v === 'C';
}

function isValidQuoteSource(v: unknown): v is LegacySettings['quoteSource'] {
  return v === 'local' || v === 'api';
}

function isValidCalendarDays(v: unknown): v is LegacySettings['calendarDays'] {
  return v === 7 || v === 14 || v === 30;
}
