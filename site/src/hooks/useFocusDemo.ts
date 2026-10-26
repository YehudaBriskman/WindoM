import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The extension's focus timer, run inside the miniature.
 *
 * The phases and their timing are taken from the product rather than invented:
 * `idle → entering → entering-overlay → active` on the way in and
 * `active → exiting-overlay → exiting → idle` on the way out, two steps of
 * 1500ms each way, with the wallpaper's scale transition spanning the whole 3s.
 * The point of the demonstration is that it behaves like the thing it is
 * demonstrating, so the sequence is copied, not approximated.
 *
 * The countdown runs at demo speed. A real 25-minute timer would show the same
 * two digits for a minute at a time, which looks broken in a product shot, so
 * this advances a minute a second - the readout is still `MM:SS` counting down
 * from the duration you picked, just quicker than life.
 */

export type FocusPhase =
  | 'idle'
  | 'entering'
  | 'entering-overlay'
  | 'active'
  | 'exiting-overlay'
  | 'exiting';

const STEP_MS = 1500;
const TICK_MS = 1000;
/** Seconds of shown time per tick, so a minute passes a second. */
const TICK_SECONDS = 60;

export interface FocusDemo {
  phase: FocusPhase;
  /** `MM:SS` counting down, or empty while idle. */
  remaining: string;
  /** True for every phase where the scrim is up or on its way. */
  engaged: boolean;
  start: (minutes: number) => void;
  stop: () => void;
}

function format(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function useFocusDemo(): FocusDemo {
  const [phase, setPhase] = useState<FocusPhase>('idle');
  const [remaining, setRemaining] = useState('');
  const timers = useRef<number[]>([]);
  const tick = useRef<number | undefined>(undefined);

  const clearTimers = useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    if (tick.current !== undefined) clearInterval(tick.current);
    tick.current = undefined;
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    setPhase('exiting-overlay');
    timers.current.push(
      window.setTimeout(() => {
        setPhase('exiting');
        timers.current.push(
          window.setTimeout(() => {
            setPhase('idle');
            setRemaining('');
          }, STEP_MS),
        );
      }, STEP_MS),
    );
  }, [clearTimers]);

  const start = useCallback(
    (minutes: number) => {
      clearTimers();
      let left = minutes * 60;
      setRemaining(format(left));
      setPhase('entering');

      timers.current.push(
        window.setTimeout(() => {
          setPhase('entering-overlay');
          timers.current.push(window.setTimeout(() => setPhase('active'), STEP_MS));
        }, STEP_MS),
      );

      tick.current = window.setInterval(() => {
        left -= TICK_SECONDS;
        setRemaining(format(left));
        if (left <= 0) stop();
      }, TICK_MS);
    },
    [clearTimers, stop],
  );

  // Nothing should outlive the component: a timer still firing after unmount
  // would set state on a tree that is gone, and on a route change this card
  // can be unmounted mid-sequence.
  useEffect(() => clearTimers, [clearTimers]);

  const engaged = phase !== 'idle' && phase !== 'exiting';

  /**
   * Escape leaves, as it does in the extension - but only once there is
   * something to leave. Binding it while idle would mean a key with no visible
   * effect, and binding it during the exit would replay the fade from the top.
   */
  useEffect(() => {
    if (phase !== 'entering' && phase !== 'entering-overlay' && phase !== 'active') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') stop();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, stop]);

  return { phase, remaining, engaged, start, stop };
}
