import { Layout } from '../components/Layout';
/**
 * Developer setup. Ported from the previous hand-written page; the environment
 * reference table is the authoritative list of what the backend needs to boot,
 * so it is reproduced rather than summarised.
 */
export function LocalSetup() {
  return (
    <Layout eyebrow="Developer Guide" title="Running WindoM locally">
      <div className="wrap wrap-prose prose">
<h2 id="extension-only">Option A - Extension Only <span className="badge">Recommended to start</span></h2>
          <p>
            This gets the extension running in Chrome with no backend needed.
            Clock, weather, todos, backgrounds, quotes, quick links, and the focus timer all work out of the box.
            Google Calendar and Spotify require the full stack setup below.
          </p>
          <h3>Prerequisites</h3>
          <ul>
            <li><a href="https://nodejs.org">Node.js 18 or higher</a></li>
            <li>Google Chrome</li>
            <li>Git</li>
          </ul>
          <h3>Steps</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Clone the repository.</p>
              <pre><code>git clone https://github.com/YehudaBriskman/WindoM.git
        cd WindoM</code></pre>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Install dependencies for the extension.</p>
              <pre><code>cd web
        npm install</code></pre>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>Build the extension.</p>
              <pre><code>npm run build</code></pre>
              <p>This creates a <code>web/dist/</code> folder - that is your built extension.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <div className="step-body">
              <p>Load the extension in Chrome.</p>
              <ol>
                <li>Open Chrome and go to <code>chrome://extensions</code></li>
                <li>Enable <strong>Developer mode</strong> (toggle in the top right)</li>
                <li>Click <strong>Load unpacked</strong></li>
                <li>Select the <code>web/dist</code> folder</li>
              </ol>
            </div>
          </div>
          <div className="step">
            <div className="step-num">5</div>
            <div className="step-body">
              <p>Open a new tab. WindoM should appear.</p>
            </div>
          </div>
          <div className="callout tip">
            <strong>Dev mode with hot reload</strong> - run <code>npm run dev</code> instead of build, then load the <code>web/</code> project root folder (not <code>dist/</code>) as the unpacked extension at <code>chrome://extensions</code>. Changes reload automatically via HMR.
          </div>
<h2 id="full-stack">Option B - Full Stack <span className="badge optional">Optional</span></h2>
          <p>
            Required if you want Google Calendar sync or Spotify integration.
            This runs a local backend with a Postgres database using Docker.
          </p>
          <h3>Prerequisites</h3>
          <ul>
            <li>Everything from Option A</li>
            <li><a href="https://www.docker.com/products/docker-desktop">Docker Desktop</a></li>
            <li>A Google Cloud project with OAuth credentials (for Calendar)</li>
            <li>A Spotify Developer app (for Spotify)</li>
          </ul>
          <h3>Steps</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>Copy the example environment file.</p>
              <pre><code>cp backend/.env.example backend/.env</code></pre>
              <p>Then open <code>backend/.env</code> and fill in the values. See the <a href="#env-reference">Environment Reference</a> below for what each one means.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>Generate secure secrets for JWT and token encryption.</p>
              <pre><code>node -e "const c=require('crypto'); console.log('JWT_ACCESS_SECRET='+c.randomBytes(32).toString('base64')); console.log('REFRESH_TOKEN_SECRET='+c.randomBytes(32).toString('base64')); console.log('TOKEN_ENC_KEY_BASE64='+c.randomBytes(32).toString('base64'));"</code></pre>
              <p>Copy the output into your <code>.env</code> file.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>Start the backend and database with Docker.</p>
              <pre><code>docker-compose up --build</code></pre>
              <p>The API will be running at <code>http://localhost:8080</code>. The database runs at port <code>5433</code>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <div className="step-body">
              <p>Build the extension pointing at your local backend.</p>
              <pre><code>cd web
        npm install
        npm run build</code></pre>
              <p>The default backend URL is already <code>http://localhost:8080</code> so no changes are needed.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">5</div>
            <div className="step-body">
              <p>Load <code>web/dist</code> as an unpacked extension in Chrome (same as Option A, step 4).</p>
            </div>
          </div>
          <div className="callout warning">
            <strong>OAuth redirect URIs</strong> - add these to your OAuth app consoles before testing:
            <ul>
              <li><strong>Google Cloud Console</strong> → Authorized redirect URIs:<br />
                <code>http://localhost:8080/auth/google/callback</code><br />
                <code>http://localhost:8080/oauth/google/callback</code>
              </li>
              <li><strong>Spotify Developer Dashboard</strong> → Redirect URIs:<br />
                <code>http://localhost:8080/oauth/spotify/callback</code>
              </li>
            </ul>
          </div>
<h2 id="env-reference">Environment Reference</h2>
          <p>All variables go in <code>backend/.env</code>. The ones marked optional are only needed for specific features.</p>
          <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Variable</th>
                <th>Description</th>
                <th>Required</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>PORT</code></td>
                <td>Port the backend listens on. Default: <code>8080</code></td>
                <td>No</td>
              </tr>
              <tr>
                <td><code>DATABASE_URL</code></td>
                <td>Postgres connection string. When using Docker Compose this is set automatically.</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td><code>JWT_ACCESS_SECRET</code></td>
                <td>Random secret used to sign access tokens. Generate with <code>openssl rand -base64 32</code></td>
                <td>Yes</td>
              </tr>
              <tr>
                <td><code>REFRESH_TOKEN_SECRET</code></td>
                <td>Random secret used to sign refresh tokens. Generate separately from the above.</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td><code>TOKEN_ENC_KEY_BASE64</code></td>
                <td>32 random bytes base64-encoded. Used to encrypt OAuth tokens at rest.</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td><code>GOOGLE_CLIENT_ID</code></td>
                <td>OAuth 2.0 Client ID from Google Cloud Console.</td>
                <td>For Google features</td>
              </tr>
              <tr>
                <td><code>GOOGLE_CLIENT_SECRET</code></td>
                <td>OAuth 2.0 Client Secret from Google Cloud Console.</td>
                <td>For Google features</td>
              </tr>
              <tr>
                <td><code>GOOGLE_REDIRECT_URI</code></td>
                <td>Callback URL for Google Sign-in. Example: <code>http://localhost:8080/auth/google/callback</code></td>
                <td>For Google features</td>
              </tr>
              <tr>
                <td><code>GOOGLE_OAUTH_REDIRECT_URI</code></td>
                <td>Callback URL for Google Calendar OAuth. Example: <code>http://localhost:8080/oauth/google/callback</code></td>
                <td>For Calendar</td>
              </tr>
              <tr>
                <td><code>SPOTIFY_CLIENT_ID</code></td>
                <td>Client ID from your Spotify Developer app.</td>
                <td>For Spotify</td>
              </tr>
              <tr>
                <td><code>SPOTIFY_CLIENT_SECRET</code></td>
                <td>Client Secret from your Spotify Developer app.</td>
                <td>For Spotify</td>
              </tr>
              <tr>
                <td><code>SPOTIFY_REDIRECT_URI</code></td>
                <td>Callback URL for Spotify OAuth. Example: <code>http://localhost:8080/oauth/spotify/callback</code></td>
                <td>For Spotify</td>
              </tr>
              <tr>
                <td><code>CORS_ALLOWED_ORIGINS</code></td>
                <td>Comma-separated list of allowed origins. Include your extension ID and localhost ports.</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td><code>EXTENSION_REDIRECT_BASE</code></td>
                <td>The chromiumapp.org URL for your extension. Used as the OAuth redirect base for the Chrome identity flow.</td>
                <td>For Google features</td>
              </tr>
              <tr>
                <td><code>SMTP_HOST</code></td>
                <td>SMTP server. Defaults to <code>smtp.gmail.com</code>, so leaving it unset preserves the Gmail behaviour. Any provider works - Resend is <code>smtp.resend.com</code>, Brevo is <code>smtp-relay.brevo.com</code>.</td>
                <td>No</td>
              </tr>
              <tr>
                <td><code>SMTP_PORT</code></td>
                <td>Defaults to <code>465</code>, which uses implicit TLS. Port <code>587</code> negotiates STARTTLS instead; the code follows the port, so the two stay consistent.</td>
                <td>No</td>
              </tr>
              <tr>
                <td><code>SMTP_USER</code></td>
                <td>SMTP username. Not required to be an email address - several providers use a plain login, such as the literal <code>resend</code>. If this and <code>SMTP_PASS</code> are unset, emails are printed to the console instead of sent.</td>
                <td>No</td>
              </tr>
              <tr>
                <td><code>SMTP_PASS</code></td>
                <td>16-character Google App Password for the SMTP account. Generate at <em>myaccount.google.com → Security → 2-Step Verification → App Passwords</em>.</td>
                <td>No</td>
              </tr>
              <tr>
                <td><code>FROM_EMAIL</code></td>
                <td>The "From" address shown on outbound emails. Defaults to <code>noreply@windom.app</code>. On Gmail it must be <code>SMTP_USER</code> or a verified alias of it; dedicated providers only require the domain to be verified with them.</td>
                <td>No</td>
              </tr>
              <tr>
                <td><code>APP_URL</code></td>
                <td>Public base URL of the backend. Used to build email verification and password-reset links. Example: <code>http://localhost:8080</code>.</td>
                <td>No</td>
              </tr>
            </tbody>
          </table>
          </div>
          <div className="callout">
            <strong>Finding your extension ID</strong> - load the extension as unpacked in Chrome, then go to <code>chrome://extensions</code>. The ID is shown under the extension name. Use it in <code>CORS_ALLOWED_ORIGINS</code> as <code>chrome-extension://YOUR_ID</code> and in <code>EXTENSION_REDIRECT_BASE</code> as <code>https://YOUR_ID.chromiumapp.org</code>.
          </div>
          <h3>Example .env for local development</h3>
          <div className="callout">
            <strong>DATABASE_URL note</strong> - when running with <code>docker-compose up</code>, the <code>DATABASE_URL</code> is automatically overridden to point to the <code>db</code> container (port 5432 internally). You only need to set it manually if you run the backend directly on your host, in which case use port <code>5433</code> - the host-mapped port Docker Compose exposes.
          </div>
          <pre><code>PORT=8080
        NODE_ENV=development
        DATABASE_URL=postgresql://windom:windom@localhost:5433/windom
        JWT_ACCESS_SECRET=your-generated-secret-here
        REFRESH_TOKEN_SECRET=your-other-generated-secret-here
        TOKEN_ENC_KEY_BASE64=your-generated-key-here
        GOOGLE_CLIENT_ID=your-google-client-id
        GOOGLE_CLIENT_SECRET=your-google-client-secret
        GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
        GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8080/oauth/google/callback
        SPOTIFY_CLIENT_ID=your-spotify-client-id
        SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
        SPOTIFY_REDIRECT_URI=http://localhost:8080/oauth/spotify/callback
        CORS_ALLOWED_ORIGINS=chrome-extension://YOUR_EXTENSION_ID,http://localhost:3000,http://localhost:5173
        EXTENSION_REDIRECT_BASE=https://YOUR_EXTENSION_ID.chromiumapp.org
        # Email - optional. If omitted, verification/reset emails are printed to the console.
        # SMTP_USER=you@yourdomain.com
        # SMTP_PASS=your-16-char-app-password
        # FROM_EMAIL=noreply@windom.app
        # APP_URL=http://localhost:8080</code></pre>
      </div>
    </Layout>
  );
}
