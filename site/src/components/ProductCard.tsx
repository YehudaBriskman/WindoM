import { Stage } from './Stage';
import { CardShot } from './CardShot';
import { useTilt } from '../hooks/useTilt';
import { contentsUsed } from '../lib/scenes';
import type { DayCycle } from '../hooks/useDayCycle';

/** The design size the tab is drawn at. Every scene is reached by scaling it. */
export const CARD = { w: 1440, h: 900 };

interface ProductCardProps {
  cycle: DayCycle;
  animated: boolean;
}

/**
 * The actor: one shell that carries every content the page asks for.
 *
 * It used to exist twice - scaled into the hero and pinned full-bleed - from
 * the same component with the same state, kept in step by hand. There is one
 * now, and what it holds changes with the scene: the live tab while it is
 * being demonstrated, a screenshot once it is being discussed. The contents
 * are stacked and cross-faded by the engine on the scene timelines, so what
 * the actor shows cannot drift out of step with where it is.
 *
 * Only one live content, deliberately. A screenshot is an image and costs
 * nothing to keep mounted; a second running `Stage` would cost a second day
 * cycle, a second set of wallpapers and a second focus timer.
 *
 * The pointer lean is applied here as `transform` while the travel owns
 * `translate`, `scale` and `rotate` - independent properties that compose
 * rather than overwrite.
 */
export function ProductCard({ cycle, animated }: ProductCardProps) {
  const tilt = useTilt<HTMLDivElement>({ max: 6, reach: 360 });
  const contents = contentsUsed();

  return (
    <div
      className="product-card"
      ref={tilt}
      style={{ '--card-w': `${CARD.w}px`, '--card-h': `${CARD.h}px` } as React.CSSProperties}
    >
      <div className="product-card-surface">
        {contents.includes('live') && (
          <div className="product-card-content" data-content="live">
            <Stage cycle={cycle} animated={animated} interactive />
          </div>
        )}

        {contents.includes('sidebar') && (
          <div className="product-card-content" data-content="sidebar" aria-hidden="true">
            <CardShot
              src="/images/shot-sidebar.webp"
              alt="The WindoM sidebar showing today's tasks above a list of upcoming calendar events"
            />
          </div>
        )}
      </div>
    </div>
  );
}
