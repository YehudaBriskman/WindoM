import { useState, useEffect } from 'react';

export interface HistoryItem {
  url: string;
  title: string;
  lastVisitTime: number;
  hostname: string;
}

export function useHistory(enabled: boolean) {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!enabled) { setItems([]); return; }

    const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    chrome.history.search({ text: '', maxResults: 20, startTime }, (results) => {
      const seen = new Set<string>();
      const filtered: HistoryItem[] = [];
      for (const r of results) {
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
  }, [enabled]);

  return items;
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
