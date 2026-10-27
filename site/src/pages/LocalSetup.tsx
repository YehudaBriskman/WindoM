import { DocsLayout } from '../components/DocsLayout';
import { EnvTable } from '../components/EnvTable';
import { EXAMPLE_ENV } from '../lib/env-reference';
import { NODE_MIN_VERSION } from '../lib/site';
/**
 * Developer setup. Ported from the previous hand-written page; the environment
 * reference table is the authoritative list of what the backend needs to boot,
 * so it is reproduced rather than summarised.
 */
export function LocalSetup() {
  return (
    <DocsLayout path="/local-setup" eyebrow="Developer Guide" title="Running WindoM locally">
<h2 id="extension-only">Option A - Extension Only <span className="badge">Recommended to start</span></h2>
          <p>
            This gets the extension running in Chrome with no backend needed.
            Clock, weather, todos, backgrounds, quotes, quick links, and the focus timer all work out of the box.
            Google Calendar and Spotify require the full stack setup below.
          </p>
          <h3>Prerequisites</h3>
          <ul>
            <li><a href="https://nodejs.org">Node.js {NODE_MIN_VERSION} or higher</a> - the build fails on older releases</li>
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
          <EnvTable locale="en" />
          <div className="callout">
            <strong>Finding your extension ID</strong> - load the extension as unpacked in Chrome, then go to <code>chrome://extensions</code>. The ID is shown under the extension name. Use it in <code>CORS_ALLOWED_ORIGINS</code> as <code>chrome-extension://YOUR_ID</code> and in <code>EXTENSION_REDIRECT_BASE</code> as <code>https://YOUR_ID.chromiumapp.org</code>.
          </div>
          <h3>Example .env for local development</h3>
          <div className="callout">
            <strong>DATABASE_URL note</strong> - when running with <code>docker-compose up</code>, the <code>DATABASE_URL</code> is automatically overridden to point to the <code>db</code> container (port 5432 internally). You only need to set it manually if you run the backend directly on your host, in which case use port <code>5433</code> - the host-mapped port Docker Compose exposes.
          </div>
          <pre><code>{EXAMPLE_ENV('en')}</code></pre>
    </DocsLayout>
  );
}
