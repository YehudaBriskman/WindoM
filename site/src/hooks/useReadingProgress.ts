import { useEffect, type RefObject } from 'react';
import { readingFraction } from '../lib/readingProgress';

/**
 * Drives the reading rail: the hairline across the top of a docs page that
 * fills as you read it.
 *
 * It measures from the top of `start` to the bottom of `end` - the page's
 * heading through the last paragraph - and nothing after: not the previous/next
 * links, not the footer. See `readingFraction` for why the document's own
 * scroll height is the wrong thing to measure.
 *
 * The fraction is written straight onto the rail as `--read`, never into React
 * state. It changes on most frames of a scroll, and a progress readout that
 * re-rendered the page sixty times a second would cost more than the bar is
 * worth. Writes are skipped when the rounded value has not changed.
 *
 * It keeps working under `prefers-reduced-motion`. That setting is about
 * movement the page makes on its own; this is a readout of where the reader
 * has scrolled to, and there is no easing on it, so it can never lie about
 * where they are.
 *
 * Images and fonts settle after first paint and change the article's height,
 * so both ends are observed for size changes as well as the window for scroll
 * and resize.
 */
export function useReadingProgress(
  rail: RefObject<HTMLElement | null>,
  start: RefObject<HTMLElement | null>,
  end: RefObject<HTMLElement | null>,
  /** Anything that means a different page: re-measures when it changes. */
  key: string,
): void {
  useEffect(() => {
    const el = rail.current;
    if (!el) return;

    let frame = 0;
    let last = -1;

    const measure = () => {
      frame = 0;
      const a = start.current;
      const b = end.current;
      if (!a || !b) return;
      const top = a.getBoundingClientRect().top;
      const bottom = b.getBoundingClientRect().bottom;
      const value = readingFraction(top, bottom - top, window.innerHeight);
      if (value === last) return;
      last = value;
      el.style.setProperty('--read', String(value));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const remeasure = () => {
      last = -1;
      schedule();
    };

    // Before the first paint, so a page opened mid-article never starts at zero.
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', remeasure);

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(remeasure) : null;
    if (observer) {
      if (start.current) observer.observe(start.current);
      if (end.current) observer.observe(end.current);
    }

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', remeasure);
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [rail, start, end, key]);
}
