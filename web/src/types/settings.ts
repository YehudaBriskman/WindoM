export interface QuickLink {
  name: string;
  url: string;
  icon: string;
}

export interface Settings {
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

export const defaultSettings: Settings = {
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
