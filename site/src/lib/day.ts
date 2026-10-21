/**
 * The day cycle, and the story told across it.
 *
 * The four stages are the extension's own greeting thresholds, copied from
 * `web/src/utils/time.ts`. The wallpapers line up because each bundled image
 * genuinely depicts a time of day, and `evening` is the default background - so
 * an evening visitor sees the exact screen they get after installing.
 *
 * Each stage also foregrounds a different part of the product. That is the
 * narrative: rather than listing features in a grid underneath the hero, the
 * page lights them up one at a time on the tab itself, at the hour you would
 * actually reach for them.
 */

export const STAGES = ['morning', 'afternoon', 'evening', 'night'] as const;
export type Stage = (typeof STAGES)[number];

/** Every widget the stage can show. Each maps to a real part of the extension. */
export type Pane =
  | 'weather'
  | 'todos'
  | 'calendar'
  | 'spotify'
  | 'finance'
  | 'github'
  | 'focus';

export interface DayStage {
  stage: Stage;
  greeting: string;
  wallpaper: string;
  /** Depicted scene, used in the alt text and the backgrounds section. */
  scene: string;
  /** Light temperature wash over the stage. */
  tint: string;
  /** Headline that arrives beside the tab at this hour. */
  headline: string;
  /** One sentence. What the product is doing for you right now. */
  body: string;
  /** Widgets lit at this hour. Everything else dims back. */
  spotlight: Pane[];
}

export const DAY: Record<Stage, DayStage> = {
  morning: {
    stage: 'morning',
    greeting: 'Good morning',
    wallpaper: '/images/day-morning.webp',
    scene: 'Sunrise over a still lake',
    tint: 'var(--dawn)',
    headline: 'Your day, before you ask for it',
    body: 'Open a tab and today is already there: what is on, what is due, and what the weather is doing. Nothing to click.',
    spotlight: ['calendar', 'todos', 'weather'],
  },
  afternoon: {
    stage: 'afternoon',
    greeting: 'Good afternoon',
    wallpaper: '/images/day-afternoon.webp',
    scene: 'Sunlight scattering across open water',
    tint: 'var(--noon)',
    headline: 'The things you keep checking',
    body: 'Markets, the pull request you are waiting on, the weather for the walk home. Pulled in from the sources you already use, with no extra tab to keep open.',
    spotlight: ['finance', 'github', 'weather'],
  },
  evening: {
    stage: 'evening',
    greeting: 'Good evening',
    wallpaper: '/images/day-evening.webp',
    scene: 'A lantern-lit house beneath a glowing wisteria',
    tint: 'var(--dusk)',
    headline: 'And the parts that are just yours',
    body: 'What is playing, where you have been, the links you keep coming back to. This background is the one you get on day one.',
    spotlight: ['spotify', 'todos'],
  },
  night: {
    stage: 'night',
    greeting: 'Good night',
    wallpaper: '/images/day-night.webp',
    scene: 'Aurora over a snow-covered cabin',
    tint: 'var(--night)',
    headline: 'Or none of it at all',
    body: 'Focus mode takes the screen and puts everything else away until the timer runs out.',
    spotlight: ['focus'],
  },
};

/** Same thresholds as the extension's `getGreeting()`. */
export function stageForHour(hours: number): Stage {
  if (hours >= 5 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 17) return 'afternoon';
  if (hours >= 17 && hours < 21) return 'evening';
  return 'night';
}

export function currentStage(now = new Date()): Stage {
  return stageForHour(now.getHours());
}

/** Formats a Date the way the extension's default clock does. */
export function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Mid-stage clock times, used once scroll takes over from real time. */
export const STAGE_CLOCK: Record<Stage, string> = {
  morning: '08:20',
  afternoon: '14:05',
  evening: '19:40',
  night: '23:15',
};

/** The dock, mirroring the extension's Quick Links. */
export const DOCK = [
  { label: 'Calendar', glyph: '◷' },
  { label: 'GitHub', glyph: '⌥' },
  { label: 'Drive', glyph: '△' },
  { label: 'Spotify', glyph: '♪' },
] as const;
