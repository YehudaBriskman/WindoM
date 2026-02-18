export interface QuickLink {
  name: string;
  url: string;
  icon: string;
}

export interface Settings {
  userName: string;
  timeFormat: '12h' | '24h';
  temperatureUnit: 'F' | 'C';
  backgroundSource: 'unsplash' | 'local';
  unsplashApiKey: string;
  unsplashCollectionId: string;
  localBackground: string;
  location: string;
  weatherApiKey: string;
  calendarConnected: boolean;
  calendarAuthToken: string;
  quickLinks: QuickLink[];
  quotesEnabled: boolean;
  quoteSource: 'local' | 'api';
  mainFocus: string;
  focusCompleted: boolean;
  showWeather: boolean;
  showLinks: boolean;
  showFocus: boolean;
  showGreeting: boolean;
}

export const defaultSettings: Settings = {
  userName: 'Friend',
  timeFormat: '12h',
  temperatureUnit: 'F',
  backgroundSource: 'unsplash',
  unsplashApiKey: '',
  unsplashCollectionId: '',
  localBackground: '',
  location: '',
  weatherApiKey: '',
  calendarConnected: false,
  calendarAuthToken: '',
  quickLinks: [
    { name: 'Gmail', url: 'https://gmail.com', icon: 'mail' },
    { name: 'YouTube', url: 'https://youtube.com', icon: 'play' },
    { name: 'GitHub', url: 'https://github.com', icon: 'github' },
  ],
  quotesEnabled: true,
  quoteSource: 'local',
  mainFocus: '',
  focusCompleted: false,
  showWeather: true,
  showLinks: true,
  showFocus: true,
  showGreeting: true,
};
