// ── Auth / session ─────────────────────────────────────────────────────────

/** Sliding window duration for each refresh token. */
export const REFRESH_WINDOW_DAYS = 7;

/**
 * Max rotations before forcing re-login.
 * With a 15-min access token TTL, a user refreshing every 15 min hits this after
 * (MAX_RENEWALS × 15 min). Set to 2016 ≈ 3 weeks of continuous active use.
 * The 7-day sliding expiresAt window handles inactive sessions automatically.
 */
export const MAX_RENEWALS = 2016;

/** bcrypt rounds for password and token hashing. */
export const BCRYPT_ROUNDS = 10;

/** Access token lifetime passed to jose. */
export const ACCESS_TOKEN_TTL = '15m';

/** Cookie name for the HttpOnly refresh token. */
export const COOKIE_NAME = 'windom_refresh';

/** Cookie maxAge in seconds — matches REFRESH_WINDOW_DAYS. */
export const COOKIE_MAX_AGE_SECONDS = REFRESH_WINDOW_DAYS * 24 * 60 * 60;

// ── OAuth ─────────────────────────────────────────────────────────────────

/** TTL for OAuth CSRF state tokens (10 minutes). */
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

/** Refresh an OAuth token this many ms before its expiry. */
export const TOKEN_REFRESH_BUFFER_MS = 60_000;

// ── External APIs ─────────────────────────────────────────────────────────

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
export const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
export const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
export const SPOTIFY_API = 'https://api.spotify.com/v1';

export const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-top-read',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'openid',
  'email',
  'profile',
].join(' ');

// ── Business limits ───────────────────────────────────────────────────────

export const MAX_CALENDAR_DAYS = 30;
export const DEFAULT_CALENDAR_DAYS = 7;
export const MAX_CALENDAR_RESULTS = 50;
export const MAX_TOP_TRACKS = 50;
export const DEFAULT_TOP_TRACKS = 10;
