import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import { getValidAccessToken } from './token-refresh.service.js';
import { config } from '../config.js';
import {
  GOOGLE_TOKEN_URL,
  CALENDAR_API,
  MAX_CALENDAR_DAYS,
  DEFAULT_CALENDAR_DAYS,
  MAX_CALENDAR_RESULTS,
} from '../types/constants.js';
import type { Result } from '../types/auth.types.js';
import type { OAuthError } from '../types/oauth.types.js';

export type CalendarError = OAuthError | 'NOT_CONNECTED';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  color?: string;
  calendarId?: string;
  htmlLink?: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
}

interface GoogleCalendarListResponse {
  items?: Array<{ id: string; backgroundColor?: string }>;
}

interface GoogleCalendarEventsResponse {
  items?: GoogleCalendarEvent[];
}

const CALENDAR_TTL_MS = 180_000;
const calendarCache = new Map<string, { data: Result<CalendarEvent[], CalendarError>; expiresAt: number }>();

/** Invalidate the calendar cache for a user (e.g. on disconnect). */
export function invalidateCalendarCache(userId: string): void {
  for (const key of calendarCache.keys()) {
    if (key === userId || key.startsWith(`${userId}:`)) {
      calendarCache.delete(key);
    }
  }
}

/** Clear the entire calendar cache. Only intended for use in tests. */
export function clearCalendarCacheForTest(): void {
  calendarCache.clear();
}

async function batchRequests<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map((t) => t()));
    results.push(...batchResults);
  }
  return results;
}

/** Fetch and normalize Google Calendar events for a user over the given day range. */
export async function getCalendarEvents(
  userId: string,
  days: number,
): Promise<Result<CalendarEvent[], CalendarError>> {
  const dayCount = Math.min(MAX_CALENDAR_DAYS, Math.max(1, days || DEFAULT_CALENDAR_DAYS));
  const cacheKey = `${userId}:${dayCount}`;
  const cached = calendarCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const [account] = await db
    .select()
    .from(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, 'google')))
    .limit(1);

  if (!account) return { ok: false, error: 'NOT_CONNECTED' };

  const accessToken = await getValidAccessToken(account, {
    tokenUrl: GOOGLE_TOKEN_URL,
    extraBody: { client_id: config.GOOGLE_CLIENT_ID ?? '', client_secret: config.GOOGLE_CLIENT_SECRET ?? '' },
  });

  if (!accessToken) return { ok: false, error: 'TOKEN_REFRESH_FAILED' };

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + dayCount * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all calendars; fall back to primary if the list call fails
  const calListRes = await fetch(`${CALENDAR_API}/users/me/calendarList?maxResults=${MAX_CALENDAR_RESULTS}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let calendarIds: Array<{ id: string; color?: string }> = [{ id: 'primary' }];
  if (calListRes.ok) {
    const calListData = (await calListRes.json()) as GoogleCalendarListResponse;
    if (calListData.items?.length) {
      calendarIds = calListData.items.map((c) => ({ id: c.id, color: c.backgroundColor }));
    }
  }

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(MAX_CALENDAR_RESULTS),
  });

  // Fan-out: fetch events from all calendars with max 5 concurrent requests
  const results = await batchRequests(
    calendarIds.map(({ id, color }) => () =>
      fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(id)}/events?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(async (r) => {
        if (!r.ok) return { items: [] as GoogleCalendarEvent[], color, calendarId: id };
        const d = (await r.json()) as GoogleCalendarEventsResponse;
        return { items: d.items ?? [], color, calendarId: id };
      }),
    ),
    5,
  );

  // Flatten, deduplicate by event id, and normalize
  const seen = new Set<string>();
  const events: CalendarEvent[] = [];

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const { items, color, calendarId } = result.value;
    for (const item of items.filter(Boolean)) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      events.push({
        id: item.id,
        title: item.summary ?? '(No title)',
        date: item.start?.dateTime ?? item.start?.date ?? '',
        description: item.description ?? '',
        color,
        calendarId,
        htmlLink: item.htmlLink,
      });
    }
  }

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const result: Result<CalendarEvent[], CalendarError> = { ok: true, data: events };
  calendarCache.set(cacheKey, { data: result, expiresAt: Date.now() + CALENDAR_TTL_MS });
  return result;
}
