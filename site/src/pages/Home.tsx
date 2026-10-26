import { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Updates } from '../components/Updates';
import { Choreography, Scene, SceneTarget } from '../components/Choreography';
import { sceneElementId } from '../lib/scenes';
import { ProductCard, CARD } from '../components/ProductCard';
import { Hero } from '../components/Hero';
import { Beat } from '../components/Beat';
import { Wallpapers } from '../components/Wallpapers';
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
    a: 'No. The clock, backgrounds, weather, todos, quick links, quotes, search and focus mode all work with no account at all. An account is only needed for Google Calendar and Spotify, because those have to authenticate with their own providers.',
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

  /**
   * Hide the navigation while the day-stage owns the screen.
   *
   * The stage is a full-viewport animation; a bar across the top of it is the
   * one piece of chrome that cannot be justified there. A class on `document.body`
   * rather than a store or context because `SiteNav` is rendered by `Layout`,
   * above this component in the tree - and it mirrors how the extension itself
   * drives focus mode.
   */
  useEffect(() => {
    const stage = document.getElementById(sceneElementId('day'));
    if (!stage) return;

    // Fires when the stage covers the top of the viewport, which is exactly
    // when the pin takes over - no scroll listener and no measurement of our
    // own to keep in step with the CSS.
    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle('stage-owns-view', entry?.isIntersecting === true);
      },
      // A sliver at the very top of the viewport: the stage intersects it from
      // the moment it pins until the moment it releases.
      { rootMargin: '0px 0px -99% 0px', threshold: 0 },
    );
    observer.observe(stage);

    /**
     * And once the card has left the day behind.
     *
     * The depth parallax is driven by the day section's timeline with a
     * forward fill, so past that section it holds its last keyframe - which
     * is every layer at zero opacity. That is correct while the stage is
     * exiting and wrong once the card is a card again somewhere else, and it
     * fails invisibly: the card simply arrives empty. This says when the day
     * is over so the layers can be restored.
     */
    const panel = document.getElementById(sceneElementId('panel'));
    const afterDay = panel
      ? new IntersectionObserver(
          ([entry]) => {
            document.body.classList.toggle('past-day-stage', entry?.isIntersecting === true);
          },
          { rootMargin: '0px 0px -40% 0px', threshold: 0 },
        )
      : null;
    if (panel && afterDay) afterDay.observe(panel);

    return () => {
      observer.disconnect();
      afterDay?.disconnect();
      document.body.classList.remove('stage-owns-view', 'past-day-stage');
    };
  }, []);
  const active = DAY[cycle.stage];

  return (
    <Layout variant="home">
      <GlassFilters />
      <Ambient />
      <MotionToggle paused={paused} onToggle={toggleMotion} />

      {/**
        * One card for the whole page.
        *
        * It rests in the hero's slot, travels to fill the window as the day
        * stage arrives, and moves aside again for the panel section. Each of
        * those is a slot; the card is rendered once, here.
        */}
      <Choreography
        actor={<ProductCard cycle={cycle} animated={animated} />}
        design={CARD}
        enabled={animated}
      >
        <Hero cycle={cycle} />

        {/* ── The stage: the card fills the window while the day passes ── */}
        <Scene id="day" className="day-stage" />

      {/* ── What the stage was ─────────────────────────────────────── */}
      <section className="section intro">
        <div className="wrap">
          <p className="eyebrow reveal">That was not a screenshot</p>
          <h2 className="reveal">
            It was a <span className="gradient-text">live tab</span>, showing your time.
          </h2>
          <p className="lede reveal">
            {SITE.name} replaces every new tab with this — your clock, your weather, your day,
            on a background that is actually worth looking at. {active.scene} is one of four it
            ships with, and the lantern-lit house is the one waiting the moment you install it.
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

          <Wallpapers />
        </div>
      </section>

      {/**
        * The card's third destination.
        *
        * It moves aside and shrinks, and the copy takes the space it leaves -
        * the same tab, now being talked about rather than demonstrated. This
        * section is the proof that the engine generalises: a slot and a
        * keyframe block, with nothing in the choreography needing to know it
        * exists.
        */}
      <Scene id="panel" className="panel-stage">
        <SceneTarget className="panel-scene-target" />
        <div className="panel-copy">
          <span className="eyebrow reveal">One panel</span>
          <h2 className="reveal">
            Today and <span className="gradient-text">tomorrow</span>, in the same place
          </h2>
          <p className="lede reveal">
            Tasks you add in a line, and the calendar you already keep, stacked in one
            sidebar. It opens from the tab you were going to open anyway.
          </p>
        </div>
      </Scene>

      <Beat
        side="left"
        eyebrow="Yours"
        title={
          <>
            Every part of it is <span className="gradient-text">optional</span>
          </>
        }
        body="Clock style, font weight, date format, which widgets appear at all. Turn off everything you do not want and the tab is just a photograph and the time."
        image="/images/shot-settings.webp"
        alt="The WindoM settings panel open on the Clock section, showing format, style, colour, size and date options"
        caption="Settings, open on the clock."
      />

      {/* ── Everything else ──────────────────────────────────────── */}
      {/* The day covered what you reach for. This is the rest, stated plainly
          and compactly rather than dressed up as fifteen identical cards. */}
      <section className="section" aria-labelledby="rest-heading">
        <div className="wrap">
          <span className="eyebrow reveal">Also in there</span>
          <h2 id="rest-heading" className="reveal">
            And the <span className="gradient-text">quiet parts</span>
          </h2>
          <ul className="index-list reveal">
            {FEATURES.map((f) => (
              <li key={f.title}>
                <span className="index-name">{f.title}</span>
                <span className="index-detail">{f.detail}</span>
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
      </Choreography>
    </Layout>
  );
}
