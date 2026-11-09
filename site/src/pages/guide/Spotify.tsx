import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Spotify.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Spotify() {
  return (
    <DocsLayout path="/guide/spotify" eyebrow="User Guide" title="Connect Spotify">
      <p>
        Once connected, WindoM shows what is playing on Spotify in the top dock, with play/pause, previous and next
        buttons, and can list your top tracks in the sidebar. Because of how Spotify's API works, each user connects
        their own free Spotify Developer app - this keeps your account private and avoids any shared rate limits. The
        whole setup takes about 2 minutes.
      </p>
      <div className="callout spotify">
        <strong>Why do I need my own app?</strong>
        <br />
        Spotify's Web API requires an OAuth app registered in their developer portal. Instead of routing everyone
        through a shared WindoM app (which has quota limits and privacy implications), each user creates their own free
        app - you get full control and there are no limits to worry about.
      </div>
      <h2>Before you start</h2>
      <ul>
        <li>
          You need a WindoM account (see <Link to="/guide/account">on the account page</Link> - free, takes 1 minute)
        </li>
        <li>
          You need a Spotify account. Free and Premium both connect, but Spotify only lets Premium accounts be
          controlled from outside its own apps - on a free account the buttons do nothing and WindoM says Premium is
          required.
        </li>
      </ul>
      <h2>Step 1 - Create a Spotify Developer app</h2>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            Go to{' '}
            <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">
              developer.spotify.com/dashboard
            </a>{' '}
            and log in with your Spotify account.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Click <strong>Create app</strong>.
          </p>
          <ul>
            <li>
              <strong>App name</strong> - anything you like, e.g. <em>My WindoM</em>
            </li>
            <li>
              <strong>App description</strong> - anything, e.g. <em>Personal WindoM integration</em>
            </li>
            <li>
              <strong>Redirect URI</strong> - leave this empty for now, you'll add it in Step 2
            </li>
            <li>
              <strong>Which API/SDKs are you planning to use?</strong> - select <strong>Web API</strong>
            </li>
          </ul>
          <p>
            Agree to the terms and click <strong>Save</strong>.
          </p>
        </div>
      </div>
      <h2>Step 2 - Copy your Redirect URI from WindoM</h2>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            Open your WindoM new tab, click <strong>Settings</strong> (gear icon, bottom-left), go to{' '}
            <strong>Apps</strong> and click the <strong>Spotify</strong> card.
          </p>
          <p>
            You'll see a box labelled <strong>Redirect URI</strong> with a value that looks like this:
          </p>
          <div className="redirect-uri-box">
            <span className="redirect-uri-label">Redirect URI</span>
            <span className="redirect-uri-value">https://&lt;your-extension-id&gt;.chromiumapp.org/</span>
          </div>
          <p>
            Click the <strong>Copy</strong> button next to it. This URI is unique to your Chrome installation - do not
            type it manually.
          </p>
        </div>
      </div>
      <h2>Step 3 - Add the Redirect URI to your Spotify app</h2>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            Go back to the{' '}
            <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">
              Spotify Developer Dashboard
            </a>
            , click on your app, then click <strong>Settings</strong> (top right of your app page).
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Scroll to the <strong>Redirect URIs</strong> field. Paste the URI you copied from WindoM, then click{' '}
            <strong>Add</strong>, then <strong>Save</strong> at the bottom.
          </p>
        </div>
      </div>
      <div className="callout warning">
        <strong>This step is easy to miss.</strong> If you skip adding the Redirect URI you'll get an{' '}
        <em>Invalid Client</em> error when you try to connect. The URI must match exactly - copy it using the button in
        WindoM, don't type it by hand.
      </div>
      <h2>Step 4 - Copy your Client ID and connect</h2>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            Still on your Spotify app's Settings page, copy the <strong>Client ID</strong> at the top. It looks like a
            32-character hex string, e.g. <code>b3d9a1f0c84e...</code>
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Go back to WindoM → Settings → Apps → <strong>Spotify</strong>. Paste the Client ID into the input field and
            click <strong>Save &amp; Connect</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            A Spotify authorization popup will appear. Click <strong>Agree</strong>.
          </p>
          <p>You're connected. The now-playing card will appear in the top dock the next time you play a track.</p>
        </div>
      </div>
      <h2>Top tracks</h2>
      <p>
        On the same Spotify card, turn on <strong>Show top tracks in sidebar</strong> to list your ten most-played
        tracks of the last few weeks in the sidebar. Each one links to the track on Spotify.
      </p>
      <h2>Troubleshooting</h2>
      <div className="callout">
        <strong>Error: Invalid Client</strong> - the Client ID is wrong or the Redirect URI wasn't saved correctly in
        the Spotify dashboard. Double-check both. The Redirect URI must be copied from WindoM's Spotify card, not typed
        manually.
      </div>
      <div className="callout">
        <strong>Error: Connection cancelled</strong> - you closed the Spotify popup before completing authorization.
        Click Save &amp; Connect again and complete the authorization flow.
      </div>
      <div className="callout tip">
        <strong>Changed Chrome profile or reinstalled Chrome?</strong> Your Redirect URI will be different. Go to
        Settings → Apps → Spotify to see the new URI, add it to your Spotify app settings (you can have multiple
        Redirect URIs), then reconnect.
      </div>
      <p>
        Still stuck? See <Link to="/support#spotify-connect">Support</Link>.
      </p>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
