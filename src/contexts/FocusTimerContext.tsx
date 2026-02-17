import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

interface FocusTimerContextValue {
  active: boolean;
  remaining: string;
  start: (minutes: number) => void;
  stop: () => void;
}

const FocusTimerContext = createContext<FocusTimerContextValue | null>(null);

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [remaining, setRemaining] = useState('');
  const endTimeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActive(false);
    setRemaining('');
    document.body.classList.remove('focus-active');
  }, []);

  const start = useCallback((minutes: number) => {
    endTimeRef.current = Date.now() + minutes * 60_000;
    document.body.classList.add('focus-active');
    setActive(true);

    const tick = () => {
      const left = endTimeRef.current - Date.now();
      if (left <= 0) {
        stop();
        return;
      }
      const totalMin = Math.ceil(left / 60_000);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      setRemaining(h > 0 ? `${h}h ${String(m).padStart(2, '0')}m remaining` : `${m}m remaining`);
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
  }, [stop]);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return (
    <FocusTimerContext.Provider value={{ active, remaining, start, stop }}>
      {children}
    </FocusTimerContext.Provider>
  );
}

export function useFocusTimer() {
  const ctx = useContext(FocusTimerContext);
  if (!ctx) throw new Error('useFocusTimer must be used within FocusTimerProvider');
  return ctx;
}
