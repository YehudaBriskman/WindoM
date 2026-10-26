import type { Locale } from '../routes';

/**
 * Matching for the documentation search.
 *
 * Separate from the dialog that shows it, and pure, so the ranking can be
 * reasoned about without a browser in the way.
 *
 * The index is built by scripts/search-index.mjs from the prerendered HTML. Its
 * keys are short because it is downloaded rather than read: `p`ath, `t`itle,
 * `l`ocale, `g`roup, `s`ections, and within a section `h`eading, e`x`cerpt.
 */

export interface IndexedSection {
  id: string;
  h: string;
  x: string;
  sub?: number;
}

export interface IndexedPage {
  p: string;
  t: string;
  l: Locale;
  g?: string;
  s: IndexedSection[];
}

export interface SearchIndex {
  v: number;
  pages: IndexedPage[];
}

export interface Result {
  /** Where this result goes, hash included when it is a section. */
  to: string;
  page: IndexedPage;
  section: IndexedSection;
  /** The heading to show, falling back to the page title for an intro match. */
  heading: string;
  excerpt: string;
  score: number;
}

/**
 * A query's words, lowercased.
 *
 * Split on whitespace only. Splitting on word characters would be wrong for the
 * Hebrew pages and for the terms people actually search for here, which include
 * `calendar.readonly` and `chrome://extensions`.
 */
export function tokenize(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

const HEADING_HIT = 8;
const BODY_HIT = 2;
const TITLE_HIT = 4;
/** A heading that begins with what you typed is almost always the one you want. */
const PREFIX_BONUS = 6;

/**
 * Results for a query, best first, within one language.
 *
 * Scoped to the active language rather than searching both: the pages are
 * translations of each other, so an unscoped search returns every answer twice
 * and half of them in a language the reader may not have.
 *
 * Every token must appear somewhere in the section, so adding a word narrows
 * the results rather than widening them - which is what typing more words is
 * for.
 */
export function search(
  index: SearchIndex,
  query: string,
  locale: Locale,
  limit = 8,
): Result[] {
  const tokens = tokenize(query);
  const [first] = tokens;
  if (first === undefined) return [];

  const results: Result[] = [];

  for (const page of index.pages) {
    if (page.l !== locale) continue;
    const title = page.t.toLowerCase();

    for (const section of page.s) {
      const heading = section.h.toLowerCase();
      const body = section.x.toLowerCase();

      let score = 0;
      let matchedAll = true;

      for (const token of tokens) {
        const inHeading = heading.includes(token);
        const inTitle = title.includes(token);
        const inBody = body.includes(token);
        if (!inHeading && !inTitle && !inBody) {
          matchedAll = false;
          break;
        }
        if (inHeading) score += HEADING_HIT;
        if (inTitle) score += TITLE_HIT;
        if (inBody) score += BODY_HIT;
      }

      if (!matchedAll) continue;
      if (heading.startsWith(first)) score += PREFIX_BONUS;

      results.push({
        to: section.id ? `${page.p}#${section.id}` : page.p,
        page,
        section,
        heading: section.h || page.t,
        excerpt: section.x,
        score,
      });
    }
  }

  // Ties broken by document order, which the index is already in, so the
  // earlier of two equally good sections wins. `sort` is stable.
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * An excerpt windowed onto the first match, split for highlighting.
 *
 * A fixed leading slice is usually the wrong 150 characters: the word you
 * searched for is halfway down the section, so the row shows text that does not
 * contain it and the result looks wrong.
 */
export function highlight(text: string, tokens: string[], width = 150): [string, string, string] {
  const lower = text.toLowerCase();
  let at = -1;
  let token = '';
  for (const candidate of tokens) {
    const found = lower.indexOf(candidate);
    if (found !== -1 && (at === -1 || found < at)) {
      at = found;
      token = candidate;
    }
  }

  if (at === -1) return [text.slice(0, width), '', ''];

  const start = Math.max(0, at - Math.floor(width / 3));
  const slice = text.slice(start, start + width);
  const prefix = start > 0 ? '…' : '';
  const offset = at - start;

  return [
    prefix + slice.slice(0, offset),
    slice.slice(offset, offset + token.length),
    slice.slice(offset + token.length),
  ];
}
