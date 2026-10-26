import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useChoreographyEngine, timelineScope, type SceneBox } from '../hooks/useChoreographyEngine';
import { SCENES, sceneElementId, sceneIndex, sceneTimeline } from '../lib/scenes';

/**
 * The stage on which the page's actor travels.
 *
 * A section claims the actor by rendering a `Scene` with its id; the scene
 * table in `lib/scenes.ts` says what happens there. Everything else - where
 * the actor is, how it gets there, what it is holding and how its edges look -
 * is computed by the engine from that table and the measured layout.
 *
 * The division of labour, which is the whole design:
 *
 * - **The table describes.** One ordered list of scenes, the way `routes.tsx`
 *   is one ordered list of pages.
 * - **The engine calculates.** It measures, interpolates, and writes the
 *   journey as a stylesheet, on mount and on resize. See
 *   `useChoreographyEngine`.
 * - **The browser animates.** Scroll-driven CSS on the compositor, with no
 *   scroll listener anywhere.
 *
 * `timeline-scope` is what makes it possible for a `position: fixed` actor to
 * be driven by sections it is not inside - the one piece of the platform this
 * rests on, verified before any of it was written.
 */

interface ChoreographyValue {
  register: (box: SceneBox) => void;
  /** The actor, rendered by the scene it rests in so no measurement is needed. */
  actor: ReactNode;
  restingScene: string;
}

const Ctx = createContext<ChoreographyValue | null>(null);

interface ChoreographyProps {
  children: ReactNode;
  /** Rendered once, by the opening scene. */
  actor: ReactNode;
  /** The actor's intrinsic size; every scene is reached by scaling this box. */
  design: { w: number; h: number };
  actorClass?: string;
  /**
   * Travel is motion, and the site's two motion switches turn it off. The
   * actor then rests in its opening scene and every section shows its own
   * content in place - a complete page, not a disabled one.
   */
  enabled: boolean;
}

export function Choreography({
  children,
  actor,
  design,
  actorClass = 'product-card',
  enabled,
}: ChoreographyProps) {
  const boxes = useRef(new Map<string, SceneBox>());
  const [known, setKnown] = useState<SceneBox[]>([]);

  const register = (box: SceneBox) => {
    boxes.current.set(box.scene.id, box);
    const ordered = SCENES.map((s) => boxes.current.get(s.id)).filter(
      (b): b is SceneBox => Boolean(b),
    );
    if (ordered.length !== known.length) setKnown(ordered);
  };

  useChoreographyEngine(known, { design, actorClass, enabled });

  return (
    <Ctx.Provider value={{ register, actor, restingScene: SCENES[0]?.id ?? '' }}>
      <div
        className="choreography"
        style={{ timelineScope: timelineScope() } as React.CSSProperties}
        data-travelling={enabled ? 'true' : 'false'}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

interface SceneProps {
  id: string;
  className?: string;
  children?: ReactNode;
}

/**
 * A section that hosts the actor.
 *
 * It publishes a `view-timeline` named after itself, which is what the leg
 * arriving here is driven by, and its box - or the box marked inside it - is
 * what the actor is measured against.
 */
export function Scene({ id, className, children }: SceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ctx = useContext(Ctx);
  const scene = SCENES[sceneIndex(id)];

  useEffect(() => {
    const section = ref.current;
    if (!section || !scene) return;
    // A section taller than the actor says which part of itself it lands on.
    const target = section.querySelector<HTMLElement>('[data-scene-target]') ?? section;
    ctx?.register({ scene, section, target });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!scene) {
    throw new Error(`Scene "${id}" is not in the scene table`);
  }

  return (
    <div
      ref={ref}
      id={sceneElementId(id)}
      className={`scene scene-${id}${scene.full ? ' is-full' : ''}${className ? ` ${className}` : ''}`}
      style={
        {
          viewTimelineName: sceneTimeline(id),
          /* As a custom property rather than `min-height` directly: an inline
             length cannot be overridden by a media query, and reduced motion
             needs to collapse a seven-screen scene to one. */
          ...(scene.length ? { '--scene-length': scene.length } : {}),
        } as React.CSSProperties
      }
    >
      {/* The actor lives in the DOM inside the scene it rests in, so the
          prerendered page and a visitor without JavaScript both get it in the
          right place with no measurement involved. Travelling makes it
          `position: fixed`, which leaves the flow without leaving the tree -
          the reason no ancestor of a scene may carry a transform, a filter or
          a perspective. */}
      {ctx && id === ctx.restingScene ? ctx.actor : null}
      {children}
    </div>
  );
}

/**
 * Marks where inside a section the actor comes to rest.
 *
 * A section that also holds copy needs to say which part of itself the actor
 * occupies. The element draws nothing; it is a measured box.
 */
export function SceneTarget({ className }: { className?: string }) {
  return <div data-scene-target className={`scene-target${className ? ` ${className}` : ''}`} />;
}
