/**
 * Which clicks count as "outside" a panel that dismisses itself.
 *
 * The settings panel lost its close button and its backdrop, so it listens for
 * clicks elsewhere and closes itself. A plain `panel.contains(target)` check is
 * not enough, because some of the panel's own UI is not inside its element: the
 * app centre opens as a centred overlay rendered as a *sibling*.
 *
 * The consequence was that clicking Connect for Spotify or Calendar - a control
 * sitting inside that overlay - dismissed the settings panel underneath it, and
 * took the component driving the OAuth call with it.
 *
 * Extracted from the component so the rule can be tested directly. Mounting the
 * settings panel means standing up every context and section it renders, which
 * is a lot of scaffolding to assert one boolean.
 */

/**
 * Selectors for UI that belongs to the panel while living outside its element.
 *
 * The backdrop is included deliberately: it dismisses the app centre through its
 * own handler, and should not take the panel with it.
 */
export const PANEL_SATELLITE_SELECTOR = '.app-center-panel, .app-center-backdrop';

/** The nearest element for a node, so text nodes resolve to their parent. */
function asElement(target: Node | null): Element | null {
  if (target instanceof Element) return target;
  return target?.parentElement ?? null;
}

/**
 * True when a pointer event should dismiss the panel.
 *
 * Returns false when the panel is not mounted: with nothing to measure against,
 * closing on every click would dismiss it for reasons unrelated to the pointer.
 */
export function shouldDismissPanel(target: Node | null, panel: Element | null): boolean {
  if (!panel) return false;
  if (panel.contains(target)) return false;
  if (asElement(target)?.closest(PANEL_SATELLITE_SELECTOR)) return false;
  return true;
}
