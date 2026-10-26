import { CardSlot } from './CardChoreography';
import { useTilt } from '../hooks/useTilt';
import { STORE_URL } from '../lib/site';
import { DAY } from '../lib/day';
import type { DayCycle } from '../hooks/useDayCycle';

interface HeroProps {
  cycle: DayCycle;
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
 * The product itself is no longer rendered here. The page owns one card and
 * moves it; the hero holds the slot the card rests in while it is here.
 */
export function Hero({ cycle }: HeroProps) {
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

        {/* Its own stacking and perspective context: the fact cards lean
            inside it, and the travelling card is positioned against the slot
            it holds. */}
        <div className="hero-stage">
          {/* The fact cards still lean as a group; the product itself is no
              longer inside this cluster. It is one card owned by the page,
              and this slot is the box it occupies while it is here. */}
          <CardSlot id="hero" className="hero-preview-slot" />

          <div className="hero-cluster" ref={tiltRef}>
            {/* A row of three, sitting below the product and lapping over its
                bottom edge, so the cards read as floating in front of the
                image rather than captioning it. */}
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
      </div>

      <a className="hero-cue" href="#slot-day" aria-label="Skip to the demonstration">
        <span className="hero-cue-rail" aria-hidden="true" />
      </a>
    </section>
  );
}
