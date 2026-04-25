import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import { getValidAccessToken } from './token-refresh.service.js';
import { config } from '../config.js';
import { GOOGLE_TOKEN_URL, GMAIL_API, GMAIL_MAX_MESSAGES } from '../types/constants.js';
import type { Result } from '../types/auth.types.js';
import type { OAuthError } from '../types/oauth.types.js';

export type GmailError = OAuthError | 'NOT_CONNECTED' | 'INSUFFICIENT_SCOPES' | 'GMAIL_API_FORBIDDEN';

export interface GmailMessage {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
}

export interface GmailSummary {
  unreadCount: number;
  messages: GmailMessage[];
}

interface GmailLabelResponse {
  messagesUnread?: number;
}

interface GmailMessageListResponse {
  messages?: Array<{ id: string }>;
  resultSizeEstimate?: number;
}

interface GmailMessageResponse {
  id: string;
  snippet?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
}

const GMAIL_TTL_MS = 45_000;
const gmailCache = new Map<string, { data: Result<GmailSummary, GmailError>; expiresAt: number }>();

export function invalidateGmailCache(userId: string): void {
  gmailCache.delete(userId);
}

export function clearGmailCacheForTest(): void {
  gmailCache.clear();
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

export async function getGmailSummary(userId: string): Promise<Result<GmailSummary, GmailError>> {
  const cached = gmailCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const [account] = await db
    .select()
    .from(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, 'google')))
    .limit(1);

  if (!account) return { ok: false, error: 'NOT_CONNECTED' };

  // Check that the stored token was granted with gmail.readonly scope
  const hasGmailScope = account.scopes.some((s) => s.includes('gmail'));
  if (!hasGmailScope) return { ok: false, error: 'INSUFFICIENT_SCOPES' };

  const tokenResult = await getValidAccessToken(account, {
    tokenUrl: GOOGLE_TOKEN_URL,
    extraBody: { client_id: config.GOOGLE_CLIENT_ID ?? '', client_secret: config.GOOGLE_CLIENT_SECRET ?? '' },
  });
  if (!tokenResult.ok) return { ok: false, error: tokenResult.error };
  const accessToken = tokenResult.data;

  const headers = { Authorization: `Bearer ${accessToken}` };

  // Fetch inbox unread count and top unread messages in parallel
  const [labelRes, listRes] = await Promise.all([
    fetch(`${GMAIL_API}/labels/INBOX`, { headers }),
    fetch(`${GMAIL_API}/messages?q=is%3Aunread&maxResults=${GMAIL_MAX_MESSAGES}`, { headers }),
  ]);

  if (!labelRes.ok || !listRes.ok) {
    const failedRes = !labelRes.ok ? labelRes : listRes;
    if (failedRes.status === 401) {
      return { ok: false, error: 'TOKEN_REFRESH_REVOKED' };
    }
    if (failedRes.status === 403) {
      // 403 from Gmail API means either missing gmail scope on the token or the
      // Gmail API is not enabled in the Google Cloud project — not a token refresh issue.
      return { ok: false, error: 'GMAIL_API_FORBIDDEN' };
    }
    return { ok: false, error: 'TOKEN_REFRESH_NETWORK_ERROR' };
  }

  const [labelData, listData] = await Promise.all([
    labelRes.json() as Promise<GmailLabelResponse>,
    listRes.json() as Promise<GmailMessageListResponse>,
  ]);

  const unreadCount = labelData.messagesUnread ?? 0;
  const messageIds = listData.messages ?? [];

  // Fetch each message's metadata in parallel
  const messageResults = await Promise.allSettled(
    messageIds.map(({ id }) =>
      fetch(
        `${GMAIL_API}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers }
      ).then((r) => r.json() as Promise<GmailMessageResponse>)
    )
  );

  const messages: GmailMessage[] = messageResults
    .filter((r): r is PromiseFulfilledResult<GmailMessageResponse> => r.status === 'fulfilled')
    .map(({ value }) => {
      const msgHeaders = value.payload?.headers ?? [];
      return {
        id: value.id,
        from: getHeader(msgHeaders, 'From'),
        subject: getHeader(msgHeaders, 'Subject') || '(No subject)',
        snippet: value.snippet ?? '',
        date: getHeader(msgHeaders, 'Date'),
      };
    });

  const result: Result<GmailSummary, GmailError> = { ok: true, data: { unreadCount, messages } };
  gmailCache.set(userId, { data: result, expiresAt: Date.now() + GMAIL_TTL_MS });
  return result;
}
