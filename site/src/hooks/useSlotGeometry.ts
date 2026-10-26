import { useEffect } from 'react';

/**
 * Publishes where each slot is, as custom properties the stylesheet can read.
 *
 * The card is one fixed element that moves between positions the layout
 * defines - the box beside the hero copy, the whole viewport, and whatever a
 * later section asks for. Those positions cannot be written in CSS because
 * they come from a grid that resolves differently at every width, and they
 * cannot be interpolated in JavaScript without running code on every frame.
 *
 * So the division is: JavaScript measures, CSS animates. Each slot's rect is
 * written to `--slot-<id>-{x,y,w}` on the scope element, and the keyframes
 * driving the card use those properties as their endpoints. Changing a
 * property re-targets a running scroll-driven animation immediately, so a
 * resize is one measurement rather than a new animation.
 *
 * Measured on mount and on resize only. Nothing here runs while scrolling.
 */

export interface Slot {
  id: string;
  /** Measured against the document, so the value does not move with scroll. */
  element: HTMLElement | null;
  /**
   * Fills the viewport instead of the element's own box. The element is then
   * only a scroll length - which is what the pinned day stage is.
   */
  full?: boolean;
}

export function useSlotGeometry(
  scopeRef: React.RefObject<HTMLElement | null>,
  slots: Slot[],
): void {
  // The slot elements are refs that change identity on every render, so the
  // dependency is the shape of the list rather than the list itself.
  const key = slots.map((s) => `${s.id}${s.full ? ':full' : ''}`).join('|');

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const measure = () => {
      for (const slot of slots) {
        const el = slot.element;
        if (!el && !slot.full) continue;

        let x: number;
        let y: number;
        let w: number;

        if (slot.full) {
          // The card fills the window. Width comes from the documentElement
          // rather than innerWidth so a scrollbar is excluded - using
          // innerWidth makes the card that much too wide and reintroduces the
          // horizontal overflow this whole card was rebuilt to remove.
          x = 0;
          y = 0;
          w = document.documentElement.clientWidth;
        } else {
          const rect = el!.getBoundingClientRect();
          x = rect.left;
          // Document coordinates. The card's first keyframe is used at scroll
          // zero, where document and viewport coordinates agree, and every
          // later keyframe is a position it travels to rather than one it has
          // to hold - so a value that does not move with scroll is the stable
          // one to publish.
          y = rect.top + window.scrollY;
          w = rect.width;
        }

        scope.style.setProperty(`--slot-${slot.id}-x`, `${Math.round(x)}px`);
        scope.style.setProperty(`--slot-${slot.id}-y`, `${Math.round(y)}px`);
        scope.style.setProperty(`--slot-${slot.id}-w`, `${Math.round(w)}px`);
      }
      // Tells the stylesheet the properties are real, so the card can leave
      // its unmeasured resting state.
      scope.dataset.measured = 'true';
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    for (const slot of slots) if (slot.element) observer.observe(slot.element);

    // Fonts land after first paint and change the hero's height, which moves
    // the slot beneath it. Without this the card is measured against a layout
    // that no longer exists by the time anyone sees it.
    document.fonts?.ready.then(measure).catch(() => {});

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, scopeRef]);
}
