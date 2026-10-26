import { useEffect, useState } from 'react';

/**
 * Which heading the reader is currently under.
 *
 * The contents rail listed every section and marked none of them, so it told
 * you what a page contained but never where in it you were - which is most of
 * what a rail on a long document is for.
 *
 * An IntersectionObserver rather than a scroll listener: the browser does the
 * geometry off the main thread and reports only when something crosses the
 * line, where a scroll handler would measure every heading on every frame.
 *
 * The root margin collapses the viewport to a band just below the sticky
 * chrome, so "current" means the heading that has most recently passed under
 * the bar rather than whichever one happens to be visible - with a tall
 * viewport several are visible at once, and the topmost is not always the one
 * being read.
 */
export function useActiveHeading(ids: string[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!ids.length || typeof IntersectionObserver !== 'function') return;

    const seen = new Map<string, boolean>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          seen.set(entry.target.id, entry.isIntersecting);
        }

        // The first heading inside the band, in document order. Falling back
        // to the last one above it keeps something marked while the reader is
        // in the body of a long section with no heading on screen.
        const inBand = ids.find((id) => seen.get(id));
        if (inBand) {
          setActive(inBand);
          return;
        }

        const passed = ids.filter((id) => {
          const el = document.getElementById(id);
          return el !== null && el.getBoundingClientRect().top < 0;
        });
        setActive(passed.length ? passed[passed.length - 1] : ids[0]);
      },
      {
        // Top of the band under the chrome, bottom most of the way up the
        // viewport, so a heading becomes current as it reaches reading
        // position rather than as it appears at the bottom edge.
        rootMargin: '-120px 0px -70% 0px',
        threshold: 0,
      },
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
    // The ids are derived from the page's own headings, so this re-runs on a
    // route change and on nothing else.
  }, [ids.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  return active;
}
