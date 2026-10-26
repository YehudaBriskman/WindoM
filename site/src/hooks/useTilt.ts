import { useEffect, useRef } from 'react';

/**
 * Tilts an element in 3D toward the pointer.
 *
 * The product shot is a flat image of something that is not flat, and a still
 * rectangle beside a moving page reads as a screenshot. Leaning it toward the
 * cursor makes it an object sitting in the page rather than a picture pasted
 * onto it.
 *
 * The rotation is written to custom properties rather than to `transform`
 * directly, so the stylesheet keeps control of how they compose - the preview
 * also carries a scale and a translate, and a hook that owned the whole
 * transform would have to know about both.
 */

interface TiltOptions {
  /** Maximum rotation in degrees at the far edge. */
  max?: number;
  /** How far outside the element the pointer still has an effect, in pixels. */
  reach?: number;
}

export function useTilt<T extends HTMLElement>({ max = 7, reach = 240 }: TiltOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Honour the OS setting. A 3D tilt following the cursor is exactly the kind
    // of motion the preference exists to suppress.
    const query = typeof matchMedia === 'function'
      ? matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    if (query?.matches) return;

    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    const apply = () => {
      frame = 0;
      if (!pending) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;

      // -1 .. 1 across the element, continuing past its edges so the tilt eases
      // off with distance rather than snapping to neutral at the boundary.
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (pending.x - cx) / (rect.width / 2 + reach);
      const dy = (pending.y - cy) / (rect.height / 2 + reach);

      const clamp = (v: number) => Math.max(-1, Math.min(1, v));

      // Y rotation follows horizontal travel, X rotation follows vertical, and
      // X is inverted: pointer above the centre should tip the top away.
      el.style.setProperty('--tilt-y', `${(clamp(dx) * max).toFixed(2)}deg`);
      el.style.setProperty('--tilt-x', `${(-clamp(dy) * max).toFixed(2)}deg`);
    };

    const onPointerMove = (event: PointerEvent) => {
      // Keyed off the event rather than a `(pointer: fine)` media query. The
      // query describes the *primary* input, so a laptop with a touchscreen can
      // report coarse while being driven by a mouse - and on a touch device
      // pointermove fires throughout a scroll, which would tilt the card as the
      // page moved under the finger.
      if (event.pointerType !== 'mouse') return;

      pending = { x: event.clientX, y: event.clientY };
      // Coalesced to one write per frame. The naive version writes a style on
      // every pointer event, which on a high-polling mouse is several times a
      // frame and forces layout each time.
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      pending = null;
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('blur', reset);
    document.addEventListener('pointerleave', reset);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('blur', reset);
      document.removeEventListener('pointerleave', reset);
    };
  }, [max, reach]);

  return ref;
}
