import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Tab History.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function History() {
  return (
    <DocsLayout path="/guide/history" eyebrow="User Guide" title="Tab History">
      <h2>Overview</h2>

      <p>
        Adds a <strong>Recent</strong> list to the sidebar: the ten sites you visited most recently, each with its icon
        and when you were there. It is off until you turn it on.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            Open Settings → <strong>Apps</strong> → <strong>History</strong> and turn on{' '}
            <strong>Show in sidebar and search</strong>. Chrome then asks whether WindoM may read your browsing history
            - click <strong>Allow</strong>. If you decline, the switch stays off and nothing else changes.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>Open the sidebar from the list icon in the bottom-right corner. Click an entry to open it in a new tab.</p>
        </div>
      </div>
      <p>
        The list is read from Chrome's own history on your device; nothing in it is sent anywhere. The same switch adds
        pages you visited to the <Link to="/guide/search">search</Link> suggestions on the new tab.
      </p>
      <p>
        WindoM does not ask for your history when you install it - only when you turn this on. Turning it off gives the
        permission back to Chrome. If you remove it yourself at <code>chrome://extensions</code>, the{' '}
        <strong>Recent</strong> list shows an <strong>Allow access</strong> button instead of your history.
      </p>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
