import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PEN_MUTED, READING, penRange, sequence } from './penClock.ts';

/** Plain `node --test`; see search.test.ts. */

describe('penRange', () => {
  it('tiles the clock: each word ends where the next begins, the last at 100%', () => {
    const n = 7;
    for (let i = 0; i < n - 1; i++) assert.equal(penRange(i, n)[1], penRange(i + 1, n)[0]);
    assert.equal(penRange(0, n)[0], '0%');
    assert.equal(penRange(n - 1, n)[1], '100%');
  });

  it('survives an empty paragraph', () => {
    assert.deepEqual(penRange(0, 0), ['0%', '100%']);
  });
});

describe('sequence', () => {
  const V = 800;

  it('lets a lone block keep its whole clock', () => {
    assert.deepEqual(sequence([{ top: 900, bottom: 1100 }], V), [{ lead: 0, span: 1 }]);
  });

  it('never writes two neighbouring blocks at once', () => {
    const blocks = [
      { top: 900, bottom: 1000 },
      { top: 1020, bottom: 1120 },
      { top: 1140, bottom: 1240 },
    ];
    const slots = sequence(blocks, V);
    let done = -Infinity;
    slots.forEach((slot, i) => {
      const b = blocks[i]!;
      const s = b.top - READING.from * V;
      const len = b.bottom - READING.to * V - s;
      const start = s + slot.lead * len;
      const end = start + slot.span * len;
      assert.ok(start >= done - 1e-6, `block ${i} starts before the previous finished`);
      assert.ok(slot.lead >= 0 && slot.span > 0 && slot.lead + slot.span <= 1 + 1e-9);
      done = end;
    });
  });
});

describe('the reading window', () => {
  it('is the same pair of numbers in the stylesheet', () => {
    const css = readFileSync(new URL('../styles/written.css', import.meta.url), 'utf8');
    assert.match(css, new RegExp(`--read-from:\\s*${READING.from};`));
    assert.match(css, new RegExp(`--read-to:\\s*${READING.to};`));
    assert.match(css, new RegExp(`--pen-muted:\\s*${PEN_MUTED};`));
  });
});
