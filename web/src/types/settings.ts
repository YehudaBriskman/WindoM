// ─── Shared sub-types ────────────────────────────────────────────────────────

export interface QuickLink {
  name: string;
  url: string;
  icon: string;
}

// ─── Section interfaces ───────────────────────────────────────────────────────

export interface GeneralSettings {
  userName: string;
  searchEngine: 'google' | 'bing' | 'duckduckgo' | 'brave';
  sidebarSide: 'left' | 'right';
  showGreeting: boolean;
}

export interface ClockSettings {
  timeFormat: '12h' | '24h';
  showSeconds: boolean;
  leadingZero: boolean;
  style: 'default' | 'glass' | 'outline';
  color: string;
  size: number;
  weight: 100 | 200 | 400 | 600;
  showDate: boolean;
  dateFormat: 'long' | 'short' | 'numeric';
}

export interface BackgroundSettings {
  // localBackground lives in chrome.storage.local (can be multi-MB data URL)
  source: 'unsplash' | 'local';
  unsplashApiKey: string;
  unsplashCollectionId: string;
}

export interface WeatherSettings {
  show: boolean;
  unit: 'F' | 'C';
  location: string;
  apiKey: string;
}

export interface WidgetsSettings {
  showLinks: boolean;
  showFocus: boolean;
  showQuotes: boolean;
  quoteSource: 'local' | 'api';
  quickLinks: QuickLink[];
}

/** Device-only — stored under a separate key, never sent to the backend. */
export interface FocusSettings {
  mainFocus: string;
  completed: boolean;
}

export interface CalendarIntegration {
  days: 7 | 14 | 30;
}

export interface SpotifyIntegration {
  // No user-configurable fields yet; clientId lives in OAuth state
}

export interface FinanceIntegration {
  finnhubApiKey: string;
  watchlistTickers: string[];
  cryptoWatchlist: string[];
  showStocks: boolean;
  showCrypto: boolean;
}

export interface IntegrationsSettings {
  calendar: CalendarIntegration;
  spotify: SpotifyIntegration;
  finance: FinanceIntegration;
}

// ─── Top-level Settings ───────────────────────────────────────────────────────

export interface Settings {
  general: GeneralSettings;
  clock: ClockSettings;
  background: BackgroundSettings;
  weather: WeatherSettings;
  widgets: WidgetsSettings;
  /** Stored under a separate chrome.storage.sync key (windom_focus). */
  focus: FocusSettings;
  integrations: IntegrationsSettings;
}

/** Schema version — increment whenever the shape changes incompatibly. */
export const SETTINGS_VERSION = 2;

// ─── Legacy flat type (kept for migration only) ───────────────────────────────

/**
 * The old 28-field flat Settings shape (v1).
 * Used exclusively by the migration function — do not use in new code.
 */
export interface LegacySettings {
  userName: string;
  timeFormat: '12h' | '24h';
  showSeconds: boolean;
  clockLeadingZero: boolean;
  clockStyle: 'default' | 'glass' | 'outline';
  clockColor: string;
  clockSize: number;
  clockWeight: 100 | 200 | 400 | 600;
  showDate: boolean;
  dateFormat: 'long' | 'short' | 'numeric';
  temperatureUnit: 'F' | 'C';
  backgroundSource: 'unsplash' | 'local';
  unsplashApiKey: string;
  unsplashCollectionId: string;
  localBackground: string;
  location: string;
  calendarConnected: boolean;
  calendarDays: 7 | 14 | 30;
  spotifyConnected: boolean;
  quickLinks: QuickLink[];
  quotesEnabled: boolean;
  quoteSource: 'local' | 'api';
  mainFocus: string;
  focusCompleted: boolean;
  showWeather: boolean;
  showLinks: boolean;
  showFocus: boolean;
  showGreeting: boolean;
  searchEngine: 'google' | 'bing' | 'duckduckgo' | 'brave';
  tabSidebarSide: 'left' | 'right';
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const defaultSettings: Settings = {
  general: {
    userName: 'Friend',
    searchEngine: 'google',
    sidebarSide: 'right',
    showGreeting: true,
  },
  clock: {
    timeFormat: '12h',
    showSeconds: false,
    leadingZero: false,
    style: 'default',
    color: '#ffffff',
    size: 120,
    weight: 200,
    showDate: false,
    dateFormat: 'long',
  },
  background: {
    source: 'local',
    unsplashApiKey: '',
    unsplashCollectionId: '',
  },
  weather: {
    show: true,
    unit: 'F',
    location: '',
    apiKey: '',
  },
  widgets: {
    showLinks: true,
    showFocus: true,
    showQuotes: true,
    quoteSource: 'local',
    quickLinks: [
      { name: 'Gmail', url: 'https://gmail.com', icon: '' },
      { name: 'YouTube', url: 'https://youtube.com', icon: '' },
      { name: 'GitHub', url: 'https://github.com', icon: '' },
    ],
  },
  focus: {
    mainFocus: '',
    completed: false,
  },
  integrations: {
    calendar: { days: 7 },
    spotify: {},
    finance: {
      finnhubApiKey: '',
      watchlistTickers: [],
      cryptoWatchlist: [],
      showStocks: false,
      showCrypto: false,
    },
  },
};

export const defaultLegacySettings: LegacySettings = {
  userName: 'Friend',
  timeFormat: '12h',
  showSeconds: false,
  clockLeadingZero: false,
  clockStyle: 'default',
  clockColor: '#ffffff',
  clockSize: 120,
  clockWeight: 200,
  showDate: false,
  dateFormat: 'long',
  temperatureUnit: 'F',
  backgroundSource: 'local',
  unsplashApiKey: '',
  unsplashCollectionId: '',
  localBackground: '',
  location: '',
  calendarConnected: false,
  calendarDays: 7,
  spotifyConnected: false,
  quickLinks: [
    { name: 'Gmail', url: 'https://gmail.com', icon: '' },
    { name: 'YouTube', url: 'https://youtube.com', icon: '' },
    { name: 'GitHub', url: 'https://github.com', icon: '' },
  ],
  quotesEnabled: true,
  quoteSource: 'local',
  mainFocus: '',
  focusCompleted: false,
  showWeather: true,
  showLinks: true,
  showFocus: true,
  showGreeting: true,
  searchEngine: 'google',
  tabSidebarSide: 'right',
};
