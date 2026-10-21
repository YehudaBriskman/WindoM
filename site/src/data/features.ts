/**
 * The feature grid, kept as data so the markup stays a loop.
 *
 * Mirrors the README's feature table. Two entries previously carried
 * "Beta" / "Coming Soon" badges; "Themes - Coming Soon" has been dropped
 * because nothing in web/src implements it and an unfulfilled promise on a
 * landing page is worse than an absent one.
 */

export interface Feature {
  icon: string;
  title: string;
  detail: string;
  badge?: string;
}

export const FEATURES: Feature[] = [
  { icon: '⏰', title: 'Clock & Greeting', detail: 'Personalised, and it adapts to the time of day.' },
  { icon: '🌤️', title: 'Weather', detail: 'Live conditions via Open-Meteo. No API key, no account.' },
  { icon: '🖼️', title: 'Backgrounds', detail: 'Unsplash rotation, or upload your own image.' },
  { icon: '📅', title: 'Google Calendar', detail: 'Your upcoming events, synced to the sidebar.' },
  { icon: '✉️', title: 'Gmail Inbox', detail: 'Unread count and recent messages, refreshed every 45 seconds.' },
  { icon: '🎵', title: 'Spotify', detail: 'Now playing, playback controls and your top tracks.' },
  { icon: '📈', title: 'Finance', detail: 'Stocks and crypto from Yahoo Finance and CoinGecko.' },
  { icon: '🐙', title: 'GitHub', detail: 'Open pull requests and issues across your repositories.' },
  { icon: '✅', title: 'Todos', detail: 'A local task list that is always one tab away.' },
  { icon: '⏱️', title: 'Focus Mode', detail: 'A distraction-free countdown that hides everything else.' },
  { icon: '🔗', title: 'Quick Links', detail: 'Pinned shortcuts and a dock on every new tab.' },
  { icon: '🕰️', title: 'Tab History', detail: 'Recent browsing, reachable from the sidebar.' },
  { icon: '💬', title: 'Daily Quotes', detail: 'A new one each day.' },
  { icon: '🔍', title: 'Search', detail: 'Google, Bing, DuckDuckGo or Brave.' },
  { icon: '☁️', title: 'Cloud Sync', detail: 'Optional account to carry settings between devices.', badge: 'Beta' },
];
