import type { ReactNode } from 'react';
import { STAGES, DAY, DOCK, type Pane } from '../lib/day';
import type { DayCycle } from '../hooks/useDayCycle';

interface StageProps {
  cycle: DayCycle;
  animated: boolean;
}

/**
 * The pinned tab the whole page is built on.
 *
 * It is a working dashboard, not a picture of one, and it carries the argument
 * rather than handing off to a feature grid: as the day advances, different
 * widgets light up and a line of copy arrives beside them explaining what that
 * part of the product is for. The features are the story, told at the hour you
 * would actually reach for each one.
 *
 * The chrome is `aria-hidden` - it is atmosphere, and every claim it makes is
 * also made in text. The narrative copy is not hidden: it is real content.
 */
export function Stage({ cycle, animated }: StageProps) {
  const active = DAY[cycle.stage];
  const lit = (p: Pane) => (active.spotlight.includes(p) ? ' is-lit' : ' is-dim');
  // Focus mode is the one state that takes the whole screen, so it does not sit
  // beside the clock - it replaces it, exactly as it does in the extension.
  const focused = active.spotlight.includes('focus');

  return (
    <div className="stage-pin">
      {/* All four wallpapers stay mounted and crossfade. Swapping `src`
          mid-scroll leaves a blank frame; at 524 KB total, holding them is
          cheaper than the flicker. */}
      <div className="stage-wallpapers" aria-hidden="true">
        {STAGES.map((s) => (
          <img
            key={s}
            className={`stage-wallpaper${s === cycle.stage ? ' is-active' : ''}`}
            src={DAY[s].wallpaper}
            alt=""
            loading={s === cycle.stage ? 'eager' : 'lazy'}
            decoding="async"
          />
        ))}
        <div className="stage-tint" style={{ background: active.tint }} />
        <div className="stage-scrim" />
      </div>

      <div className={`stage-scene${animated ? ' is-animated' : ''}`}>
        {/* ── Dock. A real feature, and what makes this read as an interface
               rather than a poster. ── */}
        <div className={`stage-dock${focused ? ' is-away' : ''}`} aria-hidden="true">
          <div className="dock-bar">
            {DOCK.map((d) => (
              <span className="dock-item" key={d.label}>
                <span className="dock-glyph">{d.glyph}</span>
                {d.label}
              </span>
            ))}
            <span className="dock-sep" />
            <span className="dock-search">Search the web…</span>
          </div>
        </div>

        {/* ── Back layer: ambient widgets ── */}
        <div className="stage-layer stage-layer-back" aria-hidden="true">
          <Pane className={`pane-weather${lit('weather')}`} label="Weather">
            <span className="pane-figure">18°</span>
            <span className="pane-sub">Clear · Tel Aviv</span>
          </Pane>

          <Pane className={`pane-finance${lit('finance')}`} label="Markets">
            <Row name="AAPL" value="241.80" delta="+1.2%" up />
            <Row name="BTC" value="98,412" delta="+3.4%" up />
            <Row name="NVDA" value="183.05" delta="−0.6%" />
          </Pane>
        </div>

        {/* ── Mid layer: the things you act on ── */}
        <div className="stage-layer stage-layer-mid" aria-hidden="true">
          <Pane className={`pane-todos${lit('todos')}`} label="Today">
            <ul className="pane-list">
              <li>Ship the release notes</li>
              <li>Review the open PR</li>
              <li className="is-done">Cut v1.4.1</li>
            </ul>
          </Pane>

          <Pane className={`pane-calendar${lit('calendar')}`} label="Up next">
            <span className="pane-figure pane-figure-sm">14:30</span>
            <span className="pane-sub">Design review</span>
            <span className="pane-sub pane-sub-quiet">17:00 · 1:1</span>
          </Pane>

          <Pane className={`pane-gmail${lit('gmail')}`} label="Inbox">
            <span className="pane-figure pane-figure-sm">4 unread</span>
            <span className="pane-sub">Fly.io · deploy succeeded</span>
          </Pane>

          <Pane className={`pane-spotify${lit('spotify')}`} label="Now playing">
            <span className="pane-sub pane-strong">Nightports</span>
            <span className="pane-sub pane-sub-quiet">Nikki Nair</span>
            <span className="pane-bar" aria-hidden="true">
              <span className="pane-bar-fill" />
            </span>
          </Pane>
        </div>

        {/* ── Focus mode: the scrim only. The readout lives in the front
               layer so it can take the clock's place rather than cover it. ── */}
        <div className={`stage-focus${focused ? ' is-lit' : ''}`} aria-hidden="true" />

        {/* ── Front layer: clock, greeting, and the narrative ── */}
        <div className="stage-layer stage-layer-front">
          <div className={`stage-headline${focused ? ' is-focus' : ''}`}>
            {/* Both readouts share one grid cell: the swap is a crossfade, with
                no reflow of the copy underneath. */}
            <div className="headline-swap" aria-hidden="true">
              <div className="headline-clock">
                <p className="stage-clock">{cycle.clock}</p>
                <p className="stage-greeting">{active.greeting}</p>
              </div>
              <div className="headline-focus">
                <span className="focus-label">Focus</span>
                <span className="focus-time">24:00</span>
              </div>
            </div>

            {/* The only place this copy exists, so it stays readable. */}
            <div className="stage-story" key={cycle.stage}>
              <h2 className="story-headline">{active.headline}</h2>
              <p className="story-body">{active.body}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nothing else signals that the pinned stage has a page beneath it. */}
      <div className="scroll-cue" aria-hidden="true">
        <span className="scroll-cue-rail" />
        Scroll through the day
      </div>
    </div>
  );
}

function Pane({
  className,
  label,
  children,
}: {
  className: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={`glass-pane ${className}`}>
      <span className="pane-label">{label}</span>
      {children}
    </div>
  );
}

function Row({
  name,
  value,
  delta,
  up,
}: {
  name: string;
  value: string;
  delta: string;
  up?: boolean;
}) {
  return (
    <span className="pane-row">
      <span className="pane-row-name">{name}</span>
      <span className="pane-row-value">{value}</span>
      <span className={`pane-row-delta${up ? ' is-up' : ''}`}>{delta}</span>
    </span>
  );
}
