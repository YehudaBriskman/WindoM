import { buildRimMask, rasterToDataURL, type GlassSurface } from './liquid-glass';

/**
 * Which panes of glass currently exist, and how thick each one is.
 *
 * A displacement field depends on the element's size, so it cannot be authored
 * in a stylesheet - it has to be generated once the element has been measured.
 * This is the registry the generator reads: elements announce themselves here,
 * `GlassFilters` renders a filter for each distinct geometry, and the element
 * refracts through it.
 *
 * Deliberately a plain module store rather than context. Glass is used by
 * widgets scattered across the tree, several of which mount lazily, and
 * threading a provider through all of them would be a lot of plumbing to tell
 * one `<svg>` about a rectangle.
 */

/** Thickness and bezel per material, in pixels. */
export const GLASS_PRESETS = {
  // Bezels are wide on purpose. A 20px band on a 500px panel is a hairline
  // nobody reads as thickness; the reference material bends light across a
  // visible fraction of the pane, and that band is most of what makes it look
  // like a solid object rather than a translucent rectangle.
  /** Dialogs and settings. Thick, because size reads as depth. */
  panel: { bezel: 56, thickness: 34 },
  /** Edge-anchored surfaces. */
  sidebar: { bezel: 48, thickness: 30 },
  /** Small floating chrome: docks, pills, the weather widget. */
  dock: { bezel: 22, thickness: 20 },
  /** Quiet, nearly flat surfaces that sit under text. */
  quote: { bezel: 20, thickness: 14 },
} as const;

export type GlassKey = keyof typeof GLASS_PRESETS;

type Registered = GlassSurface & { key: GlassKey };
type Listener = (surfaces: Map<string, Registered>) => void;

const surfaces = new Map<string, Registered>();
const listeners = new Set<Listener>();

function notify(): void {
  const snapshot = new Map(surfaces);
  for (const listener of listeners) listener(snapshot);
}

export function subscribeGlassSurfaces(listener: Listener): () => void {
  listeners.add(listener);
  listener(new Map(surfaces));
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Sizes are bucketed to 8px before they become a key.
 *
 * A field costs a pass over every pixel plus a PNG encode, and the difference
 * between a 519px pane and a 520px one is not something a rim shows. Bucketing
 * means a scrollbar appearing, a font settling or a window nudge reuses the
 * field already built instead of paying for a new one.
 */
const BUCKET = 8;
const bucket = (v: number): number => Math.max(BUCKET, Math.round(v / BUCKET) * BUCKET);

export function glassFilterId(key: GlassKey, width: number, height: number, radius: number): string {
  return `glass-${key}-${bucket(width)}x${bucket(height)}r${Math.round(radius)}`;
}

/**
 * Register a pane. Returns the filter id to refract through.
 *
 * Sizes are rounded before they become a key, so a resize of a pixel or two -
 * a scrollbar appearing, a font settling - reuses the field it already has
 * rather than rasterising a new one.
 */
export function registerGlassSurface(
  key: GlassKey,
  width: number,
  height: number,
  radius: number,
): Registered & { id: string } {
  const id = glassFilterId(key, width, height, radius);
  const existing = surfaces.get(id);
  if (existing) return { ...existing, id };

  const preset = GLASS_PRESETS[key];
  const w = bucket(width);
  const h = bucket(height);

  /**
   * The bezel is capped at a quarter of the pane's shorter side.
   *
   * A preset is a thickness in pixels, which is right for a panel and wrong
   * for anything narrow. There are two rims, not one, so a cap of a quarter
   * still let them meet in the middle: the tab sidebar at 220px wide got 55px
   * a side and kept only half its width flat.
   *
   * At a sixth, the two rims take a third of the element and two thirds stays
   * flat, which is what reads as an edge on a surface rather than as the
   * surface itself.
   */
  const bezel = Math.min(preset.bezel, Math.min(w, h) / 6);

  const surface: Registered = {
    key,
    width: w,
    height: h,
    radius: Math.round(radius),
    ...preset,
    bezel,
  };
  surfaces.set(id, surface);
  notify();
  return { ...surface, id };
}

/**
 * An alpha mask confining a layer to the pane's bezel.
 *
 * The rim layer carries a full copy of the wallpaper; without this it would
 * cover the whole pane and the backdrop blur underneath would be pointless.
 */
const maskCache = new Map<string, string>();

export function rimMaskFor(surface: GlassSurface, id: string): string {
  const hit = maskCache.get(id);
  if (hit !== undefined) return hit;
  const url = rasterToDataURL(
    buildRimMask(surface),
    Math.round(surface.width),
    Math.round(surface.height),
  );
  maskCache.set(id, url);
  return url;
}
