import type { OAuthProvider } from './oauth-connection';

/**
 * Google is one backend integration with two scope sets. Calendar asks for the
 * base scopes; Gmail asks for `features=gmail`, which grants Calendar too.
 * Both pass the redirect URI in the query and send no body.
 */
function googleProvider(features?: 'gmail'): OAuthProvider {
  return {
    id: 'google',
    start: (redirectUri) => ({
      path:
        `/oauth/google/start?redirectUri=${encodeURIComponent(redirectUri)}` +
        (features ? `&features=${features}` : ''),
    }),
  };
}

export const GOOGLE_CALENDAR_OAUTH = googleProvider();
export const GOOGLE_GMAIL_OAUTH = googleProvider('gmail');
