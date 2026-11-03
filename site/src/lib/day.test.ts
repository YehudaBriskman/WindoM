import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clockForProgress, STAGE_CLOCK, STAGES, stageForHour } from './day.ts';

/** Plain `node --test`; see search.test.ts. */

const minutes = (clock: string): number => {
  const [h = 0, m = 0] = clock.split(':').map(Number);
  return h * 60 + m;
};

describe('clockForProgress', () => {
  it('reads each stage anchor exactly at that stage midpoint', () => {
    STAGES.forEach((stage, i) => {
      const midpoint = (i + 0.5) / STAGES.length;
      assert.equal(clockForProgress(midpoint), STAGE_CLOCK[stage], stage);
    });
  });

  it('lands in the stage it is showing at each midpoint', () => {
    STAGES.forEach((stage, i) => {
      const hour = Number(clockForProgress((i + 0.5) / STAGES.length).slice(0, 2));
      assert.equal(stageForHour(hour), stage);
    });
  });

  it('never runs backwards across the whole scroll', () => {
    let previous = -1;
    for (let step = 0; step <= 1000; step++) {
      const now = minutes(clockForProgress(step / 1000));
      assert.ok(now >= previous, `went back at progress ${step / 1000}`);
      previous = now;
    }
  });

  it('is already moving at the start and still moving at the end', () => {
    assert.ok(minutes(clockForProgress(0)) < minutes(STAGE_CLOCK.morning));
    assert.ok(minutes(clockForProgress(1)) > minutes(STAGE_CLOCK.night));
  });

  it('clamps progress outside 0..1 to the extremes', () => {
    assert.equal(clockForProgress(-5), clockForProgress(0));
    assert.equal(clockForProgress(-Number.EPSILON), clockForProgress(0));
    assert.equal(clockForProgress(7), clockForProgress(1));
  });

  it('stays a valid same-day HH:MM at both ends', () => {
    for (const p of [0, 1]) {
      assert.match(clockForProgress(p), /^([01]\d|2[0-3]):[0-5]\d$/);
    }
  });
});
