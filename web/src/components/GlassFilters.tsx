/**
 * Previously generated one SVG refraction filter per pane.
 *
 * It does not work, and the reason is worth recording rather than
 * rediscovering: `feDisplacementMap` fed by `feImage` returns nothing when the
 * filter is referenced from `backdrop-filter`. The pane does not refract its
 * backdrop, it erases it and goes flat grey.
 *
 * Confirmed by screenshotting one frame twice over a hard striped backdrop,
 * with the filter applied and with `--glass-refract: none`. Stripes read
 * through the pane when it is off; with it on the panel is uniform grey and
 * nothing behind it survives. Every variation failed the same way - region in
 * objectBoundingBox and in userSpaceOnUse, the three-pass dispersion chain and
 * a single displacement pass alone.
 *
 * Edge thickness is drawn in CSS instead; see the rim gradients in glass.css.
 * The optics in lib/liquid-glass.ts remain correct and tested, and are the
 * basis for the approach that can work here: displacing a copy of the
 * wallpaper, which the extension already knows the URL of, rather than asking
 * the compositor to displace a backdrop it will not hand over.
 */
export function GlassFilters() {
  return null;
}
