import { Stage } from './Stage';
import { STORE_URL } from '../lib/site';
import type { DayCycle } from '../hooks/useDayCycle';

interface HeroProps {
  cycle: DayCycle;
  animated: boolean;
}

/** Short, concrete, and each one visible in the preview beside them. */
const CHIPS = ['Weather', 'Calendar', 'Todos', 'Spotify', 'Markets', 'Focus timer'];

/**
 * The front door.
 *
 * The page used to open directly into the pinned tab, so a visitor arrived
 * mid-animation with no headline, no sentence saying what this is, and nothing
 * to click - and the document had no `h1` at all. This is that missing first
 * screen: what it is, why, and how to get it.
 *
 * The preview beside the copy is the real `Stage`, scaled down, rather than a
 * screenshot. It cannot go stale - which matters when every screenshot the site
 * owns predates the glass rebuild - and it is the product demonstrating itself
 * at the visitor's actual time of day.
 */
export function Hero({ cycle, animated }: HeroProps) {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-inner">
        <div className="hero-copy">
          <span className="eyebrow">Chrome extension</span>

          <h1 id="hero-heading">
            Your new tab,
            <br />
            <span className="gradient-text">actually useful</span>
          </h1>

          <p className="lede">
            WindoM replaces the blank new tab with the things you were about to open anyway -
            your calendar, the weather, what you meant to do today - on a wallpaper that moves
            with the hour.
          </p>

          <div className="btn-row">
            <a className="btn btn-primary" href={STORE_URL}>
              Add to Chrome
            </a>
            <a className="btn btn-secondary" href="/guide.html">
              See what it does
            </a>
          </div>

          <ul className="hero-chips">
            {CHIPS.map((chip) => (
              <li className="badge" key={chip}>
                {chip}
              </li>
            ))}
          </ul>
        </div>

        {/*
          Its own stacking and transform context, so the scaled preview cannot
          bleed into the pinned stage below it - the two render the same
          component and would otherwise share a 3D space.

          aria-hidden because it is a picture of the product: every claim it
          makes is also made in the copy beside it, and reading a mock dashboard
          aloud would be noise.
        */}
        <div className="hero-preview" aria-hidden="true">
          <div className="hero-preview-frame">
            <Stage cycle={cycle} animated={animated} />
          </div>
        </div>
      </div>

      <a className="hero-cue" href="#day-stage" aria-label="Skip to the demonstration">
        <span className="hero-cue-rail" aria-hidden="true" />
      </a>
    </section>
  );
}
