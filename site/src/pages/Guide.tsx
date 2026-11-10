import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { DocsLayout } from '../components/DocsLayout';

/**
 * The English user guide.
 *
 * The previous guide shipped both languages in every response and swapped them
 * with CSS display rules, so Hebrew was never indexable and every reader
 * downloaded a language they could not read. Each language now has its own URL
 * and carries only its own copy, with hreflang alternates in the HTML entry.
 *
 * Sections run from no setup at all to the most setup: the panels that work
 * the moment WindoM is installed, then the optional account, then the
 * integrations that need a credential of your own, ending with Spotify's four
 * steps. The order is the opening callout's promise kept - it used to put
 * Spotify second and the clock last. Every setting named here is a label in
 * web/src; the Hebrew page mirrors this one section for section.
 */

/** Every id the guide used to have as a section, so an old `/guide/spotify` still lands. */
const MOVED = new Set([
  'clock',
  'background',
  'links',
  'todos',
  'focus',
  'quotes',
  'search',
  'tab-sidebar',
  'history',
  'weather',
  'finance',
  'templates',
  'account',
  'calendar',
  'github',
  'spotify',
]);

export function Guide() {
  const navigate = useNavigate();
  const { hash } = useLocation();

  useEffect(() => {
    const id = hash.replace(/^#/, '');
    if (MOVED.has(id)) navigate(`/guide/${id}`, { replace: true });
  }, [hash, navigate]);

  return (
    <DocsLayout path="/guide" eyebrow="User Guide" title="Using WindoM">
      <h2 id="overview">At a glance</h2>
      <div className="callout tip">
        <strong>No account required for most things.</strong> The clock, weather, backgrounds, quick links, todos, focus
        mode, quotes, search, the tab sidebar and stock prices all work instantly with no sign-in. An account is only
        needed for settings sync, Google Calendar, GitHub and Spotify. You can always add one later. New here? Start
        with <Link to="/install">Install</Link>.
      </div>
      <div className="feature-grid">
        <Link className="feature-card" to="/guide/clock" viewTransition>
          <div className="feature-card-title">Clock &amp; Greeting</div>
          <div className="feature-card-desc">12h / 24h, style, color, size, date. Always on, no account needed.</div>
        </Link>
        <Link className="feature-card" to="/guide/background" viewTransition>
          <div className="feature-card-title">Background</div>
          <div className="feature-card-desc">Built-in photos, your own images, or Unsplash. Stored locally.</div>
        </Link>
        <Link className="feature-card" to="/guide/links" viewTransition>
          <div className="feature-card-title">Quick Links</div>
          <div className="feature-card-desc">Pin your most-used sites to the dock bar at the top.</div>
        </Link>
        <Link className="feature-card" to="/guide/todos" viewTransition>
          <div className="feature-card-title">Todos</div>
          <div className="feature-card-desc">A task list in the sidebar. No account needed.</div>
        </Link>
        <Link className="feature-card" to="/guide/focus" viewTransition>
          <div className="feature-card-title">Focus Mode</div>
          <div className="feature-card-desc">Set your main focus, then a countdown that hides everything else.</div>
        </Link>
        <Link className="feature-card" to="/guide/search" viewTransition>
          <div className="feature-card-title">Search</div>
          <div className="feature-card-desc">One shortcut on any page: tabs, history and the web.</div>
        </Link>
        <Link className="feature-card" to="/guide/weather" viewTransition>
          <div className="feature-card-title">Weather</div>
          <div className="feature-card-desc">Live temperature and conditions. No API key, no account.</div>
        </Link>
        <Link className="feature-card" to="/guide/calendar" viewTransition>
          <div className="feature-card-title">Google Calendar</div>
          <div className="feature-card-desc">
            Upcoming events in the sidebar. Needs an account + Google authorization.
          </div>
        </Link>
        <Link className="feature-card" to="/guide/spotify" viewTransition>
          <div className="feature-card-title">Spotify</div>
          <div className="feature-card-desc">
            Now playing, playback controls and top tracks. Needs an account + a free Spotify Developer app.
          </div>
        </Link>
      </div>
      <p>
        Something not behaving as described here? <Link to="/support">Support</Link> covers the problems that come up
        most. If you want to run or change WindoM yourself, see <Link to="/local-setup">Local Setup</Link>.
      </p>
      <h2 id="everyday">Everyday panels</h2>
      <p>These work the moment WindoM is installed, with no account.</p>
      <ul>
        <li>
          <Link to="/guide/clock">Clock, Date & Greeting</Link> - 12h or 24h, style, date, greeting
        </li>
        <li>
          <Link to="/guide/background">Backgrounds</Link> - Built-in, your own, or Unsplash
        </li>
        <li>
          <Link to="/guide/links">Quick Links & Dock</Link> - Pin your most-used sites
        </li>
        <li>
          <Link to="/guide/todos">Todos</Link> - A task list in the sidebar
        </li>
        <li>
          <Link to="/guide/focus">Focus Mode</Link> - Set an intention, then a timer
        </li>
        <li>
          <Link to="/guide/quotes">Daily Quotes</Link> - One a day, clickable for another
        </li>
        <li>
          <Link to="/guide/search">Search</Link> - Tabs, history and the web
        </li>
        <li>
          <Link to="/guide/tab-sidebar">Tab Sidebar</Link> - Your open tabs, from any page
        </li>
        <li>
          <Link to="/guide/history">Tab History</Link> - Where you have just been
        </li>
        <li>
          <Link to="/guide/weather">Weather</Link> - Live conditions, no key
        </li>
        <li>
          <Link to="/guide/finance">Finance</Link> - Live stocks and crypto
        </li>
        <li>
          <Link to="/guide/templates">Layout Templates</Link> - Minimal, Deep Focus, Dashboard
        </li>
      </ul>
      <h2 id="integrations">Account and integrations</h2>
      <p>Optional. They need a WindoM account, and some need a credential of your own.</p>
      <ul>
        <li>
          <Link to="/guide/account">WindoM Account</Link> - Optional. Sync and integrations
        </li>
        <li>
          <Link to="/guide/calendar">Google Calendar</Link> - Today and what is coming
        </li>
        <li>
          <Link to="/guide/github">GitHub</Link> - Notifications, reviews, issues
        </li>
        <li>
          <Link to="/guide/spotify">Spotify</Link> - Now playing and top tracks
        </li>
      </ul>
    </DocsLayout>
  );
}
