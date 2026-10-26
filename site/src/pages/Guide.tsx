import { DocsLayout } from '../components/DocsLayout';

/**
 * The English user guide.
 *
 * The previous guide shipped both languages in every response and swapped them
 * with CSS display rules, so Hebrew was never indexable and every reader
 * downloaded a language they could not read. Each language now has its own URL
 * and carries only its own copy, with hreflang alternates in the HTML entry.
 */
export function Guide() {
  return (
    <DocsLayout href="/guide.html" eyebrow="User Guide" title="Using WindoM">
        <p className="lang-switch">
          <a href="/he/guide.html" lang="he" hrefLang="he">עברית</a>
        </p>
        <div className="callout tip">
            <strong>No account required for most things.</strong>
            Clock, weather, todos, backgrounds, quotes, quick links, and the focus timer all work instantly with no sign-in. An account is only needed for Google Calendar sync and Spotify. You can always add one later.
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-card-title">🕐 Clock &amp; Date</div>
              <div className="feature-card-desc">12h / 24h, custom color, font size, date format. Always on, no account needed.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">🌤 Weather</div>
              <div className="feature-card-desc">Live temperature and conditions. Needs a free OpenWeatherMap API key.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">🖼 Background</div>
              <div className="feature-card-desc">Rotating Unsplash photos or upload your own image. Stored locally.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">⏱ Focus Timer</div>
              <div className="feature-card-desc">Set an intention and dim everything else. No account needed.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">🔗 Quick Links</div>
              <div className="feature-card-desc">Pin your most-used sites to the dock bar at the top.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">📋 Todos</div>
              <div className="feature-card-desc">Local task list in the right sidebar. Stays on your device.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">🎵 Spotify</div>
              <div className="feature-card-desc">Now-playing in the top dock. Needs an account + a free Spotify Developer app.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">📅 Google Calendar</div>
              <div className="feature-card-desc">Upcoming events in the right sidebar. Needs an account + Google authorization.</div>
            </div>
          </div>
          <h2 id="account">
            <span className="section-icon">👤</span>
            Create a WindoM Account
            <span className="badge optional">Optional</span>
          </h2>
          <p>
            A WindoM account syncs your settings across devices and is required to connect Google Calendar or Spotify. Registration is free and takes under a minute.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Open the gear icon (<strong>Settings</strong>) in the bottom-left corner of your new tab, then go to the <strong>Account</strong> tab.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
                <p>Enter your email address and a password (minimum 8 characters) and click <strong>Create account</strong>.</p>
                <p>Or click <strong>Continue with Google</strong> if you prefer not to manage a password.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>Check your inbox for a verification email and click the link inside. You're signed in.</p>
            </div>
          </div>
          <div className="callout tip">
            <strong>Settings sync</strong> -
            once signed in, your clock format, background preference, widgets, and quick links all sync to the cloud and appear on any device where you're logged in to WindoM.
          </div>
          <h2 id="spotify">
            <span className="section-icon">🎵</span>
            Connect Spotify
            <span className="badge byoa">BYOA</span>
          </h2>
          <p>
            WindoM shows your Spotify now-playing card directly in the new tab dock. Because of how Spotify's API works, each user connects their own free Spotify Developer app - this keeps your account private and avoids any shared rate limits. The whole setup takes about 2 minutes.
          </p>
          <div className="callout spotify">
            <strong>Why do I need my own app?</strong><br />
            Spotify's Web API requires an OAuth app registered in their developer portal. Instead of routing everyone through a shared WindoM app (which has quota limits and privacy implications), each user creates their own free app - you get full control and there are no limits to worry about.
          </div>
          <h3>Before you start</h3>
          <ul>
            <li>You need a WindoM account (see above - free, takes 1 minute)</li>
            <li>You need a Spotify account (free or premium both work)</li>
          </ul>
          <h3>Step 1 - Create a Spotify Developer app</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">developer.spotify.com/dashboard</a> and log in with your Spotify account.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
                <p>Click <strong>Create app</strong>.</p>
                <ul>
                  <li><strong>App name</strong> - anything you like, e.g. <em>My WindoM</em></li>
                  <li><strong>App description</strong> - anything, e.g. <em>Personal WindoM integration</em></li>
                  <li><strong>Redirect URI</strong> - leave this empty for now, you'll add it in Step 2</li>
                  <li><strong>Which API/SDKs are you planning to use?</strong> - select <strong>Web API</strong></li>
                </ul>
                <p>Agree to the terms and click <strong>Save</strong>.</p>
            </div>
          </div>
          <h3>Step 2 - Copy your Redirect URI from WindoM</h3>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
                <p>
                  Open your WindoM new tab, click <strong>Settings</strong> (gear icon, bottom-left), then go to the <strong>Spotify</strong> tab.
                </p>
                <p>
                  You'll see a box labelled <strong>Redirect URI</strong> with a value that looks like this:
                </p>
                <div className="redirect-uri-box">
                  <span className="redirect-uri-label">Redirect URI</span>
                  <span className="redirect-uri-value">https://&lt;your-extension-id&gt;.chromiumapp.org/</span>
                <p>Click the <strong>Copy</strong> button next to it. This URI is unique to your Chrome installation - do not type it manually.</p>
              </div>
            </div>
          </div>
          <h3>Step 3 - Add the Redirect URI to your Spotify app</h3>
          <div className="step">
            <div className="step-num">4</div>
            <div className="step-body">
              <p>Go back to the <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">Spotify Developer Dashboard</a>, click on your app, then click <strong>Settings</strong> (top right of your app page).</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">5</div>
            <div className="step-body">
              <p>Scroll to the <strong>Redirect URIs</strong> field. Paste the URI you copied from WindoM, then click <strong>Add</strong>, then <strong>Save</strong> at the bottom.</p>
            </div>
          </div>
          <div className="callout warning">
            <strong>This step is easy to miss.</strong>
            If you skip adding the Redirect URI you'll get an <em>Invalid Client</em> error when you try to connect. The URI must match exactly - copy it using the button in WindoM, don't type it by hand.
          </div>
          <h3>Step 4 - Copy your Client ID and connect</h3>
          <div className="step">
            <div className="step-num">6</div>
            <div className="step-body">
              <p>Still on your Spotify app's Settings page, copy the <strong>Client ID</strong> at the top. It looks like a 32-character hex string, e.g. <code>b3d9a1f0c84e...</code></p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">7</div>
            <div className="step-body">
              <p>Go back to WindoM → Settings → <strong>Spotify</strong> tab. Paste the Client ID into the input field and click <strong>Save &amp; Connect</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">8</div>
            <div className="step-body">
                <p>A Spotify authorization popup will appear. Click <strong>Agree</strong>.</p>
                <p>You're connected. The now-playing card will appear in the top dock the next time you play a track.</p>
            </div>
          </div>
          <h3>Troubleshooting</h3>
          <div className="callout">
            <strong>Error: Invalid Client</strong> -
            the Client ID is wrong or the Redirect URI wasn't saved correctly in the Spotify dashboard. Double-check both. The Redirect URI must be copied from WindoM's Spotify tab, not typed manually.
          </div>
          <div className="callout">
            <strong>Error: Connection cancelled</strong> -
            you closed the Spotify popup before completing authorization. Click Save &amp; Connect again and complete the authorization flow.
          </div>
          <div className="callout tip">
            <strong>Changed Chrome profile or reinstalled Chrome?</strong>
            Your Redirect URI will be different. Go to Settings → Spotify tab to see the new URI, add it to your Spotify app settings (you can have multiple Redirect URIs), then reconnect.
          </div>
          <h2 id="calendar">
            <span className="section-icon">📅</span>
            Connect Google Calendar
          </h2>
          <p>
            WindoM pulls your upcoming Google Calendar events into the right sidebar so your day is always visible. This requires a WindoM account and a one-time Google authorization.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Make sure you have a WindoM account and are signed in (Settings → Account tab).</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Open Settings → <strong>Apps hub</strong> → click the <strong>Calendar</strong> card → click <strong>Connect</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
                <p>A Google authorization window opens. Choose your Google account and click <strong>Allow</strong>.</p>
                <p>WindoM only requests read-only access to your calendar events - it cannot create, edit, or delete anything.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <div className="step-body">
              <p>Done. Your upcoming events appear in the right sidebar, grouped by day.</p>
            </div>
          </div>
          <div className="callout tip">
            <strong>Look-ahead window</strong> -
            by default events for the next 7 days are shown. You can change this to 14 or 30 days in Settings → <strong>Calendar</strong>.
          </div>
          <h2 id="finance">
            <span className="section-icon">📈</span>
            Finance Dashboard
          </h2>
          <p>
            Track live stock prices and crypto rates directly on your new tab. Prices update from Yahoo Finance and CoinGecko - no API key or account needed. Two scrollable cards appear on your dashboard: one for stocks, one for crypto.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Open Settings → <strong>Apps hub</strong> → click the <strong>Finance</strong> card.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Under <strong>Stocks</strong>, type a company name or ticker in the search bar (e.g. "Apple" or "AAPL"). Select from the autocomplete results. Repeat for each ticker you want.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>Under <strong>Crypto</strong>, toggle the coins you want to track (Bitcoin, Ethereum, Solana, and more).</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <div className="step-body">
              <p>The Finance dashboards appear centered on your new tab. Each card is independently scrollable and has a show/hide toggle at the top.</p>
            </div>
          </div>
          <div className="callout tip">
            <strong>Prices cached for 5 minutes</strong> -
            adding a new ticker bypasses the cache immediately so you see the price right away.
          </div>
          <h2 id="focus">
            <span className="section-icon">⏱</span>
            Focus Timer
          </h2>
          <p>
            The focus timer lets you set an intention for your session. While active, the background dims and all other UI fades away so nothing distracts you.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Click the focus input in the center of your new tab - it says something like <em>"What are you working on?"</em></p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Type what you're working on and press <strong>Enter</strong>. The timer starts and the tab dims.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>When you're done, click anywhere on the screen or press <strong>Escape</strong> to exit focus mode.</p>
            </div>
          </div>
          <div className="callout tip">
            <strong>Focus presets</strong> -
            go to Settings → <strong>Focus</strong> to save your most common focus tasks as one-click presets, so you don't have to type the same thing every day.
          </div>
          <h2 id="background">
            <span className="section-icon">🖼</span>
            Change Your Background
          </h2>
          <p>
            WindoM supports two background sources: curated photos from Unsplash, or an image you upload from your device.
          </p>
          <h3>Option A - Unsplash photos</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Open Settings → <strong>Background</strong> tab. Select <strong>Unsplash</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
                <p>
                  Optionally, paste a <strong>Collection ID</strong> from Unsplash to curate the photo style.
                  To find a collection ID: go to <a href="https://unsplash.com/collections" target="_blank" rel="noreferrer">unsplash.com/collections</a>,
                  open any collection, and copy the number from the URL -
                  e.g. <code>unsplash.com/collections/<strong>4324303</strong>/...</code>
                </p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>A new photo loads each time you open a new tab.</p>
            </div>
          </div>
          <h3>Option B - Your own image</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Open Settings → <strong>Background</strong> tab. Select <strong>Local</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Click <strong>Choose image</strong> and select any photo from your device. It's stored locally - never uploaded anywhere.</p>
            </div>
          </div>
          <h2 id="weather">
            <span className="section-icon">🌤</span>
            Weather Widget
            <span className="badge optional">Needs API Key</span>
          </h2>
          <p>
            The weather widget shows live temperature and conditions in the top bar. It uses OpenWeatherMap's free tier - you need your own API key.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Go to <a href="https://openweathermap.org" target="_blank" rel="noreferrer">openweathermap.org</a> and create a free account.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>
                In your account dashboard, go to <strong>API Keys</strong> and copy your default key (or create a new one labelled something like <em>WindoM</em>).
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>Open WindoM Settings → <strong>Weather</strong> tab. Paste your API key and enter your city name (e.g. <code>Tel Aviv</code> or <code>New York</code>). Choose °C or °F and click <strong>Save</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <div className="step-body">
              <p>The weather widget appears in the top-left of your new tab.</p>
            </div>
          </div>
          <div className="callout">
            <strong>New API key not working?</strong>
            OpenWeatherMap free keys can take up to 2 hours to activate after creation. If you get an error right after creating the key, wait a bit and try again.
          </div>
          <div className="callout tip">
            <strong>Free tier limits</strong> -
            OpenWeatherMap's free plan allows 1,000 API calls per day. WindoM caches the weather for 10 minutes per new tab, so you'll never come close to that limit.
          </div>
          <h2 id="links">
            <span className="section-icon">🔗</span>
            Quick Links &amp; Dock Bar
          </h2>
          <p>
            Pin your most-used sites to the dock bar that runs across the top of every new tab. Each link shows as a favicon icon - hover to see the label.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Open Settings → <strong>Links</strong> tab.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Click <strong>Add link</strong>. Enter the full URL (e.g. <code>https://github.com</code>) and a display name.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>Drag to reorder. Click the <strong>×</strong> on any link to remove it.</p>
            </div>
          </div>
          <h2 id="clock">
            <span className="section-icon">🕐</span>
            Clock &amp; Date
          </h2>
          <p>
            The clock is the centerpiece of your new tab. Everything about it is customizable.
          </p>
          <ul>
            <li><strong>Format</strong> - 12-hour (with AM/PM) or 24-hour</li>
            <li><strong>Size</strong> - small, medium, or large font</li>
            <li><strong>Color</strong> - pick any color with the color picker</li>
            <li><strong>Date</strong> - show or hide the date below the time; choose your preferred date format</li>
            <li><strong>Style</strong> - plain digits or a more styled variant</li>
          </ul>
          <p>All options are in Settings → <strong>Clock</strong> tab.</p>
    </DocsLayout>
  );
}
