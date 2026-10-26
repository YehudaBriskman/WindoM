import { Stage } from './Stage';
import { useTilt } from '../hooks/useTilt';
import { STORE_URL } from '../lib/site';
import { DAY } from '../lib/day';
import type { DayCycle } from '../hooks/useDayCycle';

interface HeroProps {
  cycle: DayCycle;
  animated: boolean;
}

/** The specification strip. Short enough to read as a row, not a list. */
const CAPABILITIES = [
  { glyph: '◴', label: 'Clock' },
  { glyph: '◌', label: 'Weather' },
  { glyph: '◷', label: 'Calendar' },
  { glyph: '♪', label: 'Spotify' },
  { glyph: '▦', label: 'Markets' },
];

/**
 * What someone hesitates over before letting an extension own their new tab.
 * Each is checkable rather than a claim: the licence is MIT, the privacy policy
 * lists what is stored, and most of the product works signed out.
 */
const FACTS = [
  { stat: 'MIT', title: 'Open source', body: 'Every line on GitHub' },
  { stat: 'Zero', title: 'Tracking', body: 'No analytics, no ads' },
  { stat: 'Free', title: 'Always', body: 'No account required' },
];

/**
 * The front door.
 *
 * The product bleeds off the right edge rather than sitting in a card, lit from
 * behind by the same hour it is showing - the glow takes its colour from the
 * active stage's own tint, so the page is lit by the time of day the preview
 * depicts rather than by a fixed accent.
 *
 * The preview is the real `Stage`, scaled. It cannot go stale, which matters
 * while every screenshot the site owns predates the glass rebuild.
 */
export function Hero({ cycle, animated }: HeroProps) {
  const tint = DAY[cycle.stage].tint;
  const tiltRef = useTilt<HTMLDivElement>();

  return (
    <section className="hero" aria-labelledby="hero-heading">
      {/* The light source. Its colour is the stage's own, so the hero is lit by
          the hour the preview is showing. */}
      <div className="hero-glow" style={{ background: tint }} aria-hidden="true" />

      <div className="hero-inner">
        <div className="hero-copy">
          <span className="eyebrow">Chrome extension</span>

          <h1 id="hero-heading">
            <span className="hero-line-1">A new tab</span>
            <span className="hero-line-2 gradient-text">worth opening.</span>
          </h1>

          <p className="lede">
            Your calendar, the weather and what you meant to do today - waiting on the tab you
            already open fifty times a day, on a wallpaper that moves with the hour.
          </p>

          <div className="btn-row">
            <a className="btn btn-primary" href={STORE_URL}>
              Add to Chrome
            </a>
            <a className="btn btn-secondary" href="/guide.html">
              See what it does
            </a>
          </div>

          {/* A specification strip rather than loose tags: bracketed, on one
              line, read as a row of capabilities. */}
          <ul className="hero-spec" aria-label="What it shows">
            {CAPABILITIES.map((c) => (
              <li key={c.label}>
                <span className="hero-spec-glyph" aria-hidden="true">
                  {c.glyph}
                </span>
                {c.label}
              </li>
            ))}
          </ul>
        </div>

        {/*
          Its own stacking and transform context, so the scaled Stage cannot
          share a 3D space with the pinned Stage further down - they are the
          same component.

          aria-hidden because it is a picture of the product: every claim it
          makes is also made in the copy beside it.
        */}
        <div className="hero-stage">
          <div className="hero-preview" ref={tiltRef} aria-hidden="true">
            <div className="hero-preview-frame">
              <Stage cycle={cycle} animated={animated} />
            </div>
            <span className="hero-preview-sheen" aria-hidden="true" />
          </div>

          {/* A row of three, sitting below the product and lapping over its
              bottom edge - the arrangement in the reference, where the cards
              read as floating in front of the image rather than captioning it. */}
          <ul className="hero-facts" aria-label="Key facts">
            {FACTS.map((f) => (
              <li key={f.title}>
                <span className="hero-fact-stat">{f.stat}</span>
                <strong>{f.title}</strong>
                <span className="hero-fact-body">{f.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <a className="hero-cue" href="#day-stage" aria-label="Skip to the demonstration">
        <span className="hero-cue-rail" aria-hidden="true" />
      </a>
    </section>
  );
}
