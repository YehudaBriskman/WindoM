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
  | 'gmail'
  | 'recent'
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
    spotlight: ['calendar', 'todos', 'weather', 'gmail'],
  },
  afternoon: {
    stage: 'afternoon',
    greeting: 'Good afternoon',
    wallpaper: '/images/day-afternoon.webp',
    scene: 'Sunlight scattering across open water',
    tint: 'var(--noon)',
    headline: 'The things you keep checking',
    body: 'Markets, the pull request you are waiting on, the weather for the walk home. Pulled in from the sources you already use, with no extra tab to keep open.',
    spotlight: ['finance', 'github', 'weather', 'recent'],
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

/** Mid-stage clock times. Each is the hour its stage is anchored to. */
export const STAGE_CLOCK: Record<Stage, string> = {
  morning: '08:20',
  afternoon: '14:05',
  evening: '19:40',
  night: '23:15',
};

/** Minutes past midnight, for interpolating between the anchors above. */
function minutesOf(clock: string): number {
  const [h = '0', m = '0'] = clock.split(':');
  return Number(h) * 60 + Number(m);
}

/**
 * The anchors as minutes, bracketed by an extra stop at either end.
 *
 * The outer two are extrapolation anchors rather than times anyone sees: the
 * anchors sit at stage midpoints, so the first and last half-stage need
 * something to interpolate towards. In practice the scroll runs 07:30 to 23:37.
 */
const CLOCK_STOPS = [
  minutesOf('06:40'),
  ...STAGES.map((s) => minutesOf(STAGE_CLOCK[s])),
  minutesOf('23:59'),
];

/**
 * The time of day at a point in the scroll, as a continuous value.
 *
 * Reading `STAGE_CLOCK[stage]` gave four fixed strings, so the clock teleported
 * hours in a single frame at each stage boundary while the wallpaper behind it
 * cross-faded over a second. The picture glided and the numbers jumped, and
 * that mismatch is most of what read as jumpiness.
 *
 * Interpolated piecewise between the stage anchors rather than linearly across
 * the whole day: each stage still reads exactly its anchor time at its
 * midpoint - which is what the copy beside it is written against - and the
 * minutes simply advance in between. The extra stop at either end means the
 * clock is already moving as the first stage arrives and keeps moving out of
 * the last, instead of sitting still at the extremes.
 */
export function clockForProgress(progress: number): string {
  const clamped = Math.min(Math.max(progress, 0), 1);

  // Anchors sit at stage midpoints, so the usable span runs from the first
  // midpoint to the last with half a stage of run-up at either end.
  const span = 1 / STAGES.length;
  const position = clamped / span + 0.5; // 0.5 .. STAGES.length + 0.5
  const index = Math.min(Math.floor(position), CLOCK_STOPS.length - 2);
  const within = position - index;

  const from = CLOCK_STOPS[index] ?? CLOCK_STOPS[0]!;
  const to = CLOCK_STOPS[index + 1] ?? from;
  const minutes = Math.round(from + (to - from) * Math.min(Math.max(within, 0), 1));

  const date = new Date(2026, 0, 1, 0, 0, 0);
  date.setMinutes(minutes);
  return formatClock(date);
}

