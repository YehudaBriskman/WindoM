import { Stage } from './Stage';
import { useTilt } from '../hooks/useTilt';
import type { DayCycle } from '../hooks/useDayCycle';

/** The design size the tab is drawn at. Every slot is reached by scaling it. */
export const CARD_W = 1440;
export const CARD_H = 900;

interface ProductCardProps {
  cycle: DayCycle;
  animated: boolean;
}

/**
 * The product tab, rendered once for the whole page.
 *
 * This used to exist twice - scaled into the hero and pinned full-bleed as
 * the scroll story - from the same component with the same state. Two mounts
 * of one idea, kept in step by hand, with the hero's copy hidden from
 * assistive technology so the duplicate markup was legal. There is one now,
 * and `CardChoreography` moves it between the positions the page asks for.
 *
 * It carries a fixed intrinsic size and is scaled to each slot, so there is
 * exactly one layout to reason about no matter how large it is being shown.
 * That also means the panes inside it never reflow as it travels: the card
 * grows, it does not relayout.
 *
 * The pointer lean is applied here as `transform`, while the travel uses the
 * separate `translate` and `scale` properties - so the two compose instead of
 * overwriting each other, and the card can lean toward the cursor while it is
 * a card and stop once it has become the screen.
 */
export function ProductCard({ cycle, animated }: ProductCardProps) {
  const tilt = useTilt<HTMLDivElement>({ max: 6, reach: 360 });

  return (
    <div
      className="product-card"
      ref={tilt}
      style={{ '--card-w': `${CARD_W}px`, '--card-h': `${CARD_H}px` } as React.CSSProperties}
    >
      <div className="product-card-surface">
        <div className="product-card-frame">
          <Stage cycle={cycle} animated={animated} interactive />
        </div>
      </div>
    </div>
  );
}
