import { useFocusTimer } from '../../contexts/FocusTimerContext';
import { Clock } from '../clock/Clock';

export function FocusOverlay() {
  const { active, remaining, stop } = useFocusTimer();

  if (!active) return null;

  return (
    <div className="focus-overlay">
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
