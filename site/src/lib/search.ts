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
 * Every token must appear in the section's own heading or body, so adding a
 * word narrows the results rather than widening them - which is what typing
 * more words is for.
 *
 * The page title deliberately does not satisfy that test; it only adds score.
 * It used to satisfy it, and because the title is identical for every section
 * of a page, a single hit on it qualified the entire page: searching `guide`
 * matched all eighteen sections of "User Guide" at the same score, document
 * order broke every tie, and the eight rows were eight consecutive guide
 * sections while the real answers elsewhere never got one. The same held for
 * `support`, `privacy`, `terms` and `contact` - every page whose name is also
 * a word a reader would type.
 *
 * Searching a page by its name still works: `pageResult` gives such a page
 * exactly one row instead of all of them.
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
    let matchedSections = 0;

    for (const section of page.s) {
      const heading = section.h.toLowerCase();
      const body = section.x.toLowerCase();

      let score = 0;
      let matchedAll = true;

      for (const token of tokens) {
        const inHeading = heading.includes(token);
        const inBody = body.includes(token);
        if (!inHeading && !inBody) {
          matchedAll = false;
          break;
        }
        if (inHeading) score += HEADING_HIT;
        if (inBody) score += BODY_HIT;
        // Scored but never qualifying: a page named after the word you typed
        // holds the better of two otherwise equal sections, which is not the
        // same thing as holding every section worth returning.
        if (title.includes(token)) score += TITLE_HIT;
      }

      if (!matchedAll) continue;
      if (heading.startsWith(first)) score += PREFIX_BONUS;
      matchedSections += 1;

      results.push({
        to: section.id ? `${page.p}#${section.id}` : page.p,
        page,
        section,
        heading: section.h || page.t,
        excerpt: section.x,
        score,
      });
    }

    // Guarded on `matchedSections` so a page is either represented by the
    // sections that answered or by its own name, never by both.
    if (!matchedSections && tokens.every((token) => title.includes(token))) {
      const whole = pageResult(page, title, tokens.length, first);
      if (whole) results.push(whole);
    }
  }

  // Ties broken by document order, which the index is already in, so the
  // earlier of two equally good sections wins. `sort` is stable.
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * One row standing for a whole page, for a query that only its title matched.
 *
 * It points at the top of the page rather than at a heading, because a title
 * match says nothing about which part of the page the reader wants. Scored from
 * the title alone, which keeps it under any section that matched its own text:
 * a section about what you typed is a better answer than a page merely named
 * after it.
 *
 * Null for a page the index recorded with no sections at all - it has no
 * excerpt to show, and a row with an empty body reads as a broken result.
 */
function pageResult(
  page: IndexedPage,
  title: string,
  tokenCount: number,
  first: string,
): Result | null {
  const [intro] = page.s;
  if (!intro) return null;

  return {
    to: page.p,
    page,
    section: intro,
    heading: page.t,
    excerpt: intro.x,
    score: tokenCount * TITLE_HIT + (title.startsWith(first) ? PREFIX_BONUS : 0),
  };
}

/**
 * `text` lowercased without changing its length.
 *
 * `toLowerCase()` is not length-preserving: `İ` (U+0130) lowercases to two code
 * units, `ẚ` to three. `highlight` searches the lowercased copy and then slices
 * the original at the index it found, so one such character anywhere before the
 * match slides every later offset and the `<mark>` lands on the wrong word - or
 * past the end of a short excerpt, highlighting nothing. The Hebrew pages have
 * no case at all and the English ones are ordinary prose, which is exactly why
 * this would have surfaced as a one-off bug report from a single page rather
 * than as something anyone could reproduce.
 *
 * Characters that would change length keep their original form instead. They
 * then only match case-sensitively, which costs a highlight on a word nobody
 * has searched for yet and keeps every offset honest.
 */
function lowerKeepingLength(text: string): string {
  let out = '';
  // By code point, so a surrogate pair is weighed as the one character it is.
  for (const char of text) {
    const lower = char.toLowerCase();
    out += lower.length === char.length ? lower : char;
  }
  return out;
}

/**
 * An excerpt windowed onto the first match, split for highlighting.
 *
 * A fixed leading slice is usually the wrong 150 characters: the word you
 * searched for is halfway down the section, so the row shows text that does not
 * contain it and the result looks wrong.
 */
export function highlight(text: string, tokens: string[], width = 150): [string, string, string] {
  const lower = lowerKeepingLength(text);
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

  // `token.length` measures the match in the original too: the lowercased copy
  // is the same length, and a token that grew while being lowercased could not
  // have matched the character that stayed its original length.

  return [
    prefix + slice.slice(0, offset),
    slice.slice(offset, offset + token.length),
    slice.slice(offset + token.length),
  ];
}
