import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NAV_KEY, createNavMemory, parseNav, resolveClosed, serializeNav, type NavStorage } from './navMemory.ts';

/** Plain `node --test`; see search.test.ts. */

function fakeStorage(initial: Record<string, string> = {}): NavStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe('parseNav', () => {
  it('is empty for nothing, garbage, or the wrong shape', () => {
    for (const raw of [null, undefined, '', 'not json', '42', 'null', '"x"', '[]']) {
      assert.deepEqual(parseNav(raw), { closed: [], fresh: true, sections: true, scroll: 0 }, String(raw));
    }
  });

  it('reads what serializeNav wrote', () => {
    const m = { closed: ['Settings', 'Using WindoM'], fresh: false, sections: false, scroll: 0 };
    assert.deepEqual(parseNav(serializeNav(m)), m);
  });

  it('keeps only usable group names, once each', () => {
    const raw = JSON.stringify({ closed: ['A', 'A', 3, null, '', 'B', {}], sections: 'yes' });
    assert.deepEqual(parseNav(raw), { closed: ['A', 'B'], fresh: false, sections: true, scroll: 0 });
  });

  it('bounds how many groups a bad value can carry', () => {
    const many = Array.from({ length: 500 }, (_, i) => `g${i}`);
    assert.equal(parseNav(JSON.stringify({ closed: many })).closed.length, 40);
  });

  it('is fresh until a list of closed groups has been saved, even an empty one', () => {
    assert.equal(parseNav(JSON.stringify({ sections: false })).fresh, true);
    assert.equal(parseNav(JSON.stringify({ closed: [] })).fresh, false);
  });

  it('never takes the scroll position from storage', () => {
    assert.equal(parseNav(JSON.stringify({ closed: [], scroll: 900 })).scroll, 0);
  });
});

describe('createNavMemory', () => {
  it('reports whether storage has been read', () => {
    const store = createNavMemory(() => null);
    assert.equal(store.loaded(), false);
    store.load();
    assert.equal(store.loaded(), true);
  });

  it('is no longer fresh once anything is saved', () => {
    const store = createNavMemory(() => null);
    store.load();
    assert.equal(store.snapshot().fresh, true);
    store.save({ sections: false });
    assert.equal(store.snapshot().fresh, false);
  });

  it('has nothing to say before load, so the first render matches the prerendered HTML', () => {
    const store = createNavMemory(() => fakeStorage({ [NAV_KEY]: JSON.stringify({ closed: ['A'] }) }));
    assert.deepEqual(store.snapshot().closed, []);
  });

  it('loads from storage once, then serves the cache', () => {
    const s = fakeStorage({ [NAV_KEY]: JSON.stringify({ closed: ['A'], sections: false }) });
    const store = createNavMemory(() => s);
    assert.deepEqual(store.load().closed, ['A']);
    s.data[NAV_KEY] = JSON.stringify({ closed: ['Z'] });
    assert.deepEqual(store.load().closed, ['A'], 'second load must not re-read');
    assert.equal(store.snapshot().sections, false);
  });

  it('writes closed groups and the section state, and not the scroll position', () => {
    const s = fakeStorage();
    const store = createNavMemory(() => s);
    store.load();
    store.setScroll(480);
    store.save({ closed: ['A', 'B'], sections: false });
    assert.deepEqual(JSON.parse(s.data[NAV_KEY] ?? 'null'), { closed: ['A', 'B'], sections: false });
    assert.equal(store.snapshot().scroll, 480, 'scroll stays in memory');
  });

  it('keeps the rest when only one field is saved', () => {
    const store = createNavMemory(() => fakeStorage());
    store.load();
    store.save({ closed: ['A'] });
    store.save({ sections: false });
    assert.deepEqual(store.snapshot(), { closed: ['A'], fresh: false, sections: false, scroll: 0 });
  });

  it('survives storage that throws, on read and on write', () => {
    const broken: NavStorage = {
      getItem() {
        throw new Error('denied');
      },
      setItem() {
        throw new Error('full');
      },
    };
    const store = createNavMemory(() => broken);
    assert.deepEqual(store.load(), { closed: [], fresh: true, sections: true, scroll: 0 });
    store.save({ closed: ['A'] });
    assert.deepEqual(store.snapshot().closed, ['A'], 'still remembered for this visit');
  });

  it('survives having no storage at all, as in the prerender', () => {
    const store = createNavMemory(() => null);
    assert.deepEqual(store.load(), { closed: [], fresh: true, sections: true, scroll: 0 });
    store.save({ sections: false });
    assert.equal(store.snapshot().sections, false);
  });

  it('ignores a scroll position that is not a positive number', () => {
    const store = createNavMemory(() => null);
    for (const bad of [-5, NaN, Infinity]) {
      store.setScroll(bad);
      assert.equal(store.snapshot().scroll, 0, String(bad));
    }
    store.setScroll(120);
    assert.equal(store.snapshot().scroll, 120);
  });
});

describe('resolveClosed', () => {
  const groups = ['Get started', 'Everyday panels', 'Settings'];

  it('folds everything but the current group for a reader who has never touched the tree', () => {
    assert.deepEqual(
      [...resolveClosed({ closed: [], fresh: true }, groups, 'Everyday panels')],
      ['Get started', 'Settings'],
    );
  });

  it("uses the reader's own list once there is one, even an empty one", () => {
    assert.deepEqual([...resolveClosed({ closed: [], fresh: false }, groups, 'Settings')], []);
    assert.deepEqual(
      [...resolveClosed({ closed: ['Get started'], fresh: false }, groups, 'Settings')],
      ['Get started'],
    );
  });

  it('never folds the group the reader is in', () => {
    assert.deepEqual([...resolveClosed({ closed: ['Settings'], fresh: false }, groups, 'Settings')], []);
  });

  it('folds everything on a page that is in no group', () => {
    assert.equal(resolveClosed({ closed: [], fresh: true }, groups, undefined).size, 3);
  });

  it('ignores a remembered group that no longer exists', () => {
    assert.deepEqual([...resolveClosed({ closed: ['Gone'], fresh: false }, groups, 'Settings')], ['Gone']);
  });
});
