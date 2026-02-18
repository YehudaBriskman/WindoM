import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

// Phases for sequential enter/exit animations:
//   idle → entering (UI fades out) → entering-overlay (overlay fades in) → active
//   active → exiting-overlay (overlay fades out) → exiting (UI fades in) → idle
// Background zoom spans the full enter/exit duration (3s).
export type FocusPhase = 'idle' | 'entering' | 'entering-overlay' | 'active' | 'exiting-overlay' | 'exiting';

interface FocusTimerContextValue {
  phase: FocusPhase;
  remaining: string;
  start: (minutes: number) => void;
  stop: () => void;
}

const FocusTimerContext = createContext<FocusTimerContextValue | null>(null);

const STEP_MS = 1500;

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<FocusPhase>('idle');
  const [remaining, setRemaining] = useState('');
  const endTimeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const transitionRef = useRef<ReturnType<typeof setTimeout>>();
  const transitionRef2 = useRef<ReturnType<typeof setTimeout>>();

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (transitionRef.current) clearTimeout(transitionRef.current);
    if (transitionRef2.current) clearTimeout(transitionRef2.current);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (transitionRef.current) clearTimeout(transitionRef.current);
    if (transitionRef2.current) clearTimeout(transitionRef2.current);

    // Step 1: overlay fades out + background starts zooming back (3s)
    setPhase('exiting-overlay');
    document.body.classList.remove('focus-active', 'focus-entering', 'focus-entering-overlay');
    document.body.classList.add('focus-exiting-overlay');
    document.getElementById('bg-zoom-layer')?.classList.remove('zoomed'); // background zoom-out starts (3s)

    // Step 2: after overlay gone, UI fades back in
    transitionRef.current = setTimeout(() => {
      document.body.classList.remove('focus-exiting-overlay');
      document.body.classList.add('focus-exiting');
      setPhase('exiting');

      // Step 3: after UI faded in, done
      transitionRef2.current = setTimeout(() => {
        document.body.classList.remove('focus-exiting');
        setPhase('idle');
        setRemaining('');
      }, STEP_MS);
    }, STEP_MS);
  }, []);

  const start = useCallback((minutes: number) => {
    endTimeRef.current = Date.now() + minutes * 60_000;

    // Step 1: UI fades out + background starts zooming in (3s)
    setPhase('entering');
    document.body.classList.add('focus-entering');
    document.getElementById('bg-zoom-layer')?.classList.add('zoomed'); // zoom starts (3s)

    // Step 2: after UI gone, overlay fades in
    transitionRef.current = setTimeout(() => {
      document.body.classList.remove('focus-entering');
      document.body.classList.add('focus-entering-overlay');
      setPhase('entering-overlay');

      // Step 3: after overlay visible, settle into active
      transitionRef2.current = setTimeout(() => {
        document.body.classList.remove('focus-entering-overlay');
        document.body.classList.add('focus-active');
        setPhase('active');
      }, STEP_MS);
    }, STEP_MS);

    const tick = () => {
      const left = endTimeRef.current - Date.now();
      if (left <= 0) {
        stop();
        return;
      }
      const totalSec = Math.ceil(left / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setRemaining(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
  }, [stop]);

  useEffect(() => () => {
    clearTimers();
  }, [clearTimers]);

  return (
    <FocusTimerContext.Provider value={{ phase, remaining, start, stop }}>
      {children}
    </FocusTimerContext.Provider>
  );
}

export function useFocusTimer() {
  const ctx = useContext(FocusTimerContext);
  if (!ctx) throw new Error('useFocusTimer must be used within FocusTimerProvider');
  return ctx;
}
