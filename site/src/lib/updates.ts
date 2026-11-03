// With the extension so `node --test` can load this file; see changelog.test.ts.
import { UPDATES_API } from './site.ts';

/**
 * A post as the personal site's blog API returns it.
 *
 * Only the fields this site renders are declared. The API returns more
 * (body, readingMinutes, seo, links); narrowing here means a change to any of
 * those cannot break this page.
 */
export interface Update {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  tags: string[];
}

/** Everything the UI needs to decide what to render, with no thrown errors. */
export type UpdatesResult = { status: 'ok'; updates: Update[] } | { status: 'empty' } | { status: 'unavailable' };

function isUpdate(value: unknown): value is Update {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['slug'] === 'string' &&
    typeof v['title'] === 'string' &&
    typeof v['excerpt'] === 'string' &&
    typeof v['publishedAt'] === 'string' &&
    Array.isArray(v['tags'])
  );
}

/**
 * The list inside an API response, or null for a shape this does not know.
 *
 * The live endpoint answers `{ ok: true, items: [...] }` (queried 2026-11-03).
 * This used to accept only a bare array or `{ posts: [...] }`, neither of which
 * the API has ever returned, so even a successful response was read as
 * 'unavailable' (#374). The older two shapes stay accepted; they cost nothing.
 */
export function postsOf(body: unknown): unknown[] | null {
  if (Array.isArray(body)) return body;
  if (typeof body !== 'object' || body === null) return null;
  for (const key of ['items', 'posts'] as const) {
    const list = (body as Record<string, unknown>)[key];
    if (Array.isArray(list)) return list;
  }
  return null;
}

/**
 * Fetches WindoM's posts from the personal site.
 *
 * Deliberately never throws and never rejects. As of 2026-11-03 the API's CORS
 * allowlist does not include https://windom.app (that fix lives in the
 * portfolio_site repo) and the `windom` collection is empty, so in production
 * this returns 'unavailable' and the section shows the changelog's releases
 * instead. A marketing page must not show a broken state because a
 * cross-origin request was refused.
 */
export async function fetchUpdates(limit = 4, signal?: AbortSignal): Promise<UpdatesResult> {
  try {
    const res = await fetch(UPDATES_API, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return { status: 'unavailable' };

    const raw = postsOf(await res.json());
    if (!raw) return { status: 'unavailable' };

    const updates = raw
      .filter(isUpdate)
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .slice(0, limit);

    return updates.length ? { status: 'ok', updates } : { status: 'empty' };
  } catch {
    // Network failure, CORS refusal, abort, or malformed JSON all land here and
    // are the same thing as far as the page is concerned.
    return { status: 'unavailable' };
  }
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // UTC, because the changelog's dates are bare `YYYY-MM-DD`, which parse as UTC
  // midnight: in local time every reader west of Greenwich saw the day before,
  // and the prerendered HTML (built in UTC) would disagree with the hydrated page.
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
