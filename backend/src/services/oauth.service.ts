import crypto from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { oauthStates, oauthAccounts } from '../db/schema.js';
import { encryptToken } from '../lib/crypto.js';
import { config } from '../config.js';
import {
  OAUTH_STATE_TTL_MS,
  GOOGLE_TOKEN_URL,
  GOOGLE_USERINFO_URL,
  SPOTIFY_TOKEN_URL,
} from '../types/constants.js';
import type { OAuthProvider, OAuthPurpose, OAuthStateRecord, OAuthTokenSet, OAuthError } from '../types/oauth.types.js';
import type { Result } from '../types/auth.types.js';

// ── State management ──────────────────────────────────────────────────────

/** Create a CSRF state token for an OAuth flow and persist it. Returns the state string. */
export async function createOAuthState(
  provider: OAuthProvider,
  purpose: OAuthPurpose,
  userId?: string,
  clientId?: string,
): Promise<string> {
  const state = crypto.randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MS);
  await db.insert(oauthStates).values({ state, provider, purpose, userId: userId ?? null, clientId: clientId ?? null, expiresAt });
  return state;
}

/**
 * Verify a state token, mark it as used, and return the record.
 * Returns an error if the state is invalid, expired, or already consumed.
 */
export async function verifyAndConsumeOAuthState(
  state: string,
  provider: OAuthProvider,
  purpose: OAuthPurpose,
): Promise<Result<OAuthStateRecord, OAuthError>> {
  const [row] = await db
    .select()
    .from(oauthStates)
    .where(and(eq(oauthStates.state, state), eq(oauthStates.provider, provider), eq(oauthStates.used, false)))
    .limit(1);

  if (!row) return { ok: false, error: 'STATE_INVALID' };
  if (new Date(row.expiresAt) < new Date()) return { ok: false, error: 'STATE_EXPIRED' };
  if (row.purpose !== purpose) return { ok: false, error: 'STATE_INVALID' };

  await db.update(oauthStates).set({ used: true }).where(eq(oauthStates.id, row.id));

  return {
    ok: true,
    data: {
      id: row.id,
      userId: row.userId,
      provider: row.provider as OAuthProvider,
      purpose: row.purpose,
      clientId: row.clientId ?? null,
    },
  };
}

// ── Token storage ─────────────────────────────────────────────────────────

/** Encrypt and upsert OAuth tokens for a user+provider in the DB. */
export async function storeOAuthTokens(
  userId: string,
  provider: OAuthProvider,
  tokens: OAuthTokenSet,
): Promise<void> {
  const accessTokenEnc = await encryptToken(tokens.accessToken);
  const refreshTokenEnc = tokens.refreshToken ? await encryptToken(tokens.refreshToken) : null;
  const tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
  const scopes = tokens.scope?.split(' ') ?? [];
  const providerClientId = tokens.providerClientId ?? null;

  await db
    .insert(oauthAccounts)
    .values({ userId, provider, providerUserId: tokens.providerUserId, accessTokenEnc, refreshTokenEnc, tokenExpiresAt, scopes, providerClientId })
    .onConflictDoUpdate({
      target: [oauthAccounts.provider, oauthAccounts.providerUserId],
      set: {
        userId,
        accessTokenEnc,
        ...(refreshTokenEnc ? { refreshTokenEnc } : {}),
        tokenExpiresAt,
        scopes,
        providerClientId,
        updatedAt: new Date(),
      },
    });
}

// ── Account existence check ───────────────────────────────────────────────

/** Returns true if the user already has an OAuth row for the given provider. */
export async function hasOAuthAccount(userId: string, provider: OAuthProvider): Promise<boolean> {
  const [row] = await db
    .select({ id: oauthAccounts.id })
    .from(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, provider)))
    .limit(1);
  return !!row;
}

/**
 * Check whether a provider account (identified by providerUserId) is already
 * linked to a WindoM user — and if so, whether it's the same user or a different one.
 *
 * - 'none'       → no existing link, safe to insert
 * - 'same_user'  → already linked to this user, safe to update
 * - 'other_user' → linked to a different user — must reject
 */
export async function checkOAuthConflict(
  userId: string,
  provider: OAuthProvider,
  providerUserId: string,
): Promise<'none' | 'same_user' | 'other_user'> {
  const [row] = await db
    .select({ userId: oauthAccounts.userId })
    .from(oauthAccounts)
    .where(and(eq(oauthAccounts.provider, provider), eq(oauthAccounts.providerUserId, providerUserId)))
    .limit(1);

  if (!row) return 'none';
  return row.userId === userId ? 'same_user' : 'other_user';
}

// ── Google code exchange ──────────────────────────────────────────────────

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  error?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
}

/**
 * Exchange a Google auth code for tokens and fetch the user's profile.
 * Used by both the login flow (auth-google) and the calendar link flow (oauth-google).
 */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<Result<{ tokens: GoogleTokenResponse; userInfo: GoogleUserInfo }, OAuthError>> {
  let tokenRes: Response;
  try {
    tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
  } catch {
    return { ok: false, error: 'TOKEN_EXCHANGE_FAILED' };
  }

  const tokens = (await tokenRes.json()) as GoogleTokenResponse;
  if (!tokens.access_token || tokens.error) return { ok: false, error: 'TOKEN_EXCHANGE_FAILED' };

  let userInfo: GoogleUserInfo;
  try {
    const infoRes = await fetch(GOOGLE_USERINFO_URL, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    userInfo = (await infoRes.json()) as GoogleUserInfo;
  } catch {
    return { ok: false, error: 'USERINFO_FAILED' };
  }

  return { ok: true, data: { tokens, userInfo } };
}

// ── Spotify code exchange ─────────────────────────────────────────────────

interface SpotifyTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  error?: string;
}

function spotifyBasicAuth(): string {
  return `Basic ${Buffer.from(`${config.SPOTIFY_CLIENT_ID}:${config.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`;
}

/** Exchange a Spotify auth code for tokens and fetch the Spotify user ID. */
export async function exchangeSpotifyCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string,
  pkceClientId?: string,
): Promise<Result<SpotifyTokenResponse & { providerUserId: string }, OAuthError>> {
  let tokenRes: Response;
  try {
    const isPkce = codeVerifier !== undefined && pkceClientId !== undefined;
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (!isPkce) headers['Authorization'] = spotifyBasicAuth();

    const bodyParams: Record<string, string> = { code, redirect_uri: redirectUri, grant_type: 'authorization_code' };
    if (isPkce) {
      bodyParams['client_id'] = pkceClientId!;
      bodyParams['code_verifier'] = codeVerifier!;
    }

    tokenRes = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers,
      body: new URLSearchParams(bodyParams),
    });
  } catch {
    return { ok: false, error: 'TOKEN_EXCHANGE_FAILED' };
  }

  const tokens = (await tokenRes.json()) as SpotifyTokenResponse;
  if (!tokens.access_token || tokens.error) return { ok: false, error: 'TOKEN_EXCHANGE_FAILED' };

  let providerUserId: string;
  try {
    const meRes = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const me = (await meRes.json()) as { id: string };
    providerUserId = me.id;
  } catch {
    return { ok: false, error: 'USERINFO_FAILED' };
  }

  return { ok: true, data: { ...tokens, providerUserId } };
}
