import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSlotGeometry, type Slot } from '../hooks/useSlotGeometry';
import { slotElementId } from '../lib/slots';

/**
 * One card, moved between the positions the page asks for.
 *
 * The site used to render the product tab twice - scaled into the hero and
 * pinned full-bleed as the scroll story - from the same component with the
 * same state. Two mounts of one idea, kept in step by hand, with the hero's
 * copy hidden from assistive technology so the duplicate markup was legal.
 *
 * There is one now, and it travels. A section claims the card by rendering a
 * `CardSlot`; the card moves to that slot as the section arrives.
 *
 * How it works, and why it is shaped this way:
 *
 * - **CSS does the animating.** Each slot publishes a named `view-timeline`
 *   and this element carries `timeline-scope`, so the card - which is
 *   `position: fixed` and a descendant of none of them - can be driven by a
 *   section it is not inside. That was verified before it was built.
 * - **JavaScript only measures.** Slot positions come from a grid that
 *   resolves differently at every width, so they cannot be written in CSS;
 *   but interpolating them in JavaScript would mean running code on every
 *   frame. The measurement is published as custom properties and the
 *   keyframes use those as endpoints, which keeps the animation off the main
 *   thread. See `useSlotGeometry`.
 * - **Adding a destination is a slot and a keyframe block.** Nothing here
 *   needs to know how many there are.
 *
 * Until the first measurement the card has no coordinates to animate between,
 * so it renders in place inside the first slot as ordinary flow content. That
 * is also the state a visitor without JavaScript keeps: a correct, static
 * card that simply does not travel.
 */

interface ChoreographyValue {
  register: (slot: Slot) => void;
  /** Rendered by the first slot, so it is correct before any measurement. */
  card: ReactNode;
  restingSlot: string;
}

const Choreography = createContext<ChoreographyValue | null>(null);

export function useChoreography(): ChoreographyValue | null {
  return useContext(Choreography);
}

interface CardChoreographyProps {
  children: ReactNode;
  /** The card itself. Rendered once, by this component. */
  card: ReactNode;
  /**
   * Slot ids in the order the card visits them. The first is where it rests
   * before anything has scrolled, and where it stays if travel is suppressed.
   */
  order: string[];
  /**
   * Travel is motion, and the site's two motion switches turn it off. The
   * card then stays in its first slot and each section renders its own
   * content in place - a complete page, not a disabled one.
   */
  enabled: boolean;
}

export function CardChoreography({ children, card, order, enabled }: CardChoreographyProps) {
  const scope = useRef<HTMLDivElement>(null);
  const slots = useRef(new Map<string, Slot>());
  const [known, setKnown] = useState<Slot[]>([]);

  const register = (slot: Slot) => {
    slots.current.set(slot.id, slot);
    // Ordered by the declared sequence rather than by mount order, so the
    // keyframe legs and the measurement agree about which slot is which.
    const ordered = order.map((id) => slots.current.get(id)).filter((s): s is Slot => Boolean(s));
    if (ordered.length !== known.length) setKnown(ordered);
  };

  useSlotGeometry(scope, enabled ? known : []);

  // `timeline-scope` must name every timeline it publishes, and the list is
  // only knowable from the declared order - so it is written here rather than
  // in the stylesheet, which cannot know what a page contains.
  const scopeNames = order.map((id) => `--slot-${id}`).join(', ');

  return (
    <Choreography.Provider value={{ register, card, restingSlot: order[0] ?? '' }}>
      <div
        className="card-choreography"
        ref={scope}
        style={{ timelineScope: scopeNames } as React.CSSProperties}
        data-travelling={enabled ? 'true' : 'false'}
      >
        {children}
      </div>
    </Choreography.Provider>
  );
}

interface CardSlotProps {
  id: string;
  /** The card fills the viewport here, and the slot is only a scroll length. */
  full?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * A position the card can occupy.
 *
 * The element publishes a `view-timeline` named after the slot, which is what
 * the card's keyframes for that leg are driven by, and its box is what the
 * card is measured against.
 */
export function CardSlot({ id, full, className, children }: CardSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ctx = useChoreography();

  useEffect(() => {
    // A section may mark where inside itself the card should land. Without
    // one the section's own box is the target, which is what a slot the
    // height of the card wants.
    const target = ref.current?.querySelector<HTMLElement>('[data-card-target]') ?? ref.current;
    ctx?.register({ id, element: ref.current, target, full });
    // Registration is by id; re-running on every context change would thrash.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, full]);

  return (
    <div
      ref={ref}
      id={slotElementId(id)}
      className={`card-slot${full ? ' is-full' : ''}${className ? ` ${className}` : ''}`}
      style={{ viewTimelineName: `--slot-${id}` } as React.CSSProperties}
    >
      {/* The card lives in the DOM inside the slot it rests in, so the
          prerendered page and a visitor without JavaScript both get a card
          in the right place with no measurement involved. Travelling makes
          it `position: fixed`, which leaves the flow without leaving the
          tree - the reason no ancestor of this slot may carry a transform,
          a filter or a perspective. */}
      {ctx && id === ctx.restingSlot ? ctx.card : null}
      {children}
    </div>
  );
}

/**
 * Marks where inside a section the card should come to rest.
 *
 * A section taller than the card - one that holds it for a while, or sets
 * copy beside it - needs to say which part of itself the card occupies. The
 * element draws nothing; it is a measured box.
 */
export function CardTarget({ className }: { className?: string }) {
  return <div data-card-target className={`card-target${className ? ` ${className}` : ''}`} />;
}
