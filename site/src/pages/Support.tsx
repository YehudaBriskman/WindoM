import { DocsLayout } from '../components/DocsLayout';
import { GITHUB_URL, CONTACT_EMAIL, STORE_URL } from '../lib/site';

/**
 * Where someone goes when WindoM is not behaving.
 *
 * Written around the problems that actually occur rather than a generic FAQ:
 * every fix below corresponds to a real fault that has been reported or found
 * in production. The Chrome Web Store listing points its support URL here.
 */
export function Support() {
  return (
    <DocsLayout path="/support" eyebrow="Help" title="Support" subtitle="Fixes for the problems that actually come up">
      <p>
        Most problems with WindoM fall into one of a handful of shapes. Try the matching fix
        below first - if none of them helps, <a href={`${GITHUB_URL}/issues/new`}>open an issue
        on GitHub</a> or email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>Google Calendar keeps disconnecting</h2>
      <p>
        If you connected Calendar before 26 October 2026 and found it disconnected roughly a
        week later, that was a configuration fault on our side rather than anything you did.
        Google expires access for applications whose consent screen is still in testing after
        seven days, and WindoM's was. It is published now, so a connection made today stays
        connected.
      </p>
      <p>Reconnect once from <strong>Settings → Apps → Calendar → Connect</strong> and it should hold.</p>

      <h2>Signing in appears to work, then signs me out</h2>
      <p>
        Fixed in <strong>1.5.1</strong>. A failure in any one connected service - Calendar,
        Spotify - was being read as the whole session having expired, which signed you out
        moments after signing in. The more services you had connected, the faster it happened.
      </p>
      <p>
        Check you are on 1.5.1 or later at <code>chrome://extensions</code>. Chrome usually
        updates extensions within a few hours, and <strong>Update</strong> on that page forces it.
      </p>

      <h2>Spotify ignores the first press of a button</h2>
      <p>
        Also fixed in <strong>1.5.1</strong>. Play, pause, next and previous all reached Spotify
        correctly, but the dashboard went on showing the state from just before the command for
        up to fifteen seconds - so it looked as though nothing had happened, and pressing again
        appeared to fix it.
      </p>

      <h2>A "this app isn't verified" screen when connecting Google</h2>
      <p>
        Expected, and safe. WindoM's verification with Google is in review. Until it completes,
        Google shows that warning for applications it has not finished reviewing. You can
        continue past it, and the extension only ever asks to <em>read</em> your calendar - the
        exact permissions are listed in the <a href="/privacy.html">privacy policy</a>.
      </p>

      <h2>The Gmail widget has gone</h2>
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

      <h2>Weather shows the wrong place</h2>
      <p>
        WindoM asks the browser for your location and falls back to a rough lookup from your IP
        address, which can be some distance out on a VPN or a mobile connection. Set a city by
        hand in <strong>Settings → Weather</strong>.
      </p>

      <h2>Settings did not follow me to another computer</h2>
      <p>
        Settings sync through your Chrome profile, so both machines need to be signed in to the
        same Chrome account with sync enabled. Background images, cached weather and tab history
        are deliberately excluded - they are large, and they stay on the device that made them.
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
        WindoM is open source, so you can also read the code for any behaviour described here:{' '}
        <a href={GITHUB_URL}>github.com/YehudaBriskman/WindoM</a>. Reviews and bug reports on
        the <a href={STORE_URL}>Chrome Web Store</a> listing are read too, though GitHub is the
        faster route - the store gives no way to reply with a follow-up question.
      </p>
    </DocsLayout>
  );
}
