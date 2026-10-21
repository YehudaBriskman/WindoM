import { Layout } from '../components/Layout';
import { Updates } from '../components/Updates';
import { FEATURES } from '../data/features';
import { SITE, STORE_URL, GITHUB_URL, PROJECT_PAGE } from '../lib/site';

const FAQ = [
  {
    q: 'Do I need an account?',
    a: 'No. The clock, backgrounds, weather, todos, quick links, quotes, search and focus mode all work with no account at all. An account is only needed for Google Calendar, Gmail and Spotify, because those have to authenticate with their own providers.',
  },
  {
    q: 'Does it work offline?',
    a: 'The dashboard itself does. Anything that fetches - weather, quotes, calendar, finance - needs a connection, and falls back to cached values where it can.',
  },
  {
    q: 'Does it track me?',
    a: 'No analytics, no telemetry, no ads. Your settings live in Chrome storage. If you create an account, settings sync through the backend so they follow you between devices - nothing else is collected.',
  },
  {
    q: 'Which browsers work?',
    a: 'Chrome, Arc, Brave, Edge and any other Chromium-based browser. Firefox is not supported: it uses a different extension model for new-tab replacement.',
  },
  {
    q: 'Can I self-host the backend?',
    a: 'Yes. It is a Fastify API with Postgres, and the whole thing runs under Docker Compose. The local setup guide walks through it.',
  },
  {
    q: 'What happens if I uninstall it?',
    a: 'Chrome removes everything stored locally. If you made an account, you can delete it from Settings to remove the synced copy too.',
  },
];

export function Home() {
  return (
    <Layout variant="home">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="section hero">
        <div className="wrap">
          <span className="badge">All the essentials in one new tab</span>
          <h1>
            {SITE.name}
            <br />
            <span className="gradient-text">{SITE.tagline}</span>
          </h1>
          <p className="lede">{SITE.description}</p>
          <div className="btn-row">
            <a className="btn btn-primary" href={STORE_URL}>
              Add to Chrome
            </a>
            <a className="btn btn-secondary" href="/guide.html">
              User Guide
            </a>
            <a className="btn btn-secondary" href="/local-setup.html">
              Run it locally
            </a>
            <a className="btn btn-secondary" href={GITHUB_URL}>
              GitHub
            </a>
          </div>
          <p className="muted hero-compat">
            Works on Chrome, Arc, Brave, Edge and any Chromium-based browser.
          </p>
        </div>
      </section>

      {/* ── Screenshot ───────────────────────────────────────────── */}
      <section className="wrap">
        {/* WebP with no fallback is safe here: this is a Chromium extension's
            landing page, and Chrome has supported WebP since 2010. It costs
            144 KB instead of the 2.7 MB PNG it replaces. */}
        <img
          className="shot"
          src="/images/preview.webp"
          width={1600}
          height={1000}
          loading="lazy"
          decoding="async"
          alt="The WindoM new tab: clock and greeting centred, weather top left, and a sidebar holding todos and upcoming calendar events."
        />
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="section" aria-labelledby="features-heading">
        <div className="wrap">
          <span className="eyebrow">Features</span>
          <h2 id="features-heading">
            Everything you need, <span className="gradient-text">nothing you don&rsquo;t</span>
          </h2>
          <ul className="feature-grid">
            {FEATURES.map((f) => (
              <li className="panel feature" key={f.title}>
                <span className="feature-icon" aria-hidden="true">
                  {f.icon}
                </span>
                <h3>
                  {f.title}
                  {f.badge && <span className="badge feature-badge">{f.badge}</span>}
                </h3>
                <p className="muted">{f.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Install ──────────────────────────────────────────────── */}
      <section className="section" aria-labelledby="install-heading">
        <div className="wrap">
          <span className="eyebrow">Install</span>
          <h2 id="install-heading">
            Your new tab in <span className="gradient-text">seconds</span>
          </h2>
          <ol className="steps">
            <li className="panel">
              <h3>1 · Add to Chrome</h3>
              <p className="muted">Install from the Chrome Web Store. No account, no sign-up.</p>
            </li>
            <li className="panel">
              <h3>2 · Open a new tab</h3>
              <p className="muted">That is it. The dashboard is already there.</p>
            </li>
            <li className="panel">
              <h3>3 · Make it yours</h3>
              <p className="muted">
                Open settings and turn on only what you want. Everything is optional.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <Updates />

      {/* ── Trust ────────────────────────────────────────────────── */}
      <section className="section" aria-labelledby="trust-heading">
        <div className="wrap">
          <h2 id="trust-heading">
            No tracking. <span className="gradient-text">Ever.</span>
          </h2>
          <p className="lede">
            WindoM does not track you. There is no analytics, no telemetry and no advertising.
            Your data stays in your browser unless you explicitly connect an account.
          </p>
          <ul className="pill-row">
            {['Open Source', 'MIT License', 'No Telemetry', 'No Ads', 'Self-hostable', 'Account Optional'].map(
              (p) => (
                <li className="badge" key={p}>
                  {p}
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="section" aria-labelledby="faq-heading">
        <div className="wrap wrap-prose">
          <span className="eyebrow">FAQ</span>
          <h2 id="faq-heading">Questions</h2>
          {FAQ.map((item) => (
            <details className="panel faq" key={item.q}>
              <summary>{item.q}</summary>
              <p className="muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Open source ──────────────────────────────────────────── */}
      <section className="section" aria-labelledby="oss-heading">
        <div className="wrap">
          <h2 id="oss-heading">
            Built in the <span className="gradient-text">open</span>
          </h2>
          <p className="lede">
            Every line is public, MIT licensed, and built solo. Issues and pull requests are
            welcome.
          </p>
          <div className="btn-row">
            <a className="btn btn-secondary" href={GITHUB_URL}>
              View source
            </a>
            <a className="btn btn-secondary" href={PROJECT_PAGE}>
              About this project
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
