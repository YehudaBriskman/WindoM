import { useEffect, useState } from 'react';
import { fetchUpdates, formatDate, type UpdatesResult } from '../lib/updates';
import { BLOG_URL } from '../lib/site';

/**
 * Replaces the hand-maintained changelog that previously lived inline in the
 * landing page and had drifted about six months out of date.
 *
 * Updates are written once on the personal site's blog, tagged to this project,
 * and read from here - so there is one place to write and nothing to keep in
 * sync by hand.
 */
export function Updates() {
  const [result, setResult] = useState<UpdatesResult | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchUpdates(4, controller.signal).then(setResult);
    return () => controller.abort();
  }, []);

  // Render nothing at all while in flight. A skeleton would be more motion than
  // a four-item list deserves, and this section sits below the fold.
  if (result === null) return null;

  return (
    <section className="section" aria-labelledby="updates-heading">
      <div className="wrap">
        <span className="eyebrow">Latest</span>
        <h2 id="updates-heading">
          What&rsquo;s <span className="gradient-text">new</span>
        </h2>

        {result.status === 'ok' ? (
          <>
            <ul className="updates-list">
              {result.updates.map((u) => (
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
          // Covers both 'empty' and 'unavailable'. Neither is worth an error
          // message on a marketing page - the useful action is the same either way.
          <>
            <p className="lede">
              Release notes and write-ups are published on the blog.
            </p>
            <a className="btn btn-secondary" href={BLOG_URL}>
              Read the blog
            </a>
          </>
        )}
      </div>
    </section>
  );
}
