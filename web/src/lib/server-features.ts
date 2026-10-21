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
 * Defaults to available. Before the first response, and for a signed-out
 * visitor who never makes one, showing the entry is the harmless direction to
 * be wrong in: connecting requires signing in anyway, and that is the moment
 * the real answer arrives.
 */

let gmailAvailable = true;
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
