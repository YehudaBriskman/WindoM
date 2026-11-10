import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { penRange, READING, sequence } from '../lib/penClock';

/*
 * `pen` — prose that is written as it is read. Ported from the portfolio site's
 * `components/motion/Written.tsx` (yehudabriskman.com), the pen of its /story
 * page and notes reader; the mechanism and every number are the original's.
 *
 * Wrap any block of reading text in this and nothing else: a paragraph, a
 * list item, a markdown body's paragraphs. Every word starts muted, and as the
 * paragraph rises through the window the pen inks it ONE WORD AFTER ANOTHER,
 * in reading order, and leaves what it wrote at full ink — and un-writes it,
 * word by word in the opposite order, if the reader scrolls back up. Scroll is
 * the only clock: nothing here runs on a timer or fires once.
 *
 * THE CLOCK IS A WORD COUNT. Word `i` of `n` owns exactly the slice `i/n` to
 * `(i+1)/n` of the paragraph's clock, ramps from muted to ink across that
 * slice and nothing else, and holds ink after. A clock placed by geometry (a
 * line's offset plus a fraction of a line-height per word) was measured and
 * rejected: about five words were mid-ramp at once and a whole line was
 * written in a third of a mouse-wheel notch. By word count, at any scroll
 * position at most ONE word is between muted and ink, every word before it is
 * at ink and every word after it is muted, and the slices tile the clock with
 * no gap and no overlap, across line breaks too (`penClock.ts`).
 *
 * The clock (`written.css`) runs from the paragraph's top reaching 68% of the
 * window's height to its bottom reaching 38%: the READING WINDOW, `READING` in
 * `penClock.ts` and `--read-from` / `--read-to` in index.css.
 *
 * ONE BLOCK AT A TIME. That natural clock is `h + 30vh` of scroll, so two
 * paragraphs a margin apart would share a third of the window and both be
 * mid-ink. The sequencer below (`sequence` in `penClock.ts`) reads every live
 * block's place on the page and cuts each one's clock down to its own turn,
 * written as `--pen-lead` and `--pen-span` on the block; the stylesheet
 * rescales every word's slice into that part of the block's own view timeline.
 *
 * The words keep one animation each, on purpose: one registered number
 * animated on the paragraph and read by every word through inheritance was
 * measured at 16.8ms of style a frame against 3.0ms for this.
 *
 * The index is known at render time, so there is no measurement of lines: a
 * resize, a font swap or a different wrap cannot desynchronise it. Logical
 * order is DOM order, which is the reading order in a Hebrew paragraph, in
 * English under `dir="rtl"` and for an English word inside a Hebrew line alike.
 *
 * WHAT A SPLIT MUST NOT BREAK: the accessible text stays one string, the copied
 * text stays one string (the spaces are the original text nodes and the spans
 * add no characters), and a word never breaks across lines.
 *
 * A WORD HERE IS AN INLINE SPAN AND NEVER AN INLINE-BLOCK. The effect is
 * colour, and `color` applies to an inline box perfectly well. An inline-block
 * is an atomic inline the bidi algorithm treats as a neutral object character
 * (a run of them in an RTL paragraph is laid out right to left, and an
 * English word in a Hebrew line lands out of order); and it is a break
 * opportunity on each side. An inline span with `unicode-bidi: normal` is
 * invisible to both.
 *
 * One `view()` per paragraph, not per word: on an inline box `view()` resolves
 * to the block it is laid out in, so the paragraph names the clock
 * (`--written-clock`) and every word reads it.
 *
 * Two shared observers park paragraphs that are outside the reading zone (see
 * `watch`), and the off-switches are in the stylesheet.
 *
 * Adaptations for WindoM: `body.motion-paused` (this site's Pause) is the off-switch; ink is whatever
 * `--pen-ink` resolves to for the block (body copy, list text, links), and `written.css` is imported by the
 * entry so the prerender does not have to.
 */

/** The elements prose arrives in. A heading is not one by default; `h3` is allowed for a short title written with its text. */
type WrittenTag = 'p' | 'li' | 'dd' | 'div' | 'blockquote' | 'figcaption' | 'h3';

export type WrittenProps = HTMLAttributes<HTMLElement> & {
  as?: WrittenTag;
  children?: ReactNode;
};

/*
 * Elements whose text is not prose and is left exactly as it arrived.
 *
 * Code is the important one: an identifier is read character by character, it
 * has its own ground and its own ink, and an inline `code` span that dimmed
 * and lit with the sentence round it would be the one place a reader could
 * not trust the colour of what they were copying. The rest cannot hold
 * running text at all, or hold text that is not the page's.
 *
 * Matched by tag, and by the `tagName` react-markdown hands its components as
 * `node`, so a markdown body whose `code` is a custom component is still
 * recognised as code. Anything else can opt out with `data-written="off"`.
 */
/* The last row is not in the original: a block element inside a block is a block of its own (a list inside an
   item, a paragraph inside a quote or a loose item), written by its own pen on its own clock, so it is never
   split a second time here. */
const LEAVE = new Set([
  'code',
  'pre',
  'kbd',
  'samp',
  'svg',
  'math',
  'script',
  'style',
  'textarea',
  'select',
  'ul',
  'ol',
  'dl',
  'blockquote',
  'table',
  'p',
  'li',
  'dd',
]);

/*
 * The break opportunities, and only those.
 *
 * ASCII whitespace and not `\s`: `\s` also matches U+00A0, and a no-break
 * space is exactly the character an author types to say *these two words are
 * one unit on the line*, so the pen writes "10 km" as one word.
 */
const BREAK = /([\t\n\f\r ]+)/;

type Walk = { count: number; total: number };

function splitText(text: string, walk: Walk): ReactNode[] {
  return text.split(BREAK).map((part, i) => {
    /* Odd indices are the captured whitespace: returned as the original
       string, so it is a real text node with the real character in it — the
       break opportunity the line needs and the space the clipboard needs. */
    if (i % 2 === 1 || part === '') return part;
    const k = walk.count;
    walk.count += 1;
    const [from, to] = penRange(k, walk.total);
    return (
      <span
        key={i}
        className="written-word"
        data-word=""
        style={{ '--pen-from': from, '--pen-to': to } as CSSProperties}
      >
        {part}
      </span>
    );
  });
}

function tagOf(el: ReactElement): string | undefined {
  if (typeof el.type === 'string') return el.type;
  const node = (el.props as { node?: { tagName?: unknown } }).node;
  return typeof node?.tagName === 'string' ? node.tagName : undefined;
}

function split(children: ReactNode, walk: Walk): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === 'string') return splitText(child, walk);
    if (typeof child === 'number') return splitText(String(child), walk);
    if (!isValidElement(child)) return child;

    const props = child.props as { children?: ReactNode; 'data-written'?: string };
    /* A nested `Written` splits and clocks its own text; its words are on its
       clock, not this one, and are not counted here. */
    if (child.type === Written) return child;
    if (props['data-written'] === 'off') return child;
    const tag = tagOf(child);
    if (tag !== undefined && LEAVE.has(tag)) return child;
    if (props.children === undefined) return child;

    /* Same element, same props, same key — only its text is split. A link
       stays the link, with its href and its handlers, and its name stays its
       text: the spans are inside it, not around it. */
    return cloneElement(child, undefined, split(props.children, walk));
  });
}

/*
 * Two passes: the first counts the words, so the second can hand each one
 * its slice of a clock whose length it now knows. Paragraph-sized work, once
 * per render.
 */
function splitAll(children: ReactNode): ReactNode {
  const count: Walk = { count: 0, total: 1 };
  split(children, count);
  return split(children, { count: 0, total: count.count });
}

/* ------------------------------------------------------- the near-watch -- */

/* The effect only runs where scroll-driven animation does, and not when the reader has paused motion. */
function canRun(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof IntersectionObserver === 'function' &&
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('animation-timeline: view()')
  );
}

/*
 * Which paragraphs are in the reading zone, and the only ones that animate.
 *
 * Measured (motion-contract §2), the cost of `pen` is the number of words
 * animating, not the number split: every animating word's colour is resolved
 * again on every frame its paragraph's clock moves, including words sitting
 * in a fill state that cannot change. So a paragraph outside the zone is told
 * where it is, and the stylesheet stops its animation:
 *
 *   - `below`: not reached yet, so every word is muted — the clock's start;
 *   - `above`: passed, so every word is at ink — the clock's end.
 *
 * Both are exactly the values the animation's own fill would hold there, so
 * crossing in or out of the zone changes nothing a reader can see. The zone
 * is the reading window with 4% of margin either side — from 34% of the
 * window's height to 72% — which contains every block's whole clock (top at
 * 68% to bottom at 38%, or the sequencer's shorter cut of it).
 *
 * TWO OBSERVERS, because one cannot tell `above` from `below` reliably. An
 * observer reports crossings of its own zone, and a jump — a fragment link, a
 * restored scroll position, Home/End — can carry a paragraph from below the
 * window to far above it without ever intersecting the zone, so no callback
 * comes and a paragraph that is now above keeps saying `below`, muted
 * forever. (Found in the screenshots for #158.) So the second observer's zone
 * is everything above the zone's top edge, out to a distance no page reaches:
 * passing the edge in either direction, by any means, crosses it.
 *
 * Fires on crossings, not on scroll. With no attribute at all the paragraph
 * animates, so an observer that never fires leaves the effect running rather
 * than the text stuck.
 */
let near: IntersectionObserver | null = null;
let past: IntersectionObserver | null = null;

function settle(t: HTMLElement) {
  const { penNear, penPast } = t.dataset;
  if (penNear === undefined || penPast === undefined) return;
  t.dataset.pen = penNear === '1' ? 'live' : penPast === '1' ? 'above' : 'below';
}

function observer(key: 'penNear' | 'penPast', rootMargin: string): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const t = e.target as HTMLElement;
        t.dataset[key] = e.isIntersecting ? '1' : '0';
        settle(t);
      }
    },
    { rootMargin },
  );
}

/* The near-watch's zone: the reading window and a margin, as `rootMargin` shares. */
const MARGIN = 0.04;
const ZONE_TOP = Math.round((READING.to - MARGIN) * 100);
const ZONE_FOOT = Math.round((1 - READING.from - MARGIN) * 100);

function watch(el: HTMLElement): () => void {
  if (!canRun()) return () => {};
  near ??= observer('penNear', `-${ZONE_TOP}% 0px -${ZONE_FOOT}% 0px`);
  /* From the zone's top edge upwards, without end. */
  past ??= observer('penPast', `1000000px 0px -${100 - ZONE_TOP}% 0px`);
  near.observe(el);
  past.observe(el);
  blocks.add(el);
  queue();
  return () => {
    near?.unobserve(el);
    past?.unobserve(el);
    blocks.delete(el);
    queue();
  };
}

/* ------------------------------------------------------- the sequencer -- */

/*
 * Every block on the page, and when each one's turn is (see the header and
 * `sequence` in `penClock.ts`).
 *
 * Measured, so re-measured whenever the answer can change: a block arriving
 * or leaving, the document's size changing (a picture, a late font, content
 * from the network), the window's height changing (the reading window is a
 * share of it), and fonts finishing. Coalesced to one pass per task, and it
 * writes two custom properties per block — nothing per frame; the scroll
 * itself is still entirely CSS.
 *
 * A block inside a pinned (sticky or fixed) box is left out and keeps its
 * whole clock: its place on the page moves with the scroll, so a distance
 * measured to it now is not the distance the scroll will travel to it.
 */
const blocks = new Set<HTMLElement>();
let queued = 0;
let sized: ResizeObserver | null = null;

function pinned(el: HTMLElement, seen: Map<Element, boolean>): boolean {
  const chain: Element[] = [];
  let at: Element | null = el.parentElement;
  let found = false;
  while (at && at !== document.body) {
    const known = seen.get(at);
    if (known !== undefined) {
      found = known;
      break;
    }
    chain.push(at);
    const pos = getComputedStyle(at).position;
    if (pos === 'sticky' || pos === 'fixed') {
      found = true;
      break;
    }
    at = at.parentElement;
  }
  for (const c of chain) seen.set(c, found);
  return found;
}

function measure() {
  queued = 0;
  const viewport = window.innerHeight;
  if (!viewport) return;
  const seen = new Map<Element, boolean>();
  const live: HTMLElement[] = [];
  for (const el of blocks) {
    if (!el.isConnected || el.getClientRects().length === 0 || pinned(el, seen)) {
      el.style.removeProperty('--pen-lead');
      el.style.removeProperty('--pen-span');
      continue;
    }
    live.push(el);
  }
  live.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  const spans = live.map((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom };
  });
  sequence(spans, viewport).forEach(({ lead, span }, i) => {
    const el = live[i];
    if (!el) return;
    el.style.setProperty('--pen-lead', `${Math.round(lead * 1e6) / 1e4}%`);
    el.style.setProperty('--pen-span', String(Math.round(span * 1e6) / 1e6));
  });
}

function queue() {
  if (queued || typeof window === 'undefined') return;
  queued = window.setTimeout(measure, 0);
  if (!sized && typeof ResizeObserver === 'function') {
    sized = new ResizeObserver(() => queue());
    sized.observe(document.documentElement);
    window.addEventListener('resize', () => queue(), { passive: true });
    document.fonts?.addEventListener?.('loadingdone', () => queue());
  }
}

/* ------------------------------------------------------------- component -- */

/** `useLayoutEffect` is a no-op in the static prerender; React 19 does not warn, but there is no layout there. */
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function Written({ as = 'p', className = '', children, ...rest }: WrittenProps) {
  const ref = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    return el ? watch(el) : undefined;
  }, []);

  const Tag = as as 'p';
  return (
    <Tag {...rest} ref={ref as Ref<HTMLParagraphElement>} className={`written ${className}`.trimEnd()} data-written="">
      {splitAll(children)}
    </Tag>
  );
}

/*
 * Gives a docs page's prose the pen: every paragraph and list item becomes a
 * `Written` of the same element, with the same props. Walks the element tree,
 * as `anchorHeadings` does, so the prerendered HTML already has the words in
 * their spans and hydration finds the same markup.
 *
 * Left alone: anything in a table (legal clauses and settings tables are read
 * as a grid, not a line), in code, and in a block that opts out with
 * `data-written="off"`. Headings are not prose here; the pen writes the text
 * under them.
 */
const NOT_PROSE = new Set([
  'table',
  'pre',
  'code',
  'kbd',
  'figure',
  'svg',
  'details',
  'summary',
  'button',
  'label',
  'nav',
]);

export function writeProse(node: ReactNode): ReactNode {
  if (Array.isArray(node)) return Children.map(node, writeProse);
  if (!isValidElement(node)) return node;
  const el = node as ReactElement<{ children?: ReactNode; 'data-written'?: string }>;
  if (typeof el.type === 'string' && NOT_PROSE.has(el.type)) return el;
  if (el.props['data-written'] === 'off') return el;
  if (el.props.children === undefined) return el;

  const inner = writeProse(el.props.children);
  if (el.type === 'p' || el.type === 'li') {
    const rest: HTMLAttributes<HTMLElement> = { ...(el.props as HTMLAttributes<HTMLElement>) };
    delete rest.children;
    return (
      <Written as={el.type} {...rest} key={el.key ?? undefined}>
        {inner}
      </Written>
    );
  }
  return cloneElement(el, undefined, inner);
}
