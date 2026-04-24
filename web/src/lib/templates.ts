import type { Settings } from '../types/settings';

export interface SettingsTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  settings: DeepPartial<Settings>;
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const TEMPLATES: SettingsTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and distraction-free. Clock only, no widgets.',
    thumbnail: '/templates/minimal.svg',
    settings: {
      clock: {
        style: 'default',
        weight: 200,
        size: 140,
        showDate: false,
      },
      weather: { show: false },
      widgets: {
        showLinks: false,
        showFocus: false,
        showQuotes: false,
      },
    },
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Focus-first layout with quick links, tasks, and calendar.',
    thumbnail: '/templates/productivity.svg',
    settings: {
      clock: {
        style: 'default',
        weight: 200,
        size: 120,
        showDate: true,
        dateFormat: 'long',
      },
      weather: { show: true },
      widgets: {
        showLinks: true,
        showFocus: true,
        showQuotes: false,
      },
    },
  },
  {
    id: 'inspiration',
    name: 'Inspiration',
    description: 'Daily quotes front and center. Perfect for a motivational start.',
    thumbnail: '/templates/inspiration.svg',
    settings: {
      clock: {
        style: 'glass',
        weight: 100,
        size: 110,
        showDate: false,
      },
      weather: { show: true },
      widgets: {
        showLinks: false,
        showFocus: false,
        showQuotes: true,
        quoteSource: 'local',
      },
    },
  },
];
