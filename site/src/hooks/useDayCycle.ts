import { useEffect, useRef, useState } from 'react';
import { STAGES, currentStage, formatClock, clockForProgress, type Stage } from '../lib/day';

/**
 * How far past a stage boundary the scroll must travel before the stage
 * changes, in stage widths. Small enough to be imperceptible, large enough to
 * absorb trackpad jitter sitting on a threshold.
 */
const STAGE_COMMIT_MARGIN = 0.04;

/** Whether the visitor has asked the OS for less motion. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof matchMedia === 'function'
      ? matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

export interface DayCycle {
  /** Which of the four stages is showing. */
  stage: Stage;
  /** Clock face text - the visitor's real time until scroll takes over. */
  clock: string;
  /** True while still showing real local time, which the hero copy leans on. */
  live: boolean;
}

/**
 * Drives the stage from scroll position, starting from the visitor's real time.
 *
 * The page opens honest: their actual clock, their actual greeting. Only once
 * they scroll past the stage does the narrative take over. That ordering is the
 * point - if it opened on an arbitrary stage, the hero would be a mock-up rather
 * than a working tab.
 *
 * Returns the real stage and never advances when motion is reduced or paused.
 */
export function useDayCycle(enabled: boolean): DayCycle {
  const [stage, setStage] = useState<Stage>(() => currentStage());
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const [live, setLive] = useState(true);
  const liveRef = useRef(true);

  // Real clock. Kept running even after scroll takes over, so returning to the
  // top shows the true time again rather than a frozen one.
  useEffect(() => {
    const id = setInterval(() => {
      if (liveRef.current) setClock(formatClock(new Date()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!enabled) {
      // Reduced motion or paused: hold the visitor's real time of day.
      liveRef.current = true;
      setLive(true);
      setStage(currentStage());
      setClock(formatClock(new Date()));
      return;
    }

    let frame = 0;

    const read = () => {
      frame = 0;
      const stageEl = document.getElementById('day-stage');
      if (!stageEl) return;

      // Progress through the pinned stage: 0 at the top, 1 when its tall
      // container has fully passed. The container is sized in CSS, so the pacing
      // is tunable without touching this.
      const rect = stageEl.getBoundingClientRect();
      const total = stageEl.offsetHeight - window.innerHeight;
      const progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;

      if (progress <= 0.02) {
        // Back at the top: hand control back to the real clock.
        if (!liveRef.current) {
          liveRef.current = true;
          setLive(true);
          setStage(currentStage());
          setClock(formatClock(new Date()));
        }
        return;
      }

      liveRef.current = false;
      setLive(false);

      /**
       * The stage is committed with a margin, the clock is not.
       *
       * A bare `Math.floor(progress * STAGES.length)` flips the moment progress
       * crosses a boundary, so a scroll that settles on one - or a trackpad
       * that jitters either side of it - swapped the stage back and forth and
       * restarted the cross-fades each time. Requiring the boundary to be
       * cleared by a margin before committing means the stage changes once.
       *
       * The clock has no such threshold on purpose: it is continuous now, and
       * holding it back would reintroduce the stepping this replaced.
       */
      const exact = progress * STAGES.length;
      const index = Math.min(Math.floor(exact), STAGES.length - 1);
      const settled = STAGES[index] ?? 'morning';
      const withinBoundary = Math.abs(exact - Math.round(exact)) < STAGE_COMMIT_MARGIN;

      setStage((current) => (withinBoundary && current !== settled ? current : settled));
      setClock(clockForProgress(progress));
    };

    // rAF-coalesced: the old site's feature-card handler wrote styles
    // synchronously on every scroll event, which is the mistake not to repeat.
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [enabled]);

  return { stage, clock, live };
}
