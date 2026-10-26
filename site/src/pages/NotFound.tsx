import { Link } from 'react-router';
import { SiteNav } from '../components/SiteNav';

/**
 * The in-app 404.
 *
 * `public/404.html` is what GitHub Pages serves for a path it has no file for,
 * and it boots this app - so an unmatched path lands here. The two say the same
 * thing deliberately: one for visitors who arrive before the bundle loads, one
 * for anyone who reaches a dead link from inside the site.
 */
export function NotFound() {
  return (
    <div className="docs">
      <div className="ambient" aria-hidden="true" />
      <SiteNav />
      <main id="content" className="wrap wrap-prose" style={{ padding: '18vh 24px 20vh' }}>
        <h1>Page not found</h1>
        <p className="lede">
          That address does not exist on windom.app. It may have moved, or the link may be
          wrong.
        </p>
        <div className="btn-row">
          <Link className="btn btn-primary" to="/">
            Back to WindoM
          </Link>
          <Link className="btn btn-secondary" to="/guide">
            User Guide
          </Link>
        </div>
      </main>
    </div>
  );
}
