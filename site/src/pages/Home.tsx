import { Layout } from '../components/Layout';
import { Updates } from '../components/Updates';
import { Stage } from '../components/Stage';
import { Ambient } from '../components/Ambient';
import { GlassFilters } from '../components/GlassFilters';
import { MotionToggle, useMotionPaused } from '../components/MotionToggle';
import { useDayCycle, usePrefersReducedMotion } from '../hooks/useDayCycle';
import { DAY } from '../lib/day';
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
  const reduced = usePrefersReducedMotion();
  const [paused, toggleMotion] = useMotionPaused();
  // The cycle only runs when it is both allowed and wanted. Otherwise the stage
  // holds the visitor's real time of day, which is a complete state rather than
  // a disabled one.
  const animated = !reduced && !paused;
  const cycle = useDayCycle(animated);
  const active = DAY[cycle.stage];

  return (
    <Layout variant="home">
      <GlassFilters />
      <Ambient />
      <MotionToggle paused={paused} onToggle={toggleMotion} />

      {/* ── The stage: a working new tab, pinned while the day passes ── */}
      <section className="day-stage" id="day-stage">
        <Stage cycle={cycle} animated={animated} />
      </section>

      {/* ── What the stage was ─────────────────────────────────────── */}
      <section className="section intro">
        <div className="wrap">
          <p className="eyebrow reveal">That was not a screenshot</p>
          <h2 className="reveal">
            It was a <span className="gradient-text">live tab</span>, showing your time.
          </h2>
          <p className="lede reveal">
            {SITE.name} replaces every new tab with this. {active.scene.toLowerCase()} is one of
            four backgrounds it ships with — and the one you just scrolled past is what you get
            the moment you install it.
          </p>
          <div className="btn-row reveal">
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
          <p className="muted hero-compat reveal">
            Works on Chrome, Arc, Brave, Edge and any Chromium-based browser.
          </p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="section" aria-labelledby="features-heading">
        <div className="wrap">
          <span className="eyebrow reveal">Features</span>
          <h2 id="features-heading" className="reveal">
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
          <span className="eyebrow reveal">Install</span>
          <h2 id="install-heading" className="reveal">
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
          <h2 id="trust-heading" className="reveal">
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
          <span className="eyebrow reveal">FAQ</span>
          <h2 id="faq-heading" className="reveal">Questions</h2>
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
          <h2 id="oss-heading" className="reveal">
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
