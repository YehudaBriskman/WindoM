import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nearestScrollTop, pickActiveIndex } from './scrollspy.ts';

/** Plain `node --test`; see search.test.ts. */

// A 114px chrome plus the 16px gap an anchored heading lands at.
const LINE = 130;

describe('pickActiveIndex', () => {
  it('has nothing to mark on a page with no headings', () => {
    assert.equal(pickActiveIndex([], LINE, false), -1);
  });

  it('marks the first heading before any heading reaches the line', () => {
    assert.equal(pickActiveIndex([400, 900, 1500], LINE, false), 0);
  });

  it('marks the heading sitting exactly on the line', () => {
    // Where a clicked rail link leaves its heading.
    assert.equal(pickActiveIndex([-300, LINE, 700], LINE, false), 1);
  });

  it('counts a heading hidden under the sticky chrome as passed', () => {
    // The lag this replaced: 0 < top < chrome was neither "in the band" nor
    // "above the viewport", so the previous section stayed marked.
    assert.equal(pickActiveIndex([-800, 60, 700], LINE, false), 1);
  });

  it('keeps the section marked while reading its body with no heading on screen', () => {
    assert.equal(pickActiveIndex([-2400, -900, 1400], LINE, false), 1);
  });

  it('does not mark a heading that is visible but still below the line', () => {
    assert.equal(pickActiveIndex([-500, 131, 300], LINE, false), 0);
  });

  it('marks the last heading at the bottom of the page even if it never reached the line', () => {
    assert.equal(pickActiveIndex([-900, -200, 500], LINE, true), 2);
  });
});

describe('nearestScrollTop', () => {
  it('leaves a fully visible item alone', () => {
    assert.equal(nearestScrollTop(0, 400, 100, 20), null);
  });

  it('scrolls up to an item above the visible part', () => {
    assert.equal(nearestScrollTop(300, 400, 120, 20, 8), 112);
  });

  it('scrolls down just far enough to reveal an item below it', () => {
    assert.equal(nearestScrollTop(0, 400, 500, 20, 8), 128);
  });

  it('never asks for a negative offset', () => {
    assert.equal(nearestScrollTop(10, 400, 2, 20, 8), 0);
  });
});
