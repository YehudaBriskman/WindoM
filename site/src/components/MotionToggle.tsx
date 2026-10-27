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
  /**
   * Starts unpaused, with the stored preference read in the effect below.
   *
   * Reading `localStorage` in the `useState` initialiser instead ran it during
   * the hydration render, and this value is in the markup: it decides the
   * button's own label and `aria-pressed`, and the `is-animated` class on the
   * stage. The HTML is prerendered with motion on, so any returning visitor who
   * had pressed Pause motion hydrated against a tree that disagreed - React
   * threw error #418 (text content did not match) and rebuilt the subtree.
   *
   * This is the same shape as the docs sidebar's remembered collapse, and the
   * same answer: the prerendered default renders first, the preference arrives
   * on mount. One frame of motion for someone who asked for none is the price,
   * and it is cheaper than discarding the server's tree on every visit.
   */
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === '1') setPaused(true);
    } catch {
      // Private browsing, or site data blocked. Motion simply stays on.
    }
  }, []);

  // `document.body` is outside the React tree - the stylesheet hangs the paused
  // state off it so the ambient layers rendered by other components stop too.
  useEffect(() => {
    document.body.classList.toggle('motion-paused', paused);
  }, [paused]);

  /**
   * Written here rather than in an effect on `paused`.
   *
   * An effect would also fire on mount, before the effect above has read the
   * stored value, and would write the `false` default over a stored `'1'` -
   * the fix for the mismatch would have quietly eaten the preference it exists
   * to honour. Only a real press changes what is remembered.
   */
  const toggle = () => {
    setPaused((was) => {
      const next = !was;
      try {
        localStorage.setItem(KEY, next ? '1' : '0');
      } catch {
        // Not being able to remember the choice is not a reason to ignore it.
      }
      return next;
    });
  };

  return [paused, toggle];
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
