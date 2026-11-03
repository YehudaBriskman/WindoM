import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { nearestScrollTop, pickActiveIndex } from '../lib/scrollspy';

/**
 * Which heading the reader is currently under, and a way to say "this one" on
 * a click.
 *
 * A scroll-position spy rather than the IntersectionObserver it replaced. The
 * observer collapsed the viewport to a band with a hardcoded `-120px` top and
 * reported only when a heading crossed one of the band's edges; between those
 * moments it fell back to "the last heading above the viewport's top edge",
 * which excluded every heading that had slid under the ~114px sticky chrome
 * but not yet off the screen. So the previous section stayed marked for the
 * first stretch of every new one - the lag a reader saw. Measured on /guide
 * at 1440x900: 26 of 31 sampled scroll positions marked the wrong item.
 *
 * Now every scroll (passive, coalesced to one read per frame) and resize asks
 * the one question directly: which is the last heading at or above the reading
 * line? The line is read from the headings' own `scroll-margin-top`, which is
 * `--chrome-h` plus the landing gap in docs.css - the exact spot a heading is
 * put when its rail link is followed - so the rail and the anchor jump cannot
 * disagree, and there is no pixel count here to drift from the CSS.
 *
 * The cost is one `getBoundingClientRect` per heading per frame while
 * scrolling: a few dozen reads, no writes, on pages with at most ~30 headings.
 */
export function useActiveHeading(ids: string[]): {
  active: string | undefined;
  /** Mark a heading now, ahead of the smooth scroll that will reach it. */
  select: (id: string) => void;
} {
  const [active, setActive] = useState<string | undefined>(ids[0]);
  /** Set by a click, held until the scroll that click started has settled. */
  const pinned = useRef<{ id: string; settled: boolean } | null>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const key = ids.join('|');

  useEffect(() => {
    if (!ids.length) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const els = ids.map((id) => document.getElementById(id));
      const first = els.find((el): el is HTMLElement => el !== null);
      if (!first) return;

      // Resolved px of calc(var(--chrome-h) + var(--s-4)), plus a pixel or
      // two for a smooth scroll that lands on a fractional offset.
      const line = parseFloat(getComputedStyle(first).scrollMarginTop) + 2;
      const root = document.documentElement;
      const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= root.scrollHeight - 2;
      const tops = els.map((el) => (el ? el.getBoundingClientRect().top : Infinity));
      const index = pickActiveIndex(tops, line, atBottom);
      if (index >= 0) setActive(ids[index]);
    };

    const onScroll = () => {
      const pin = pinned.current;
      if (pin) {
        if (!pin.settled) {
          // Still travelling to the clicked heading: keep its mark and wait
          // for the scroll to go quiet.
          window.clearTimeout(settleTimer.current);
          settleTimer.current = window.setTimeout(() => {
            if (pinned.current) pinned.current.settled = true;
          }, 140);
          return;
        }
        // The reader has scrolled on their own since; follow them again. This
        // is what keeps a click on a short final section marked even though
        // its heading cannot scroll up to the line.
        pinned.current = null;
      }
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    const onResize = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer.current);
    };
    // The ids are derived from the page's own headings, so this re-runs on a
    // route change and on nothing else.
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const select = useCallback((id: string) => {
    pinned.current = { id, settled: false };
    window.clearTimeout(settleTimer.current);
    // Released even if the click starts no scroll at all (already there).
    settleTimer.current = window.setTimeout(() => {
      if (pinned.current) pinned.current.settled = true;
    }, 140);
    setActive(id);
  }, []);

  return { active, select };
}

/**
 * Scrolls `container` just far enough to show `item`, and never the page.
 *
 * For a sticky panel taller than the viewport: as the mark moves down a long
 * contents list, the list follows it instead of leaving it below the fold.
 */
export function keepInView(container: HTMLElement | null, item: Element | null | undefined): void {
  if (!container || !item || container.scrollHeight <= container.clientHeight) return;
  const box = container.getBoundingClientRect();
  const rect = item.getBoundingClientRect();
  const itemTop = rect.top - box.top - container.clientTop + container.scrollTop;
  const next = nearestScrollTop(container.scrollTop, container.clientHeight, itemTop, rect.height, 24);
  if (next !== null) container.scrollTop = next;
}

/** Keeps the item matching `selector` inside `ref` visible whenever `active` moves. */
export function useKeepActiveInView(
  ref: RefObject<HTMLElement | null>,
  selector: string,
  active: string | undefined,
): void {
  useEffect(() => {
    const container = ref.current;
    keepInView(container, container?.querySelector(selector));
  }, [ref, selector, active]);
}
