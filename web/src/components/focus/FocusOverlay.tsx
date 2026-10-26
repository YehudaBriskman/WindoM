import { useEffect } from 'react';
import { useFocusTimer } from '../../contexts/FocusTimerContext';
import { Clock } from '../clock/Clock';

export function FocusOverlay() {
  const { phase, remaining, stop } = useFocusTimer();

  /**
   * Stopping is only meaningful on the way in or while running.
   *
   * `stop()` clears the timers and restarts the exit sequence from its first
   * step, so calling it again mid-exit would replay the three-second fade from
   * the top. The exit phases are therefore excluded rather than guarded inside
   * `stop()`, which the phase machine owns.
   */
  const dismissible = phase === 'entering' || phase === 'entering-overlay' || phase === 'active';

  /**
   * Escape leaves focus mode, as the guide has always claimed it does.
   *
   * It did not. Focus mode covers the whole viewport and the Stop button was
   * the single way out, so anyone who believed the guide, clicked, and pressed
   * Escape concluded the tab had hung. An overlay with one exit is exactly the
   * case where a keyboard escape matters most.
   */
  useEffect(() => {
    if (!dismissible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') stop();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dismissible, stop]);

  if (phase === 'idle') return null;

  return (
    <div
      className={`focus-overlay ${phase}`}
      onClick={dismissible ? stop : undefined}
    >
      <Clock />
      <div className="focus-remaining text-shadow-sm">
        {remaining}
      </div>
      <button
        // The click already bubbles to the overlay, which stops focus mode. Left
        // explicit so the button still works from the keyboard, and stopped from
        // propagating so one activation does not call stop() twice.
        onClick={(event) => {
          event.stopPropagation();
          stop();
        }}
        className="focus-stop-btn"
      >
        Stop Focus
      </button>
    </div>
  );
}
