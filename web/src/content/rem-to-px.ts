/**
 * Rewrite every `rem` length in a stylesheet as `px` against a fixed 16px root.
 *
 * The content script injects the new tab's globals.css and glass.css into a
 * shadow root on ordinary web pages (#451). `rem` there resolves against the
 * HOST page's `<html>` font size, so a site with `html { font-size: 10px }` or
 * `62.5%` would shrink any rem-sized overlay rule, and a large root would grow
 * it. A shadow root has no root element of its own to pin.
 *
 * Converting the injected copy, and only that copy, sizes the overlay from the
 * same 16px base the new tab uses (`.windom-content` already pins `font-size`
 * to 16px for `em` and inherited text) without touching the new tab's
 * stylesheet at all.
 *
 * A number only counts as a length when it stands alone: `1.5rem`, `-1rem`,
 * `calc(100% - .5rem)`. One glued to an identifier (`--gap-2rem`, `.mt-1rem`)
 * is left alone.
 */
export const OVERLAY_ROOT_PX = 16;

const REM_LENGTH = /(?<![\w.-])(-?(?:\d+\.?\d*|\.\d+))rem(?![\w-])/gi;

export function remToPx(css: string, rootPx: number = OVERLAY_ROOT_PX): string {
  return css.replace(REM_LENGTH, (_, n: string) => `${Number((Number(n) * rootPx).toFixed(4))}px`);
}
