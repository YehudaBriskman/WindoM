import { Layout } from '../components/Layout';

/**
 * What WindoM stores and what never leaves the device.
 *
 * Content is ported verbatim from the previous hand-written page. The wording is
 * legally meaningful and was not edited during the rebuild - the only change is
 * the hostname correction, which named a server that does not exist.
 */
export function Privacy() {
  return (
    <Layout eyebrow="Legal" title="Privacy Policy" subtitle="Last updated: April 27, 2026">
      <div className="wrap wrap-prose prose">
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
          <h2>Google Calendar &amp; Gmail integration (optional)</h2>
          <p>
            If you connect your Google account, WindoM requests the following read-only scopes in a single OAuth consent:
            <code>calendar.readonly</code>, <code>gmail.readonly</code>, <code>openid</code>, <code>email</code>, <code>profile</code>.
            You can connect Calendar alone (which uses only <code>calendar.readonly</code>) or both Calendar and Gmail together.
          </p>
          <p>
            Your Google OAuth access token is stored <strong>encrypted at rest</strong> on our servers using AES-256-GCM and is used only to make API requests on your behalf. We never share it with third parties.
          </p>
          <ul>
            <li><strong>Calendar:</strong> We fetch your upcoming events (title, time, calendar name) and display them on your dashboard. We do not read event descriptions, attendees, or any calendar outside of the visible list.</li>
            <li><strong>Gmail:</strong> We fetch your unread inbox count and, for up to 5 recent unread messages, the following header-level metadata only: sender name and address, subject line, snippet (first ~100 characters), and received date. <strong>We do not read, store, or transmit full email body content.</strong> Fetched data is cached server-side for 45 seconds and then discarded.</li>
          </ul>
          <p>
            Disconnecting Google from <strong>Settings → Apps</strong> immediately revokes our stored token and deletes all cached data.
          </p>
          <h2>Spotify integration (optional)</h2>
          <p>
            WindoM uses a <strong>Bring Your Own App (BYOA)</strong> model for Spotify. You register a free Spotify Developer app and provide its Client ID in WindoM's settings. This means your music data flows between your browser and your own registered Spotify app - WindoM does not operate a shared Spotify client.
          </p>
          <p>
            Your Spotify OAuth token is stored encrypted on our servers and is used only to fetch your currently-playing track (artist, title, album art, playback state). We do not access your library, playlists, listening history, or follower data.
            Disconnecting Spotify immediately deletes the stored token.
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
            The following services are contacted directly from your browser. WindoM's servers are not involved in these requests, and we do not share personal data with these services.
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
            <li>We do not retain Gmail message content - only header metadata cached for 45 seconds</li>
          </ul>
          <h2>Data sharing</h2>
          <p>
            We do not sell, rent, or share your personal data with any third party for marketing, advertising, or any other commercial purpose.
            Data is used solely to provide the features you have explicitly enabled in WindoM.
          </p>
          <h2>Security</h2>
          <p>
            All communication between the extension and our servers uses HTTPS.
            OAuth tokens (Google, Spotify) are encrypted at rest using AES-256-GCM with a server-side key.
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
      </div>
    </Layout>
  );
}
