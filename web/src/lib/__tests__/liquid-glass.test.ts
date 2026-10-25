import { describe, expect, it } from 'vitest';
import {
  GLASS_IOR,
  Spring,
  buildDisplacementField,
  refractionOffset,
  roundedRectDistance,
  squircleProfile,
  surfaceSlope,
} from '../liquid-glass';

/**
 * These assert the physical properties the look depends on, not the numbers.
 * The old material failed exactly one of them - displacement in the middle of
 * the pane - and that single fault is what made it read as warped plastic.
 */

describe('surface profile', () => {
  it('rises from the rim to a flat interior', () => {
    expect(squircleProfile(0)).toBeCloseTo(0, 5);
    expect(squircleProfile(1)).toBeCloseTo(1, 5);
  });

  it('flattens out, so the lensing fades rather than stopping at a ring', () => {
    // A circular bevel would still be climbing here; the squircle is not.
    expect(surfaceSlope(0.95)).toBeLessThan(surfaceSlope(0.5));
    expect(surfaceSlope(1)).toBeLessThan(0.1);
  });

  it('is steepest at the rim, where glass actually bends light', () => {
    expect(surfaceSlope(0.02)).toBeGreaterThan(surfaceSlope(0.3));
  });
});

describe('refraction', () => {
  it('does not bend a ray that meets a flat surface', () => {
    expect(refractionOffset(0, 20)).toBeCloseTo(0, 6);
  });

  it('bends more as the surface tilts', () => {
    const gentle = refractionOffset(0.3, 20);
    const steep = refractionOffset(2.0, 20);
    expect(steep).toBeGreaterThan(gentle);
    expect(gentle).toBeGreaterThan(0);
  });

  it('bends more through thicker glass', () => {
    expect(refractionOffset(1, 40)).toBeCloseTo(refractionOffset(1, 20) * 2, 6);
  });

  it('bends more at a higher refractive index', () => {
    expect(refractionOffset(1, 20, 1.9)).toBeGreaterThan(refractionOffset(1, 20, 1.3));
  });

  it('bends nothing at all when the index matches air', () => {
    expect(refractionOffset(1, 20, 1)).toBeCloseTo(0, 6);
  });

  it('uses a plausible index by default', () => {
    expect(GLASS_IOR).toBeGreaterThan(1.4);
    expect(GLASS_IOR).toBeLessThan(1.7);
  });
});

describe('rounded rectangle distance', () => {
  it('is zero on the edge and positive inside', () => {
    expect(roundedRectDistance(0, 50, 200, 100, 20)).toBeCloseTo(0, 6);
    expect(roundedRectDistance(100, 50, 200, 100, 20)).toBeGreaterThan(0);
  });

  it('is negative outside the shape', () => {
    expect(roundedRectDistance(-10, 50, 200, 100, 20)).toBeLessThan(0);
  });

  it('rounds the corners, so a corner point sits outside a square one', () => {
    const corner = roundedRectDistance(2, 2, 200, 100, 30);
    const edge = roundedRectDistance(2, 50, 200, 100, 30);
    expect(corner).toBeLessThan(edge);
  });

  it('reports half the short side at the centre', () => {
    expect(roundedRectDistance(100, 50, 200, 100, 20)).toBeCloseTo(50, 6);
  });
});

describe('displacement field', () => {
  const surface = { width: 120, height: 80, radius: 24, bezel: 16, thickness: 22 };
  const field = buildDisplacementField(surface);
  const at = (x: number, y: number) => {
    const o = (y * field.width + x) * 4;
    return { r: field.data[o], g: field.data[o + 1] };
  };

  it('leaves the flat interior completely undisplaced', () => {
    // The whole point. Anything other than neutral here and text behind the
    // panel swims, which is what the turbulence-based material did.
    const mid = at(60, 40);
    expect(mid.r).toBe(128);
    expect(mid.g).toBe(128);
  });

  it('displaces inside the bezel', () => {
    const rim = at(4, 40);
    expect(Math.abs(rim.r - 128)).toBeGreaterThan(8);
  });

  it('pushes the backdrop outward on opposite edges', () => {
    // Left rim and right rim must bend in opposite directions, or the pane
    // reads as sheared rather than curved.
    const left = at(3, 40);
    const right = at(field.width - 4, 40);
    expect(Math.sign(left.r - 128)).toBe(-Math.sign(right.r - 128));
  });

  it('reports the pixel scale a saturated channel stands for', () => {
    expect(field.scale).toBeGreaterThan(0);
    expect(field.scale).toBeLessThan(surface.bezel * 2);
  });

  it('fills the full raster', () => {
    expect(field.data.length).toBe(field.width * field.height * 4);
  });
});

describe('spring', () => {
  it('settles on its target', () => {
    const s = new Spring(0);
    s.target = 10;
    for (let i = 0; i < 400 && s.step(1 / 60); i++);
    expect(s.value).toBeCloseTo(10, 2);
  });

  it('reports when it has come to rest', () => {
    const s = new Spring(0);
    s.target = 1;
    let moving = true;
    for (let i = 0; i < 600 && moving; i++) moving = s.step(1 / 60);
    expect(moving).toBe(false);
  });

  it('lags its target, which is what gives the material mass', () => {
    const s = new Spring(0);
    s.target = 100;
    s.step(1 / 60);
    expect(s.value).toBeLessThan(50);
    expect(s.value).toBeGreaterThan(0);
  });

  it('survives a long frame without exploding', () => {
    // A backgrounded tab hands back a delta of seconds; explicit integration
    // would overshoot to infinity.
    const s = new Spring(0);
    s.target = 100;
    s.step(5);
    expect(Number.isFinite(s.value)).toBe(true);
    expect(Math.abs(s.value)).toBeLessThan(1000);
  });

  it('snaps without ringing when asked', () => {
    const s = new Spring(0);
    s.target = 50;
    s.step(1 / 60);
    s.snap(7);
    expect(s.value).toBe(7);
    expect(s.step(1 / 60)).toBe(false);
  });
});
