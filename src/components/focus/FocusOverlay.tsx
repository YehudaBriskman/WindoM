import { useFocusTimer } from '../../contexts/FocusTimerContext';
import { Clock } from '../clock/Clock';

export function FocusOverlay() {
  const { phase, remaining, stop } = useFocusTimer();

  if (phase === 'idle') return null;

  return (
    <div className={`focus-overlay ${phase}`}>
      <Clock />
      <div className="focus-remaining text-shadow-sm">
        {remaining}
      </div>
      <button onClick={stop} className="focus-stop-btn">
        Stop Focus
      </button>
    </div>
  );
}
