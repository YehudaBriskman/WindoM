import type { Plugin } from 'vite';

/**
 * Types for search-index.mjs.
 *
 * The build scripts are plain JavaScript because they run under node with no
 * compile step in front of them. This file exists for the one consumer that is
 * type-checked - vite.config.ts, which registers the dev plugin below - and
 * keeps that import from resolving to an implicit `any`.
 *
 * The shapes mirror src/lib/search.ts, which is where the browser's half of
 * this contract lives. They are declared with `string` where that file uses
 * `Locale`, because these scripts are not part of the app's program and should
 * not reach into it for a type.
 */

/** One prerendered route, as scripts/prerender.mjs collects them. */
export interface RenderedPage {
  path: string;
  html: string;
  title: string;
  locale: string;
  group?: string;
}

export interface IndexedSection {
  id: string;
  h: string;
  x: string;
  sub?: number;
}

export interface IndexedPage {
  p: string;
  t: string;
  l: string;
  g?: string;
  s: IndexedSection[];
}

export interface SearchIndex {
  v: number;
  pages: IndexedPage[];
}

export function buildSearchIndex(rendered: RenderedPage[]): SearchIndex;

/** Serves /search-index.json under `vite dev`, where no build has written it. */
export function searchIndexDevPlugin(): Plugin;
