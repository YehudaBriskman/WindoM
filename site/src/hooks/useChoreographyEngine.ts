import { useEffect, useRef } from 'react';
import { MOTION, fadeKeyframes, legKeyframes, surfaceKeyframes, type Rect } from '../lib/choreography';
import { SCENES, sceneTimeline, type Scene } from '../lib/scenes';

/**
 * Measures the page and writes the actor's whole journey as a stylesheet.
 *
 * This is the part that calculates. On mount and on every resize it:
 *
 * 1. measures each scene's landing box,
 * 2. works out where the actor must be *in viewport coordinates* at the moment
 *    each leg finishes,
 * 3. asks the motion style for the waypoints of each leg and writes them as
 *    `@keyframes`,
 * 4. writes the content cross-fades and surface changes on the same timelines,
 * 5. wires the actor's `animation`, `animation-timeline` and `animation-range`
 *    lists to match,
 * 6. and hands the whole sheet to the browser.
 *
 * Nothing here runs while scrolling. The browser runs the animations against
 * scroll timelines on the compositor; this only decides what they are.
 *
 * ## The coordinate that is not obvious
 *
 * The actor is `position: fixed`, so its coordinates are relative to the
 * viewport - but a scene's position in the document says nothing about where
 * the viewport will be when the actor arrives there. Publishing document
 * coordinates works for the first scene only, because the actor is there at
 * scroll zero where the two agree.
 *
 * Each leg is driven by its destination's `view-timeline` over `entry 0%` to
 * `entry 100%`. `entry 100%` is the scroll at which that section's top reaches
 * the top of the viewport - its own document offset - and `entry 0%` is one
 * viewport earlier. Subtracting that scroll from the target's document
 * position gives the viewport coordinate the leg needs.
 */

export interface SceneBox {
  scene: Scene;
  section: HTMLElement;
  /** Where inside the section the actor lands. The section itself by default. */
  target: HTMLElement;
}

interface EngineOptions {
  /** The actor's intrinsic size. Every scene is reached by scaling this box. */
  design: { w: number; h: number };
  /** The class the generated rules are written against. */
  actorClass: string;
  enabled: boolean;
}

export function useChoreographyEngine(
  boxes: SceneBox[],
  { design, actorClass, enabled }: EngineOptions,
): void {
  const sheet = useRef<HTMLStyleElement | null>(null);
  const key = boxes.map((b) => b.scene.id).join('|');

  useEffect(() => {
    if (!enabled || boxes.length < 2) return;

    const style = document.createElement('style');
    style.dataset.choreography = 'true';
    document.head.appendChild(style);
    sheet.current = style;

    const write = () => {
      const viewport = {
        w: document.documentElement.clientWidth,
        h: document.documentElement.clientHeight,
      };
      const docTop = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;

      /** The scroll position at which the actor has arrived at scene `i`. */
      const anchorAt = (i: number) =>
        i === 0 ? docTop(boxes[1]!.section) - viewport.h : docTop(boxes[i]!.section);

      const rects: Rect[] = boxes.map((box, i) => {
        if (box.scene.full) return { x: 0, y: 0, w: viewport.w };
        const r = box.target.getBoundingClientRect();
        return { x: Math.round(r.left), y: Math.round(r.top + window.scrollY - anchorAt(i)), w: Math.round(r.width) };
      });

      const rules: string[] = [];
      const names: string[] = [];
      const timelines: string[] = [];
      const ranges: string[] = [];
      const fills: string[] = [];

      // ── The travel: one leg per pair of consecutive scenes ──────────────
      for (let i = 1; i < boxes.length; i += 1) {
        const scene = boxes[i]!.scene;
        const style_ = MOTION[scene.motion ?? 'drift'] ?? MOTION.drift!;
        const name = `travel-${scene.id}`;
        rules.push(legKeyframes(name, rects[i - 1]!, rects[i]!, style_, design.w, viewport));
        names.push(name);
        timelines.push(sceneTimeline(scene.id));
        ranges.push('entry 0% entry 100%');
        /**
         * The first leg fills backwards so the actor holds the opening scene
         * before anything has scrolled. Later legs fill forwards only: a
         * backwards fill would apply the leg's own starting value - the scene
         * before it - from the top of the page, and because later declarations
         * win it would override whichever leg is actually running.
         */
        fills.push(i === 1 ? 'both' : 'forwards');
      }

      rules.push(
        `.${actorClass} {`,
        `  animation-name: ${names.join(', ')};`,
        `  animation-timeline: ${timelines.join(', ')};`,
        `  animation-range: ${ranges.join(', ')};`,
        `  animation-fill-mode: ${fills.join(', ')};`,
        `  animation-timing-function: linear;`,
        `  animation-duration: auto;`,
        `}`,
      );

      // ── The surface: edges change with the scene they belong to ─────────
      for (let i = 1; i < boxes.length; i += 1) {
        const from = boxes[i - 1]!.scene.surface;
        const to = boxes[i]!.scene.surface;
        if (from.radius === to.radius && from.border === to.border) continue;
        const name = `surface-${boxes[i]!.scene.id}`;
        rules.push(surfaceKeyframes(name, from, to));
        rules.push(
          `.${actorClass}-surface {`,
          `  animation: ${name} linear ${i === 1 ? 'both' : 'forwards'};`,
          `  animation-timeline: ${sceneTimeline(boxes[i]!.scene.id)};`,
          // Settled a little before the actor lands, so it arrives whole
          // rather than still resolving.
          `  animation-range: entry 45% entry 95%;`,
          `}`,
        );
      }

      // ── The contents: what the actor is showing ─────────────────────────
      const contents = [...new Set(boxes.map((b) => b.scene.content))];
      for (const content of contents) {
        const legs = boxes
          .map((box, i) => ({ i, shows: box.scene.content === content }))
          .filter(({ i }) => i > 0)
          .filter(({ i }) => (boxes[i - 1]!.scene.content === content) !== (boxes[i]!.scene.content === content));

        if (legs.length === 0) continue;

        const parts: string[] = [];
        const tl: string[] = [];
        const rg: string[] = [];
        const fl: string[] = [];
        for (const { i, shows } of legs) {
          const name = `content-${content}-${boxes[i]!.scene.id}`;
          rules.push(fadeKeyframes(name, shows ? 0 : 1, shows ? 1 : 0));
          parts.push(name);
          tl.push(sceneTimeline(boxes[i]!.scene.id));
          // Later than the surface: the actor should have arrived before what
          // it is holding changes, or the swap happens mid-flight.
          rg.push('entry 62% entry 100%');
          fl.push(i === 1 ? 'both' : 'forwards');
        }
        rules.push(
          `.${actorClass} [data-content='${content}'] {`,
          `  animation-name: ${parts.join(', ')};`,
          `  animation-timeline: ${tl.join(', ')};`,
          `  animation-range: ${rg.join(', ')};`,
          `  animation-fill-mode: ${fl.join(', ')};`,
          `  animation-timing-function: linear;`,
          `}`,
        );
      }

      // ── Scene parts: things inside the actor that move with the scene ──
      for (const box of boxes) {
        for (const part of box.scene.parts ?? []) {
          rules.push(
            `.${actorClass} ${part.selector} {`,
            `  animation-name: ${part.animation};`,
            `  animation-timeline: ${sceneTimeline(box.scene.id)};`,
            `  animation-range: ${part.range ?? 'contain 0% contain 100%'};`,
            `  animation-fill-mode: both;`,
            // Linear deliberately: a scroll-driven animation should track the
            // input it is bound to, and easing it reads as lag, not polish.
            `  animation-timing-function: linear;`,
            `}`,
          );
        }
      }

      style.textContent = rules.join('\n');
    };

    write();

    const observer = new ResizeObserver(write);
    observer.observe(document.documentElement);
    for (const box of boxes) {
      observer.observe(box.section);
      if (box.target !== box.section) observer.observe(box.target);
    }
    // Fonts land after first paint and move everything below the hero, so a
    // sheet written before they arrive describes a layout that no longer
    // exists by the time anyone sees it.
    document.fonts?.ready.then(write).catch(() => {});

    return () => {
      observer.disconnect();
      style.remove();
      sheet.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, design.w, design.h, actorClass]);
}

/** Every timeline the page publishes, for the scope that makes them reachable. */
export function timelineScope(): string {
  return SCENES.map((scene) => sceneTimeline(scene.id)).join(', ');
}
