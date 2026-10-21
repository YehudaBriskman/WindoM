/**
 * The day cycle the whole page is built around.
 *
 * The four stages are not a device invented for the site - they are the
 * extension's own greeting thresholds, copied from `web/src/utils/time.ts`. If
 * those change, change these, or the page will promise a greeting the product
 * does not give.
 *
 * The wallpapers line up with them because each bundled image genuinely depicts
 * a time of day. `evening` is the extension's default background, so a visitor
 * arriving in the evening sees the exact screen they get after installing.
 */

export const STAGES = ['morning', 'afternoon', 'evening', 'night'] as const;
export type Stage = (typeof STAGES)[number];

export interface DayStage {
  stage: Stage;
  greeting: string;
  /** Shown under the clock - what the product is doing for you at this hour. */
  caption: string;
  wallpaper: string;
  /** Depicted scene, for the alt text and the credit line. */
  scene: string;
  /** Drives the light temperature wash over the stage. */
  tint: string;
}

export const DAY: Record<Stage, DayStage> = {
  morning: {
    stage: 'morning',
    greeting: 'Good morning',
    caption: 'Weather, your calendar, and what you meant to do today.',
    wallpaper: '/images/day-morning.webp',
    scene: 'Sunrise over a still lake, mist on the water',
    tint: 'var(--dawn)',
  },
  afternoon: {
    stage: 'afternoon',
    greeting: 'Good afternoon',
    caption: 'Every new tab, the same calm surface.',
    wallpaper: '/images/day-afternoon.webp',
    scene: 'Sunlight scattering across blue-green water',
    tint: 'var(--noon)',
  },
  evening: {
    stage: 'evening',
    greeting: 'Good evening',
    caption: 'The background you get the moment you install it.',
    wallpaper: '/images/day-evening.webp',
    scene: 'A lantern-lit house beneath a glowing wisteria tree',
    tint: 'var(--dusk)',
  },
  night: {
    stage: 'night',
    greeting: 'Good night',
    caption: 'Focus mode, and nothing else on the screen.',
    wallpaper: '/images/day-night.webp',
    scene: 'Aurora over a snow-covered cabin',
    tint: 'var(--night)',
  },
};

/**
 * Same thresholds as the extension's `getGreeting()`. Returns the stage rather
 * than the string so callers get the wallpaper and tint with it.
 */
export function stageForHour(hours: number): Stage {
  if (hours >= 5 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 17) return 'afternoon';
  if (hours >= 17 && hours < 21) return 'evening';
  return 'night';
}

export function currentStage(now = new Date()): Stage {
  return stageForHour(now.getHours());
}

/** Formats a Date the way the extension's default clock does: 24h, no seconds. */
export function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * A representative clock time for each stage, used once scroll takes over from
 * real time. Mid-stage rather than the boundary, so the displayed hour always
 * sits comfortably inside the greeting it is paired with.
 */
export const STAGE_CLOCK: Record<Stage, string> = {
  morning: '08:20',
  afternoon: '14:05',
  evening: '19:40',
  night: '23:15',
};
