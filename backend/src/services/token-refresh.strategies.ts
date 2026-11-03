import { z } from 'zod';
import { GOOGLE_TOKEN_URL, SPOTIFY_TOKEN_URL } from '../types/constants.js';
import type { OAuthProvider } from '../types/oauth.types.js';

/**
 * Per-provider knowledge of how to refresh a provider OAuth access token.
 *
 * The refresh service (token-refresh.service.ts) owns everything provider-agnostic:
 * the expiry check, in-flight de-duplication, decrypting the stored refresh token,
 * the POST itself, mapping HTTP failures to error codes, and the encrypted DB write.
 * A strategy owns only what differs between providers: where to POST, which extra
 * headers and form fields to send, and how to read the response.
 *
 * Not every provider's credential can be refreshed (GitHub uses a Personal Access
 * Token), so that is part of the type rather than a special case in the caller.
 */
export type TokenRefreshStrategy = RefreshableTokenStrategy | NonRefreshableTokenStrategy;

export interface RefreshableTokenStrategy {
  readonly provider: OAuthProvider;
  readonly refreshable: true;
  /** The provider's token endpoint. */
  readonly refreshUrl: string;
  /** Headers added to `Content-Type: application/x-www-form-urlencoded` (e.g. client auth). */
  buildHeaders(): Record<string, string>;
  /** The full form body for a refresh_token grant. */
  buildBody(refreshToken: string): URLSearchParams;
  /** The new access token and its lifetime, or null when the response is malformed. */
  parseResponse(json: unknown): RefreshResult | null;
}

export interface NonRefreshableTokenStrategy {
  readonly provider: OAuthProvider;
  readonly refreshable: false;
}

export interface RefreshResult {
  accessToken: string;
  /** Lifetime of the new access token, in seconds (OAuth `expires_in`). */
  expiresInSec: number;
}

const standardTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
});

/** Parses an RFC 6749 section 5.1 token response; both Google and Spotify use it. */
export function parseStandardTokenResponse(json: unknown): RefreshResult | null {
  const parsed = standardTokenResponseSchema.safeParse(json);
  if (!parsed.success) return null;
  return { accessToken: parsed.data.access_token, expiresInSec: parsed.data.expires_in };
}

/** grant_type and refresh_token first, then provider fields, in that order. */
function refreshTokenGrant(refreshToken: string, extra: Record<string, string> = {}): URLSearchParams {
  return new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, ...extra });
}

/** Google: client credentials go in the form body. */
export function googleRefreshStrategy(creds: { clientId: string; clientSecret: string }): RefreshableTokenStrategy {
  return {
    provider: 'google',
    refreshable: true,
    refreshUrl: GOOGLE_TOKEN_URL,
    buildHeaders: () => ({}),
    buildBody: (refreshToken) =>
      refreshTokenGrant(refreshToken, { client_id: creds.clientId, client_secret: creds.clientSecret }),
    parseResponse: parseStandardTokenResponse,
  };
}

/**
 * Spotify, legacy shared-app connection: client credentials as HTTP Basic auth.
 * Unset credentials are interpolated as-is ("undefined"), exactly as before the
 * strategy refactor; Spotify then rejects the refresh.
 */
export function spotifySharedAppRefreshStrategy(creds: {
  clientId: string | undefined;
  clientSecret: string | undefined;
}): RefreshableTokenStrategy {
  return {
    provider: 'spotify',
    refreshable: true,
    refreshUrl: SPOTIFY_TOKEN_URL,
    buildHeaders: () => ({
      Authorization: `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')}`,
    }),
    buildBody: (refreshToken) => refreshTokenGrant(refreshToken),
    parseResponse: parseStandardTokenResponse,
  };
}

/** Spotify, PKCE (bring-your-own-app) connection: the user's client_id in the body, no Authorization. */
export function spotifyPkceRefreshStrategy(clientId: string): RefreshableTokenStrategy {
  return {
    provider: 'spotify',
    refreshable: true,
    refreshUrl: SPOTIFY_TOKEN_URL,
    buildHeaders: () => ({}),
    buildBody: (refreshToken) => refreshTokenGrant(refreshToken, { client_id: clientId }),
    parseResponse: parseStandardTokenResponse,
  };
}

/**
 * GitHub is connected with a Personal Access Token: there is no refresh token and
 * no token endpoint. github.service reads the PAT directly and does not route through
 * the refresh service; this strategy exists so every OAuthProvider has an honest
 * answer. Asked to refresh, the service fails with TOKEN_REFRESH_FAILED without any
 * network call - the same outcome as a refreshable account with no refresh token.
 */
export const githubPatStrategy: NonRefreshableTokenStrategy = {
  provider: 'github',
  refreshable: false,
};
