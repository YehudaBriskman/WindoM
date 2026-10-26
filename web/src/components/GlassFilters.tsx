import { useEffect, useMemo, useState } from 'react';
import {
  buildDisplacementField,
  fieldToDataURL,
  type GlassSurface,
} from '../lib/liquid-glass';
import { subscribeGlassSurfaces, type GlassKey } from '../lib/glass-registry';

/**
 * The SVG filters the glass refracts through.
 *
 * One filter per distinct pane geometry, generated on demand and cached.
 *
 * Two details here are the difference between this working and silently
 * blanking the backdrop, which is what it did before:
 *
 * The region is grown well past the element. At the default region the
 * displaced pixels have nowhere to land and are clipped, which shows up as a
 * hard edge rather than a bend.
 *
 * And `feImage` is fed a data URL, which decodes asynchronously. Nothing is
 * applied to an element until that decode has resolved - see the preload in
 * useLiquidGlass. A filter evaluated against an image that has not arrived
 * yet produces nothing at all.
 */
export function GlassFilters() {
  const [surfaces, setSurfaces] = useState<Map<string, GlassSurface & { key: GlassKey }>>(new Map());

  useEffect(() => subscribeGlassSurfaces(setSurfaces), []);

  const filters = useMemo(
    () => [...surfaces.entries()].map(([id, surface]) => ({ id, ...buildFilter(surface) })),
    [surfaces],
  );

  return (
    <svg
      aria-hidden="true"
      style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
    >
      <defs>
        {filters.map(({ id, href, width, height, scale }) => (
          // sRGB rather than the linearRGB default: the field was authored in
          // sRGB bytes, and letting the filter convert them pulls every
          // displacement toward the middle of the range.
          <filter
            key={id}
            id={id}
            // Exactly the element, no bleed. The region was grown to 140% while
            // chasing the theory that displaced pixels were being clipped at the
            // edge; the displacement runs inward from the rim, so there was
            // never anything to land outside - it was just filtering twice the
            // area for nothing.
            x="0"
            y="0"
            width="1"
            height="1"
            filterUnits="objectBoundingBox"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage href={href} x="0" y="0" width={width} height={height} result="map" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        ))}
      </defs>
    </svg>
  );
}

const cache = new Map<string, { href: string; width: number; height: number; scale: number }>();

/** The field for a surface, built once per geometry. */
export function fieldFor(surface: GlassSurface & { key: GlassKey }, id: string) {
  const hit = cache.get(id);
  if (hit) return hit;

  const field = buildDisplacementField(surface);
  const built = {
    href: fieldToDataURL(field),
    width: field.width,
    height: field.height,
    scale: field.scale,
  };
  cache.set(id, built);
  return built;
}

function buildFilter(surface: GlassSurface & { key: GlassKey }) {
  return fieldFor(surface, surfaceId(surface));
}

function surfaceId(s: GlassSurface & { key: GlassKey }): string {
  return `glass-${s.key}-${Math.round(s.width)}x${Math.round(s.height)}r${Math.round(s.radius)}`;
}
