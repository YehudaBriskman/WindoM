/**
 * The extension runtime behind functions (#250). Components and hooks import
 * these instead of touching the `chrome` global, so the `chrome.*` surface
 * lives in src/lib and a test can mock one module rather than a global.
 */
import type { TabCommand } from './runtime-messages';

/** False in jsdom and in a page served outside the extension. */
export const hasChromeApi = typeof chrome !== 'undefined';

/**
 * True in the content script injected into ordinary pages, false on the
 * extension's own pages (the new tab). Content scripts cannot use chrome.tabs.*
 * in MV3, so tab commands from there go through the background worker.
 */
export const isContentScript =
  typeof window !== 'undefined' && window.location.protocol !== 'chrome-extension:';

/** Absolute URL of a file packaged with the extension; `/<path>` outside it. */
export function extensionUrl(path: string): string {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(path);
  }
  return `/${path}`;
}

/** Sends a tab command to the background worker (handled in background/index.ts). */
export function sendTabCommand(command: TabCommand): void {
  chrome.runtime.sendMessage(command);
}

/** Subscribes to runtime messages; returns the unsubscribe function. */
export function onRuntimeMessage(
  listener: (message: unknown, sender: chrome.runtime.MessageSender) => void,
): () => void {
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}
