import { Link } from 'react-router';
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
export function Guide() {
  return (
    <DocsLayout path="/guide" eyebrow="User Guide" title="Using WindoM">
          <h2 id="overview">At a glance</h2>
          <div className="callout tip">
            <strong>No account required for most things.</strong> The clock, weather, backgrounds, quick links, todos, focus mode, quotes, search, the tab sidebar and stock prices all work instantly with no sign-in. An account is only needed for settings sync, Google Calendar, GitHub and Spotify. You can always add one later. New here? Start with <Link to="/install">Install</Link>.
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-card-title">Clock &amp; Greeting</div>
              <div className="feature-card-desc">12h / 24h, style, color, size, date. Always on, no account needed.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">Background</div>
              <div className="feature-card-desc">Built-in photos, your own images, or Unsplash. Stored locally.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">Quick Links</div>
              <div className="feature-card-desc">Pin your most-used sites to the dock bar at the top.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">Todos</div>
              <div className="feature-card-desc">A task list in the sidebar. No account needed.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">Focus Mode</div>
              <div className="feature-card-desc">Set your main focus, then a countdown that hides everything else.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">Search</div>
              <div className="feature-card-desc">One shortcut on any page: tabs, history and the web.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">Weather</div>
              <div className="feature-card-desc">Live temperature and conditions. No API key, no account.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">Google Calendar</div>
              <div className="feature-card-desc">Upcoming events in the sidebar. Needs an account + Google authorization.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">Spotify</div>
              <div className="feature-card-desc">Now playing, playback controls and top tracks. Needs an account + a free Spotify Developer app.</div>
            </div>
          </div>
          <p>Something not behaving as described here? <Link to="/support">Support</Link> covers the problems that come up most. If you want to run or change WindoM yourself, see <Link to="/local-setup">Local Setup</Link>.</p>

          <h2 id="clock">
            Clock, Date &amp; Greeting
          </h2>
          <p>The clock is the centerpiece of your new tab. All of its options are in Settings → <strong>Clock</strong>:
          </p>
          <ul>
            <li><strong>Time Format</strong> - 12-hour or 24-hour, with optional seconds and a leading zero</li>
            <li><strong>Style</strong> - default, glass or outline digits</li>
            <li><strong>Color</strong> - pick any color with the color picker</li>
            <li><strong>Size</strong> - a slider from 60 to 180 pixels</li>
            <li><strong>Font Weight</strong> - Thin, Light, Regular or Bold</li>
            <li><strong>Show Date</strong> - the date below the time, in a long, short or numeric format</li>
          </ul>
          <p>Under the clock is a greeting that follows the time of day - good morning, afternoon, evening or night - and your name. Click the name to change it, press <strong>Enter</strong> to keep the change or <strong>Escape</strong> to cancel it. It starts as <em>Friend</em>; if you sign in to an account with a name while it still says that, your first name replaces it. To hide the greeting, turn off <strong>Greeting</strong> under Settings → General → <strong>Widget Visibility</strong>.</p>

          <h2 id="background">
            Change Your Background
          </h2>
          <p>WindoM starts with a set of built-in photos and needs nothing from you. You can switch to your own images, or to photos from Unsplash. The choice is under Settings → <strong>Background</strong> → <strong>Background Source</strong>.
          </p>
          <h3>Option A - Built-in and your own images</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Open Settings → <strong>Background</strong> tab and set the source to <strong>Local Image</strong>. This is the default.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Pick one of the <strong>Built-in</strong> photos, or click the upload button and choose an image from your device. Uploaded images are stored locally - never uploaded anywhere - and the most recent ones stay listed under <strong>Local Photos</strong> so you can switch back.</p>
            </div>
          </div>
          <h3>Option B - Unsplash photos</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Open Settings → <strong>Background</strong> tab and set the source to <strong>Unsplash</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Unsplash needs an access key of your own, which is free. Go to <a href="https://unsplash.com/developers" target="_blank" rel="noreferrer">unsplash.com/developers</a>, create an app, copy its <strong>Access Key</strong> and paste it into <strong>Unsplash Access Key</strong>. Without a key a gradient is shown instead of a photo.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
                <p>Optionally, paste a <strong>Collection ID</strong> from Unsplash to curate the photo style. Left empty, you get random nature photos.
                  To find a collection ID: go to <a href="https://unsplash.com/collections" target="_blank" rel="noreferrer">unsplash.com/collections</a>,
                  open any collection, and copy the number from the URL -
                  e.g. <code>unsplash.com/collections/<strong>4324303</strong>/...</code>
                </p>
            </div>
          </div>

          <h2 id="links">
            Quick Links &amp; Dock Bar
          </h2>
          <p>Pin your most-used sites to the dock bar that runs across the top of every new tab. Each link shows as the site's icon, with its name on hover. The dock holds up to 27 links in rows of nine, and scrolls a row at a time.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Click the <strong>+</strong> at the end of the dock, or open Settings → <strong>Links</strong> and click <strong>+ Add Link</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Enter a name and the full URL (e.g. <code>https://github.com</code>).</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>To remove a link, click the <strong>×</strong> on it in the dock or next to it in Settings → Links.</p>
            </div>
          </div>
          <p>To hide the dock altogether, turn off <strong>Quick Links</strong> under Settings → General → Widget Visibility.</p>

          <h2 id="todos">
            Todos
          </h2>
          <p>A simple task list, <strong>Today's Tasks</strong>, at the top of the sidebar. It is on from the start and needs no account.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Click the list icon in the bottom-right corner of the new tab to open the sidebar.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Type in <strong>Add a new task...</strong> and press <strong>Enter</strong> or click <strong>+</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>Tick a task to mark it done, or click its <strong>×</strong> to remove it.</p>
            </div>
          </div>
          <div className="callout tip">
            <strong>Where tasks live</strong> -
            tasks are kept in Chrome's storage for your profile, not on WindoM's server, and every open new tab shows the same list. To hide the list, open Settings → <strong>Apps</strong> → <strong>Tasks</strong> and turn off <strong>Show in sidebar</strong>.
          </div>

          <h2 id="focus">
            Focus Mode
          </h2>
          <p>The center of the new tab asks <em>What is your main focus for today?</em> Write it down, and when it is time to work on it, start a countdown that hides everything else.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Type your focus into the field in the center and press <strong>Enter</strong>. Click it later to mark it done; double-click it to edit it.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Click one of the durations below it - <strong>25m</strong>, <strong>1h</strong>, <strong>2h</strong> or <strong>4h</strong>. The rest of the page fades away, leaving the clock and the time remaining.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>To stop early, click <strong>Stop Focus</strong>, click anywhere on the screen, or press <strong>Escape</strong>.</p>
            </div>
          </div>
          <div className="callout tip">
            <strong>Not using it?</strong> -
            turn off <strong>Center Bar</strong> under Settings → General → Widget Visibility to hide the focus field and the durations.
          </div>

          <h2 id="quotes">
            Daily Quotes
          </h2>
          <p>A quote sits at the bottom of the new tab and changes once a day. Click it for another one.
          </p>
          <p>In Settings → <strong>Quotes</strong>, <strong>Show daily quotes</strong> turns it on or off, and <strong>Quote Source</strong> chooses between <strong>Local Quotes</strong>, a collection that ships with the extension, and <strong>API Quotes</strong>, fetched from the Quotable service.</p>

          <h2 id="search">
            Search
          </h2>
          <p>Press <kbd>Ctrl</kbd> + <kbd>Win</kbd> + <kbd>H</kbd> - <kbd>Ctrl</kbd> + <kbd>Cmd</kbd> + <kbd>H</kbd> on a Mac - to open a search box over the page you are on. It works on the new tab and on ordinary websites; extensions cannot run on Chrome's own pages, so it does not open there. The same keys close it, as does <strong>Escape</strong>.
          </p>
          <ul>
            <li><strong>Type anything</strong> - suggestions come from your open tabs, then your history (on the new tab, once <Link to="/guide#history">Tab History</Link> is on), then the web. Pick a tab to switch to it rather than opening it again.</li>
            <li><strong>Type an address</strong> - such as <code>github.com</code>, and <strong>Enter</strong> goes straight there.</li>
            <li><strong>Choose the engine</strong> - the pill beside the box switches between Google, Bing, DuckDuckGo and Brave. Google is the default.</li>
            <li><strong>Start with <code>&gt;</code></strong> - for commands: New Tab, Close Tab, Reload Page, Duplicate Tab and Pin / Unpin Tab. Anything else after <code>&gt;</code> opens in a new tab.</li>
          </ul>
          <div className="callout">
            <strong>Where the web suggestions come from</strong> -
            whichever engine you search with, the suggestions under the box come from DuckDuckGo's autocomplete, so what you type is sent to DuckDuckGo as you type it. Tab and history suggestions never leave your browser.
          </div>

          <h2 id="tab-sidebar">
            Tab Sidebar
          </h2>
          <p>Move the pointer to the right edge of the new tab and a panel slides out listing every open tab, across all your windows. Click one to switch to it, or click <strong>New Tab</strong> at the top. Chrome's own pages are left out of the list.
          </p>
          <p>To use the left edge instead, open Settings → <strong>General</strong> → <strong>Tab Sidebar</strong> and choose <strong>Left</strong>.</p>

          <h2 id="history">
            Tab History
          </h2>
          <p>Adds a <strong>Recent</strong> list to the sidebar: the ten sites you visited most recently, each with its icon and when you were there. It is off until you turn it on.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Open Settings → <strong>Apps</strong> → <strong>History</strong> and turn on <strong>Show in sidebar and search</strong>. Chrome then asks whether WindoM may read your browsing history - click <strong>Allow</strong>. If you decline, the switch stays off and nothing else changes.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Open the sidebar from the list icon in the bottom-right corner. Click an entry to open it in a new tab.</p>
            </div>
          </div>
          <p>The list is read from Chrome's own history on your device; nothing in it is sent anywhere. The same switch adds pages you visited to the <Link to="/guide#search">search</Link> suggestions on the new tab.</p>
          <p>WindoM does not ask for your history when you install it - only when you turn this on. Turning it off gives the permission back to Chrome. If you remove it yourself at <code>chrome://extensions</code>, the <strong>Recent</strong> list shows an <strong>Allow access</strong> button instead of your history.</p>

          <h2 id="weather">
            Weather Widget
          </h2>
          <p>The weather widget shows live temperature and conditions in the top bar. It reads from Open-Meteo, which needs no API key and no account - there is nothing to sign up for and nothing to paste in.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Open WindoM Settings → <strong>Weather</strong> tab.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Set <strong>Temperature Unit</strong> to Celsius (°C) or Fahrenheit (°F).</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
                <p>Start typing a city in the <strong>Location</strong> field (e.g. <code>Tel Aviv</code> or <code>New York</code>). Matching cities appear below the field with their region and country - click the one you mean.</p>
                <p>Or press <strong>Use my current location</strong> - only then does the browser ask whether WindoM may know your location. WindoM never asks on its own; until you set one, the widget shows <strong>Set location</strong>, which opens this tab. If you block the request, type a city instead.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <div className="step-body">
              <p>The weather widget appears in the top-left of your new tab. There is no Save button - the change applies as soon as you pick it.</p>
            </div>
          </div>
          <div className="callout">
            <strong>Showing the wrong place?</strong> When you use your current location, WindoM falls back to a rough lookup from your IP address when the browser will not give coordinates, which can be a long way out on a VPN or a mobile connection. Type a city by hand to pin it.
          </div>
          <div className="callout tip">
            <strong>Refreshed every 30 minutes</strong> -
            the last reading is cached, so the widget is already filled in when a new tab opens and updates once the fresh reading arrives.
          </div>

          <h2 id="finance">
            Finance Dashboard
          </h2>
          <p>Track live stock prices and crypto rates directly on your new tab. Prices update from Yahoo Finance and CoinGecko - no API key or account needed. Two scrollable cards appear on your dashboard: one for stocks, one for crypto.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Open Settings → <strong>Apps</strong> → click the <strong>Finance</strong> card.</p>
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

          <h2 id="templates">
            Layout Templates
          </h2>
          <p>Settings → <strong>Templates</strong> has six preset layouts that switch several settings at once: <strong>Minimal</strong> (just the clock), <strong>Productivity</strong>, <strong>Inspiration</strong>, <strong>Dashboard</strong> (everything on), <strong>Night Owl</strong> and <strong>Deep Focus</strong>.
          </p>
          <p>Click <strong>Apply</strong> on one and confirm. A template only overwrites the sections it covers, and the confirmation names them; your links, keys and connections stay as they are.</p>

          <h2 id="account">
            Create a WindoM Account
            <span className="badge optional">Optional</span>
          </h2>
          <p>A WindoM account syncs your settings across devices and is required to connect Google Calendar, Spotify or GitHub. Registration is free and takes under a minute.
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
          <h3>Managing your account</h3>
          <p>Everything below is in Settings → <strong>Account</strong> once you are signed in.</p>
          <ul>
            <li><strong>Name</strong> - change it under <strong>Profile</strong> and click <strong>Save</strong>.</li>
            <li><strong>Password</strong> - accounts with a password can set a new one under <strong>Change password</strong>. If you have forgotten it, click <strong>Forgot password?</strong> on the sign-in form and WindoM emails you a reset link.</li>
            <li><strong>Active sessions</strong> - every browser signed in to your account is listed. <strong>Revoke session</strong> stops one from renewing; it can keep working for up to 15 minutes afterwards.</li>
            <li><strong>Sign out</strong> - signs this browser out of the account.</li>
            <li><strong>Delete account</strong> - under <strong>Danger Zone</strong>. It permanently deletes the account and everything stored with it, including your Calendar and Spotify connections. Password accounts are asked for the password to confirm.</li>
          </ul>
          <p>What the account stores, and what never leaves your device, is in the <Link to="/privacy">privacy policy</Link>.</p>

          <h2 id="calendar">
            Connect Google Calendar
          </h2>
          <p>WindoM pulls your upcoming Google Calendar events into the sidebar so your day is always visible. This requires a WindoM account and a one-time Google authorization.
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
              <p>Open Settings → <strong>Apps</strong> → click the <strong>Calendar</strong> card → click <strong>Connect</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
                <p>A Google authorization window opens. Choose your Google account and click <strong>Allow</strong>.</p>
                <p>WindoM only requests read-only access to your calendar events - it cannot create, edit, or delete anything. The exact permissions are listed in the <Link to="/privacy">privacy policy</Link>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <div className="step-body">
              <p>Done. Your upcoming events appear in the sidebar, grouped by day.</p>
            </div>
          </div>
          <div className="callout tip">
            <strong>Look-ahead window</strong> -
            by default events for the next 7 days are shown. You can change this to 14 or 30 days on the same <strong>Calendar</strong> card under Settings → Apps.
          </div>

          <h2 id="github">
            Connect GitHub
          </h2>
          <p>The GitHub widget puts three numbers in the sidebar: unread notifications, pull requests waiting on your review, and open issues assigned to you. Each row links straight to the matching page on GitHub. It needs a WindoM account and a personal access token you create yourself.
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
                <p>Go to <a href="https://github.com/settings/tokens/new?scopes=notifications,repo&description=WindoM" target="_blank" rel="noreferrer">github.com/settings/tokens/new</a>. The link preselects the two scopes WindoM needs - <code>notifications</code> and <code>repo</code> - so check they are ticked, set an expiry you are happy with, and click <strong>Generate token</strong>.</p>
                <p>Copy the token straight away. It starts with <code>ghp_</code> and GitHub shows it only once.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>Open Settings → <strong>Apps</strong> → click the <strong>GitHub</strong> card. Paste the token into <strong>Personal Access Token</strong> and click <strong>Connect</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <div className="step-body">
              <p>The counts appear in the sidebar and refresh on their own. <strong>Show GitHub in sidebar</strong> on the same card hides the widget without disconnecting.</p>
            </div>
          </div>
          <div className="callout warning">
            <strong>Why the repo scope?</strong> The review-request and assigned-issue counts come from GitHub's search API, which only includes private repositories for a token that carries <code>repo</code>. On a classic token that scope also grants write access, which WindoM never uses - so treat the token like a password, and revoke it from <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">your token settings</a> if you stop using the widget.
          </div>

          <h2 id="spotify">
            Connect Spotify
            <span className="badge byoa">BYOA</span>
          </h2>
          <p>Once connected, WindoM shows what is playing on Spotify in the top dock, with play/pause, previous and next buttons, and can list your top tracks in the sidebar. Because of how Spotify's API works, each user connects their own free Spotify Developer app - this keeps your account private and avoids any shared rate limits. The whole setup takes about 2 minutes.
          </p>
          <div className="callout spotify">
            <strong>Why do I need my own app?</strong><br />Spotify's Web API requires an OAuth app registered in their developer portal. Instead of routing everyone through a shared WindoM app (which has quota limits and privacy implications), each user creates their own free app - you get full control and there are no limits to worry about.
          </div>
          <h3>Before you start</h3>
          <ul>
            <li>You need a WindoM account (see <a href="#account">above</a> - free, takes 1 minute)</li>
            <li>You need a Spotify account. Free and Premium both connect, but Spotify only lets Premium accounts be controlled from outside its own apps - on a free account the buttons do nothing and WindoM says Premium is required.</li>
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
            <div className="step-num">1</div>
            <div className="step-body">
                <p>Open your WindoM new tab, click <strong>Settings</strong> (gear icon, bottom-left), go to <strong>Apps</strong> and click the <strong>Spotify</strong> card.
                </p>
                <p>You'll see a box labelled <strong>Redirect URI</strong> with a value that looks like this:
                </p>
                <div className="redirect-uri-box">
                  <span className="redirect-uri-label">Redirect URI</span>
                  <span className="redirect-uri-value">https://&lt;your-extension-id&gt;.chromiumapp.org/</span>
                </div>
                <p>Click the <strong>Copy</strong> button next to it. This URI is unique to your Chrome installation - do not type it manually.</p>
            </div>
          </div>
          <h3>Step 3 - Add the Redirect URI to your Spotify app</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Go back to the <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">Spotify Developer Dashboard</a>, click on your app, then click <strong>Settings</strong> (top right of your app page).</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Scroll to the <strong>Redirect URIs</strong> field. Paste the URI you copied from WindoM, then click <strong>Add</strong>, then <strong>Save</strong> at the bottom.</p>
            </div>
          </div>
          <div className="callout warning">
            <strong>This step is easy to miss.</strong> If you skip adding the Redirect URI you'll get an <em>Invalid Client</em> error when you try to connect. The URI must match exactly - copy it using the button in WindoM, don't type it by hand.
          </div>
          <h3>Step 4 - Copy your Client ID and connect</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Still on your Spotify app's Settings page, copy the <strong>Client ID</strong> at the top. It looks like a 32-character hex string, e.g. <code>b3d9a1f0c84e...</code></p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Go back to WindoM → Settings → Apps → <strong>Spotify</strong>. Paste the Client ID into the input field and click <strong>Save &amp; Connect</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
                <p>A Spotify authorization popup will appear. Click <strong>Agree</strong>.</p>
                <p>You're connected. The now-playing card will appear in the top dock the next time you play a track.</p>
            </div>
          </div>
          <h3>Top tracks</h3>
          <p>On the same Spotify card, turn on <strong>Show top tracks in sidebar</strong> to list your ten most-played tracks of the last few weeks in the sidebar. Each one links to the track on Spotify.</p>
          <h3>Troubleshooting</h3>
          <div className="callout">
            <strong>Error: Invalid Client</strong> -
            the Client ID is wrong or the Redirect URI wasn't saved correctly in the Spotify dashboard. Double-check both. The Redirect URI must be copied from WindoM's Spotify card, not typed manually.
          </div>
          <div className="callout">
            <strong>Error: Connection cancelled</strong> -
            you closed the Spotify popup before completing authorization. Click Save &amp; Connect again and complete the authorization flow.
          </div>
          <div className="callout tip">
            <strong>Changed Chrome profile or reinstalled Chrome?</strong> Your Redirect URI will be different. Go to Settings → Apps → Spotify to see the new URI, add it to your Spotify app settings (you can have multiple Redirect URIs), then reconnect.
          </div>
          <p>Still stuck? See <Link to="/support#spotify-connect">Support</Link>.</p>
    </DocsLayout>
  );
}
