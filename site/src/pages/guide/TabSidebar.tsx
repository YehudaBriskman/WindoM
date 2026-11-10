import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';
import { GuideShot } from '../../components/GuideShot';

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
      <GuideShot
        shot="sidebar"
        alt="A new tab with the sidebar slid out on the right: today's tasks, a calendar and upcoming events over a sunrise wallpaper"
        caption="The sidebar slid out on the right edge of a new tab."
      />

      <h2>How it works</h2>
      <p>
        A strip about 15 pixels wide runs along the chosen edge of the new tab. When the pointer enters it, the panel
        slides out; when the pointer leaves, the panel waits about a third of a second and slides back. While the panel
        is hidden, a thin marker at the edge shows where to point.
      </p>
      <ul>
        <li>
          <strong>All windows</strong> - the list includes the tabs of every open Chrome window, not only the one you
          are in.
        </li>
        <li>
          <strong>The current tab is highlighted</strong>, and each row shows the page's icon (or a plain placeholder if
          it has none) and its title. Hover a row to see the full title.
        </li>
        <li>
          <strong>Switching</strong> - click a row and Chrome activates that tab and brings its window to the front. The
          panel then closes.
        </li>
        <li>
          <strong>New Tab</strong> - opens a blank tab and closes the panel.
        </li>
        <li>
          <strong>Always current</strong> - the list updates as tabs are opened, closed, switched or change title, so
          you do not need to refresh it.
        </li>
        <li>
          <strong>Left out</strong> - Chrome's own pages (<code>chrome://</code>) and extension pages (
          <code>chrome-extension://</code>) are not listed.
        </li>
      </ul>

      <h2>Every setting explained</h2>
      <p>
        There is one setting: <strong>Tab Sidebar</strong> under Settings → General, with two choices.
      </p>
      <ul>
        <li>
          <strong>Right</strong> - the default. The panel slides out from the right edge.
        </li>
        <li>
          <strong>Left</strong> - the panel slides out from the left edge instead.
        </li>
      </ul>
      <p>
        The settings panel gives the same hint in short: hover within 15px of the chosen edge to reveal tabs. The choice
        is saved with your other settings.
      </p>

      <h2>Where your data is stored and what leaves your device</h2>
      <p>
        The tab list is read from Chrome through the extension's <code>tabs</code> permission and is shown on the page;
        it is not sent anywhere. The only thing saved is which side you chose. Titles and addresses of your tabs are
        never part of your WindoM settings.
      </p>
      <p>
        See the <Link to="/privacy">Privacy Policy</Link> for what the extension stores and which services it contacts.
      </p>

      <h2>Tips and good setups</h2>
      <ul>
        <li>
          Choose the edge that is away from your scroll bar or window controls, so the pointer does not trigger the
          panel by accident.
        </li>
        <li>
          The tab sidebar is for browsing your tabs by eye. To find one by name, use{' '}
          <Link to="/guide/search">Search</Link>, which lists matching open tabs first.
        </li>
        <li>
          Do not confuse it with the other panel on the new tab, the one opened with the icon button, which holds{' '}
          <Link to="/guide/todos">Tasks</Link>, the calendar and <Link to="/guide/history">Tab History</Link>. That
          panel closes with <kbd>Escape</kbd> or a click outside it; the tab sidebar closes when the pointer leaves.
        </li>
      </ul>

      <h2>Common questions</h2>
      <p>
        <strong>Does it work on other websites?</strong> No. It is part of the new tab page. Search is the feature that
        also opens over ordinary sites.
      </p>
      <p>
        <strong>Can I turn it off?</strong> There is no on/off switch for it. You choose the side, and it only appears
        when you point at that edge.
      </p>
      <p>
        <strong>Can I close tabs from it?</strong> Not from the sidebar. It switches to tabs and opens a new one.
      </p>
      <p>
        <strong>Can I reorder or group tabs?</strong> No. The sidebar lists tabs and switches to them.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>The panel does not slide out</strong> - move the pointer all the way to the screen edge you chose in
          Settings → General → Tab Sidebar; the trigger strip is only 15 pixels wide.
        </li>
        <li>
          <strong>A tab is missing</strong> - Chrome's own pages and extension pages are deliberately left out.
        </li>
        <li>
          <strong>The panel is on the wrong side</strong> - choose <strong>Left</strong> or <strong>Right</strong> in
          Settings → General → Tab Sidebar.
        </li>
      </ul>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/search">Search</Link> - find and switch to a tab by name
        </li>
        <li>
          <Link to="/guide/history">Tab History</Link> - recently visited pages
        </li>
        <li>
          <Link to="/guide/shortcuts">Keyboard Shortcuts</Link>
        </li>
        <li>
          <Link to="/privacy">Privacy Policy</Link> and <Link to="/support">Support</Link>
        </li>
      </ul>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
