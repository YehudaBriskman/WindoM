import { DocsLayout } from '../components/DocsLayout';
import { Link } from 'react-router';
import { CONTACT_EMAIL } from '../lib/site';

/**
 * What WindoM stores and what never leaves the device.
 *
 * The wording is legally meaningful. The 2026-11-09 revision was drafted from
 * the code (backend/src/db/schema.ts, services/*, web/manifest.json) and still
 * needs a lawyer's review. Every factual claim here should be re-checked against
 * the code when it changes.
 */
export function Privacy() {
  return (
    <DocsLayout path="/privacy" eyebrow="Legal" title="Privacy Policy" subtitle="Last updated: November 9, 2026">
      <p>
        WindoM is a Chrome extension that replaces your new tab page with a personal productivity dashboard. This policy
        explains exactly what data we collect, what stays entirely on your device, and how we use it. We do not
        advertise, track, or sell data.
      </p>
      <h2>Who is responsible</h2>
      <p>
        WindoM is made and operated by one individual, Yehuda Briskman, in Israel. He is the controller of the personal
        data described below. There is no company behind the project and no data protection officer. Questions and
        requests about your data go to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
      <p>
        Providing information to WindoM is voluntary. You are not legally required to create an account or connect any
        service, and the core dashboard works without either. Without an account there is nothing for us to hold: the
        features that run in your browser contact the third parties listed below directly.
      </p>
      <h2>What stays on your device</h2>
      <p>
        The following is stored only in your browser using <code>chrome.storage</code> and is{' '}
        <strong>never sent to any server</strong>:
      </p>
      <ul>
        <li>Dashboard settings and preferences</li>
        <li>Todo items and quick links</li>
        <li>Custom background images you upload</li>
        <li>Cached background images from Unsplash (photo history)</li>
        <li>Cached weather data</li>
        <li>
          Your last-known location coordinates (used for weather only, and only if you chose "Use my current location")
        </li>
        <li>Finance watchlist - the stock tickers and crypto coins you add</li>
        <li>Tab history displayed in the sidebar (read from your local browser, never transmitted)</li>
        <li>Onboarding and dismissal state</li>
      </ul>
      <h2>Account (optional)</h2>
      <p>
        Creating an account is entirely optional. The dashboard works fully without signing in. If you choose to create
        an account, we store the following on our servers:
      </p>
      <ul>
        <li>Your email address and a bcrypt-hashed password</li>
        <li>Your display name</li>
        <li>
          Your dashboard settings - synced so preferences are consistent across your devices. This includes your display
          name, your quick links (names and URLs), the city name you typed for weather and, if you entered them, your
          own Unsplash access key and weather API key. They are stored as ordinary JSON in the database, not encrypted
          field by field, and the two keys are left out of the data export. Todos, uploaded images and the finance
          watchlist are not synced
        </li>
        <li>
          Active session records (used to manage login sessions and detect unauthorized access). For each signed-in
          session we store the browser and operating system name (for example &ldquo;Chrome &middot; Windows&rdquo;, no
          versions) so you can recognise it under Active sessions. We also keep a keyed digest (HMAC-SHA-256) of the IP
          address and of the full browser user-agent string, to spot a stolen sign-in. The raw values are not kept, but
          an IP address is a small space to guess in, so we treat the digest as personal data. Session records are kept
          until you delete your account; expired or revoked ones are deleted automatically after 30 days
        </li>
        <li>
          A security log of sensitive account actions (sign-ins and failed sign-in attempts, sign-outs, password changes
          and resets, email verification, session revocations, connecting or disconnecting integrations, and data
          exports): each entry holds only the action, its time, the session it concerns and the same browser and
          operating system name, never an IP address, email or token; entries are deleted after 180 days, or immediately
          with your account
        </li>
      </ul>
      <p>
        The API server's request log, kept by our hosting provider, records the IP address of each request together with
        its method and path. Values in the query string, such as sign-in codes and reset tokens, are replaced before
        they are written. Nothing in these logs is used for anything except diagnosing faults and abuse.
      </p>
      <p>
        You can delete your account and all associated server-side data at any time from
        <strong>Settings → Account → Delete account</strong>. Your data is deleted from our database immediately. Copies
        that can remain in server logs and database backups are not used for anything and expire on their own within 30
        days. You can also download a JSON copy of this data, with passwords, tokens and API keys left out, from the
        authenticated <code>GET /me/export</code> endpoint.
      </p>
      <h2>Google Calendar integration (optional)</h2>
      <p>
        If you connect your Google account, WindoM requests the following read-only scopes in a single OAuth consent:
        <code>calendar.readonly</code>, <code>openid</code>, <code>email</code>, <code>profile</code>. That is the
        complete list; nothing else is requested.
      </p>
      <p>
        WindoM's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements. Google user data is never sold, never used for advertising, never used
        to train any model, and is never read by a human except with your explicit consent, to resolve a problem you
        have reported, or where the law requires it.
      </p>
      <p>
        Your Google OAuth access token is stored <strong>encrypted at rest</strong> on our servers using AES-256-GCM and
        is used only to make API requests on your behalf. We never share it with third parties.
      </p>
      <ul>
        <li>
          <strong>Calendar:</strong> We fetch your upcoming events (title, time, calendar name) and display them on your
          dashboard. We do not read event descriptions, attendees, or any calendar outside of the visible list.
        </li>
      </ul>
      <p>
        Disconnecting Google from <strong>Settings → Apps</strong> immediately deletes the tokens we hold and the cached
        events, and asks Google to revoke the grant. That request is best-effort: if it fails, the disconnect still
        completes, so to confirm the grant is gone, check{' '}
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
          myaccount.google.com/permissions
        </a>
        . Google user data (the events fetched for display) is held in server memory for about three minutes and is not
        written to disk.
      </p>
      <p>
        <strong>Gmail is switched off.</strong> Earlier versions could show an unread count and the subject lines of
        recent mail, which required Google's restricted <code>gmail.readonly</code> scope. The code for that widget is
        still in the extension and the server, but it is gated on a server-side setting (<code>GMAIL_ENABLED</code>)
        that is <strong>off</strong> on the server WindoM ships against. While it is off the scope is never added to the
        consent screen, the server refuses every mail request, and the Gmail card does not appear in{' '}
        <strong>Settings → Apps</strong>. No mail data of any kind reaches our servers, and tokens granted under the old
        consent lose the Gmail permission the next time you reconnect.
      </p>
      <p>
        Turning that setting on would mean requesting a restricted scope, which Google only permits after an annual
        third-party security assessment. If it is ever turned on for the hosted service, this policy will be updated to
        describe what is read before the change ships. Anyone running their own WindoM server can enable it for
        themselves, in which case the mail data goes to their server and this policy does not apply to it.
      </p>
      <h2>Spotify integration (optional)</h2>
      <p>
        WindoM uses a <strong>Bring Your Own App (BYOA)</strong> model for Spotify. You register a free Spotify
        Developer app and provide its Client ID in WindoM's settings, so the access is granted to your own Spotify app,
        not to a shared WindoM client. Our server then calls the Spotify Web API on your behalf with the token you
        authorised.
      </p>
      <p>
        Your Spotify OAuth token is stored encrypted on our servers and is used only to fetch your currently-playing
        track (artist, title, album art, playback state). We do not access your library, playlists, listening history,
        or follower data. Disconnecting Spotify immediately deletes the stored token; to also cancel the grant on
        Spotify's side, remove the app at spotify.com/account/apps.
      </p>
      <p>
        <strong>Spotify developer terms.</strong> Track data is shown to you, the person who authorised it, and kept
        only in server memory for about fifteen seconds as a cache. It is not stored in the database, not sold, not used
        for advertising, and not used to train any machine-learning or AI model. The widget links back to Spotify and
        does not alter album art or metadata. Your use of the Spotify integration is subject to the{' '}
        <a href="https://developer.spotify.com/terms" target="_blank" rel="noreferrer">
          Spotify Developer Terms
        </a>{' '}
        and the{' '}
        <a href="https://developer.spotify.com/policy" target="_blank" rel="noreferrer">
          Spotify Developer Policy
        </a>
        , which apply to the Spotify app you register. WindoM is not affiliated with or endorsed by Spotify.
      </p>
      <h2>GitHub integration (optional)</h2>
      <p>
        The GitHub widget shows three counts in the sidebar: unread notifications, open pull requests waiting on your
        review, and open issues assigned to you. Connecting it means creating a GitHub{' '}
        <strong>classic personal access token</strong> with the <code>notifications</code> and <code>repo</code> scopes
        and pasting it into <strong>Settings → Apps → GitHub</strong>. It requires a WindoM account.
      </p>
      <p>
        That token is sent to our server over HTTPS and stored <strong>encrypted at rest</strong> using AES-256-GCM,
        alongside your GitHub username. Our server - not your browser - calls <code>api.github.com</code> with it, and
        returns only those three numbers and the username to the extension. Nothing about the notifications, pull
        requests or issues themselves is stored: no titles, no repository names, no contents. The counts are held in
        memory on the server for one minute to stay inside GitHub's rate limits, and are never written to disk.
      </p>
      <p>
        The <code>repo</code> scope is broad - on a classic token it covers read and write access to the repositories
        you can reach. WindoM only ever issues the three read requests described above, but the token itself carries
        everything GitHub granted it, so treat it as a credential. Disconnecting from <strong>Settings → Apps</strong>{' '}
        deletes it from our database immediately, but only you can revoke the token itself, which you can do at any time
        from your{' '}
        <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">
          GitHub token settings
        </a>
        .
      </p>
      <p>
        <strong>GitHub terms.</strong> The token is yours, issued under your own GitHub account, and is used only for
        the three read-only counts described above. The data is not sold, not used for advertising, and not used to
        train any model. Use of GitHub's API is subject to the{' '}
        <a
          href="https://docs.github.com/site-policy/github-terms/github-terms-of-service"
          target="_blank"
          rel="noreferrer"
        >
          GitHub Terms of Service
        </a>{' '}
        and the{' '}
        <a
          href="https://docs.github.com/site-policy/acceptable-use-policies/github-acceptable-use-policies"
          target="_blank"
          rel="noreferrer"
        >
          GitHub Acceptable Use Policies
        </a>
        . WindoM is not affiliated with or endorsed by GitHub.
      </p>
      <h2>Browser permissions</h2>
      <p>WindoM requests the following Chrome permissions and uses them as described:</p>
      <table>
        <thead>
          <tr>
            <th>Permission</th>
            <th>Why it is used</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>storage</code> / <code>unlimitedStorage</code>
            </td>
            <td>
              Save your settings, todos, links, cached images, and finance watchlist in your browser.{' '}
              <code>unlimitedStorage</code> is required only for locally uploaded background images.
            </td>
          </tr>
          <tr>
            <td>
              <code>tabs</code>
            </td>
            <td>
              Open, close, and pin tabs from the tab sidebar. Tab titles and URLs are used only locally to populate the
              sidebar and are never sent anywhere.
            </td>
          </tr>
          <tr>
            <td>
              <code>history</code>
            </td>
            <td>
              Optional - not requested at install. Chrome asks for it only when you turn on Tab History (Settings → Apps
              → History), and turning that off gives it back. Read your recent browsing history to display recent sites
              in the tab sidebar and provide search suggestions on the new tab. For the sidebar, only the last 7 days
              are read, deduplicated by hostname, limited to 10 entries. This data never leaves your device.
            </td>
          </tr>
          <tr>
            <td>
              <code>identity</code>
            </td>
            <td>
              Launch the Spotify PKCE OAuth flow via <code>chrome.identity.launchWebAuthFlow</code>.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Besides the permissions above, WindoM declares access to the hosts of the services in the table below (needed so
        the browser lets the extension call them) and runs a content script on web pages (<code>http</code> and{' '}
        <code>https</code>) so that the sidebar can be opened on top of the page you are viewing. That script draws the
        sidebar and reads one thing from the page, whether its text direction is left-to-right or right-to-left. It does
        not read, store or send the content of the pages you visit. WindoM loads no code from a remote server: all of
        its code ships inside the extension package.
      </p>
      <h2>Third-party APIs called directly by the extension</h2>
      <p>
        The following services are contacted when a feature that needs them is switched on. Every one except GitHub is
        called directly from your browser, with WindoM's servers not involved; GitHub is called by our server, because
        that is where the access token is held. Nothing is sent to any of them beyond what its row below lists.
      </p>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>What is sent</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Unsplash</strong> (<code>api.unsplash.com</code>)
            </td>
            <td>Search query / category, and the Unsplash access key you entered (as the API requires)</td>
            <td>
              Fetch background images for the dashboard. The photographer's name and a link back to Unsplash are shown
              with each photo, as the Unsplash API guidelines require.
            </td>
          </tr>
          <tr>
            <td>
              <strong>Open-Meteo</strong> (<code>api.open-meteo.com</code>)
            </td>
            <td>Latitude &amp; longitude</td>
            <td>Fetch current weather data. No API key, no account.</td>
          </tr>
          <tr>
            <td>
              <strong>Open-Meteo Geocoding</strong> (<code>geocoding-api.open-meteo.com</code>)
            </td>
            <td>City name search string</td>
            <td>Resolve a typed city name to coordinates for weather</td>
          </tr>
          <tr>
            <td>
              <strong>Nominatim / OpenStreetMap</strong> (<code>nominatim.openstreetmap.org</code>)
            </td>
            <td>Latitude &amp; longitude</td>
            <td>Reverse-geocode coordinates to a human-readable city name</td>
          </tr>
          <tr>
            <td>
              <strong>ipapi.co</strong>
            </td>
            <td>Your IP address (implicit)</td>
            <td>
              IP-based location fallback - only used after you have allowed location for weather and the browser cannot
              get a fix. WindoM never asks for your location on its own: the browser prompt appears only when you press
              "Use my current location" in Settings → Weather
            </td>
          </tr>
          <tr>
            <td>
              <strong>Quotable</strong> (<code>api.quotable.io</code>)
            </td>
            <td>Nothing</td>
            <td>Fetch an inspirational quote. No personal data involved.</td>
          </tr>
          <tr>
            <td>
              <strong>Yahoo Finance</strong> (<code>query1/query2.finance.yahoo.com</code>)
            </td>
            <td>Stock ticker symbols you added</td>
            <td>Fetch real-time stock prices for the Finance widget</td>
          </tr>
          <tr>
            <td>
              <strong>CoinGecko</strong> (<code>api.coingecko.com</code>)
            </td>
            <td>Crypto coin IDs you added</td>
            <td>Fetch real-time cryptocurrency prices</td>
          </tr>
          <tr>
            <td>
              <strong>GitHub</strong> (<code>api.github.com</code>)
            </td>
            <td>Your personal access token - sent by our server, not by your browser</td>
            <td>
              Count unread notifications, review requests and assigned issues for the GitHub widget. See the GitHub
              section above for where the token is stored.
            </td>
          </tr>
          <tr>
            <td>
              <strong>Google Favicons</strong> (<code>google.com/s2/favicons</code>)
            </td>
            <td>Domain name</td>
            <td>Fetch favicon icons for quick links</td>
          </tr>
          <tr>
            <td>
              <strong>DuckDuckGo</strong> (<code>duckduckgo.com</code>)
            </td>
            <td>Domain name</td>
            <td>Fallback favicon source for quick links</td>
          </tr>
          <tr>
            <td>
              <strong>WindoM API on Fly.io</strong> (<code>windom-api.fly.dev</code>)
            </td>
            <td>Everything in the Account section, only if you sign in</td>
            <td>
              The optional account, settings sync and the Google, Spotify and GitHub integrations. Hosted on Fly.io.
            </td>
          </tr>
          <tr>
            <td>
              <strong>Email delivery</strong> (an SMTP provider)
            </td>
            <td>Your email address and the text of the message</td>
            <td>Send the verification and password-reset emails, and nothing else. No marketing email is ever sent.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Each of these services has its own privacy policy. We recommend reviewing them if you have concerns about a
        specific service.
      </p>
      <p>
        Unsplash, Google, GitHub, Spotify, Open-Meteo, OpenStreetMap, ipapi.co, Yahoo, CoinGecko, DuckDuckGo, Fly.io and
        Chrome are the names of their respective owners and are used here only to say which service is meant. WindoM is
        an independent project and is not affiliated with, sponsored or endorsed by any of them.
      </p>
      <h2>This website</h2>
      <p>
        windom.app is a static site served by GitHub Pages. It sets no cookies and runs no analytics. It stores two
        display preferences, the sidebar state and whether animation is paused, in your browser's local storage, and
        they never leave it. The pages load fonts from Google Fonts, so Google receives your IP address and browser
        details when a page loads, and GitHub, as the host, keeps ordinary server logs. The site hosts no user content.
      </p>
      <h2>How long we keep data</h2>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Kept</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Account, settings, connected-service tokens, session records</td>
            <td>Until you delete the account. Disconnecting a service deletes its token at once.</td>
          </tr>
          <tr>
            <td>Security log</td>
            <td>180 days, or until the account is deleted</td>
          </tr>
          <tr>
            <td>Calendar, Spotify and GitHub results</td>
            <td>In server memory only, for between fifteen seconds and three minutes</td>
          </tr>
          <tr>
            <td>Server request logs and database backups</td>
            <td>Up to about 30 days, held by the hosting provider</td>
          </tr>
          <tr>
            <td>Everything stored in your browser</td>
            <td>Until you clear it or uninstall the extension</td>
          </tr>
        </tbody>
      </table>
      <h2>Where data is processed</h2>
      <p>
        The API runs on Fly.io, with its primary region in Frankfurt, Germany. The operator is in Israel and reaches the
        data from there, and the third-party services above are mostly based in the United States and Europe. If you use
        WindoM from elsewhere, your data crosses borders. Israel is recognised by the European Commission as providing
        an adequate level of data protection. By creating an account you agree to this transfer.
      </p>
      <h2>Your rights</h2>
      <p>
        Under the Israeli Privacy Protection Law, 5741-1981, as amended (including Amendment 13, in force since August
        2025), you may ask to see the information we hold about you, to have it corrected, and to have it deleted. If
        you are in the EU or the UK, GDPR gives you the same rights and a few more, such as objecting to processing and
        moving your data. You can delete your account and export your data yourself, as described above. For anything
        else, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address the account uses, so we can
        verify it is you. We aim to answer within 30 days. We have not appointed a representative in the EU or the UK.
      </p>
      <p>
        If you are not satisfied with the answer, you may complain to the Israeli Privacy Protection Authority, or to
        the data protection authority where you live. We rely on your consent, and on the need to provide the account
        you asked for, as the basis for processing.
      </p>
      <h2>Data we do not collect</h2>
      <ul>
        <li>We do not use analytics, tracking pixels, or third-party advertising SDKs</li>
        <li>We do not read the content of pages you visit</li>
        <li>We do not collect keystrokes or form input from other websites</li>
        <li>We do not share or sell any data to third parties</li>
        <li>
          We do not access your email - the mail scope is disabled on the hosted service, as described above, and no
          mail data reaches our servers
        </li>
      </ul>
      <h2>Data sharing</h2>
      <p>
        We do not sell, rent, or share your personal data with any third party for marketing, advertising, or any other
        commercial purpose. Data is used solely to provide the features you have explicitly enabled in WindoM.
      </p>
      <h2>Security</h2>
      <p>
        All communication between the extension and our servers uses HTTPS. Service credentials - Google and Spotify
        OAuth tokens, and the GitHub personal access token - are encrypted at rest using AES-256-GCM with a server-side
        key. Passwords are hashed with bcrypt (cost factor 12). Authentication uses short-lived JWT access tokens
        (15-minute TTL) and rotating refresh tokens stored as <code>HttpOnly; Secure; SameSite=None</code> cookies.
        Refresh token reuse is detected and triggers automatic session revocation.
      </p>
      <h2>Children's privacy</h2>
      <p>
        WindoM is not directed at children under the age of 13, and you must be at least 13 to create an account. In
        some countries the age at which a person can consent to an online service is higher, up to 16, and in Israel a
        minor needs a parent or guardian's permission to enter into an agreement. We do not knowingly collect personal
        information from children below the applicable age. If you believe a child has provided us with personal data,
        please contact us and we will delete it promptly.
      </p>
      <h2>Changes to this policy</h2>
      <p>
        We may update this policy as features change. When we do, we will update the "Last updated" date at the top of
        this page. Continued use of WindoM after a policy update constitutes acceptance of the new policy.
      </p>
      <h2>Contact</h2>
      <p>
        If you have any questions about this policy or want to request access, correction or deletion of your data,
        reach out at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. More ways to reach us are on the{' '}
        <Link to="/contact">contact page</Link>.
      </p>
    </DocsLayout>
  );
}
