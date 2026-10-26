/**
 * The DOM id a card slot is given.
 *
 * Three separate things address the day section: the hook that reads its
 * scroll position to advance the clock, and the two observers that hide the
 * navigation and restore the card after it. Renaming that section once
 * already froze the day cycle silently - the hook looked for an id that no
 * longer existed, found nothing, and simply stopped, with the stage holding
 * one time for its whole length and no error anywhere.
 *
 * So the name is computed in one place rather than spelled out in four.
 */
export function slotElementId(id: string): string {
  return `slot-${id}`;
}
