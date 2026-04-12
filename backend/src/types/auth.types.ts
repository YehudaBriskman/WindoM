// ── Result type ────────────────────────────────────────────────────────────

/** Discriminated union for service return values — avoids throwing for expected errors. */
export type Result<T, E extends string = string> = { ok: true; data: T } | { ok: false; error: E };

// ── Error codes ────────────────────────────────────────────────────────────

export type AuthError =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_TAKEN'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'SESSION_LIMIT_REACHED'
  | 'TOKEN_REUSE_DETECTED'
  | 'USER_NOT_FOUND';

// ── Value objects ──────────────────────────────────────────────────────────

/** Client metadata attached to every session for audit purposes. */
export interface SessionMeta {
  ip: string;
  userAgent: string;
}

/** Access token + raw (un-hashed) refresh token returned after login/refresh. */
export interface TokenPair {
  accessToken: string;
  rawRefreshToken: string;
}

/** User data returned by /me and stored in access token payload. */
export interface UserRecord {
  id: string;
  email: string | null;
  name: string;
  createdAt: Date;
  hasPassword: boolean;
}
