import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fetchUpdates } from './updates.ts';

/** Plain `node --test`; see search.test.ts. `fetch` is stubbed per test. */

function post(slug: string, publishedAt: string) {
  return { slug, title: slug, excerpt: '', publishedAt, tags: [] };
}

function respond(body: unknown, init: ResponseInit = { status: 200 }): void {
  mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(body), init));
}

async function slugs(limit?: number): Promise<string[] | string> {
  const result = await fetchUpdates(limit);
  return result.status === 'ok' ? result.updates.map((u) => u.slug) : result.status;
}

describe('fetchUpdates', () => {
  afterEach(() => mock.restoreAll());

  const shapes: Array<[string, (list: unknown[]) => unknown]> = [
    ['{ ok, items }', (list) => ({ ok: true, items: list })],
    ['{ posts }', (list) => ({ posts: list })],
    ['a bare array', (list) => list],
  ];
  for (const [shape, wrap] of shapes) {
    it(`reads ${shape}`, async () => {
      respond(wrap([post('a', '2026-01-01')]));
      assert.deepEqual(await slugs(), ['a']);
    });
  }

  it('sorts newest first and honours the limit', async () => {
    respond({ items: [post('old', '2025-01-01'), post('new', '2026-06-01'), post('mid', '2025-09-01')] });
    assert.deepEqual(await slugs(2), ['new', 'mid']);
  });

  it('drops malformed posts, and reports empty when none survive', async () => {
    respond({ items: [{ slug: 'x' }, null, 'post', { ...post('y', '2026-01-01'), tags: 'no' }] });
    assert.deepEqual(await fetchUpdates(), { status: 'empty' });
  });

  it('reports empty for an empty list', async () => {
    respond({ ok: true, items: [] });
    assert.deepEqual(await fetchUpdates(), { status: 'empty' });
  });

  it('reports unavailable for an unknown shape', async () => {
    respond({ data: [post('a', '2026-01-01')] });
    assert.deepEqual(await fetchUpdates(), { status: 'unavailable' });
  });

  it('reports unavailable for a non-2xx response', async () => {
    respond({ items: [post('a', '2026-01-01')] }, { status: 503 });
    assert.deepEqual(await fetchUpdates(), { status: 'unavailable' });
  });

  it('never rejects on a network failure', async () => {
    mock.method(globalThis, 'fetch', async () => {
      throw new TypeError('Failed to fetch');
    });
    assert.deepEqual(await fetchUpdates(), { status: 'unavailable' });
  });

  it('never rejects on a body that is not JSON', async () => {
    mock.method(globalThis, 'fetch', async () => new Response('<html>', { status: 200 }));
    assert.deepEqual(await fetchUpdates(), { status: 'unavailable' });
  });
});
