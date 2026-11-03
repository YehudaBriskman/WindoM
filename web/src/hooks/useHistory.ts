import { useState, useEffect, useCallback } from 'react';
import {
  hasHistoryPermission,
  requestHistoryPermission,
  releaseHistoryPermission,
  onHistoryPermissionChange,
} from '../lib/history-permission';

export interface HistoryItem {
  url: string;
  title: string;
  lastVisitTime: number;
  hostname: string;
}

/**
 * Whether the optional `history` permission is granted right now.
 * `null` while the first check is in flight. Follows grants and revocations
 * made anywhere (another tab, chrome://extensions) through
 * chrome.permissions.onAdded / onRemoved.
 */
export function useHistoryPermission() {
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    void hasHistoryPermission().then((g) => { if (alive) setGranted(g); });
    const off = onHistoryPermissionChange((g) => { if (alive) setGranted(g); });
    return () => { alive = false; off(); };
  }, []);

  // Call `request` straight from a click/change handler: Chrome only shows
  // the permission prompt inside a user gesture.
  const request = useCallback(async () => {
    const ok = await requestHistoryPermission();
    setGranted(ok);
    return ok;
  }, []);

  const release = useCallback(async () => {
    await releaseHistoryPermission();
    setGranted(await hasHistoryPermission());
  }, []);

  return { granted, request, release };
}

/**
 * The 10 most-recent unique sites from the last week. Touches chrome.history
 * only when the feature is on AND the permission is granted; otherwise the
 * list is empty and `granted` says why.
 */
export function useHistory(enabled: boolean) {
  const { granted, request } = useHistoryPermission();
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!enabled || granted !== true || !chrome.history?.search) { setItems([]); return; }

    let alive = true;
    const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    chrome.history.search({ text: '', maxResults: 20, startTime }, (results) => {
      if (!alive) return;
      const seen = new Set<string>();
      const filtered: HistoryItem[] = [];
      for (const r of results ?? []) {
        if (!r.url || !r.title) continue;
        try {
          const hostname = new URL(r.url).hostname;
          if (seen.has(hostname)) continue;
          seen.add(hostname);
          filtered.push({ url: r.url, title: r.title, lastVisitTime: r.lastVisitTime ?? 0, hostname });
          if (filtered.length === 10) break;
        } catch { continue; }
      }
      setItems(filtered);
    });
    return () => { alive = false; };
  }, [enabled, granted]);

  return { items, granted, request };
}

export function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60_000);
  const hr = Math.floor(diff / 3_600_000);
  const day = Math.floor(diff / 86_400_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day === 1) return 'yesterday';
  return `${day}d ago`;
}
