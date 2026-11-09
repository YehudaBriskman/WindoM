import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Layout Templates.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Templates() {
  return (
    <DocsLayout path="/guide/templates" eyebrow="User Guide" title="Layout Templates">
      <h2>Overview</h2>

      <p>
        Settings → <strong>Templates</strong> has six preset layouts that switch several settings at once:{' '}
        <strong>Minimal</strong> (just the clock), <strong>Productivity</strong>, <strong>Inspiration</strong>,{' '}
        <strong>Dashboard</strong> (everything on), <strong>Night Owl</strong> and <strong>Deep Focus</strong>.
      </p>
      <p>
        Click <strong>Apply</strong> on one and confirm. A template only overwrites the sections it covers, and the
        confirmation names them; your links, keys and connections stay as they are.
      </p>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
