import { UPDATES_API } from './site';

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
export type UpdatesResult =
  | { status: 'ok'; updates: Update[] }
  | { status: 'empty' }
  | { status: 'unavailable' };

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
 * Fetches WindoM's posts from the personal site.
 *
 * Deliberately never throws and never rejects. The API's CORS allowlist does not
 * yet include this origin, so in production today this returns 'unavailable' and
 * the section falls back to a plain link to the blog. A marketing page must not
 * show a broken state because a cross-origin request was refused, and the
 * section is decorative - the rest of the page does not depend on it.
 */
export async function fetchUpdates(limit = 4, signal?: AbortSignal): Promise<UpdatesResult> {
  try {
    const res = await fetch(UPDATES_API, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return { status: 'unavailable' };

    const body: unknown = await res.json();
    // The endpoint returns either a bare array or { posts: [...] } depending on
    // version; accept both rather than coupling to one.
    const raw = Array.isArray(body)
      ? body
      : typeof body === 'object' && body !== null && Array.isArray((body as { posts?: unknown }).posts)
        ? (body as { posts: unknown[] }).posts
        : null;

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
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
