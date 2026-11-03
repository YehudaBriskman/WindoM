/**
 * Which heading the reader is under, as a pure function of geometry.
 *
 * Kept apart from the hook so the rule can be tested without a browser: given
 * where each heading's top edge is on screen and where the reading line sits,
 * the answer is the last heading that has reached the line.
 *
 * - `tops` are viewport-relative (`getBoundingClientRect().top`), in document
 *   order.
 * - `line` is the reading line: just under the sticky chrome, which is where
 *   an anchored heading lands when jumped to. A heading that has slid *under*
 *   the chrome still counts - it is above the line, and that is the section
 *   being read. The observer this replaced only counted headings above the
 *   viewport's own top edge, so a heading hidden behind the bar was ignored
 *   and the previous section stayed marked.
 * - `atBottom` wins over the line: the last section of a page is often too
 *   short for its heading to ever reach the line, and without this it could
 *   never be marked at all.
 *
 * Returns an index into `tops`, or -1 when there are no headings. Before the
 * first heading reaches the line, the first heading is current - the reader is
 * at the top of the page, and the first entry is where they are.
 */
export function pickActiveIndex(tops: readonly number[], line: number, atBottom: boolean): number {
  if (tops.length === 0) return -1;
  if (atBottom) return tops.length - 1;

  let active = 0;
  for (let i = 0; i < tops.length; i++) {
    // Sorted in document order, so the first one below the line ends it.
    if ((tops[i] ?? Infinity) <= line) active = i;
    else break;
  }
  return active;
}

/**
 * The scroll offset that brings `item` into view inside `container`, or `null`
 * when it is already fully visible.
 *
 * `block: 'nearest'` semantics, computed rather than delegated to
 * `scrollIntoView`, because `scrollIntoView` scrolls every scrollable ancestor
 * - the page included - and calling it while the page is mid-way through a
 * smooth scroll cancels that scroll.
 *
 * All values are in the container's own content coordinates: `itemTop` is the
 * item's offset from the top of the container's scrolled content.
 */
export function nearestScrollTop(
  scrollTop: number,
  viewHeight: number,
  itemTop: number,
  itemHeight: number,
  margin = 0,
): number | null {
  const top = itemTop - margin;
  const bottom = itemTop + itemHeight + margin;
  if (top < scrollTop) return Math.max(0, top);
  if (bottom > scrollTop + viewHeight) return bottom - viewHeight;
  return null;
}
