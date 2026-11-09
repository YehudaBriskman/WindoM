import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Daily Quotes.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Quotes() {
  return (
    <DocsLayout path="/guide/quotes" eyebrow="User Guide" title="Daily Quotes">
      <h2>Overview</h2>

      <p>A quote sits at the bottom of the new tab and changes once a day. Click it for another one.</p>
      <p>
        In Settings → <strong>Quotes</strong>, <strong>Show daily quotes</strong> turns it on or off, and{' '}
        <strong>Quote Source</strong> chooses between <strong>Local Quotes</strong>, a collection that ships with the
        extension, and <strong>API Quotes</strong>, fetched from the Quotable service.
      </p>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
