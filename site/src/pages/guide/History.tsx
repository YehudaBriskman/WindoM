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
      <h2>How it works</h2>
      <p>
        When History is on, WindoM asks Chrome for pages from the last seven days and builds the <strong>Recent</strong>{' '}
        list from the result. Entries without a title are skipped, and only one entry is kept per site: if you opened
        several pages on the same website, the most recent one represents it. The list shows up to ten sites. Each row
        shows the page title and a relative time such as <code>just now</code>, <code>12m ago</code>,{' '}
        <code>3h ago</code>, <code>yesterday</code> or <code>2d ago</code>.
      </p>
      <p>
        The feature is on only when two things are true: the <strong>Show in sidebar and search</strong> switch is on
        and Chrome has granted WindoM the optional <code>history</code> permission. If either is missing, the feature
        shows as off.
      </p>

      <h2>The setting explained</h2>
      <ul>
        <li>
          <strong>Show in sidebar and search</strong> - under Settings → <strong>Apps</strong> →{' '}
          <strong>History</strong> (the card is labelled <strong>Browsing History</strong>). It is off by default. One
          switch controls both the <strong>Recent</strong> list and the history suggestions in search.
        </li>
        <li>
          Turning it on asks Chrome for permission to read your browsing history. Turning it off switches the feature
          off and gives that permission back, so WindoM holds it only while the feature is in use.
        </li>
        <li>
          If you decline the prompt, WindoM shows a message that Chrome did not grant access, and the switch stays off.
          You can turn it on again at any time.
        </li>
      </ul>

      <h2>History in search</h2>
      <p>
        With History on, typing in the <Link to="/guide/search">search</Link> box can also suggest pages you have
        visited. WindoM asks Chrome's history for matches to what you typed, leaves out pages that are already open in a
        tab, and shows at most four. Chrome performs the matching on your device.
      </p>

      <h2>What leaves your device</h2>
      <p>
        Your browsing history is read through Chrome's own history API and is not sent to WindoM's servers or to any
        other service. There is one outside request related to this list: each row's site icon is loaded from Google's
        favicon service (<code>www.google.com/s2/favicons</code>), and that request contains the site's host name, such
        as <code>example.com</code>. If an icon cannot be loaded, it is simply hidden and the row still works. For the
        full list of services WindoM contacts, see the <Link to="/privacy">privacy policy</Link>.
      </p>

      <h2>Tips</h2>
      <ul>
        <li>
          Use <strong>Recent</strong> as a way back to something you closed a moment ago. It covers the last week and
          keeps one entry per site, so it is not a full history; for that, use Chrome's own history page.
        </li>
        <li>
          Pair it with the <Link to="/guide/tab-sidebar">Tab Sidebar</Link>: open tabs and recently visited sites sit in
          the same sidebar.
        </li>
        <li>If you only want the sidebar list or only the search suggestions, note that they share one switch.</li>
      </ul>

      <h2>Common questions</h2>
      <p>
        <strong>Does WindoM ask for my history when I install it?</strong>
      </p>
      <p>
        No. The <code>history</code> permission is optional and is requested only when you turn this feature on.
      </p>
      <p>
        <strong>Why is the list empty?</strong>
      </p>
      <p>
        The list is hidden when there is nothing to show: for example, no site with a title was visited in the last
        seven days, or the feature is off.
      </p>
      <p>
        <strong>I turned it on, but I see "Allow access" instead of my sites. Why?</strong>
      </p>
      <p>
        The switch is on but Chrome no longer has the permission for this install. This happens if you removed it at{' '}
        <code>chrome://extensions</code>, or if the setting reached this browser through settings sync from another
        device where it was allowed. Click <strong>Allow access</strong> in the Recent section, or turn the switch off
        and on again in Settings.
      </p>
      <p>
        <strong>How do I stop it completely?</strong>
      </p>
      <p>
        Turn off <strong>Show in sidebar and search</strong>. The permission is returned to Chrome at the same time.
      </p>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/search">Search</Link> - where history suggestions appear
        </li>
        <li>
          <Link to="/guide/tab-sidebar">Tab Sidebar</Link> - your open tabs
        </li>
        <li>
          <Link to="/privacy">Privacy policy</Link> and <Link to="/support">Support</Link>
        </li>
      </ul>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
