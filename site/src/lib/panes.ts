import type { Pane } from './day';

/**
 * What each widget in the tab is showing.
 *
 * This used to live inline in `Stage.tsx` as literal JSX - the temperature, the
 * three market rows, the todo list, the track title. That meant a pane could
 * not be re-skinned, reordered or reused without editing the component, and the
 * stage had no description of its own contents to read.
 *
 * It is deliberately a small vocabulary of shapes rather than one type per
 * widget: a figure with a caption, a list, a set of rows, a track. Every pane
 * the extension has fits one of them, which is what keeps adding a widget to
 * the miniature a data change rather than a component.
 */

export interface PaneRow {
  name: string;
  value: string;
  delta?: string;
  up?: boolean;
}

export type PaneBody =
  /** One large number with a caption or two beneath it. */
  | { kind: 'figure'; figure: string; small?: boolean; lines: string[] }
  /** A checklist. `done` renders struck through. */
  | { kind: 'list'; items: { text: string; done?: boolean }[] }
  /** Name / value / change, as the markets and GitHub panes use. */
  | { kind: 'rows'; rows: PaneRow[] }
  /** Title, subtitle and a progress bar. */
  | { kind: 'track'; title: string; artist: string; progress: number };

export interface PaneSpec {
  id: Pane;
  /** The label across the top of the pane. */
  label: string;
  /** Which depth layer it belongs to - back is ambient, mid is actionable. */
  layer: 'back' | 'mid';
  /**
   * How far the pane rises when you hover it, in rem.
   *
   * Deliberately different for every pane. A uniform lift makes eight panes
   * look like one sheet with a hover state; varying it makes each read as its
   * own object sitting at its own height above the glass. The back layer
   * lifts less than the mid layer, so the depth the parallax already implies
   * is not contradicted by the hover.
   *
   * The numbers are in the card's own coordinates, which the hero shows at
   * roughly a third scale - so the smallest of them has to be large enough to
   * still be visible once divided by three.
   */
  lift: number;
  /**
   * Where the pane sits on the tab, as percentages of the card.
   *
   * Here rather than in eight hand-written CSS rules, because the rules could
   * not see each other: adding two panes last round put `recent` on top of
   * `finance` and `gmail` on top of `todos`, in both columns at once, and
   * nothing could have caught it except looking. A single table can be read
   * down a column and checked.
   *
   * Each column is a ladder of four with a pane's own height (~17%) of
   * clearance, nudged horizontally so the result is a tab rather than a
   * spreadsheet.
   */
  place: { top: string; side: 'left' | 'right'; inset: string };
  body: PaneBody;
}

/**
 * The panes, in the order they are rendered within their layer.
 *
 * Content mirrors the extension closely enough to be recognisable and is
 * deliberately not live: a marketing page that fetches someone's real calendar
 * to decorate itself would be a much worse trade than a plausible mock.
 */
export const PANES: PaneSpec[] = [
  {
    id: 'weather',
    label: 'Weather',
    layer: 'back',
    lift: 0.75,
    place: { top: '11%', side: 'left',  inset: '5%' },
    body: { kind: 'figure', figure: '18°', lines: ['Clear · Tel Aviv'] },
  },
  {
    id: 'finance',
    label: 'Markets',
    layer: 'back',
    lift: 1.1,
    place: { top: '77%', side: 'left',  inset: '6%' },
    body: {
      kind: 'rows',
      rows: [
        { name: 'AAPL', value: '241.80', delta: '+1.2%', up: true },
        { name: 'BTC', value: '98,412', delta: '+3.4%', up: true },
        { name: 'NVDA', value: '183.05', delta: '−0.6%' },
      ],
    },
  },
  {
    id: 'recent',
    label: 'Recent',
    layer: 'back',
    lift: 0.6,
    place: { top: '55%', side: 'left',  inset: '5%' },
    body: {
      kind: 'rows',
      rows: [
        { name: 'github.com', value: 'windom' },
        { name: 'figma.com', value: 'Stage v3' },
      ],
    },
  },
  {
    id: 'todos',
    label: 'Today',
    layer: 'mid',
    lift: 1.65,
    place: { top: '11%', side: 'right', inset: '5%' },
    body: {
      kind: 'list',
      items: [
        { text: 'Ship the release notes' },
        { text: 'Review the open PR' },
        { text: 'Cut v1.4.1', done: true },
      ],
    },
  },
  {
    id: 'calendar',
    label: 'Up next',
    layer: 'mid',
    lift: 1.35,
    place: { top: '55%', side: 'right', inset: '7%' },
    body: {
      kind: 'figure',
      figure: '14:30',
      small: true,
      lines: ['Design review', '17:00 · 1:1'],
    },
  },
  {
    id: 'github',
    label: 'Pull requests',
    layer: 'mid',
    lift: 1.9,
    place: { top: '33%', side: 'left',  inset: '7%' },
    body: { kind: 'figure', figure: '3 open', small: true, lines: ['windom · release gate'] },
  },
  {
    id: 'gmail',
    label: 'Inbox',
    layer: 'mid',
    lift: 1.0,
    place: { top: '33%', side: 'right', inset: '6%' },
    body: { kind: 'figure', figure: '2 new', small: true, lines: ['Unsplash · API limits'] },
  },
  {
    id: 'spotify',
    label: 'Now playing',
    layer: 'mid',
    lift: 1.5,
    place: { top: '77%', side: 'right', inset: '5%' },
    body: { kind: 'track', title: 'Nightports', artist: 'Nikki Nair', progress: 38 },
  },
];

export function panesInLayer(layer: PaneSpec['layer']): PaneSpec[] {
  return PANES.filter((p) => p.layer === layer);
}

/** The quick-links row across the top of the tab. */
export const DOCK = [
  { label: 'Calendar', glyph: '◷' },
  { label: 'GitHub', glyph: '⌥' },
  { label: 'Drive', glyph: '△' },
  { label: 'Spotify', glyph: '♪' },
] as const;

/**
 * The quote at the foot of the tab, and the two corner controls.
 *
 * Small things, and most of what makes the miniature read as a tab someone
 * uses rather than a poster of one: a real new tab always has the settings
 * gear in one corner and the sidebar handle in the other.
 */
export const QUOTE = {
  text: 'Simplicity is the ultimate sophistication.',
  author: 'Leonardo da Vinci',
};
