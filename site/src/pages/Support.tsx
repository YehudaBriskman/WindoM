import { DocsLayout } from '../components/DocsLayout';
import { GITHUB_URL, STORE_URL } from '../lib/site';
import { Link } from 'react-router';

/**
 * Where someone goes when WindoM is not behaving.
 *
 * Written around the problems that actually occur rather than a generic FAQ:
 * every fix below corresponds to a real fault that has been reported or found
 * in production. The Chrome Web Store listing points its support URL here.
 *
 * Evergreen answers sit under three topic headings; faults that belong to one
 * release live together under "Fixed in recent releases", so they can be
 * pruned as a block once nobody is on those versions. The two headings other
 * pages link to carry explicit ids, shared with the Hebrew page, so a link
 * survives a reworded heading and works in both languages.
 */
export function Support() {
  return (
    <DocsLayout path="/support" eyebrow="Help" title="Support" subtitle="Fixes for the problems that actually come up">
      <p>
        Most problems with WindoM fall into one of a handful of shapes. Try the matching fix
        below first. If none of them helps, <a href={`${GITHUB_URL}/issues/new`}>open an issue
        on GitHub</a> - or see <Link to="/contact">Contact</Link> for email, and for how soon to
        expect a reply.
      </p>

      <h2>Sign-in and accounts</h2>

      <h3>Settings did not follow me to another computer</h3>
      <p>
        Settings follow your WindoM account. Sign in from <strong>Settings → Account</strong> on
        both machines and your clock format, background choice, widget layout and quick links
        arrive on the second one. If you are signed in on one machine and not the other, there is
        nothing linking them.
      </p>
      <p>
        Without an account, Chrome's own profile sync carries them instead, which needs both
        machines signed in to the same Chrome account with sync enabled - and it stops at the
        boundary of that profile, so a different browser or a work profile will not see them.
      </p>
      <p>
        Either way, background images, cached weather and tab history are deliberately excluded.
        They are large, and they stay on the device that made them.
      </p>

      <h3>I have forgotten my password</h3>
      <p>
        On the sign-in form in <strong>Settings → Account</strong>, click{' '}
        <strong>Forgot password?</strong>, enter your email and click{' '}
        <strong>Send reset link</strong>. The link arrives by email. If you signed up with{' '}
        <strong>Continue with Google</strong>, sign in that way again instead.
      </p>

      <h3>"You've reached the maximum number of active sessions"</h3>
      <p>
        Each account can be signed in on a limited number of browsers at once. Sign out on one
        you no longer use, or, from a browser that is still signed in, open{' '}
        <strong>Settings → Account → Active sessions</strong> and click{' '}
        <strong>Revoke session</strong> on the one to drop. A revoked session can keep working
        for up to 15 minutes before it ends.
      </p>

      <h3>A "this app isn't verified" screen when connecting Google</h3>
      <p>
        Google shows this screen for any app whose verification with Google has not been
        completed, and it is safe to continue past it. Whatever the screen says, the extension
        only ever asks to <em>read</em> your calendar - the exact permissions are listed in the{' '}
        <Link to="/privacy">privacy policy</Link>.
      </p>

      <h2>Widgets and integrations</h2>

      <h3 id="spotify-connect">Spotify will not connect</h3>
      <p>
        Almost always one of two things: the Client ID pasted into WindoM is not your app's, or
        the Redirect URI was not added and saved in your app's settings on the Spotify Developer
        Dashboard - which shows up as <em>Invalid Client</em>. Copy the URI with the{' '}
        <strong>Copy</strong> button in <strong>Settings → Apps → Spotify</strong> rather than
        typing it, and remember it changes if you reinstall Chrome or switch profiles. The{' '}
        <Link to="/guide#spotify">guide's Spotify section</Link> walks through every step and its
        own troubleshooting list.
      </p>

      <h3>The Spotify buttons do nothing</h3>
      <p>
        Spotify only allows Premium accounts to be controlled from outside its own apps. On a
        free account WindoM can show what is playing and your top tracks, but play, pause, next
        and previous are refused, and WindoM says Premium is required.
      </p>

      <h3>Weather shows the wrong place</h3>
      <p>
        WindoM asks the browser for your location and falls back to a rough lookup from your IP
        address, which can be some distance out on a VPN or a mobile connection. Set a city by
        hand in <strong>Settings → Weather</strong>.
      </p>

      <h2>Permissions</h2>

      <h3 id="all-sites">Why does WindoM need access to all websites?</h3>
      <p>
        For the <Link to="/guide#search">search box</Link>. Pressing <kbd>Ctrl</kbd> +{' '}
        <kbd>Win</kbd> + <kbd>H</kbd> (<kbd>Ctrl</kbd> + <kbd>Cmd</kbd> + <kbd>H</kbd> on a
        Mac) opens it over whatever page you are on, and for that to work on any site, a small
        script has to be loaded into every page. Chrome describes that as being able to read and
        change data on all websites.
      </p>
      <p>
        The script stays out of sight until you press the shortcut. The only thing it looks at
        on the page is whether the page is written right to left, so the box can match it; it
        does not read what is on the page or send anything about it anywhere. The code is in{' '}
        <code>web/src/content/</code> in the <a href={GITHUB_URL}>repository</a>.
      </p>
      <p>The other permissions Chrome lists are for:</p>
      <ul>
        <li><strong>Tabs</strong> - the tab sidebar, and open tabs as search suggestions</li>
        <li><strong>History</strong> - the tab history list, and history as search suggestions</li>
        <li><strong>Identity</strong> - the sign-in windows for Google and Spotify</li>
        <li><strong>Storage</strong> - your settings, todos and images, on your device</li>
      </ul>
      <p>
        The full list of what is stored and every service WindoM contacts is in the{' '}
        <Link to="/privacy">privacy policy</Link>.
      </p>

      <h2>Fixed in recent releases</h2>
      <p>
        If one of these matches what you see, check your version at{' '}
        <code>chrome://extensions</code> first. Chrome usually updates extensions within a few
        hours, and <strong>Update</strong> on that page forces it.
      </p>

      <h3>Google Calendar keeps disconnecting</h3>
      <p>
        If you connected Calendar before 26 October 2026 and found it disconnected roughly a
        week later, that was a configuration fault on our side rather than anything you did.
        Google expires access for applications whose consent screen is still in testing after
        seven days, and WindoM's was. It was published on 26 October 2026, and connections made
        since then stay connected.
      </p>
      <p>Reconnect once from <strong>Settings → Apps → Calendar → Connect</strong> and it should hold.</p>

      <h3>Signing in appears to work, then signs me out</h3>
      <p>
        Fixed in <strong>1.5.1</strong>. A failure in any one connected service - Calendar,
        Spotify - was being read as the whole session having expired, which signed you out
        moments after signing in. The more services you had connected, the faster it happened.
      </p>

      <h3>Spotify ignores the first press of a button</h3>
      <p>
        Also fixed in <strong>1.5.1</strong>. Play, pause, next and previous all reached Spotify
        correctly, but the dashboard went on showing the state from just before the command for
        up to fifteen seconds - so it looked as though nothing had happened, and pressing again
        appeared to fix it.
      </p>

      <h3>The Gmail widget has gone</h3>
      <p>
        Switched off in <strong>1.5.0</strong>. Reading mail needed a Google permission
        class that carries a mandatory annual third-party security assessment costing several
        hundred to several thousand dollars a year. That is not sustainable for a free
        extension, so the widget was withdrawn rather than funded by changing what WindoM does
        with your data.
      </p>
      <p>
        The code is still in the repository behind a server-side setting that is off on the
        server the published extension talks to, which is why you may still find Gmail in the
        source. On that server the scope is never requested and the card never appears. If you
        run your own backend you can turn it on for yourself.
      </p>

      <h2>Reporting something else</h2>
      <p>To get a problem fixed quickly, include:</p>
      <ul>
        <li>The WindoM version from <code>chrome://extensions</code></li>
        <li>Your Chrome version and operating system</li>
        <li>What you did, what happened, and what you expected instead</li>
        <li>
          Anything in the console - right-click the new tab, <strong>Inspect</strong>, then the
          <strong> Console</strong> tab. Errors there are usually the whole answer.
        </li>
      </ul>
      <p>
        <a href={`${GITHUB_URL}/issues/new`}>GitHub issues</a> is the fastest route. For anything
        that should not be public - a security report, or a question about your own data - see{' '}
        <Link to="/contact">Contact</Link>.
      </p>
      <p>
        WindoM is open source, so you can also read the code for any behaviour described here:{' '}
        <a href={GITHUB_URL}>github.com/YehudaBriskman/WindoM</a>. Reviews and bug reports on
        the <a href={STORE_URL}>Chrome Web Store</a> listing are read too, though GitHub is the
        faster route - the store gives no way to reply with a follow-up question.
      </p>
    </DocsLayout>
  );
}
