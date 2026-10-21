import { useEffect, useState } from 'react';

const KEY = 'windom-motion-paused';

/**
 * Lets the visitor stop the ambient motion.
 *
 * Separate from the OS reduced-motion setting and deliberately so: that is a
 * standing preference, this is for someone who wants to read the page right now
 * without the background moving. A page with this much ambient movement should
 * offer the choice rather than assume nobody minds.
 *
 * The preference persists, because having to find this control on every visit
 * would defeat it.
 */
export function useMotionPaused(): [boolean, () => void] {
  const [paused, setPaused] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      // Private browsing, or site data blocked. Default to motion on.
      return false;
    }
  });

  useEffect(() => {
    document.body.classList.toggle('motion-paused', paused);
    try {
      localStorage.setItem(KEY, paused ? '1' : '0');
    } catch {
      // Not being able to remember the choice is not a reason to ignore it.
    }
  }, [paused]);

  return [paused, () => setPaused((p) => !p)];
}

export function MotionToggle({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="motion-toggle"
      onClick={onToggle}
      aria-pressed={paused}
    >
      <span aria-hidden="true">{paused ? '▶' : '❙❙'}</span>
      {paused ? 'Play motion' : 'Pause motion'}
    </button>
  );
}
