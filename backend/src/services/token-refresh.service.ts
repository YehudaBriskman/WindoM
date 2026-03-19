import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import { decryptToken, encryptToken } from '../lib/crypto.js';
import { TOKEN_REFRESH_BUFFER_MS } from '../types/constants.js';

type OAuthAccountRow = typeof oauthAccounts.$inferSelect;

export interface TokenRefreshConfig {
  tokenUrl: string;
  /** Additional body fields merged alongside grant_type + refresh_token. */
  extraBody: Record<string, string>;
  /** Optional Authorization header (e.g. Basic auth for Spotify). */
  authHeader?: string;
}

/**
 * Return a valid decrypted access token for the given account.
 * Automatically refreshes using the stored refresh token if the current one
 * expires within TOKEN_REFRESH_BUFFER_MS. Updates the DB on refresh.
 * Returns null if unable to get a valid token.
 */
export async function getValidAccessToken(
  account: OAuthAccountRow,
  refreshConfig: TokenRefreshConfig,
): Promise<string | null> {
  const expiresAt = account.tokenExpiresAt ? new Date(account.tokenExpiresAt) : null;
  const isStillValid = expiresAt && expiresAt.getTime() - Date.now() > TOKEN_REFRESH_BUFFER_MS;

  if (isStillValid) return decryptToken(account.accessTokenEnc);
  if (!account.refreshTokenEnc) return null;

  const refreshToken = await decryptToken(account.refreshTokenEnc);

  const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (refreshConfig.authHeader) headers['Authorization'] = refreshConfig.authHeader;

  const res = await fetch(refreshConfig.tokenUrl, {
    method: 'POST',
    headers,
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      ...refreshConfig.extraBody,
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { access_token: string; expires_in: number };
  const newAccessEnc = await encryptToken(data.access_token);
  const newExpiry = new Date(Date.now() + data.expires_in * 1000);

  await db
    .update(oauthAccounts)
    .set({ accessTokenEnc: newAccessEnc, tokenExpiresAt: newExpiry, updatedAt: new Date() })
    .where(eq(oauthAccounts.id, account.id));

  return data.access_token;
}
