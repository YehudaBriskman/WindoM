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
 *
 * ## Why the vertical coordinate is not simply the element's position
 *
 * The card is `position: fixed`, so its coordinates are relative to the
 * viewport - but a slot's position in the document says nothing about where
 * the viewport will be when the card arrives there. Publishing document
 * coordinates works for the first slot only, because the card is there at
 * scroll zero where the two agree; for a slot eight thousand pixels down it
 * puts the card eight thousand pixels below the window.
 *
 * So each slot publishes the position the card should hold **at the moment
 * its leg of the journey finishes**, which the timeline already defines:
 *
 * - every leg is driven by its destination's `view-timeline`, over
 *   `entry 0%` to `entry 100%`;
 * - `entry 100%` is the scroll at which that section's top reaches the top
 *   of the viewport, which is its own document offset;
 * - `entry 0%` is one viewport earlier.
 *
 * Subtracting that scroll from the target's document position gives the
 * viewport coordinate the card needs. It is the one piece of arithmetic in
 * the engine, and getting it wrong is invisible until a later slot exists -
 * which is exactly how it was found.
 */

export interface Slot {
  id: string;
  /** The section. Its `view-timeline` drives the leg that arrives here. */
  element: HTMLElement | null;
  /**
   * Where inside the section the card should land. Defaults to the section
   * itself, which is what the hero wants; a tall section that only hosts the
   * card for part of its length marks the box explicitly.
   */
  target: HTMLElement | null;
  /**
   * Fills the viewport instead of a measured box. The section is then only a
   * scroll length - which is what the pinned day stage is.
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
    if (!scope || slots.length === 0) return;

    const measure = () => {
      const viewport = document.documentElement.clientHeight;
      const width = document.documentElement.clientWidth;

      const docTop = (el: HTMLElement | null) =>
        el ? el.getBoundingClientRect().top + window.scrollY : 0;

      /** The scroll position at which the card is at slot `i`. */
      const anchorFor = (i: number): number =>
        i === 0
          ? // The first slot is where the card starts, which is the beginning
            // of the first leg: one viewport before the second slot arrives.
            docTop(slots[1]?.element ?? null) - viewport
          : docTop(slots[i]!.element);

      slots.forEach((slot, i) => {
        const anchor = anchorFor(i);
        let x: number;
        let y: number;
        let w: number;

        if (slot.full) {
          x = 0;
          y = 0;
          // From documentElement rather than innerWidth so a scrollbar is
          // excluded. Using innerWidth makes the card that much too wide and
          // reintroduces the horizontal overflow the card was rebuilt to
          // remove.
          w = width;
        } else {
          const box = slot.target ?? slot.element;
          if (!box) return;
          const rect = box.getBoundingClientRect();
          x = rect.left;
          y = rect.top + window.scrollY - anchor;
          w = rect.width;
        }

        scope.style.setProperty(`--slot-${slot.id}-x`, `${Math.round(x)}px`);
        scope.style.setProperty(`--slot-${slot.id}-y`, `${Math.round(y)}px`);
        scope.style.setProperty(`--slot-${slot.id}-w`, `${Math.round(w)}px`);
      });

      // Tells the stylesheet the properties are real, so the card can leave
      // its unmeasured resting state.
      scope.dataset.measured = 'true';
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    for (const slot of slots) {
      if (slot.element) observer.observe(slot.element);
      if (slot.target && slot.target !== slot.element) observer.observe(slot.target);
    }

    // Fonts land after first paint and change the hero's height, which moves
    // every slot beneath it. Without this the card is measured against a
    // layout that no longer exists by the time anyone sees it.
    document.fonts?.ready.then(measure).catch(() => {});

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, scopeRef]);
}
