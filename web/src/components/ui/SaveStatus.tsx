import type { SaveState } from '../../hooks/useSaveStatus';
import './feedback.css';

const TEXT: Record<SaveState, string> = {
  idle: '',
  saved: 'Saved',
  error: 'Couldn’t save. Try again.',
};

/**
 * Quiet inline save outcome. Always mounted, so the polite live region
 * exists before its text changes and screen readers announce it.
 */
export function SaveStatus({ state }: { state: SaveState }) {
  const cls = `save-status${state !== 'idle' ? ' visible' : ''}${state === 'error' ? ' error' : ''}`;
  return (
    <span className={cls} role="status" aria-live="polite">
      {TEXT[state]}
    </span>
  );
}
