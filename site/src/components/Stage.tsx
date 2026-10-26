import { STAGES, DAY, type Pane } from '../lib/day';
import { DOCK, QUOTE, panesInLayer, type PaneBody, type PaneSpec } from '../lib/panes';
import type { DayCycle } from '../hooks/useDayCycle';
import { useFocusDemo } from '../hooks/useFocusDemo';

interface StageProps {
  cycle: DayCycle;
  animated: boolean;
  /**
   * Whether the focus timer in this instance can actually be operated.
   *
   * The stage is rendered twice - scaled into the hero and pinned full-bleed -
   * and both copies are `aria-hidden` because they are the same decorative
   * picture of the product. A control inside a hidden subtree is reachable by
   * neither keyboard nor screen reader, so exactly one instance may own the
   * real button.
   */
  interactive?: boolean;
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
 * also made in text. The narrative copy is not hidden: it is real content, and
 * neither is the focus control where this instance owns it.
 */
export function Stage({ cycle, animated, interactive = false }: StageProps) {
  const active = DAY[cycle.stage];
  const focus = useFocusDemo();

  /**
   * Focus takes the whole screen, so it is not a pane beside the others - it
   * replaces the clock, exactly as it does in the extension.
   *
   * The scroll story engages it on its own at the hour it is arguing for. The
   * interactive copy does not: there, the visitor drives it, and a card that
   * arrives already dimmed would hide every widget it is meant to be showing
   * off and leave a "try focus mode" prompt beside an already-focused tab.
   */
  const focused = (!interactive && active.spotlight.includes('focus')) || focus.engaged;
  const lit = (p: Pane) => (active.spotlight.includes(p) ? ' is-lit' : ' is-dim');

  return (
    <div className="stage-pin" data-focus={focus.phase}>
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
          {panesInLayer('back').map((pane) => (
            <PaneBox key={pane.id} pane={pane} state={lit(pane.id)} />
          ))}
        </div>

        {/* ── Mid layer: the things you act on ── */}
        <div className="stage-layer stage-layer-mid" aria-hidden="true">
          {panesInLayer('mid').map((pane) => (
            <PaneBox key={pane.id} pane={pane} state={lit(pane.id)} />
          ))}
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
                <span className="focus-time">{focus.remaining || '25:00'}</span>
              </div>
            </div>

            {interactive && <FocusControl focus={focus} />}

            {/* The only place this copy exists, so it stays readable. */}
            <div className="stage-story" key={cycle.stage}>
              <h2 className="story-headline">{active.headline}</h2>
              <p className="story-body">{active.body}</p>
            </div>
          </div>
        </div>

        {/* ── The corners. A real tab always has these two, and their absence
               was most of what made the miniature read as a poster. ── */}
        <span className="stage-corner stage-corner-settings" aria-hidden="true">
          <GearGlyph />
        </span>
        <span className="stage-corner stage-corner-sidebar" aria-hidden="true">
          <PanelGlyph />
        </span>

        <p className={`stage-quote${focused ? ' is-away' : ''}`} aria-hidden="true">
          {QUOTE.text}
          <span className="stage-quote-author">{QUOTE.author}</span>
        </p>
      </div>

      {/* Nothing else signals that the pinned stage has a page beneath it. */}
      <div className="scroll-cue" aria-hidden="true">
        <span className="scroll-cue-rail" />
        Scroll through the day
      </div>
    </div>
  );
}

/**
 * The focus timer's controls.
 *
 * Outside every `aria-hidden` subtree on purpose: it is the one part of the
 * miniature that is genuinely operable, so it has to be reachable by keyboard
 * and announced. The durations are the extension's own presets.
 */
function FocusControl({ focus }: { focus: ReturnType<typeof useFocusDemo> }) {
  if (focus.engaged) {
    return (
      <div className="stage-focus-controls">
        <button type="button" className="stage-focus-stop" onClick={focus.stop}>
          Stop Focus
        </button>
      </div>
    );
  }

  return (
    <div className="stage-focus-controls">
      <span className="stage-focus-hint" id="stage-focus-hint">
        Try focus mode
      </span>
      <span className="stage-focus-presets">
        {[25, 60].map((minutes) => (
          <button
            key={minutes}
            type="button"
            className="stage-focus-preset"
            onClick={() => focus.start(minutes)}
            aria-describedby="stage-focus-hint"
          >
            {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
          </button>
        ))}
      </span>
    </div>
  );
}

function PaneBox({ pane, state }: { pane: PaneSpec; state: string }) {
  return (
    <div
      className={`glass-pane pane-${pane.id}${state}`}
      style={{ '--lift': `${pane.lift}rem` } as React.CSSProperties}
    >
      <span className="pane-label">{pane.label}</span>
      <PaneContents body={pane.body} />
    </div>
  );
}

function PaneContents({ body }: { body: PaneBody }) {
  if (body.kind === 'figure') {
    return (
      <>
        <span className={`pane-figure${body.small ? ' pane-figure-sm' : ''}`}>{body.figure}</span>
        {body.lines.map((line, i) => (
          <span key={line} className={`pane-sub${i > 0 ? ' pane-sub-quiet' : ''}`}>
            {line}
          </span>
        ))}
      </>
    );
  }

  if (body.kind === 'list') {
    return (
      <ul className="pane-list">
        {body.items.map((item) => (
          <li key={item.text} className={item.done ? 'is-done' : undefined}>
            {item.text}
          </li>
        ))}
      </ul>
    );
  }

  if (body.kind === 'rows') {
    return (
      <>
        {body.rows.map((row) => (
          <span className="pane-row" key={row.name}>
            <span className="pane-row-name">{row.name}</span>
            <span className="pane-row-value">{row.value}</span>
            {row.delta && (
              <span className={`pane-row-delta${row.up ? ' is-up' : ''}`}>{row.delta}</span>
            )}
          </span>
        ))}
      </>
    );
  }

  return (
    <>
      <span className="pane-sub pane-strong">{body.title}</span>
      <span className="pane-sub pane-sub-quiet">{body.artist}</span>
      <span className="pane-bar" aria-hidden="true">
        <span className="pane-bar-fill" style={{ width: `${body.progress}%` }} />
      </span>
    </>
  );
}

function GearGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M8 1.6v1.6M8 12.8v1.6M14.4 8h-1.6M3.2 8H1.6M12.5 3.5l-1.1 1.1M4.6 11.4l-1.1 1.1M12.5 12.5l-1.1-1.1M4.6 4.6L3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PanelGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.6" y="2.8" width="12.8" height="10.4" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <line x1="10" y1="2.8" x2="10" y2="13.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
