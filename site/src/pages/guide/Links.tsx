import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Quick Links & Dock.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Links() {
  return (
    <DocsLayout path="/guide/links" eyebrow="User Guide" title="Quick Links & Dock Bar">
      <h2>Overview</h2>

      <p>
        Pin your most-used sites to the dock bar that runs across the top of every new tab. Each link shows as the
        site's icon, with its name on hover. The dock holds up to 27 links in rows of nine, and scrolls a row at a time.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            Click the <strong>+</strong> at the end of the dock, or open Settings → <strong>Links</strong> and click{' '}
            <strong>+ Add Link</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Enter a name and the full URL (e.g. <code>https://github.com</code>).
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            To remove a link, click the <strong>×</strong> on it in the dock or next to it in Settings → Links.
          </p>
        </div>
      </div>
      <p>
        To hide the dock altogether, turn off <strong>Quick Links</strong> under Settings → General → Widget Visibility.
      </p>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
