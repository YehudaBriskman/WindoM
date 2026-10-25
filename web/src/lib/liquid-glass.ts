/**
 * The optics of liquid glass.
 *
 * The previous material distorted its backdrop with `feTurbulence` - fractal
 * noise applied evenly across the whole surface. Real glass does not do that.
 * A pane of uniform thickness bends nothing; light only bends where the surface
 * is *curved*, which on a lozenge of glass means the rim. That is why the old
 * effect read as warped plastic and why text behind it swam: the distortion was
 * strongest exactly where it should have been zero.
 *
 * This computes the real thing. For every pixel we work out how deep into the
 * pane it sits, what the surface tilt is at that depth, refract the incoming ray
 * through that tilt with Snell's law, and record how far the ray lands from
 * where it started. The result is a displacement field that is zero across the
 * flat middle and rises sharply into the bezel - a lens, not a noise field.
 *
 * Everything here is pure maths over a normalised surface, so it is testable
 * without a DOM and the expensive part (rasterising the field) happens once per
 * distinct element size and is cached.
 */

/** Refractive index. Window glass is 1.52; acrylic 1.49. */
export const GLASS_IOR = 1.5;

/**
 * Steepest incidence angle we still treat as refracting, in radians.
 *
 * The squircle is vertical at the rim, so its derivative is singular there and
 * `tan(theta)` runs away to infinity - left alone it produced 424 pixels of
 * displacement on a 16 pixel bezel, which then normalised every other pixel in
 * the pane down to nothing.
 *
 * The cap is not a fudge, it is where the model stops applying. As incidence
 * approaches grazing, Fresnel reflectance climbs toward 1: almost nothing is
 * transmitted, so there is no refracted ray left to displace. Past this angle
 * the rim is reflecting, and reflection is drawn separately as the specular
 * highlight.
 */
export const MAX_INCIDENCE = (65 * Math.PI) / 180;

/**
 * Surface height across the bezel, as a function of depth into the pane.
 *
 * `t` is 0 at the outer rim and 1 where the surface flattens out. The quartic
 * squircle is the profile Apple uses, and the reason is visible in the
 * derivative: a circular bevel meets the flat interior at a discontinuity in
 * curvature, which shows up as a hard ring in the refraction. The squircle
 * arrives flat, so the lensing fades out instead of stopping.
 */
export function squircleProfile(t: number): number {
  const u = 1 - clamp01(t);
  return Math.pow(1 - u * u * u * u, 0.25);
}

/**
 * Surface slope at depth `t`, by central difference.
 *
 * Done numerically on purpose: the analytic derivative of the squircle is
 * singular at the rim, and the profile is meant to be swappable. Sampling it
 * keeps both honest.
 */
export function surfaceSlope(t: number, profile = squircleProfile): number {
  const d = 1e-3;
  const a = profile(Math.max(0, t - d));
  const b = profile(Math.min(1, t + d));
  return (b - a) / (2 * d);
}

/**
 * Lateral shift of a ray entering the glass at a surface of the given slope.
 *
 * A ray arriving straight down meets the tilted surface at incidence angle
 * `atan(slope)` to the normal. Snell's law bends it to `asin(sin(theta) / n)`.
 * Over `thickness` of travel the refracted ray lands this much further across
 * than the unrefracted one would have:
 *
 *     offset = thickness * (tan(theta1) - tan(theta2))
 *
 * Positive values pull the backdrop outward, which is what makes the rim appear
 * to wrap around whatever is behind it.
 *
 * Total internal reflection cannot occur here - we are going from air into a
 * denser medium, so theta2 is always real.
 */
export function refractionOffset(slope: number, thickness: number, ior = GLASS_IOR): number {
  const theta1 = Math.min(Math.atan(Math.abs(slope)), MAX_INCIDENCE);
  const theta2 = Math.asin(Math.sin(theta1) / ior);
  return thickness * (Math.tan(theta1) - Math.tan(theta2));
}

/**
 * Signed distance to the edge of a rounded rectangle, negative outside.
 *
 * The displacement direction is the gradient of this field, so using a real SDF
 * rather than four separate corner cases is what lets the bezel stay continuous
 * where the straight edges meet the corners.
 */
export function roundedRectDistance(
  x: number, y: number, width: number, height: number, radius: number,
): number {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw, hh);
  const qx = Math.abs(x - hw) - hw + r;
  const qy = Math.abs(y - hh) - hh + r;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inside = Math.min(Math.max(qx, qy), 0);
  return r - (outside + inside);
}

export interface GlassSurface {
  width: number;
  height: number;
  radius: number;
  /** How far the curved bezel reaches in from the rim, in pixels. */
  bezel: number;
  /** Apparent thickness of the pane. Drives how hard the rim bends light. */
  thickness: number;
  ior?: number;
}

export interface DisplacementField {
  /**
   * RGBA bytes: red carries x, green carries y, 128 being no displacement.
   * Pinned to ArrayBuffer rather than the default ArrayBufferLike, because
   * ImageData refuses a view that might sit over a SharedArrayBuffer.
   */
  data: Uint8ClampedArray<ArrayBuffer>;
  width: number;
  height: number;
  /** Pixels of displacement that a fully saturated channel stands for. */
  scale: number;
}

/**
 * Rasterise the refraction into an RGBA field.
 *
 * `feDisplacementMap` reads one byte per axis, so the field is normalised to its
 * own maximum and that maximum is handed back to be used as the filter's
 * `scale`. Encoding it any other way would either clip the rim or waste most of
 * the 8-bit range on the flat middle, where the displacement is zero anyway.
 */
export function buildDisplacementField(surface: GlassSurface): DisplacementField {
  const { width, height, radius, bezel, thickness, ior = GLASS_IOR } = surface;
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  // Backed by an explicit ArrayBuffer: ImageData will not accept a view that
  // might be over SharedArrayBuffer.
  const data = new Uint8ClampedArray(new ArrayBuffer(w * h * 4));

  // Two passes: the first measures, the second encodes. The maximum is not
  // known analytically once the bezel is clipped by a small radius.
  const vx = new Float32Array(w * h);
  const vy = new Float32Array(w * h);
  let max = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const d = roundedRectDistance(x + 0.5, y + 0.5, w, h, radius);

      // Outside the shape, and across the flat interior, light passes straight
      // through. Leaving these at zero is what keeps the middle of the panel
      // readable instead of swimming.
      if (d <= 0 || d >= bezel) continue;

      const t = d / bezel;
      const slope = surfaceSlope(t);
      const offset = refractionOffset(slope, thickness, ior);
      if (offset === 0) continue;

      // Direction: the inward gradient of the distance field, found the same
      // numerical way as the slope so the two always agree.
      const e = 0.75;
      const gx = roundedRectDistance(x + 0.5 + e, y + 0.5, w, h, radius)
        - roundedRectDistance(x + 0.5 - e, y + 0.5, w, h, radius);
      const gy = roundedRectDistance(x + 0.5, y + 0.5 + e, w, h, radius)
        - roundedRectDistance(x + 0.5, y + 0.5 - e, w, h, radius);
      const len = Math.hypot(gx, gy) || 1;

      // Inward, along the gradient. The direction matters more than it looks:
      // `backdrop-filter` has no backdrop beyond the element's own box, so a
      // rim that samples outward reads a clamped edge pixel and smears it into
      // a streak. Sampling inward magnifies the band just inside the rim,
      // which is what a thick bezel does to whatever is behind it anyway.
      const dx = (gx / len) * offset;
      const dy = (gy / len) * offset;
      vx[i] = dx;
      vy[i] = dy;
      const m = Math.hypot(dx, dy);
      if (m > max) max = m;
    }
  }

  const norm = max > 0 ? 127 / max : 0;
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    data[o] = 128 + vx[i] * norm;
    data[o + 1] = 128 + vy[i] * norm;
    data[o + 2] = 128;
    data[o + 3] = 255;
  }

  return { data, width: w, height: h, scale: max };
}

/** Rasterised field as a PNG data URL, for `feImage`. */
export function fieldToDataURL(field: DisplacementField): string {
  const canvas = document.createElement('canvas');
  canvas.width = field.width;
  canvas.height = field.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.putImageData(new ImageData(field.data, field.width, field.height), 0, 0);
  return canvas.toDataURL('image/png');
}

// ── Motion ──────────────────────────────────────────────────────────────────

/**
 * A damped harmonic oscillator, integrated semi-implicitly.
 *
 * This is what gives the material mass. Highlights that snap to the pointer
 * read as a decal painted on the surface; highlights that lag and settle read
 * as light moving across something solid. Explicit Euler blows up at the
 * stiffnesses that feel right, so velocity is updated before position.
 */
export class Spring {
  value: number;
  velocity = 0;
  target: number;

  constructor(initial: number, private stiffness = 170, private damping = 26) {
    this.value = initial;
    this.target = initial;
  }

  /** Advance by `dt` seconds. Returns true while still moving. */
  step(dt: number): boolean {
    // Long frames (a background tab, a slow paint) would otherwise integrate
    // into a violent overshoot.
    const h = Math.min(dt, 1 / 30);
    const force = (this.target - this.value) * this.stiffness - this.velocity * this.damping;
    this.velocity += force * h;
    this.value += this.velocity * h;

    if (Math.abs(this.velocity) < 0.001 && Math.abs(this.target - this.value) < 0.001) {
      this.value = this.target;
      this.velocity = 0;
      return false;
    }
    return true;
  }

  snap(to: number): void {
    this.value = to;
    this.target = to;
    this.velocity = 0;
  }
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
