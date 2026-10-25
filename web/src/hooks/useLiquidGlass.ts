import { useEffect, useRef } from 'react';
import { Spring } from '../lib/liquid-glass';
import { registerGlassSurface, type GlassKey } from '../lib/glass-registry';

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
};

const panes = new Set<Pane>();

// One light for the whole screen, because there is one. Each pane works out its
// own angle to it; a spring per pane would let them disagree about where the
// light is, which is exactly what breaks the illusion.
const viewportW = typeof window === 'undefined' ? 1280 : window.innerWidth;
const viewportH = typeof window === 'undefined' ? 800 : window.innerHeight;
const lightX = new Spring(viewportW / 2, 120, 20);
const lightY = new Spring(-viewportH * 0.3, 120, 20);

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
    const { el } = pane;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

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
    // Softer than the light's spring: the swell is a body of material moving,
    // not a reflection, so it should feel heavier.
    const pane: Pane = { el, key, proximity: new Spring(0, 90, 18) };
    panes.add(pane);

    const measure = (): void => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      const id = registerGlassSurface(key, rect.width, rect.height, radius);
      el.style.setProperty('--glass-refract', `url(#${id})`);
      // A pane that resized has moved every light value it was holding. The
      // settings panel grows from a 42px button to a full sheet, and without
      // this it kept the highlight it computed while it was still the button.
      paint();
      start();
    };

    measure();
    paint();

    const observer = typeof ResizeObserver === 'function'
      ? new ResizeObserver(measure)
      : null;
    observer?.observe(el);

    return () => {
      observer?.disconnect();
      panes.delete(pane);
    };
  }, [key]);

  return ref;
}
