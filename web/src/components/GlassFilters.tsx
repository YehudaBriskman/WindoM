import { useEffect, useMemo, useState } from 'react';
import {
  buildDisplacementField,
  buildRimMask,
  fieldToDataURL,
  rasterToDataURL,
  type GlassSurface,
} from '../lib/liquid-glass';
import { GLASS_PRESETS, subscribeGlassSurfaces, type GlassKey } from '../lib/glass-registry';

/**
 * The SVG filters the glass refracts through.
 *
 * One filter per distinct element size, generated on demand and cached: a
 * displacement field is a function of the pane's geometry, so two panels the
 * same size share one. Nothing is generated until an element asks for it.
 *
 * Each filter displaces the backdrop three times at slightly different
 * strengths and recombines the channels. That is dispersion - shorter
 * wavelengths refract harder, so blue bends further than red and the rim picks
 * up the faint colour fringe real glass has at its edges. One displacement pass
 * gives you a lens; three give you a lens made of glass.
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
          // sRGB bytes, and letting the filter convert them shifts every
          // displacement toward the middle of the range.
          <filter
            key={id}
            id={id}
            x="0"
            y="0"
            width={width}
            height={height}
            // Both in user space, in pixels. Mixing objectBoundingBox for the
            // region with userSpaceOnUse for the primitives leaves the field
            // anchored to one corner, and the refraction then shows up only on
            // the bottom and right edges.
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage href={href} x="0" y="0" width={width} height={height} result="map" />

            {/* Red bends least, blue most - the whole of dispersion. */}
            <feDisplacementMap
              in="SourceGraphic" in2="map" result="dr"
              scale={scale * 0.94} xChannelSelector="R" yChannelSelector="G"
            />
            <feDisplacementMap
              in="SourceGraphic" in2="map" result="dg"
              scale={scale} xChannelSelector="R" yChannelSelector="G"
            />
            <feDisplacementMap
              in="SourceGraphic" in2="map" result="db"
              scale={scale * 1.06} xChannelSelector="R" yChannelSelector="G"
            />

            <feColorMatrix in="dr" result="cr" type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
            <feColorMatrix in="dg" result="cg" type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" />
            <feColorMatrix in="db" result="cb" type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />

            {/* Screen, not add: the channels are disjoint, and screen keeps the
                recombined alpha sane where the passes disagree at the rim. */}
            <feBlend in="cr" in2="cg" mode="screen" result="crg" />
            <feBlend in="crg" in2="cb" mode="screen" />
          </filter>
        ))}
      </defs>
    </svg>
  );
}

const cache = new Map<string, { href: string; width: number; height: number; scale: number }>();

/** Rim masks, keyed the same way. Read by the hook, not by this component. */
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

function buildFilter(surface: GlassSurface & { key: GlassKey }) {
  const id = surfaceId(surface);
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

function surfaceId(s: GlassSurface & { key: GlassKey }): string {
  return `${s.key}-${Math.round(s.width)}x${Math.round(s.height)}r${Math.round(s.radius)}`;
}

export { GLASS_PRESETS };
