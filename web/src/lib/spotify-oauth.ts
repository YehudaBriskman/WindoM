/**
 * Spotify's side of the shared OAuth flow (#247): the user brings their own
 * Spotify Developer app, so the client ID is an argument to connect and is kept
 * in chrome.storage.local, and the flow uses PKCE (S256).
 */
import { mapIntegrationError, type OAuthProvider } from './oauth-connection';
import { generateCodeChallenge, generateCodeVerifier } from './pkce';

export const SPOTIFY_CLIENT_ID_KEY = 'windom_spotify_client_id';

export const SPOTIFY_OAUTH: OAuthProvider<string> = {
  id: 'spotify',
  async start(redirectUri, clientId) {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    return {
      path: '/oauth/spotify/start',
      body: { clientId, codeChallenge, codeChallengeMethod: 'S256', redirectUri },
      exchange: { codeVerifier },
    };
  },
};

export async function loadSpotifyClientId(): Promise<string> {
  const result = await chrome.storage.local.get(SPOTIFY_CLIENT_ID_KEY);
  return (result[SPOTIFY_CLIENT_ID_KEY] as string | undefined) ?? '';
}

export async function saveSpotifyClientId(clientId: string): Promise<void> {
  await chrome.storage.local.set({ [SPOTIFY_CLIENT_ID_KEY]: clientId });
}

export async function clearSpotifyClientId(): Promise<void> {
  await chrome.storage.local.remove(SPOTIFY_CLIENT_ID_KEY);
}

/**
 * Spotify's own wording first (a cancel, a bad client ID, not signed in), then
 * the shared integration mapping, so a network failure reads the same as it
 * does for Google rather than surfacing a raw "Failed to fetch".
 */
export function mapSpotifyConnectError(err: unknown, signedIn: boolean): string {
  const msg = err instanceof Error ? err.message : 'Connection failed';
  if (/cancelled|canceled/i.test(msg)) return 'Connection cancelled.';
  if (/invalid_client|Invalid Client/i.test(msg)) {
    return 'Invalid Client ID - check your app settings at developer.spotify.com.';
  }
  if (!signedIn) return 'You must be signed in to connect Spotify.';
  return mapIntegrationError(err);
}
