import { useEffect, useRef, useState } from 'react';
import { STAGES, currentStage, formatClock, STAGE_CLOCK, type Stage } from '../lib/day';

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

      const index = Math.min(Math.floor(progress * STAGES.length), STAGES.length - 1);
      const next = STAGES[index] ?? 'morning';
      setStage(next);
      setClock(STAGE_CLOCK[next]);
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
