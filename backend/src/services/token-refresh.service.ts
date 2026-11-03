import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import { decryptToken, encryptToken } from '../lib/crypto.js';
import { TOKEN_REFRESH_BUFFER_MS } from '../types/constants.js';
import type { Result } from '../types/auth.types.js';
import type { OAuthError } from '../types/oauth.types.js';
import { fetchWithTimeout } from '../lib/external-fetch.js';
import type { TokenRefreshStrategy } from './token-refresh.strategies.js';

type OAuthAccountRow = typeof oauthAccounts.$inferSelect;
type RefreshError = Extract<
  OAuthError,
  'TOKEN_REFRESH_FAILED' | 'TOKEN_REFRESH_REVOKED' | 'TOKEN_REFRESH_NETWORK_ERROR'
>;

// Deduplicates concurrent refresh calls for the same account - the second caller
// awaits the first refresh rather than triggering a parallel token rotation race.
const inflight = new Map<string, Promise<Result<string, RefreshError>>>();

/**
 * Refresh the account's access token with the provider's strategy and persist it.
 * Provider-agnostic: everything that differs per provider comes from `strategy`.
 *
 * Error codes:
 * - TOKEN_REFRESH_REVOKED: provider returned 401/403 - user must re-authorize
 * - TOKEN_REFRESH_NETWORK_ERROR: network/5xx failure - transient, safe to retry
 * - TOKEN_REFRESH_FAILED: malformed provider response, missing refresh token,
 *   or a provider whose credential cannot be refreshed
 */
async function doRefresh(
  account: OAuthAccountRow,
  strategy: TokenRefreshStrategy,
): Promise<Result<string, RefreshError>> {
  if (!strategy.refreshable) return { ok: false, error: 'TOKEN_REFRESH_FAILED' };
  if (!account.refreshTokenEnc) return { ok: false, error: 'TOKEN_REFRESH_FAILED' };

  const refreshToken = await decryptToken(account.refreshTokenEnc);

  let res: Response;
  try {
    res = await fetchWithTimeout(strategy.refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...strategy.buildHeaders() },
      body: strategy.buildBody(refreshToken),
    });
  } catch {
    return { ok: false, error: 'TOKEN_REFRESH_NETWORK_ERROR' };
  }

  if (!res.ok) {
    // 401/403 means the refresh token is revoked or expired - user must re-authorize.
    // 5xx or other codes are transient provider errors - safe to retry later.
    return {
      ok: false,
      error: res.status === 401 || res.status === 403 ? 'TOKEN_REFRESH_REVOKED' : 'TOKEN_REFRESH_NETWORK_ERROR',
    };
  }

  const parsed = strategy.parseResponse(await res.json());
  if (!parsed) return { ok: false, error: 'TOKEN_REFRESH_FAILED' };

  const { accessToken, expiresInSec } = parsed;
  const newAccessEnc = await encryptToken(accessToken);
  const newExpiry = new Date(Date.now() + expiresInSec * 1000);

  await db
    .update(oauthAccounts)
    .set({ accessTokenEnc: newAccessEnc, tokenExpiresAt: newExpiry, updatedAt: new Date() })
    .where(eq(oauthAccounts.id, account.id));

  return { ok: true, data: accessToken };
}

/**
 * Return a valid decrypted access token for the given account.
 * Automatically refreshes, via the provider's strategy, if the current one
 * expires within TOKEN_REFRESH_BUFFER_MS. Updates the DB on refresh.
 * Concurrent calls for the same account share a single in-flight refresh promise.
 */
export async function getValidAccessToken(
  account: OAuthAccountRow,
  strategy: TokenRefreshStrategy,
): Promise<Result<string, RefreshError>> {
  const expiresAt = account.tokenExpiresAt ? new Date(account.tokenExpiresAt) : null;
  const isStillValid = expiresAt && expiresAt.getTime() - Date.now() > TOKEN_REFRESH_BUFFER_MS;

  if (isStillValid) return { ok: true, data: await decryptToken(account.accessTokenEnc) };

  const existing = inflight.get(account.id);
  if (existing) return existing;

  const promise = doRefresh(account, strategy).finally(() => inflight.delete(account.id));
  inflight.set(account.id, promise);
  return promise;
}
