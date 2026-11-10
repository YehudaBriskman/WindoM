import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { highlight, search, suggestions, type IndexedPage, type SearchIndex } from './search.ts';

/**
 * Run with `npm test` - plain `node --test`, which strips the types itself, so
 * this needs no test runner as a dependency. search.ts is pure and imports
 * nothing at runtime, which is what makes that enough.
 */

function page(p: string, t: string, sections: Array<[id: string, h: string, x: string]>): IndexedPage {
  return { p, t, l: 'en', s: sections.map(([id, h, x]) => ({ id, h, x })) };
}

/**
 * The shape of the real index behind #401: a page named after a common word
 * with many sections that never mention it, and a genuine answer elsewhere
 * that sorts after it in document order.
 */
const guide = page('/guide', 'User Guide', [
  ['', '', 'Everything WindoM can do, one widget at a time.'],
  ...Array.from({ length: 17 }, (_, i): [string, string, string] => [
    `step-${i}`,
    `Step ${i}`,
    'Click the button and wait.',
  ]),
]);
const setup = page('/local-setup', 'Local Setup', [['', '', 'Run it yourself. This guide assumes Node 22.']]);
const index: SearchIndex = { v: 1, pages: [guide, setup] };

describe('search: a page title does not qualify every section (#401)', () => {
  it('returns one row for the titled page, leaving room for real matches', () => {
    const results = search(index, 'guide', 'en');
    assert.deepEqual(
      results.map((r) => r.to),
      ['/guide', '/local-setup'],
    );
  });

  it('gives the title-only row the page title and points at the top of the page', () => {
    const [top] = search(index, 'guide', 'en');
    assert.equal(top?.heading, 'User Guide');
    assert.equal(top?.to, '/guide');
  });

  it('still lets the title add score to a section that matched on its own', () => {
    const results = search(index, 'button', 'en');
    // Every guide step mentions it in the body, and none of them twice; one
    // page may hold three rows, not eight.
    assert.equal(results.length, 3);
    assert.ok(results.every((r) => r.page.p === '/guide'));
  });

  it('leads with the page named after the query, then its matching sections', () => {
    const titled = page('/support', 'Support', [
      ['', '', 'Help.'],
      ['contact-support', 'Contact support', 'Email us.'],
    ]);
    const results = search({ v: 1, pages: [titled] }, 'support', 'en');
    assert.deepEqual(
      results.map((r) => r.to),
      ['/support', '/support#contact-support'],
    );
  });

  it('puts the page called Keyboard Shortcuts above an FAQ that mentions shortcuts (#514)', () => {
    const faq = page('/guide/faq', 'FAQ', [
      ['', '', 'Hi.'],
      ['shortcuts', 'Can I change the shortcuts?', 'Yes.'],
    ]);
    const keys = page('/guide/shortcuts', 'Keyboard Shortcuts', [
      ['', '', 'Keys.'],
      ['global', 'The global shortcut', 'Ctrl.'],
    ]);
    const [top, second] = search({ v: 1, pages: [faq, keys] }, 'shortcut', 'en');
    assert.equal(top?.to, '/guide/shortcuts');
    assert.equal(second?.to, '/guide/shortcuts#global');
  });

  it('keeps a page to three rows so other pages get a turn', () => {
    const many = page('/a', 'Alpha', [
      ['', '', ''],
      ...Array.from({ length: 6 }, (_, i): [string, string, string] => [`s${i}`, 'widget', 'x']),
    ]);
    const other = page('/b', 'Beta', [['', '', 'a widget here']]);
    const results = search({ v: 1, pages: [many, other] }, 'widget', 'en');
    assert.equal(results.filter((r) => r.page.p === '/a').length, 3);
    assert.ok(results.some((r) => r.page.p === '/b'));
  });

  it('wants two characters before it returns anything', () => {
    assert.deepEqual(search(index, 'x', 'en'), []);
    assert.deepEqual(search(index, ' b ', 'en'), []);
  });

  it('suggests the pages it knows, in order, for the current language only', () => {
    const idx: SearchIndex = {
      v: 1,
      pages: [
        page('/support', 'Support', [['', '', 'Help.']]),
        page('/install', 'Install', [['', '', 'Get it.']]),
        { p: '/he/install', t: 'התקנה', l: 'he', s: [{ id: '', h: '', x: 'x' }] },
      ],
    };
    assert.deepEqual(
      suggestions(idx, 'en').map((r) => r.to),
      ['/install', '/support'],
    );
    assert.deepEqual(
      suggestions(idx, 'he').map((r) => r.to),
      ['/he/install'],
    );
  });

  it('skips a title-only page that has no sections to show', () => {
    const empty = page('/empty', 'Guide stub', []);
    assert.deepEqual(search({ v: 1, pages: [empty] }, 'guide', 'en'), []);
  });
});

describe('search: matching', () => {
  it('narrows as words are added', () => {
    assert.equal(search(index, 'guide node', 'en').length, 1);
    assert.equal(search(index, 'guide nothing-matches-this', 'en').length, 0);
  });

  it('is scoped to one locale', () => {
    const he: IndexedPage = { ...setup, p: '/he/local-setup', l: 'he' };
    const results = search({ v: 1, pages: [setup, he] }, 'node', 'he');
    assert.deepEqual(
      results.map((r) => r.to),
      ['/he/local-setup'],
    );
  });

  it('returns nothing for a blank query', () => {
    assert.deepEqual(search(index, '   ', 'en'), []);
  });
});

describe('highlight', () => {
  it('marks the matched text, case preserved', () => {
    assert.deepEqual(highlight('Open Settings now', ['settings']), ['Open ', 'Settings', ' now']);
  });

  it('keeps offsets right after a character that lengthens when lowercased', () => {
    // `İ`.toLowerCase() is two code units; the mark must still land on `tabs`.
    const [, mark] = highlight('İstanbul tabs', ['tabs']);
    assert.equal(mark, 'tabs');
  });
});
