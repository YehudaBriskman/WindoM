import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import { decryptToken } from '../lib/crypto.js';
import { fetchWithTimeout } from '../lib/external-fetch.js';
import { logger } from '../lib/logger.js';

export const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
/** Revocation is a courtesy to the user; it must never hold up a disconnect or delete. */
export const REVOKE_TIMEOUT_MS = 3_000;

export interface RevocableAccount {
  provider: string;
  accessTokenEnc: string;
  refreshTokenEnc: string | null;
}

/** Load the stored accounts that may need revoking. Call BEFORE deleting the rows. */
export async function loadRevocableAccounts(userId: string, provider?: string): Promise<RevocableAccount[]> {
  const where = provider
    ? and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, provider))
    : eq(oauthAccounts.userId, userId);
  return db
    .select({
      provider: oauthAccounts.provider,
      accessTokenEnc: oauthAccounts.accessTokenEnc,
      refreshTokenEnc: oauthAccounts.refreshTokenEnc,
    })
    .from(oauthAccounts)
    .where(where);
}

/**
 * Best-effort revoke of the grant at the provider. Never throws and never logs a token.
 *
 * - Google: POST https://oauth2.googleapis.com/revoke. Revoking the refresh token ends the
 *   whole grant; the access token is used only when there is no refresh token.
 * - GitHub: not implemented. GitHub's grant-delete endpoint
 *   (DELETE /applications/{client_id}/grant) needs the OAuth app's client id and secret;
 *   this backend connects GitHub with a user-supplied personal access token and holds neither.
 * - Spotify: Spotify has no public token-revocation endpoint; the user removes the app at
 *   spotify.com/account/apps.
 */
export async function revokeAtProvider(account: RevocableAccount): Promise<void> {
  if (account.provider !== 'google') return;
  try {
    const token = await decryptToken(account.refreshTokenEnc ?? account.accessTokenEnc);
    const res = await fetchWithTimeout(
      GOOGLE_REVOKE_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token }).toString(),
      },
      REVOKE_TIMEOUT_MS,
    );
    if (!res.ok) logger.warn({ provider: 'google', status: res.status }, 'provider revoke was not accepted');
  } catch (err) {
    logger.warn({ provider: 'google', errName: err instanceof Error ? err.name : 'unknown' }, 'provider revoke failed');
  }
}

/** Revoke several accounts in parallel; never rejects. */
export async function revokeAccounts(accounts: RevocableAccount[]): Promise<void> {
  await Promise.allSettled(accounts.map(revokeAtProvider));
}
