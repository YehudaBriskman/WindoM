import { useSyncExternalStore } from 'react';

/**
 * False while rendering on the server and on the very first client render,
 * true from the moment after hydration.
 *
 * The home page is prerendered, and it renders the current time. Without this
 * the build's clock - 19:29, "Good evening" - would be baked into the HTML and
 * then disagree with the visitor's own time on hydration, which React reports
 * as a mismatch and patches by re-rendering the subtree.
 *
 * Gating on this instead means the server renders the page without the parts
 * that depend on *now*, and the client fills them in on mount. The text a
 * crawler needs is in the HTML; the clock is not, because a clock in a static
 * file is wrong the moment it is written.
 */
const subscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
