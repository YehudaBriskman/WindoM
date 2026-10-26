import { useEffect, useRef } from 'react';

/**
 * Leans an element in 3D toward the pointer, anywhere on the page.
 *
 * The product shot is a flat image of something that is not flat, and a still
 * rectangle beside a moving page reads as a screenshot. Leaning it toward the
 * cursor makes it an object sitting in the page rather than a picture pasted
 * onto it.
 *
 * It is applied to the whole cluster - the screen and the cards in front of it
 * - so they turn as one object. The pointer does not have to be over them:
 * the effect falls off with distance, which is what makes the thing feel like
 * it is tracking you across the page rather than reacting to being touched.
 *
 * The rotation is written to custom properties rather than to `transform`
 * directly, so the stylesheet keeps control of how they compose. That is what
 * lets the CSS add them to a resting pose instead of treating square-to-the-
 * viewer as the neutral position.
 */

interface TiltOptions {
  /** Maximum rotation in degrees at the far edge. */
  max?: number;
  /** How far outside the element the pointer still has an effect, in pixels. */
  reach?: number;
}

export function useTilt<T extends HTMLElement>({ max = 7, reach = 320 }: TiltOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const query = typeof matchMedia === 'function'
      ? matchMedia('(prefers-reduced-motion: reduce)')
      : null;

    let frame = 0;
    /** The last known pointer position, kept so the lean can be recomputed
     *  when the element moves underneath a stationary cursor. */
    let pointer: { x: number; y: number } | null = null;

    const clear = () => {
      el.style.removeProperty('--tilt-x');
      el.style.removeProperty('--tilt-y');
    };

    /**
     * Suppressed by the OS preference or by the page's own pause control.
     *
     * Read on every frame rather than captured once: the preference can change
     * while the page is open, and the pause button is a plain class on <body>
     * that this hook would otherwise never hear about. The old version checked
     * `matches` a single time at mount and ignored the pause entirely.
     */
    const suppressed = () =>
      query?.matches === true || document.body.classList.contains('motion-paused');

    const apply = () => {
      frame = 0;
      if (!pointer) return;
      if (suppressed()) {
        clear();
        return;
      }

      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;

      // -1 .. 1 across the element, continuing past its edges so the lean eases
      // off with distance rather than snapping to neutral at the boundary.
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (pointer.x - cx) / (rect.width / 2 + reach);
      const dy = (pointer.y - cy) / (rect.height / 2 + reach);

      const clamp = (v: number) => Math.max(-1, Math.min(1, v));

      // Y rotation follows horizontal travel, X rotation follows vertical, and
      // X is inverted: pointer above the centre should tip the top away.
      el.style.setProperty('--tilt-y', `${(clamp(dx) * max).toFixed(2)}deg`);
      el.style.setProperty('--tilt-x', `${(-clamp(dy) * max).toFixed(2)}deg`);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onPointerMove = (event: PointerEvent) => {
      // Keyed off the event rather than a `(pointer: fine)` media query. The
      // query describes the *primary* input, so a laptop with a touchscreen can
      // report coarse while being driven by a mouse - and on a touch device
      // pointermove fires throughout a scroll, which would lean the card as the
      // page moved under the finger.
      if (event.pointerType !== 'mouse') return;

      pointer = { x: event.clientX, y: event.clientY };
      // Coalesced to one write per frame. The naive version writes a style on
      // every pointer event, which on a high-polling mouse is several times a
      // frame and forces layout each time.
      schedule();
    };

    /**
     * The element moves even when the pointer does not.
     *
     * Scrolling or resizing changes where the cluster sits relative to a
     * stationary cursor, so a lean computed once is wrong immediately after.
     * The previous version listened only for pointer movement, which left the
     * card frozen mid-lean as you scrolled past it.
     */
    const onViewportChange = () => {
      if (pointer) schedule();
    };

    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      pointer = null;
      clear();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onViewportChange, { passive: true });
    window.addEventListener('resize', onViewportChange, { passive: true });
    window.addEventListener('blur', reset);
    document.addEventListener('pointerleave', reset);
    query?.addEventListener('change', reset);

    // The pause control toggles a class on <body>; without this the lean stays
    // wherever it was when the page was paused.
    const paused = new MutationObserver(() => {
      if (suppressed()) clear();
      else schedule();
    });
    paused.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onViewportChange);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('blur', reset);
      document.removeEventListener('pointerleave', reset);
      query?.removeEventListener('change', reset);
      paused.disconnect();
    };
  }, [max, reach]);

  return ref;
}
