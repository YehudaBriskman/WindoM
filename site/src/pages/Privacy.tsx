import { DocsLayout } from '../components/DocsLayout';

/**
 * What WindoM stores and what never leaves the device.
 *
 * Content is ported verbatim from the previous hand-written page. The wording is
 * legally meaningful and was not edited during the rebuild - the only change is
 * the hostname correction, which named a server that does not exist.
 */
export function Privacy() {
  return (
    <DocsLayout path="/privacy" eyebrow="Legal" title="Privacy Policy" subtitle="Last updated: April 27, 2026">
        <p>
            WindoM is a Chrome extension that replaces your new tab page with a personal productivity dashboard.
            This policy explains exactly what data we collect, what stays entirely on your device, and how we use it.
            We do not advertise, track, or sell data.
          </p>
          <h2>What stays on your device</h2>
          <p>
            The following is stored only in your browser using <code>chrome.storage</code> and is <strong>never sent to any server</strong>:
          </p>
          <ul>
            <li>Dashboard settings and preferences</li>
            <li>Todo items and quick links</li>
            <li>Custom background images you upload</li>
            <li>Cached background images from Unsplash (photo history)</li>
            <li>Cached weather data</li>
            <li>Your last-known location coordinates (used for weather only)</li>
            <li>Finance watchlist - the stock tickers and crypto coins you add</li>
            <li>Tab history displayed in the sidebar (read from your local browser, never transmitted)</li>
            <li>Onboarding and dismissal state</li>
          </ul>
          <h2>Account (optional)</h2>
          <p>
            Creating an account is entirely optional. The dashboard works fully without signing in.
            If you choose to create an account, we store the following on our servers:
          </p>
          <ul>
            <li>Your email address and a bcrypt-hashed password</li>
            <li>Your display name</li>
            <li>Your dashboard settings - synced so preferences are consistent across your devices</li>
            <li>Active session records (used to manage login sessions and detect unauthorized access)</li>
          </ul>
          <p>
            You can delete your account and all associated server-side data at any time from
            <strong>Settings → Account → Delete account</strong>. All data is deleted permanently and immediately.
          </p>
          <h2>Google Calendar integration (optional)</h2>
          <p>
            If you connect your Google account, WindoM requests the following read-only scopes in a single OAuth consent:
            <code>calendar.readonly</code>, <code>openid</code>, <code>email</code>, <code>profile</code>. That is the
            complete list; nothing else is requested.
          </p>
          <p>
            WindoM's use of information received from Google APIs adheres to the{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. Google user data is never sold, never used for advertising, never
            used to train any model, and is never read by a human except with your explicit consent, to resolve a
            problem you have reported, or where the law requires it.
          </p>
          <p>
            Your Google OAuth access token is stored <strong>encrypted at rest</strong> on our servers using AES-256-GCM and is used only to make API requests on your behalf. We never share it with third parties.
          </p>
          <ul>
            <li><strong>Calendar:</strong> We fetch your upcoming events (title, time, calendar name) and display them on your dashboard. We do not read event descriptions, attendees, or any calendar outside of the visible list.</li>
          </ul>
          <p>
            Disconnecting Google from <strong>Settings → Apps</strong> immediately revokes our stored token and deletes all cached data.
          </p>
          <p>
            <strong>Gmail is switched off.</strong> Earlier versions could show an unread count and the
            subject lines of recent mail, which required Google's restricted <code>gmail.readonly</code> scope.
            The code for that widget is still in the extension and the server, but it is gated on a server-side
            setting (<code>GMAIL_ENABLED</code>) that is <strong>off</strong> on the server WindoM ships against.
            While it is off the scope is never added to the consent screen, the server refuses every mail request,
            and the Gmail card does not appear in <strong>Settings → Apps</strong>. No mail data of any kind reaches
            our servers, and tokens granted under the old consent lose the Gmail permission the next time you
            reconnect.
          </p>
          <p>
            Turning that setting on would mean requesting a restricted scope, which Google only permits after an
            annual third-party security assessment. If it is ever turned on for the hosted service, this policy will
            be updated to describe what is read before the change ships. Anyone running their own WindoM server can
            enable it for themselves, in which case the mail data goes to their server and this policy does not
            apply to it.
          </p>
          <h2>Spotify integration (optional)</h2>
          <p>
            WindoM uses a <strong>Bring Your Own App (BYOA)</strong> model for Spotify. You register a free Spotify Developer app and provide its Client ID in WindoM's settings. This means your music data flows between your browser and your own registered Spotify app - WindoM does not operate a shared Spotify client.
          </p>
          <p>
            Your Spotify OAuth token is stored encrypted on our servers and is used only to fetch your currently-playing track (artist, title, album art, playback state). We do not access your library, playlists, listening history, or follower data.
            Disconnecting Spotify immediately deletes the stored token.
          </p>
          <h2>GitHub integration (optional)</h2>
          <p>
            The GitHub widget shows three counts in the sidebar: unread notifications, open pull requests waiting on
            your review, and open issues assigned to you. Connecting it means creating a GitHub <strong>classic
            personal access token</strong> with the <code>notifications</code> and <code>repo</code> scopes and
            pasting it into <strong>Settings → Apps → GitHub</strong>. It requires a WindoM account.
          </p>
          <p>
            That token is sent to our server over HTTPS and stored <strong>encrypted at rest</strong> using
            AES-256-GCM, alongside your GitHub username. Our server - not your browser - calls{' '}
            <code>api.github.com</code> with it, and returns only those three numbers and the username to the
            extension. Nothing about the notifications, pull requests or issues themselves is stored: no titles, no
            repository names, no contents. The counts are held in memory on the server for one minute to stay inside
            GitHub's rate limits, and are never written to disk.
          </p>
          <p>
            The <code>repo</code> scope is broad - on a classic token it covers read and write access to the
            repositories you can reach. WindoM only ever issues the three read requests described above, but the
            token itself carries everything GitHub granted it, so treat it as a credential. Disconnecting from{' '}
            <strong>Settings → Apps</strong> deletes it from our database immediately, and you can revoke it at any
            time from your{' '}
            <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">GitHub token settings</a>.
          </p>
          <h2>Browser permissions</h2>
          <p>WindoM requests the following Chrome permissions and uses them as described:</p>
          <table>
            <thead>
              <tr><th>Permission</th><th>Why it is used</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><code>storage</code> / <code>unlimitedStorage</code></td>
                <td>Save your settings, todos, links, cached images, and finance watchlist in your browser. <code>unlimitedStorage</code> is required only for locally uploaded background images.</td>
              </tr>
              <tr>
                <td><code>tabs</code></td>
                <td>Open, close, and pin tabs from the tab sidebar. Tab titles and URLs are used only locally to populate the sidebar and are never sent anywhere.</td>
              </tr>
              <tr>
                <td><code>history</code></td>
                <td>Read your recent browsing history to display recent sites in the tab sidebar and provide search suggestions. Only the last 7 days are read, deduplicated by hostname, limited to 10 entries. This data never leaves your device.</td>
              </tr>
              <tr>
                <td><code>identity</code></td>
                <td>Launch the Spotify PKCE OAuth flow via <code>chrome.identity.launchWebAuthFlow</code>.</td>
              </tr>
            </tbody>
          </table>
          <h2>Third-party APIs called directly by the extension</h2>
          <p>
            The following services are contacted when a feature that needs them is switched on. Every one except
            GitHub is called directly from your browser, with WindoM's servers not involved; GitHub is called by our
            server, because that is where the access token is held. Nothing is sent to any of them beyond what its
            row below lists.
          </p>
          <table>
            <thead>
              <tr><th>Service</th><th>What is sent</th><th>Purpose</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Unsplash</strong> (<code>api.unsplash.com</code>)</td>
                <td>Search query / category</td>
                <td>Fetch background images for the dashboard</td>
              </tr>
              <tr>
                <td><strong>Open-Meteo</strong> (<code>api.open-meteo.com</code>)</td>
                <td>Latitude &amp; longitude</td>
                <td>Fetch current weather data. No API key, no account.</td>
              </tr>
              <tr>
                <td><strong>Open-Meteo Geocoding</strong> (<code>geocoding-api.open-meteo.com</code>)</td>
                <td>City name search string</td>
                <td>Resolve a typed city name to coordinates for weather</td>
              </tr>
              <tr>
                <td><strong>Nominatim / OpenStreetMap</strong> (<code>nominatim.openstreetmap.org</code>)</td>
                <td>Latitude &amp; longitude</td>
                <td>Reverse-geocode coordinates to a human-readable city name</td>
              </tr>
              <tr>
                <td><strong>ipapi.co</strong></td>
                <td>Your IP address (implicit)</td>
                <td>IP-based location fallback - only used if browser geolocation is denied or unavailable</td>
              </tr>
              <tr>
                <td><strong>Quotable</strong> (<code>api.quotable.io</code>)</td>
                <td>Nothing</td>
                <td>Fetch an inspirational quote. No personal data involved.</td>
              </tr>
              <tr>
                <td><strong>Yahoo Finance</strong> (<code>query1/query2.finance.yahoo.com</code>)</td>
                <td>Stock ticker symbols you added</td>
                <td>Fetch real-time stock prices for the Finance widget</td>
              </tr>
              <tr>
                <td><strong>CoinGecko</strong> (<code>api.coingecko.com</code>)</td>
                <td>Crypto coin IDs you added</td>
                <td>Fetch real-time cryptocurrency prices</td>
              </tr>
              <tr>
                <td><strong>GitHub</strong> (<code>api.github.com</code>)</td>
                <td>Your personal access token - sent by our server, not by your browser</td>
                <td>Count unread notifications, review requests and assigned issues for the GitHub widget. See the GitHub section above for where the token is stored.</td>
              </tr>
              <tr>
                <td><strong>Google Favicons</strong> (<code>google.com/s2/favicons</code>)</td>
                <td>Domain name</td>
                <td>Fetch favicon icons for quick links</td>
              </tr>
              <tr>
                <td><strong>DuckDuckGo</strong> (<code>duckduckgo.com</code>)</td>
                <td>Domain name</td>
                <td>Fallback favicon source for quick links</td>
              </tr>
            </tbody>
          </table>
          <p>
            Each of these services has its own privacy policy. We recommend reviewing them if you have concerns about a specific service.
          </p>
          <h2>Data we do not collect</h2>
          <ul>
            <li>We do not use analytics, tracking pixels, or third-party advertising SDKs</li>
            <li>We do not read the content of pages you visit</li>
            <li>We do not collect keystrokes or form input from other websites</li>
            <li>We do not share or sell any data to third parties</li>
            <li>We do not access your email - the mail scope is disabled on the hosted service, as described above, and no mail data reaches our servers</li>
          </ul>
          <h2>Data sharing</h2>
          <p>
            We do not sell, rent, or share your personal data with any third party for marketing, advertising, or any other commercial purpose.
            Data is used solely to provide the features you have explicitly enabled in WindoM.
          </p>
          <h2>Security</h2>
          <p>
            All communication between the extension and our servers uses HTTPS.
            Service credentials - Google and Spotify OAuth tokens, and the GitHub personal access token - are encrypted at rest using AES-256-GCM with a server-side key.
            Passwords are hashed with bcrypt (cost factor 12).
            Authentication uses short-lived JWT access tokens (15-minute TTL) and rotating refresh tokens stored as <code>HttpOnly; Secure; SameSite=None</code> cookies.
            Refresh token reuse is detected and triggers automatic session revocation.
          </p>
          <h2>Children's privacy</h2>
          <p>
            WindoM is not directed at children under the age of 13. We do not knowingly collect personal information from children.
            If you believe a child has provided us with personal data, please contact us and we will delete it promptly.
          </p>
          <h2>Changes to this policy</h2>
          <p>
            We may update this policy as features change. When we do, we will update the "Last updated" date at the top of this page.
            Continued use of WindoM after a policy update constitutes acceptance of the new policy.
          </p>
          <h2>Contact</h2>
          <p>
            If you have any questions about this policy or want to request data deletion, reach out at
            <a href="mailto:yehudabriskman@windom.app">yehudabriskman@windom.app</a>.
          </p>
    </DocsLayout>
  );
}
