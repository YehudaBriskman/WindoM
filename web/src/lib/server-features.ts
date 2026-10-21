/**
 * What the backend will actually do, as opposed to what this UI can draw.
 *
 * Gmail needs a restricted Google scope the server may be configured not to
 * request (see issue #321). When it is off, no consent screen can grant it, so
 * a Connect button would spin forever and the widget would stay empty with no
 * explanation. The hub hides it instead.
 *
 * One source of truth - the server - rather than a second build-time flag that
 * could disagree with it. Written from the `/integrations` response the app
 * already fetches, so nothing here costs an extra request.
 *
 * Defaults to UNAVAILABLE. The guard this needs to give is against showing a
 * feature that cannot work: the published build talks to a server with Gmail
 * off, so a card that appears before the first response and vanishes after it
 * is a flicker advertising something that was never on offer. A reviewer
 * comparing the extension against a consent screen that asks only for Calendar
 * should not find an inbox in the settings either.
 *
 * A self-hosted server with GMAIL_ENABLED=true answers on the first
 * /integrations call, and the entry appears then.
 */

let gmailAvailable = false;
const listeners = new Set<() => void>();

export function setGmailAvailable(available: boolean): void {
  if (available === gmailAvailable) return;
  gmailAvailable = available;
  for (const listener of listeners) listener();
}

export function subscribeServerFeatures(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getGmailAvailable(): boolean {
  return gmailAvailable;
}
