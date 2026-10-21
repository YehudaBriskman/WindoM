import { STAGES, DAY } from '../lib/day';
import type { DayCycle } from '../hooks/useDayCycle';

interface StageProps {
  cycle: DayCycle;
  /** False when motion is reduced or the visitor paused it. */
  animated: boolean;
}

/**
 * The pinned dashboard the page is built on.
 *
 * All four wallpapers are rendered at once and crossfaded by opacity rather than
 * swapped, because swapping `src` on a 1920px image mid-scroll produces a visible
 * blank frame. They total 513 KB, so holding all four is cheaper than the flicker.
 *
 * Marked `aria-hidden`: this is atmosphere. Every claim it makes visually is also
 * made in the text beneath it, so a screen reader loses nothing by skipping it.
 */
export function Stage({ cycle, animated }: StageProps) {
  const active = DAY[cycle.stage];

  return (
    <div className="stage-pin" aria-hidden="true">
      {/* Wallpapers. The active one is opaque, the rest wait at zero. */}
      <div className="stage-wallpapers">
        {STAGES.map((s) => (
          <img
            key={s}
            className={`stage-wallpaper${s === cycle.stage ? ' is-active' : ''}`}
            src={DAY[s].wallpaper}
            alt=""
            // The first stage shown must not wait for lazy loading - it is the
            // first thing above the fold.
            loading={s === cycle.stage ? 'eager' : 'lazy'}
            decoding="async"
          />
        ))}
        {/* Light temperature wash, tinted per stage. */}
        <div className="stage-tint" style={{ background: active.tint }} />
        {/* Keeps the copy legible whatever the wallpaper is doing. */}
        <div className="stage-scrim" />
      </div>

      {/* The dashboard itself, in depth. Each layer takes a different translateZ
          so scrolling separates them rather than sliding them as one plane. */}
      <div className={`stage-scene${animated ? ' is-animated' : ''}`}>
        <div className="stage-layer stage-layer-back">
          <GlassPane className="pane-weather" label="Weather">
            <span className="pane-figure">18°</span>
            <span className="pane-sub">Clear</span>
          </GlassPane>
        </div>

        <div className="stage-layer stage-layer-mid">
          <GlassPane className="pane-todos" label="Today">
            <ul className="pane-list">
              <li>Ship the release notes</li>
              <li>Review the open PR</li>
              <li className="is-done">Cut v1.4.1</li>
            </ul>
          </GlassPane>

          <GlassPane className="pane-calendar" label="Up next">
            <span className="pane-figure pane-figure-sm">14:30</span>
            <span className="pane-sub">Design review</span>
          </GlassPane>
        </div>

        {/* Front layer: the clock and greeting, which are the real thing. */}
        <div className="stage-layer stage-layer-front">
          <div className="stage-headline">
            <p className="stage-clock">{cycle.clock}</p>
            <p className="stage-greeting">{active.greeting}</p>
            <p className="stage-caption">{active.caption}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GlassPaneProps {
  className: string;
  label: string;
  children: React.ReactNode;
}

/** A single glass widget, refracted by the extension's own filter. */
function GlassPane({ className, label, children }: GlassPaneProps) {
  return (
    <div className={`glass-pane ${className}`}>
      <span className="pane-label">{label}</span>
      {children}
    </div>
  );
}
