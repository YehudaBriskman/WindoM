import type { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate } from '../middleware/authenticate.js';
import { decryptToken, encryptToken } from '../lib/crypto.js';
import { config } from '../config.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

interface TokenRefreshResponse {
  access_token: string;
  expires_in: number;
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

interface GoogleCalendarListResponse {
  items: GoogleCalendarEvent[];
}

interface GoogleCalendarEntry {
  id: string;
  backgroundColor?: string;
  primary?: boolean;
}

interface GoogleCalendarListEntriesResponse {
  items: GoogleCalendarEntry[];
}

async function getValidAccessToken(account: typeof oauthAccounts.$inferSelect): Promise<string | null> {
  const now = new Date();
  const expiresAt = account.tokenExpiresAt ? new Date(account.tokenExpiresAt) : null;

  // If token is still valid (with 60s buffer)
  if (expiresAt && expiresAt.getTime() - now.getTime() > 60_000) {
    return decryptToken(account.accessTokenEnc);
  }

  // Token expired — use refresh token
  if (!account.refreshTokenEnc) return null;
  const refreshToken = await decryptToken(account.refreshTokenEnc);

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID ?? '',
      client_secret: config.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as TokenRefreshResponse;

  // Update stored access token
  const newAccessEnc = await encryptToken(data.access_token);
  const newExpiry = new Date(Date.now() + data.expires_in * 1000);
  await db
    .update(oauthAccounts)
    .set({ accessTokenEnc: newAccessEnc, tokenExpiresAt: newExpiry, updatedAt: new Date() })
    .where(eq(oauthAccounts.id, account.id));

  return data.access_token;
}

export async function calendarRoutes(app: FastifyInstance) {
  // GET /calendar/events?days=7
  app.get('/events', { preHandler: authenticate }, async (req, reply) => {
    const { days = '7' } = req.query as { days?: string };
    const dayCount = Math.min(30, Math.max(1, parseInt(days, 10) || 7));

    const [account] = await db
      .select()
      .from(oauthAccounts)
      .where(and(eq(oauthAccounts.userId, req.user.sub), eq(oauthAccounts.provider, 'google')))
      .limit(1);

    if (!account) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Google Calendar not connected' });
    }

    const accessToken = await getValidAccessToken(account);
    if (!accessToken) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Could not refresh Google token. Please reconnect.' });
    }

    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + dayCount * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all calendars the user has access to
    const calListRes = await fetch(`${CALENDAR_API}/users/me/calendarList?maxResults=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let calendarIds: Array<{ id: string; color?: string }> = [{ id: 'primary' }];
    if (calListRes.ok) {
      const calListData = (await calListRes.json()) as GoogleCalendarListEntriesResponse;
      if (calListData.items?.length) {
        calendarIds = calListData.items.map((c) => ({ id: c.id, color: c.backgroundColor }));
      }
    }

    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50',
    });

    // Fan-out: fetch events from all calendars in parallel
    const results = await Promise.allSettled(
      calendarIds.map(({ id, color }) =>
        fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(id)}/events?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then(async (r) => {
          if (!r.ok) return { items: [], color };
          const d = (await r.json()) as GoogleCalendarListResponse;
          return { items: d.items ?? [], color, calendarId: id };
        })
      )
    );

    // Flatten, deduplicate by event id, normalize
    const seen = new Set<string>();
    const events: Array<{
      id: string;
      title: string;
      date: string;
      description: string;
      color?: string;
      calendarId?: string;
      htmlLink?: string;
    }> = [];

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const { items, color, calendarId } = result.value as { items: GoogleCalendarEvent[]; color?: string; calendarId?: string };
      for (const item of items) {
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

    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return reply.send({ events });
  });
}
