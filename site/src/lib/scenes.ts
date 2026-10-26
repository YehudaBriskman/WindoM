import { MOTION } from './choreography';

/**
 * The page, as a sequence of scenes.
 *
 * This is the whole description. Each entry says how much scroll the scene
 * occupies, where the actor sits while it is there, how it arrives, what it
 * shows and how its surface looks. Adding a scene is an entry here plus a
 * `<Scene>` in the page's markup to say where in the document it falls -
 * nothing in the engine needs to know how many there are or what they contain.
 *
 * It follows the same idea as `routes.tsx`: one table describing the thing,
 * and everything else reading it. Six lists describing thirteen pages is what
 * that replaced, and eight hand-written CSS rules describing eight panes is
 * what the pane table replaced after two of them silently overlapped.
 */

export type MotionName = keyof typeof MOTION;

export interface SceneSurface {
  radius: string;
  border: string;
}

/**
 * Something inside the actor that animates on this scene's own progress.
 *
 * The keyframes live in the stylesheet, where they are design. Which timeline
 * drives them and over what range is declared here, so the engine writes the
 * wiring and a scene's timeline name is never spelled out in CSS. It was
 * once, and renaming the scenes took every parallax layer to zero opacity
 * with no error - the animation stopped resolving and its fill applied the
 * end keyframe.
 */
export interface ScenePart {
  /** Matched inside the actor. */
  selector: string;
  /** A keyframes name defined in the stylesheet. */
  animation: string;
  /** Defaults to the scene's whole contained travel. */
  range?: string;
}

export interface Scene {
  id: string;
  /** How much scroll this scene occupies. Absent means its content decides. */
  length?: string;
  /**
   * The actor fills the viewport here, and the section is only a scroll
   * length. Otherwise it lands on the section's box, or on the box marked
   * inside it for a section that also holds copy.
   */
  full?: boolean;
  /** How the actor travels *into* this scene. The first scene has no arrival. */
  motion?: MotionName;
  /** Which of the actor's contents is shown here. */
  content: string;
  /** The actor's edges while it is here. */
  surface: SceneSurface;
  /** Parts of the actor that animate while this scene is on screen. */
  parts?: ScenePart[];
}

const CARD: SceneSurface = { radius: 'var(--r-lg)', border: 'var(--border-strong)' };
const EDGELESS: SceneSurface = { radius: '0px', border: 'transparent' };

export const SCENES: Scene[] = [
  {
    id: 'hero',
    content: 'live',
    surface: CARD,
  },
  {
    id: 'day',
    length: '700vh',
    full: true,
    // Becoming the whole screen should read as arriving, not as being thrown.
    motion: 'rise',
    content: 'live',
    surface: EDGELESS,
    /* The depth parallax: each layer recedes at its own rate, and that
       difference is the depth. `contain` on a scene taller than the viewport
       spans exactly its own scroll travel, so this begins and ends with the
       day rather than with the length of the document. */
    parts: [
      { selector: '.stage-layer-back', animation: 'layer-back' },
      { selector: '.stage-layer-mid', animation: 'layer-mid' },
      { selector: '.stage-layer-front', animation: 'layer-front' },
    ],
  },
  {
    id: 'panel',
    length: '160vh',
    // Leaving the screen it recedes, turns and settles - the one place in the
    // journey where the actor is handed from one thing to another, so the
    // motion is allowed to be the most deliberate.
    motion: 'turn',
    content: 'sidebar',
    surface: CARD,
  },
];

/** The scene a given id belongs to, and where it falls in the order. */
export function sceneIndex(id: string): number {
  return SCENES.findIndex((scene) => scene.id === id);
}

/** Every content an actor must be able to show, in the order first used. */
export function contentsUsed(): string[] {
  const seen: string[] = [];
  for (const scene of SCENES) if (!seen.includes(scene.content)) seen.push(scene.content);
  return seen;
}

/** The DOM id a scene's section is given. Computed once; read in four places. */
export function sceneElementId(id: string): string {
  return `scene-${id}`;
}

/** The timeline a scene publishes, and that the leg arriving there is driven by. */
export function sceneTimeline(id: string): string {
  return `--scene-${id}`;
}
