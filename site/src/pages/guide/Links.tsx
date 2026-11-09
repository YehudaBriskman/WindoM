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
      <h2>How it works</h2>
      <p>
        Each link is a name and an address. The dock shows the site's icon, and clicking it opens the site in the same
        tab. The dock appears at the top of the new tab and can be switched off at any time without losing your links.
      </p>
      <ul>
        <li>
          <strong>Adding from the dock.</strong> The <strong>+</strong> opens a small form with <strong>Name</strong>{' '}
          and <strong>https://...</strong> fields. If you leave the name empty, the site's host name is used (without a
          leading <code>www.</code>). If you type an address without a scheme, such as <code>github.com</code>,{' '}
          <code>https://</code> is added for you. Press <strong>Add</strong> to save.
        </li>
        <li>
          <strong>Adding from Settings.</strong> <strong>+ Add Link</strong> in Settings → Links adds a row you then
          fill in. Name and URL can be edited in place at any time.
        </li>
        <li>
          <strong>Rows.</strong> Links fill rows of nine, up to three rows. With more than one row, use the mouse wheel
          over the dock to move one row at a time, or click the dots beneath it. When you reach 27 links the{' '}
          <strong>+</strong> disappears; remove a link to make room.
        </li>
      </ul>

      <h2>Every setting explained</h2>
      <ul>
        <li>
          <strong>Icon</strong> - not editable. It is fetched automatically from the site's address. If no icon can be
          found, a generic link symbol is shown instead.
        </li>
        <li>
          <strong>Name</strong> - the label shown on hover and read by screen readers.
        </li>
        <li>
          <strong>URL</strong> - must start with <code>http://</code> or <code>https://</code> and be no longer than
          2048 characters. Other schemes are not accepted. A row with an invalid address is highlighted in Settings, and
          the matching dock icon does not open anything until you fix it.
        </li>
        <li>
          <strong>Quick Links</strong> toggle - under Settings → General → Widget Visibility. Turning it off hides the
          dock; your links stay saved.
        </li>
      </ul>
      <p>A fresh install starts with three links: Gmail, YouTube and GitHub. You can remove or replace them.</p>

      <h2>Where your data is stored and what leaves your device</h2>
      <p>
        Your links are part of your WindoM settings and live in Chrome's extension storage in your browser. If you have
        a WindoM account with settings sync, they travel with your other settings to the browsers you sign in to.
      </p>
      <p>
        To draw each icon, your browser asks Google's favicon service (<code>google.com/s2/favicons</code>) for the icon
        of that site's domain. That request names the domain of each link shown on the dock. Addresses without a dot in
        the host name, such as <code>localhost</code>, are not looked up and show the generic symbol. See the{' '}
        <Link to="/privacy">privacy policy</Link> for the full list of services the extension contacts.
      </p>

      <h2>Tips and good setups</h2>
      <ul>
        <li>Put the sites you open every day in the first row, since that row is the one visible without scrolling.</li>
        <li>Link to the exact page you want, such as a project board or a dashboard, not just a site's home page.</li>
        <li>Give links short names; they are shown on hover, so a word or two is enough.</li>
        <li>
          Pair a short dock with a minimal layout: see <Link to="/guide/templates">Layout templates</Link>, where some
          arrangements hide the dock and others keep it.
        </li>
        <li>
          Use <Link to="/guide/search">Search</Link> for sites you only visit occasionally and keep the dock for the
          regulars.
        </li>
      </ul>

      <h2>Common questions</h2>
      <h3>Can I open a link in a new tab?</h3>
      <p>
        Links open in the current tab. Use your browser's usual options on a link, such as the context menu, if you want
        a new tab.
      </p>
      <h3>Why does a link show a generic icon?</h3>
      <p>
        The icon comes from an online favicon service. If it has no icon for that site, if the host name has no dot or
        if the request fails, the generic link symbol is shown. The link still works.
      </p>
      <h3>Can I link to a file or a chrome:// page?</h3>
      <p>
        No. Only <code>http://</code> and <code>https://</code> addresses are accepted.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Enter a valid HTTP or HTTPS URL.</strong> The address in the dock form could not be read as a web
          address. Check for typos and spaces.
        </li>
        <li>
          <strong>A dock icon does nothing when clicked.</strong> Open Settings → Links and check that its URL starts
          with <code>https://</code> or <code>http://</code>.
        </li>
        <li>
          <strong>The dock is missing.</strong> Turn <strong>Quick Links</strong> back on under Settings → General →
          Widget Visibility.
        </li>
        <li>
          <strong>No + button.</strong> The dock is full at 27 links. Remove one.
        </li>
        <li>
          Still stuck? See <Link to="/support">Support</Link>.
        </li>
      </ul>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/search">Search</Link> - go straight to a search engine from the new tab
        </li>
        <li>
          <Link to="/guide/templates">Layout templates</Link> - preset arrangements that show or hide the dock
        </li>
        <li>
          <Link to="/guide/tab-sidebar">Tab sidebar</Link> - jump between tabs you already have open
        </li>
      </ul>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
