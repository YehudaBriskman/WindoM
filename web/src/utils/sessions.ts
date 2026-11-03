/** Formatting and ordering for Settings > Account > Active sessions. */

export interface Session {
  id: string;
  /** "Browser · OS"; null for sessions that predate labels. Absent from older backends. */
  device?: string | null;
  /** The session this browser is using. Absent from older backends. */
  current?: boolean;
  /** Latest sign-in or automatic renewal - not the last request. */
  lastUsedAt: string;
  expiresAt: string;
}

// ── Formatting ───────────────────────────────────────────────────────────────

const relativeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
export const absoluteFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 86_400_000],
  ['month', 30 * 86_400_000],
  ['week', 7 * 86_400_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

/** "3 days ago", "in 6 days", "now" - in the viewer's locale. */
export function formatRelative(ms: number, now = Date.now()): string {
  const diff = ms - now;
  for (const [unit, size] of UNITS) {
    if (Math.abs(diff) >= size) return relativeFormat.format(Math.round(diff / size), unit);
  }
  return relativeFormat.format(0, 'second');
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "3 active sessions · this device + 2 others" */
export function summarise(sessions: Session[]): string {
  const total = plural(sessions.length, 'active session', 'active sessions');
  if (!sessions.some((session) => session.current)) return total;
  const others = sessions.length - 1;
  return others === 0 ? `${total} · this device` : `${total} · this device + ${plural(others, 'other', 'others')}`;
}

/** Current session first, then the most recently renewed. Does not trust the server's order. */
export function orderSessions(sessions: Session[]): Session[] {
  return [...sessions].sort(
    (a, b) =>
      Number(Boolean(b.current)) - Number(Boolean(a.current)) || Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt),
  );
}
