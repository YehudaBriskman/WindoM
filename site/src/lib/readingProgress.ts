/**
 * How much of an article has been read.
 *
 * Measured against the article itself, never the document. After the last
 * paragraph of a docs page come the previous/next links and the whole site
 * footer, and a bar driven by the document's own scroll height reads about
 * two thirds done at the moment the article actually ends.
 *
 * `top` is the article's top edge relative to the viewport (negative once it
 * has scrolled past), `height` its full height, `viewport` the window height.
 * The result is 0 while the top of the article is at or below the top of the
 * screen, and 1 once its last line has cleared the bottom of the screen.
 *
 * An article shorter than the screen has no travel at all, so the travel is
 * floored at one pixel rather than allowed to reach zero (a division by zero)
 * or go negative (an inverted bar).
 *
 * Rounded to three decimals, which is below one pixel on any rail this site
 * can draw, so most frames of a slow scroll produce the same number and the
 * caller can skip the write.
 */
export function readingFraction(top: number, height: number, viewport: number): number {
  const travel = Math.max(1, height - Math.max(1, viewport));
  const value = Math.min(1, Math.max(0, -top / travel));
  return Math.round(value * 1000) / 1000;
}
