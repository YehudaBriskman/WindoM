import { Link } from 'react-router';
import { DocsLayout } from '../components/DocsLayout';
import { STORE_URL } from '../lib/site';

/**
 * The first documentation page: getting WindoM into Chrome and finding the
 * controls.
 *
 * Installation used to exist only as a button on the home page, so the docs
 * began with the guide's discussion of accounts - a reader who arrived from a
 * search had no first step. Every location named here is checked against the
 * extension: the gear is `.settings-container` (fixed bottom-left), the
 * widget sidebar `.sidebar-container` (bottom-right), the tab sidebar's
 * trigger a 15px strip on the edge chosen in Settings → General, and the
 * search shortcut the Ctrl + Meta + H handler in `SearchOverlay`.
 */
export function Install() {
  return (
    <DocsLayout path="/install" eyebrow="Get started" title="Install WindoM" subtitle="About a minute, and no account">
      <p>
        WindoM is a Chrome extension that replaces the new tab page. Installing it is the only step most people ever
        need: the clock, weather, backgrounds, todos, quick links, quotes, search and focus mode all work the moment it
        is in, with nothing to sign up for.
      </p>

      <h2>Add it to Chrome</h2>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            Open <a href={STORE_URL}>WindoM on the Chrome Web Store</a> and click <strong>Add to Chrome</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Chrome lists the permissions WindoM asks for and asks you to confirm. Click <strong>Add extension</strong>.
            What each permission is for is explained <Link to="/support#all-sites">on the support page</Link>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            Open a new tab. WindoM is now your new tab page, and the first one shows a short welcome tour - step through
            it, or close it with the <strong>×</strong> in its corner.
          </p>
          <p>
            If Chrome asks whether you meant to change the new tab page, choose to keep the change. Choosing to change
            it back turns WindoM off.
          </p>
        </div>
      </div>
      <h2>What works without an account</h2>
      <p>Everything below works on your device straight away, with no sign-in:</p>
      <ul>
        <li>
          <Link to="/guide/clock">Clock and greeting</Link>, <Link to="/guide/background">backgrounds</Link> and{' '}
          <Link to="/guide/weather">weather</Link>
        </li>
        <li>
          <Link to="/guide/links">Quick links</Link>, <Link to="/guide/todos">todos</Link> and{' '}
          <Link to="/guide/quotes">daily quotes</Link>
        </li>
        <li>
          <Link to="/guide/focus">Focus mode</Link>, <Link to="/guide/search">search</Link>, the{' '}
          <Link to="/guide/tab-sidebar">tab sidebar</Link> and <Link to="/guide/history">tab history</Link>
        </li>
        <li>
          <Link to="/guide/finance">Stock and crypto prices</Link> and{' '}
          <Link to="/guide/templates">layout templates</Link>
        </li>
      </ul>
      <p>
        A free <Link to="/guide/account">WindoM account</Link> is needed only to carry your settings between computers
        and to connect Google Calendar, GitHub or Spotify. You can add one at any time without losing what you have set
        up.
      </p>

      <h2>Finding your way around</h2>
      <ul>
        <li>
          <strong>Settings</strong> - the gear icon in the bottom-left corner of the new tab. Every option in this
          documentation is under one of its tabs: General, Clock, Background, Weather, Quotes, Links, Apps, Templates
          and Account.
        </li>
        <li>
          <strong>The sidebar</strong> - the list icon in the bottom-right corner. It holds your todos, and once you
          turn them on, tab history, calendar events, GitHub counts and Spotify top tracks.
        </li>
        <li>
          <strong>The tab sidebar</strong> - move the pointer to the right edge of the new tab to see every open tab.
          The edge can be switched to the left in Settings → General.
        </li>
        <li>
          <strong>Search</strong> - press <kbd>Ctrl</kbd> + <kbd>Win</kbd> + <kbd>H</kbd>, or <kbd>Ctrl</kbd> +{' '}
          <kbd>Cmd</kbd> + <kbd>H</kbd> on a Mac, on the new tab or on any website. Chrome's own pages, such as{' '}
          <code>chrome://</code> settings, are the exception: extensions cannot run there.
        </li>
        <li>
          <strong>Apps</strong> - Settings → <strong>Apps</strong> is where Calendar, Finance, GitHub, Spotify, Tasks
          and History are switched on and connected.
        </li>
      </ul>

      <h2>Where to go next</h2>
      <ul>
        <li>
          The <Link to="/guide">User Guide</Link> walks through every panel, simplest first.
        </li>
        <li>
          <Link to="/support">Support</Link> has fixes for the problems that come up most.
        </li>
        <li>
          The <Link to="/privacy">privacy policy</Link> sets out what stays on your device and what the optional account
          stores.
        </li>
        <li>
          To remove WindoM, open <code>chrome://extensions</code> and click <strong>Remove</strong> on its card.
          Chrome's own new tab comes back straight away.
        </li>
      </ul>
    </DocsLayout>
  );
}
