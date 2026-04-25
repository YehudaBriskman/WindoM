import type { Settings } from '../types/settings';

export interface SettingsTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  accent: string;
  settings: DeepPartial<Settings>;
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const TEMPLATES: SettingsTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean slate - just the clock.',
    thumbnail: '/templates/minimal.svg',
    accent: '#6366f1',
    settings: {
      clock: { style: 'default', weight: 200, size: 140, showDate: false },
      weather: { show: false },
      widgets: { showLinks: false, showFocus: false, showQuotes: false },
    },
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Date, links, focus bar - all business.',
    thumbnail: '/templates/productivity.svg',
    accent: '#22d3ee',
    settings: {
      clock: { style: 'default', weight: 200, size: 120, showDate: true, dateFormat: 'long' },
      weather: { show: true },
      widgets: { showLinks: true, showFocus: true, showQuotes: false },
    },
  },
  {
    id: 'inspiration',
    name: 'Inspiration',
    description: 'Daily quotes front and center.',
    thumbnail: '/templates/inspiration.svg',
    accent: '#f59e0b',
    settings: {
      clock: { style: 'glass', weight: 100, size: 110, showDate: false },
      weather: { show: true },
      widgets: { showLinks: false, showFocus: false, showQuotes: true, quoteSource: 'local' },
    },
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Everything on. Max info density.',
    thumbnail: '/templates/dashboard.svg',
    accent: '#4ade80',
    settings: {
      clock: { style: 'default', weight: 400, size: 100, showDate: true, dateFormat: 'long' },
      weather: { show: true },
      widgets: { showLinks: true, showFocus: true, showQuotes: true, quoteSource: 'local' },
    },
  },
  {
    id: 'night',
    name: 'Night Owl',
    description: 'Bold outline clock, no distractions.',
    thumbnail: '/templates/night.svg',
    accent: '#a78bfa',
    settings: {
      clock: { style: 'outline', weight: 100, size: 130, showDate: false, color: '#a78bfa' },
      weather: { show: false },
      widgets: { showLinks: false, showFocus: true, showQuotes: false },
    },
  },
  {
    id: 'focus-only',
    name: 'Deep Focus',
    description: 'Just your intention for today.',
    thumbnail: '/templates/focus-only.svg',
    accent: '#fb7185',
    settings: {
      clock: { style: 'default', weight: 200, size: 90, showDate: false },
      weather: { show: false },
      widgets: { showLinks: false, showFocus: true, showQuotes: false },
    },
  },
];
