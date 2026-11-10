import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readingFraction } from './readingProgress.ts';

/** Plain `node --test`; see search.test.ts. */

describe('readingFraction', () => {
  it('is zero while the top of the article is on screen or below it', () => {
    assert.equal(readingFraction(400, 3000, 800), 0);
    assert.equal(readingFraction(0, 3000, 800), 0);
  });

  it('is one when the last line reaches the bottom of the screen', () => {
    // top = -(height - viewport): the article's bottom edge sits on the viewport's.
    assert.equal(readingFraction(-2200, 3000, 800), 1);
  });

  it('stays at one however far past the end the reader scrolls', () => {
    assert.equal(readingFraction(-9000, 3000, 800), 1);
  });

  it('is proportional in between', () => {
    assert.equal(readingFraction(-1100, 3000, 800), 0.5);
  });

  it('never goes negative or above one', () => {
    for (const top of [-1e6, -5000, -1, 0, 1, 5000]) {
      const v = readingFraction(top, 3000, 800);
      assert.ok(v >= 0 && v <= 1, `${top} -> ${v}`);
    }
  });

  it('has no travel for an article shorter than the screen, and does not invert', () => {
    // 500px article in an 800px window: floored travel, so any scroll past the
    // top reads as finished instead of dividing by zero or going negative.
    assert.equal(readingFraction(0, 500, 800), 0);
    assert.equal(readingFraction(-1, 500, 800), 1);
    assert.equal(readingFraction(5, 500, 800), 0);
  });

  it('survives a zero-height window', () => {
    // The window floors to 1px, so travel is 99 and ten pixels in reads 10/99.
    assert.equal(readingFraction(-10, 100, 0), 0.101);
    assert.ok(Number.isFinite(readingFraction(0, 0, 0)));
  });

  it('rounds to three decimals, so a slow scroll repeats values', () => {
    assert.equal(readingFraction(-1, 3000, 800), 0);
    assert.equal(readingFraction(-1100.4, 3000, 800), readingFraction(-1100.6, 3000, 800));
  });
});
