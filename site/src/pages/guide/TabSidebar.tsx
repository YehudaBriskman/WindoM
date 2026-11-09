import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Tab Sidebar.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function TabSidebar() {
  return (
    <DocsLayout path="/guide/tab-sidebar" eyebrow="User Guide" title="Tab Sidebar">
      <h2>Overview</h2>

      <p>
        Move the pointer to the right edge of the new tab and a panel slides out listing every open tab, across all your
        windows. Click one to switch to it, or click <strong>New Tab</strong> at the top. Chrome's own pages are left
        out of the list.
      </p>
      <p>
        To use the left edge instead, open Settings → <strong>General</strong> → <strong>Tab Sidebar</strong> and choose{' '}
        <strong>Left</strong>.
      </p>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
