/**
 * The page choreography engine.
 *
 * A page is described here as an ordered list of scenes. Each scene says how
 * much scroll it occupies, which actors it hosts, where they sit, how they
 * arrive, what they show while they are there and how their surface should
 * look. Everything else - measuring, interpolating, writing keyframes, wiring
 * timelines - is computed from that description.
 *
 * ## Why it generates CSS rather than animating in JavaScript
 *
 * The positions an actor travels between come from a layout that resolves
 * differently at every width, so they cannot be written by hand. But driving
 * them from JavaScript would mean running code on every frame of every scroll.
 *
 * So the engine measures once, computes the whole journey as `@keyframes`, and
 * hands it to the browser to run against a scroll timeline. The arithmetic
 * happens on mount and on resize; the animation happens on the compositor. A
 * resize recomputes the sheet rather than restarting anything.
 *
 * ## The three transform properties
 *
 * `translate`, `scale` and `rotate` are independent CSS properties and are
 * owned entirely by the travel. `transform` is left alone, which is what lets
 * an actor carry a pointer-driven lean at the same time without the two
 * overwriting each other. Losing that separation is what silently killed the
 * card's lean once already, so it is stated here as a rule of the engine
 * rather than left as a convention.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
}

/**
 * One waypoint along a leg.
 *
 * Offsets are expressed as fractions rather than pixels so a style reads the
 * same at every viewport: `aside: -0.06` means six percent of the viewport's
 * width off the direct path, whether that is 23px on a phone or 150px on a
 * desktop.
 */
export interface Waypoint {
  /** Position along the leg, 0 to 1. */
  at: number;
  /** Sideways offset from the straight path, as a fraction of the viewport. */
  aside?: number;
  /** Vertical offset from the straight path, as a fraction of the viewport. */
  lift?: number;
  /** Multiplier on the interpolated size. Below 1 the actor recedes. */
  shrink?: number;
  /** Degrees of rotation about each axis at this waypoint. */
  turn?: { x?: number; y?: number; z?: number };
  /** The curve used to reach the *next* waypoint. */
  ease?: string;
}

export interface MotionStyle {
  name: string;
  description: string;
  waypoints: Waypoint[];
}

const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
/** Passes its target and comes back, which is what gives motion mass. */
const SETTLE = 'cubic-bezier(0.34, 1.28, 0.64, 1)';

/**
 * The motion vocabulary.
 *
 * Adding one is an entry here and nothing else - the engine reads the
 * waypoints and writes the keyframes, so a style never has to know what it is
 * moving or how far.
 */
export const MOTION: Record<string, MotionStyle> = {
  /**
   * Recede, turn, return.
   *
   * The actor shrinks and swings off the direct path with a 3D turn, then
   * comes back square and slightly past its target before settling. Modelled
   * on the extension's liquid glass, whose own comment argues that lagging,
   * overshooting and settling is what separates a material with mass from a
   * decal painted on the screen.
   */
  turn: {
    name: 'turn',
    description: 'Recedes and swings aside with a 3D turn, then settles upright.',
    waypoints: [
      { at: 0, turn: { y: 0 }, ease: EASE_IN_OUT },
      { at: 0.34, aside: -0.07, lift: 0.035, shrink: 0.78, turn: { y: -17, x: 3 }, ease: EASE_OUT },
      { at: 0.68, aside: -0.02, lift: 0.012, shrink: 0.94, turn: { y: -6, x: 1 }, ease: SETTLE },
      { at: 0.88, aside: 0.012, shrink: 1.03, turn: { y: 3 }, ease: EASE_OUT },
      { at: 1, turn: { y: 0 } },
    ],
  },

  /**
   * A straight-ish growth.
   *
   * What the day stage wants: becoming the whole screen should feel like
   * arriving, not like being thrown. It still eases and still passes very
   * slightly through its target, so it lands rather than stopping dead.
   */
  rise: {
    name: 'rise',
    description: 'Grows into place, easing out with a small settle.',
    waypoints: [
      { at: 0, ease: EASE_IN_OUT },
      { at: 0.55, lift: 0.018, shrink: 0.97, turn: { x: 1.5 }, ease: EASE_OUT },
      { at: 0.9, shrink: 1.012, ease: SETTLE },
      { at: 1 },
    ],
  },

  /** A gentle arc with no rotation, for when a turn would be too much. */
  drift: {
    name: 'drift',
    description: 'Curves into place without rotating.',
    waypoints: [
      { at: 0, ease: EASE_IN_OUT },
      { at: 0.5, aside: -0.035, lift: 0.025, shrink: 0.9, ease: EASE_OUT },
      { at: 1 },
    ],
  },

  /** Straight interpolation. Mostly useful as a control when something looks wrong. */
  direct: {
    name: 'direct',
    description: 'Linear interpolation between the two positions.',
    waypoints: [{ at: 0 }, { at: 1 }],
  },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The journey of one actor between two positions, as CSS keyframe text.
 *
 * `designW` is the actor's own intrinsic width: every position is reached by
 * scaling that one box, which is what keeps the contents from reflowing as it
 * travels - it grows, it does not relayout.
 */
export function legKeyframes(
  name: string,
  from: Rect,
  to: Rect,
  style: MotionStyle,
  designW: number,
  viewport: { w: number; h: number },
): string {
  const stops = style.waypoints.map((point) => {
    const t = point.at;
    const scale = (lerp(from.w, to.w, t) / designW) * (point.shrink ?? 1);
    const x = lerp(from.x, to.x, t) + (point.aside ?? 0) * viewport.w;
    const y = lerp(from.y, to.y, t) - (point.lift ?? 0) * viewport.h;

    const declarations = [
      `translate: ${Math.round(x)}px ${Math.round(y)}px`,
      `scale: ${scale.toFixed(5)}`,
      `rotate: ${rotateFor(point.turn)}`,
    ];
    if (point.ease) declarations.push(`animation-timing-function: ${point.ease}`);

    return `  ${(t * 100).toFixed(2)}% { ${declarations.join('; ')}; }`;
  });

  return `@keyframes ${name} {\n${stops.join('\n')}\n}`;
}

/**
 * The `rotate` property's value for a waypoint.
 *
 * One axis is written as `y -17deg`, which is both cheaper to read and what
 * most waypoints need. Two or three become the `x y z angle` form, where the
 * first three numbers are a vector and the angle is applied about it - so the
 * vector is the normalised mix of the axes asked for.
 */
function rotateFor(turn: Waypoint['turn']): string {
  if (!turn) return 'none';
  const axes = (['x', 'y', 'z'] as const).filter((axis) => turn[axis]);
  if (axes.length === 0) return 'none';
  if (axes.length === 1) {
    const axis = axes[0]!;
    return `${axis} ${turn[axis]}deg`;
  }

  // The combined rotation: a vector built from the requested degrees, applied
  // about itself by their magnitude. Equivalent to the separate rotations for
  // the small angles these styles use, and expressible in one property.
  const x = turn.x ?? 0;
  const y = turn.y ?? 0;
  const z = turn.z ?? 0;
  const angle = Math.hypot(x, y, z);
  return `${(x / angle).toFixed(4)} ${(y / angle).toFixed(4)} ${(z / angle).toFixed(4)} ${angle.toFixed(2)}deg`;
}

/**
 * A simple two-stop fade, used for content and surface changes.
 *
 * Driven by the same timelines as the travel, so what the actor shows and how
 * its edges look can never drift out of step with where it is.
 */
export function fadeKeyframes(name: string, from: number, to: number): string {
  return `@keyframes ${name} {\n  from { opacity: ${from}; }\n  to { opacity: ${to}; }\n}`;
}

export function surfaceKeyframes(
  name: string,
  from: { radius: string; border: string },
  to: { radius: string; border: string },
): string {
  return (
    `@keyframes ${name} {\n` +
    `  from { border-radius: ${from.radius}; border-color: ${from.border}; }\n` +
    `  to { border-radius: ${to.radius}; border-color: ${to.border}; }\n}`
  );
}
