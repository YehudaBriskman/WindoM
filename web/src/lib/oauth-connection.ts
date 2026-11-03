/**
 * The OAuth "connect an integration" flow shared by the Calendar, Gmail and
 * Spotify settings sections (#261).
 *
 * Every provider runs the same steps:
 *   1. POST /oauth/<id>/start            -> { authUrl }
 *   2. remember the `state` in the URL   (oauth-state.ts)
 *   3. chrome.identity.launchWebAuthFlow -> redirect URL
 *   4. reject `?error=`, require `?code=`, validate and consume `state`
 *   5. POST /oauth/<id>/exchange         -> { status: 'linked' }
 *
 * What differs between providers is data, not control flow, and lives in an
 * `OAuthProvider`: the start request (Google passes the redirect URI and the
 * requested features in the query; Spotify sends the user's client ID and a
 * PKCE challenge in the body) and any extra exchange fields (Spotify's PKCE
 * verifier).
 */
import { apiFetch, apiPost } from './api';
import { mapOAuthError } from './oauth-errors';
import { clearOAuthState, rememberOAuthState, validateAndConsumeOAuthState, type OAuthFlow } from './oauth-state';

export const WEB_AUTH_TIMEOUT_MS = 120_000;

export interface OAuthStart {
  /** Path of the POST that returns `{ authUrl }`, query string included. */
  path: string;
  /** JSON body of that POST; omitted means no body is sent. */
  body?: unknown;
  /** Extra fields for the exchange POST, appended after code/state/redirectUri. */
  exchange?: Record<string, string>;
}

export interface OAuthProvider<A = void> {
  /** Names the `/oauth/<id>/…` routes, the `/integrations/<id>` route and the state slot. */
  id: OAuthFlow;
  /** Builds the start request. `args` is whatever the caller passes to connect. */
  start(redirectUri: string, args: A): Promise<OAuthStart> | OAuthStart;
}

/** Opens the provider consent window and resolves with the redirect URL. */
export function launchWebAuth(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      reject(new Error('Sign-in timed out. Please try again.'));
    }, WEB_AUTH_TIMEOUT_MS);

    chrome.identity.launchWebAuthFlow({ url, interactive: true }, (redirectUrl) => {
      clearTimeout(timer);
      if (settled) return;
      if (chrome.runtime.lastError || !redirectUrl) {
        reject(new Error(mapOAuthError(chrome.runtime.lastError?.message ?? 'Auth cancelled')));
      } else {
        resolve(redirectUrl);
      }
    });
  });
}

/** Runs the whole connect flow; resolves once the backend reports the account linked. */
export async function runOAuthFlow<A>(provider: OAuthProvider<A>, args: A): Promise<void> {
  const redirectUri = chrome.identity.getRedirectURL();
  const start = await provider.start(redirectUri, args);
  const { authUrl } = await apiPost<{ authUrl: string }>(start.path, start.body);

  rememberOAuthState(authUrl, provider.id);
  try {
    const redirectUrl = await launchWebAuth(authUrl);
    const params = new URL(redirectUrl).searchParams;
    const oauthError = params.get('error');
    if (oauthError) throw new Error(mapOAuthError(oauthError));

    const code = params.get('code');
    const state = params.get('state');
    if (!code) throw new Error('No auth code returned');
    validateAndConsumeOAuthState(state, provider.id);

    const { status } = await apiPost<{ status: string }>(`/oauth/${provider.id}/exchange`, {
      code,
      state,
      redirectUri,
      ...start.exchange,
    });
    if (status !== 'linked') throw new Error('Linking failed');
  } finally {
    clearOAuthState(provider.id);
  }
}

/** Unlinks the provider on the backend; throws `failedMessage` on a non-2xx. */
export async function disconnectIntegration(id: OAuthFlow, failedMessage: string): Promise<void> {
  const res = await apiFetch(`/integrations/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(failedMessage);
}

/** User-facing text for a failed connect. */
export function mapIntegrationError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/already.linked|account already linked/i.test(msg)) return 'This account is already linked to a different user.';
  if (/network|fetch|connection|failed to fetch/i.test(msg)) return 'Connection failed. Check your internet and try again.';
  if (msg === 'access_denied' || msg.includes('access_denied')) return mapOAuthError(msg);
  if (msg && msg !== 'Failed') return msg;
  return 'Something went wrong. Please try again.';
}
