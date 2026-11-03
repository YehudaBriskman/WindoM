import { useEffect, useState } from 'react';
import releases from 'virtual:release-feed';
import { fetchUpdates, formatDate, type Update } from '../lib/updates';
import { BLOG_URL, GITHUB_URL } from '../lib/site';

const CHANGELOG_URL = `${GITHUB_URL}/blob/main/CHANGELOG.md`;

/**
 * Replaces the hand-maintained changelog that previously lived inline in the
 * landing page and had drifted about six months out of date.
 *
 * Two sources, in order of preference:
 *
 * 1. Posts in the personal site's `windom` blog collection, when that API
 *    answers this origin with any. Written prose, so it wins when it exists.
 * 2. The newest releases from CHANGELOG.md, parsed at build time
 *    (`virtual:release-feed`). Always present, because the changelog is written
 *    as part of cutting a release.
 *
 * Until #374 the blog was the only source, and it has never once answered -
 * no CORS header for windom.app, a response shape this did not parse, and an
 * empty collection - so eleven releases shipped and the section showed none of
 * them. The changelog is the floor that keeps that from recurring: the section
 * renders real releases in the prerendered HTML, before any script runs, and a
 * blog that is unreachable or empty changes nothing visible.
 */
export function Updates() {
  const [posts, setPosts] = useState<Update[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchUpdates(4, controller.signal).then((r) => {
      if (r.status === 'ok') setPosts(r.updates);
    });
    return () => controller.abort();
  }, []);

  return (
    /* `id="updates"` is what the nav's "Changelog" item points at, and nothing
       on the page carried it: the section was only labelled by its heading,
       which names it for a screen reader but is not somewhere a URL can land.
       So `/#updates` resolved to nothing and the link was a dead anchor that
       dropped you at the top of the home page. The id goes on the section
       rather than on the heading, so the eyebrow above it is not scrolled past. */
    <section className="section" id="updates" aria-labelledby="updates-heading">
      <div className="wrap">
        <span className="eyebrow">Latest</span>
        <h2 id="updates-heading">
          What&rsquo;s <span className="gradient-text">new</span>
        </h2>

        {posts ? (
          <>
            <ul className="updates-list">
              {posts.map((u) => (
                <li key={u.slug}>
                  <a className="update" href={`${BLOG_URL}/${u.slug}`}>
                    <time className="update-date" dateTime={u.publishedAt}>
                      {formatDate(u.publishedAt)}
                    </time>
                    <h3>{u.title}</h3>
                    <p className="muted">{u.excerpt}</p>
                  </a>
                </li>
              ))}
            </ul>
            <a className="btn btn-secondary" href={BLOG_URL}>
              Read all updates
            </a>
          </>
        ) : (
          <>
            <ul className="updates-list">
              {releases.map((r) => (
                <li key={r.version}>
                  <a className="update" href={`${CHANGELOG_URL}#${r.anchor}`}>
                    <time className="update-date" dateTime={r.date}>
                      {formatDate(r.date)}
                    </time>
                    <h3>Version {r.version}</h3>
                    <p className="muted">{r.summary}</p>
                  </a>
                </li>
              ))}
            </ul>
            <a className="btn btn-secondary" href={CHANGELOG_URL}>
              Full changelog
            </a>
          </>
        )}
      </div>
    </section>
  );
}
