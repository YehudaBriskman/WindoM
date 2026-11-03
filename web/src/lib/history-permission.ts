// `history` is an optional permission (issue #256): the extension installs
// without it, and asks for it only when the user turns on the History app.
// Every chrome.history call in the app goes through `hasHistoryPermission()`
// first, because the permission can be missing in three ways the setting
// alone does not show:
//   - never granted (the user denied the prompt),
//   - revoked later from chrome://extensions (chrome.permissions.onRemoved),
//   - `showHistory` arrived through chrome.storage.sync from another device
//     where it *was* granted.
// chrome.permissions is absent in content scripts, so there the answer is
// always "no" and the history features stay off.

const HISTORY = { permissions: ['history'] } as const;

function permissionsApi(): typeof chrome.permissions | undefined {
  return typeof chrome !== 'undefined' ? chrome.permissions : undefined;
}

export async function hasHistoryPermission(): Promise<boolean> {
  const api = permissionsApi();
  if (!api?.contains) return false;
  try {
    return await api.contains({ permissions: [...HISTORY.permissions] });
  } catch {
    return false;
  }
}

/** Must be called synchronously from a user gesture (click/change handler). */
export async function requestHistoryPermission(): Promise<boolean> {
  const api = permissionsApi();
  if (!api?.request) return false;
  try {
    return await api.request({ permissions: [...HISTORY.permissions] });
  } catch {
    return false;
  }
}

export async function releaseHistoryPermission(): Promise<void> {
  const api = permissionsApi();
  if (!api?.remove) return;
  try {
    await api.remove({ permissions: [...HISTORY.permissions] });
  } catch {
    // Nothing to undo: if Chrome refused, the permission simply stays granted.
  }
}

/** Calls `cb` with the new state whenever `history` is granted or revoked. */
export function onHistoryPermissionChange(cb: (granted: boolean) => void): () => void {
  const api = permissionsApi();
  if (!api?.onAdded || !api.onRemoved) return () => {};
  const touchesHistory = (p: chrome.permissions.Permissions) =>
    p.permissions?.includes('history') ?? false;
  const added = (p: chrome.permissions.Permissions) => { if (touchesHistory(p)) cb(true); };
  const removed = (p: chrome.permissions.Permissions) => { if (touchesHistory(p)) cb(false); };
  api.onAdded.addListener(added);
  api.onRemoved.addListener(removed);
  return () => {
    api.onAdded.removeListener(added);
    api.onRemoved.removeListener(removed);
  };
}

/** Whether this context has chrome.history at all (it stays bound after a revoke: check the permission too). */
export function hasHistoryApi(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.history?.search;
}

/** chrome.history.search. Call only after `hasHistoryPermission()` resolved true. */
export function searchHistory(query: chrome.history.HistoryQuery): Promise<chrome.history.HistoryItem[]> {
  return new Promise((resolve) => {
    chrome.history.search(query, (results) => resolve(results ?? []));
  });
}
