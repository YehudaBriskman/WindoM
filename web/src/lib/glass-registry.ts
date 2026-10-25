import type { GlassSurface } from './liquid-glass';

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
  /** Dialogs and settings. Thick, because size reads as depth. */
  panel: { bezel: 22, thickness: 26 },
  /** Edge-anchored surfaces. */
  sidebar: { bezel: 20, thickness: 22 },
  /** Small floating chrome: docks, pills, the weather widget. */
  dock: { bezel: 14, thickness: 16 },
  /** Quiet, nearly flat surfaces that sit under text. */
  quote: { bezel: 12, thickness: 10 },
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

export function glassFilterId(key: GlassKey, width: number, height: number, radius: number): string {
  return `glass-${key}-${Math.round(width)}x${Math.round(height)}r${Math.round(radius)}`;
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

  const surface: Registered = {
    key,
    width: Math.round(width),
    height: Math.round(height),
    radius: Math.round(radius),
    ...GLASS_PRESETS[key],
  };
  surfaces.set(id, surface);
  notify();
  return { ...surface, id };
}
