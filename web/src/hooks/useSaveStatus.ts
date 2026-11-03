import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveState = 'idle' | 'saved' | 'error';

const SAVED_MS = 1_600;
const ERROR_MS = 4_000;

/**
 * Tracks the outcome of one save so a component can say "Saved" or
 * "Couldn't save" briefly beside the field. `track` awaits the save and
 * returns whether it succeeded; a rejection or a `false` result is a failure.
 */
export function useSaveStatus() {
  const [state, setState] = useState<SaveState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback((next: Exclude<SaveState, 'idle'>) => {
    clearTimeout(timer.current);
    setState(next);
    timer.current = setTimeout(() => setState('idle'), next === 'error' ? ERROR_MS : SAVED_MS);
  }, []);

  const track = useCallback(
    async (save: () => unknown): Promise<boolean> => {
      try {
        const ok = (await save()) !== false;
        show(ok ? 'saved' : 'error');
        return ok;
      } catch (error) {
        console.error('[WindoM] save failed:', error);
        show('error');
        return false;
      }
    },
    [show],
  );

  return { state, track };
}
