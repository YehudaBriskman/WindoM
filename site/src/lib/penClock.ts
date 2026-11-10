/*
 * The pen's clock, as arithmetic. Ported from the portfolio site's
 * `components/motion/penClock.ts` (yehudabriskman.com), numbers unchanged.
 * `Written.tsx` hands each word the range `penRange` returns, and a test can
 * hold the per-word progression without a browser.
 */

/**
 * The slice of the paragraph's clock word `i` of `n` is written across, as
 * percentages. Contiguous and disjoint by construction: word `i` ends exactly
 * where word `i + 1` starts, and the last ends at 100%. Rounded to four
 * places, the same rounding on both ends, so neighbours agree to the digit.
 */
export function penRange(i: number, n: number): [string, string] {
  const at = (k: number) => `${Math.round((k / Math.max(1, n)) * 1e6) / 1e4}%`;
  return [at(i), at(i + 1)];
}

/**
 * The alpha on `--color-fg` an unwritten word rests at (`--pen-muted` in the
 * stylesheet): a quarter ink (the portfolio's value). It is the state of a
 * word the pen has not reached yet, on screen only while the reader scrolls
 * toward it, and every way out of the animation lands at full ink. A test holds
 * it visible (over 1.3:1 on the page background) and a clear step below the ink.
 */
export const PEN_MUTED = 0.25;

/**
 * THE READING WINDOW, the one pair of numbers every pen clock is cut from,
 * as fractions of the window's height from its top: a block starts being
 * written when its top reaches `from` and is finished by the time its bottom
 * reaches `to`. `--read-from` / `--read-to` in written.css are the same numbers
 * for the stylesheet (a test holds them equal).
 */
export const READING = { from: 0.68, to: 0.38 };

/** The clock's `view-timeline-inset`, as fractions of the window: top, then foot. */
export const PEN_INSETS = { top: READING.to, foot: 1 - READING.from };

/**
 * ONE BLOCK AT A TIME, IN DOCUMENT ORDER (two blocks a margin apart must not
 * both be mid-ink).
 *
 * Each block's own clock is its natural window: from its top at
 * `READING.from` to its bottom at `READING.to`, which in scroll distance is
 * `[top − from·V, bottom − to·V]` (positions in the document, `V` the
 * window's height). Two neighbours a paragraph's margin apart overlap by
 * nearly `(from − to)·V` — a third of the window — and both were mid-ink.
 *
 * So the windows are sequenced: each block may not start before the one
 * before it has finished, and must finish by the time the next one is due
 * to start. A block keeps its own start (its top at 68%) whenever the
 * previous one is done by then, which is always unless two blocks sit side
 * by side; and it ends at the earlier of its own end and its successor's
 * start. A block with nothing close below it keeps its whole natural clock;
 * a block in dense prose is written while it crosses the 68% line. Either
 * way at most one block is between muted and ink at any scroll position,
 * and it is the first one in reading order that is not finished.
 *
 * Side by side (two blocks whose starts nearly coincide), the second would
 * get no time at all; each block is given at least `min` of the window, and
 * the next is pushed after it.
 *
 * Returned as each block's share of its natural clock — `lead`, where in it
 * the block starts, and `span`, how much of it the block uses — which is all
 * the stylesheet needs to rescale its words' slices within the block's own
 * view timeline.
 */
export type Span = { top: number; bottom: number };
export type Slot = { lead: number; span: number };

export function sequence(blocks: readonly Span[], viewport: number, min = 0.04, reading = READING): Slot[] {
  const natural = blocks.map((b) => ({ s: b.top - reading.from * viewport, e: b.bottom - reading.to * viewport }));
  const out: Slot[] = [];
  let done = -Infinity;
  natural.forEach(({ s, e }, i) => {
    const length = Math.max(1e-6, e - s);
    const start = Math.max(s, done);
    const due = natural[i + 1]?.s ?? Infinity;
    let end = Math.min(e, Math.max(due, start));
    end = Math.max(end, Math.min(start + min * viewport, start + length));
    done = end;
    out.push({ lead: (start - s) / length, span: (end - start) / length });
  });
  return out;
}

/** The scroll offsets, in the same frame as `sequence`'s input, at which slot `k` is being written. */
export function slotWindow(b: Span, slot: Slot, viewport: number, reading = READING): [number, number] {
  const s = b.top - reading.from * viewport;
  const length = b.bottom - reading.to * viewport - s;
  return [s + slot.lead * length, s + (slot.lead + slot.span) * length];
}

/**
 * Where in the window (0 top, 1 foot) a word `f` of the way through its
 * paragraph (0 first, 1 last) is when it reaches full ink. The clock runs
 * from the paragraph's top at `1 − foot` to its bottom at `top`, a distance
 * of `h + (1 − foot − top)` windows; the word sits `f·h` below the top and
 * is inked at progress `f`, so the `h` cancels: `(1 − foot) − (1 − foot −
 * top)·f`, whatever the paragraph's height.
 */
export function inkedAt(f: number, insets = PEN_INSETS): number {
  const start = 1 - insets.foot;
  return start - (start - insets.top) * f;
}

/** How inked word `i` of `n` is at clock progress `p` (0..1): 0 muted, 1 ink. */
export function inkAt(p: number, i: number, n: number): number {
  const from = i / n;
  const to = (i + 1) / n;
  if (p <= from) return 0;
  if (p >= to) return 1;
  return (p - from) / (to - from);
}
