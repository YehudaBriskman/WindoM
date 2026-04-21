import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import { decryptToken, encryptToken } from '../lib/crypto.js';
import { TOKEN_REFRESH_BUFFER_MS } from '../types/constants.js';
import type { Result } from '../types/auth.types.js';
import type { OAuthError } from '../types/oauth.types.js';

type OAuthAccountRow = typeof oauthAccounts.$inferSelect;
type RefreshError = Extract<OAuthError, 'TOKEN_REFRESH_FAILED' | 'TOKEN_REFRESH_REVOKED' | 'TOKEN_REFRESH_NETWORK_ERROR'>;

export interface TokenRefreshConfig {
  tokenUrl: string;
  /** Additional body fields merged alongside grant_type + refresh_token. */
  extraBody: Record<string, string>;
  /** Optional Authorization header (e.g. Basic auth for Spotify legacy shared-app). */
  authHeader?: string;
  /** For PKCE (BYOA) Spotify connections - the user's own Spotify app client_id. When set, omits Authorization header and sends client_id in body instead. */
  pkceClientId?: string;
}

const refreshResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
});

/**
 * Return a valid decrypted access token for the given account.
 * Automatically refreshes using the stored refresh token if the current one
 * expires within TOKEN_REFRESH_BUFFER_MS. Updates the DB on refresh.
 *
 * Error codes:
 * - TOKEN_REFRESH_REVOKED: provider returned 401/403 — user must re-authorize
 * - TOKEN_REFRESH_NETWORK_ERROR: network/5xx failure — transient, safe to retry
 * - TOKEN_REFRESH_FAILED: malformed provider response or missing refresh token
 */
export async function getValidAccessToken(
  account: OAuthAccountRow,
  refreshConfig: TokenRefreshConfig,
): Promise<Result<string, RefreshError>> {
  const expiresAt = account.tokenExpiresAt ? new Date(account.tokenExpiresAt) : null;
  const isStillValid = expiresAt && expiresAt.getTime() - Date.now() > TOKEN_REFRESH_BUFFER_MS;

  if (isStillValid) return { ok: true, data: await decryptToken(account.accessTokenEnc) };
  if (!account.refreshTokenEnc) return { ok: false, error: 'TOKEN_REFRESH_FAILED' };

  const refreshToken = await decryptToken(account.refreshTokenEnc);

  const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (refreshConfig.pkceClientId) {
    // PKCE (BYOA) mode: no Authorization header; client_id goes in body
  } else if (refreshConfig.authHeader) {
    headers['Authorization'] = refreshConfig.authHeader;
  }

  let res: Response;
  try {
    res = await fetch(refreshConfig.tokenUrl, {
      method: 'POST',
      headers,
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        ...(refreshConfig.pkceClientId ? { client_id: refreshConfig.pkceClientId } : {}),
        ...refreshConfig.extraBody,
      }),
    });
  } catch {
    return { ok: false, error: 'TOKEN_REFRESH_NETWORK_ERROR' };
  }

  if (!res.ok) {
    // 401/403 means the refresh token is revoked or expired — user must re-authorize.
    // 5xx or other codes are transient provider errors — safe to retry later.
    return {
      ok: false,
      error: res.status === 401 || res.status === 403 ? 'TOKEN_REFRESH_REVOKED' : 'TOKEN_REFRESH_NETWORK_ERROR',
    };
  }

  const parsed = refreshResponseSchema.safeParse(await res.json());
  if (!parsed.success) return { ok: false, error: 'TOKEN_REFRESH_FAILED' };

  const { access_token, expires_in } = parsed.data;
  const newAccessEnc = await encryptToken(access_token);
  const newExpiry = new Date(Date.now() + expires_in * 1000);

  await db
    .update(oauthAccounts)
    .set({ accessTokenEnc: newAccessEnc, tokenExpiresAt: newExpiry, updatedAt: new Date() })
    .where(eq(oauthAccounts.id, account.id));

  return { ok: true, data: access_token };
}
