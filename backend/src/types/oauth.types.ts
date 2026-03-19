export type OAuthProvider = 'google' | 'spotify';

export type OAuthPurpose = 'login' | 'link';

export type OAuthError =
  | 'STATE_INVALID'
  | 'STATE_EXPIRED'
  | 'NOT_CONNECTED'
  | 'TOKEN_EXCHANGE_FAILED'
  | 'USERINFO_FAILED'
  | 'TOKEN_REFRESH_FAILED'
  | 'NO_REDIRECT_URI'
  | 'API_ERROR'
  | 'FORBIDDEN';

/** Verified + consumed OAuth state record returned by verifyAndConsumeOAuthState. */
export interface OAuthStateRecord {
  id: string;
  userId: string | null;
  provider: OAuthProvider;
  purpose: OAuthPurpose;
}

/** Decrypted OAuth tokens ready to store in the DB. */
export interface OAuthTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope?: string;
  providerUserId: string;
}
