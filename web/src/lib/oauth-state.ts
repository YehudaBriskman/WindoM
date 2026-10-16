export type OAuthFlow = 'google' | 'spotify';

const keyFor = (flow: OAuthFlow): string => `windom_oauth_state_${flow}`;

export function rememberOAuthState(authUrl: string, flow: OAuthFlow): string {
  const state = new URL(authUrl).searchParams.get('state');
  if (!state) throw new Error('OAuth authorization URL did not include state');
  sessionStorage.setItem(keyFor(flow), state);
  return state;
}

export function validateAndConsumeOAuthState(returnedState: string | null, flow: OAuthFlow): void {
  const key = keyFor(flow);
  const expectedState = sessionStorage.getItem(key);
  sessionStorage.removeItem(key);

  if (!returnedState) throw new Error('OAuth callback did not include state');
  if (!expectedState) throw new Error('OAuth session state is missing or already used');
  if (returnedState !== expectedState) throw new Error('OAuth state mismatch');
}

export function clearOAuthState(flow: OAuthFlow): void {
  sessionStorage.removeItem(keyFor(flow));
}
