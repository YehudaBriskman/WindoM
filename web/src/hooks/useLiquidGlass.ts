import { useEffect, useRef } from 'react';
import { Spring } from '../lib/liquid-glass';
import { registerGlassSurface, type GlassKey } from '../lib/glass-registry';
import { fieldFor } from '../components/GlassFilters';
import { rimMaskFor } from '../lib/glass-registry';

/**
 * Makes an element a pane of liquid glass.
 *
 * Two jobs. It measures the element so a displacement field can be generated
 * for that exact geometry, and it drives the specular highlight from a light
 * source that follows the pointer.
 *
 * The light is sprung rather than pinned to the cursor, and that single detail
 * is most of the difference between glass and a decal. A highlight that tracks
 * the pointer exactly reads as a texture painted on the surface. One that lags,
 * overshoots slightly and settles reads as light travelling across something
 * with mass - which is what Apple gets from the gyroscope on a phone, and what
 * a pointer is the honest desktop equivalent of.
 */

type Pane = {
  el: HTMLElement;
  key: GlassKey;
  /** How near the light is to this pane, sprung so it swells and settles. */
  proximity: Spring;
  /**
   * Last known box, cached.
   *
   * Reading `getBoundingClientRect` inside the frame loop forces a synchronous
   * layout, and because the loop also writes custom properties, the sequence
   * became write-read-write-read across every pane on every frame - the
   * browser re-laying-out six times a frame to answer questions whose answers
   * had not changed. Geometry only moves on resize or scroll, so it is read
   * there and only there.
   */
  rect: DOMRect | null;
};

const panes = new Set<Pane>();

// One light for the whole screen, because there is one. Each pane works out its
// own angle to it; a spring per pane would let them disagree about where the
// light is, which is exactly what breaks the illusion.
const viewportW = typeof window === 'undefined' ? 1280 : window.innerWidth;
const viewportH = typeof window === 'undefined' ? 800 : window.innerHeight;
// Stiff and close to critically damped. The first pass used 120/20, which
// takes the better part of a second to arrive - the highlight visibly trailed
// the cursor instead of following it. Light has no inertia; what should lag is
// the *material*, and that is the proximity spring below. This one only needs
// enough softening to avoid looking stapled to the pointer.
//
// Critical damping for k=1400 is 2*sqrt(1400) = 75. Sitting just under it
// settles in about 110ms, which reads as immediate.
const lightX = new Spring(viewportW / 2, 1400, 70);
const lightY = new Spring(-viewportH * 0.3, 1400, 70);

let frame = 0;
let lastTime = 0;
let pointerBound = false;
let reduced = false;

function onPointerMove(event: PointerEvent): void {
  lightX.target = event.clientX;
  lightY.target = event.clientY;
  start();
}

function paint(): void {
  for (const pane of panes) {
    const { el, rect } = pane;
    if (!rect || rect.width === 0 || rect.height === 0) continue;

    // Where the light sits over this pane, as a percentage of its own box.
    // Values run outside 0-100 when the light is off the element, which is
    // wanted: the highlight should slide off the edge rather than stick.
    const px = ((lightX.value - rect.left) / rect.width) * 100;
    const py = ((lightY.value - rect.top) / rect.height) * 100;
    el.style.setProperty('--glass-lx', `${px.toFixed(1)}%`);
    el.style.setProperty('--glass-ly', `${py.toFixed(1)}%`);

    // Distance falls off the rim light: a pane far from the light catches less
    // of it. Normalised against the viewport diagonal so it is resolution
    // independent.
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const diagonal = Math.hypot(window.innerWidth, window.innerHeight);
    const falloff = 1 - Math.min(1, Math.hypot(lightX.value - cx, lightY.value - cy) / diagonal);
    el.style.setProperty('--glass-lit', (0.35 + falloff * 0.65).toFixed(3));

    // Proximity: how far the light is from the pane's own edge, measured in
    // the pane's own terms rather than the viewport's, so a small widget and a
    // full panel both respond when the pointer is the same distance away.
    //
    // This is the local swell. Glass under a fingertip on iOS gathers toward
    // it - the material appears to thicken where it is being touched. Here the
    // same value widens the highlight and lifts the pane, and because it runs
    // through a spring it arrives late and settles rather than snapping.
    const reach = Math.max(120, Math.min(rect.width, rect.height) * 0.9);
    const edgeX = Math.max(rect.left - lightX.value, 0, lightX.value - rect.right);
    const edgeY = Math.max(rect.top - lightY.value, 0, lightY.value - rect.bottom);
    pane.proximity.target = 1 - Math.min(1, Math.hypot(edgeX, edgeY) / reach);
    el.style.setProperty('--glass-prox', pane.proximity.value.toFixed(3));

    // Align this pane's copy of the wallpaper with the real one.
    //
    // `backdrop-filter` will not refract - a displacement map fed by feImage
    // returns nothing there and the backdrop is erased rather than bent. So the
    // rim displaces its own copy of the wallpaper with `filter:`, which does
    // work, and the copy has to be positioned so it lines up with the original
    // behind the pane. #bg-zoom-layer is fixed and covers the viewport, so
    // offsetting the background by the pane's own origin is the whole alignment.
    el.style.setProperty('--glass-wall-x', `${(-rect.left).toFixed(0)}px`);
    el.style.setProperty('--glass-wall-y', `${(-rect.top).toFixed(0)}px`);
  }
}

/**
 * The wallpaper currently behind everything, as a CSS `url(...)`.
 *
 * Read from the live layer rather than from settings: it is the element that
 * actually decides what is on screen, it already handles the default gradient
 * and the local-upload case, and reading it cannot drift out of sync with what
 * the viewer sees.
 */
function wallpaperImage(): string {
  const layer = document.getElementById('bg-zoom-layer');
  if (!layer) return 'none';
  return getComputedStyle(layer).backgroundImage || 'none';
}

function publishWallpaper(): void {
  const image = wallpaperImage();
  const size = `${window.innerWidth}px ${window.innerHeight}px`;
  for (const { el } of panes) {
    el.style.setProperty('--glass-wall', image);
    el.style.setProperty('--glass-wall-size', size);
  }
}

function tick(now: number): void {
  const dt = lastTime ? (now - lastTime) / 1000 : 1 / 60;
  lastTime = now;

  // Paint first so proximity targets are current, then integrate: a pane that
  // has only just come near the light should start moving on this frame.
  paint();
  const lightMoving = [lightX.step(dt), lightY.step(dt)].some(Boolean);
  let paneMoving = false;
  for (const pane of panes) if (pane.proximity.step(dt)) paneMoving = true;
  const moving = lightMoving || paneMoving;

  // Stop once the light has settled. An idle new tab should not hold a frame
  // loop open for a highlight that is no longer moving.
  if (moving) frame = requestAnimationFrame(tick);
  else frame = 0;
}

function start(): void {
  if (frame || reduced) return;
  lastTime = 0;
  frame = requestAnimationFrame(tick);
}

function bindPointer(): void {
  if (pointerBound) return;
  pointerBound = true;

  // Not every environment that renders these components has the full window
  // API - jsdom under test has neither matchMedia nor ResizeObserver. The
  // material is decoration, so it degrades to a fixed light rather than
  // taking the component down with it.
  const query = typeof matchMedia === 'function'
    ? matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  const apply = (): void => {
    reduced = query?.matches ?? true;
    if (reduced) {
      // A fixed light from the upper left: the same material, lit the same way,
      // simply not following anything.
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lightX.snap(window.innerWidth * 0.3);
      lightY.snap(-window.innerHeight * 0.2);
      paint();
    }
  };
  apply();
  query?.addEventListener('change', apply);

  window.addEventListener('pointermove', onPointerMove, { passive: true });
}

/**
 * @param existing a ref the component already holds, when it needs the element
 *   for something of its own. Passing it keeps one ref on the node rather than
 *   two, which JSX will not accept anyway.
 */
export function useLiquidGlass<T extends HTMLElement>(
  key: GlassKey,
  existing?: React.RefObject<T | null>,
): React.RefObject<T | null> {
  const own = useRef<T>(null);
  const ref = existing ?? own;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    bindPointer();
    // Softer than the light, and deliberately so: this is the one thing that
    // should lag. The reflection tracks, the material gathers.
    const pane: Pane = { el, key, proximity: new Spring(0, 200, 26), rect: null };
    panes.add(pane);

    // Geometry is cheap and must stay current; the field is expensive and can
    // afford to wait. Splitting them is the whole fix for the half-second of
    // script that opening a panel used to cost.
    const measure = (): void => {
      pane.rect = el.getBoundingClientRect();
    };

    /**
     * Build the pane's displacement field and apply it, once it can be used.
     *
     * The decode is the whole point. `feImage` takes a data URL and decodes it
     * asynchronously; a filter evaluated before that resolves produces nothing,
     * and the pane does not refract its backdrop but erases it. Applying the
     * filter only after `decode()` settles is what makes the difference between
     * a lens and a flat grey rectangle.
     */
    let cancelled = false;
    let settle = 0;

    const regenerate = (): void => {
      const rect = el.getBoundingClientRect();
      pane.rect = rect;
      if (rect.width < 2 || rect.height < 2) return;

      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      const surface = registerGlassSurface(key, rect.width, rect.height, radius);
      const field = fieldFor(surface, surface.id);
      if (!field.href) return;

      el.style.setProperty('--glass-rim', `url("${rimMaskFor(surface, surface.id)}")`);
      publishWallpaper();

      const img = new Image();
      img.src = field.href;
      void img
        .decode()
        .then(() => {
          if (cancelled) return;
          el.style.setProperty('--glass-refract', `url(#${surface.id})`);
          el.style.setProperty('--glass-lens', '1');
          paint();
          start();
        })
        .catch(() => {
          // A field that will not decode is not worth retrying; the pane keeps
          // its drawn edge and loses only the lensing.
        });
    };

    /**
     * Rasterise only once the element has stopped moving.
     *
     * A field is a pass over every pixel of the pane plus a PNG encode - about
     * two million operations for a 520x680 panel. The settings panel opens by
     * animating from a 42px button to a full sheet and a ResizeObserver fires
     * on every frame of that, so generating per frame cost 519ms of script for
     * a single open. Nothing needs a field mid-transition.
     */
    const scheduleRegenerate = (): void => {
      // The lens goes away the moment the pane starts moving, and does not come
      // back until a field has been built for the size it ended up.
      //
      // It carries a full copy of the wallpaper masked to the bezel, and both
      // the mask and the alignment are built for one exact geometry. Leave it
      // visible through a resize and it paints that wallpaper unmasked at the
      // wrong size - which is what was tearing across the screen for the length
      // of every panel transition.
      el.style.setProperty('--glass-lens', '0');
      measure();
      paint();
      window.clearTimeout(settle);
      settle = window.setTimeout(regenerate, 140);
    };

    measure();
    paint();

    scheduleRegenerate();

    const observer = typeof ResizeObserver === 'function'
      ? new ResizeObserver(scheduleRegenerate)
      : null;
    observer?.observe(el);

    // Scrolling moves a pane under a light that has not moved, so the cache
    // has to be refreshed - but passively and coalesced, never from the frame
    // loop.
    window.addEventListener('scroll', measure, { passive: true, capture: true });
    window.addEventListener('resize', measure, { passive: true });

    return () => {
      cancelled = true;
      window.clearTimeout(settle);
      observer?.disconnect();
      window.removeEventListener('scroll', measure, { capture: true });
      window.removeEventListener('resize', measure);
      panes.delete(pane);
    };
  }, [key]);

  return ref;
}
