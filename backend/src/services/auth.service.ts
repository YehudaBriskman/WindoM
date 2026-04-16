import { eq, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signAccessToken } from '../lib/jwt.js';
import {
  createSession,
  findSessionByToken,
  hasChildSession,
  isRenewalCapReached,
  revokeSession,
  revokeAllUserSessions,
} from './session.service.js';
import { sendVerification } from './auth-email.service.js';
import { logger } from '../lib/logger.js';
import type { Result, TokenPair, SessionMeta, AuthError } from '../types/auth.types.js';

/** Register a new user with email + password. Returns TOKEN_PAIR or EMAIL_TAKEN. */
export async function register(
  email: string,
  password: string,
  name: string,
  meta: SessionMeta,
): Promise<Result<TokenPair, AuthError>> {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return { ok: false, error: 'EMAIL_TAKEN' };

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ email, name, passwordHash }).returning();

  // Send verification email — fire-and-forget so register doesn't fail on email errors
  void sendVerification(user.id).catch((err) => logger.error({ err }, 'register: verification email failed'));

  const accessToken = await signAccessToken({ sub: user.id, email: user.email, name: user.name, emailVerified: false });
  const rawRefreshToken = await createSession(user.id, meta);
  return { ok: true, data: { accessToken, rawRefreshToken } };
}

/** Authenticate with email + password. Returns TOKEN_PAIR or INVALID_CREDENTIALS. */
export async function login(
  email: string,
  password: string,
  meta: SessionMeta,
): Promise<Result<TokenPair, AuthError>> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Constant-time rejection — prevents timing attacks that reveal whether email exists
  const dummyHash = '$2b$12$invalidhashpadding000000000000000000000000000000000000';
  const passwordOk = user?.passwordHash
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, dummyHash).then(() => false);

  if (!user || !passwordOk) return { ok: false, error: 'INVALID_CREDENTIALS' };

  const accessToken = await signAccessToken({ sub: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified });
  const rawRefreshToken = await createSession(user.id, meta);
  return { ok: true, data: { accessToken, rawRefreshToken } };
}

/**
 * Rotate a refresh token and issue a new access token.
 * Detects reuse and enforces the renewal cap.
 */
export async function refresh(
  rawToken: string,
  meta: SessionMeta,
): Promise<Result<TokenPair, AuthError>> {
  const session = await findSessionByToken(rawToken);
  if (!session) {
    logger.warn('refresh: SESSION_NOT_FOUND — token revoked, expired, or invalid (may be a multi-tab race)');
    return { ok: false, error: 'SESSION_NOT_FOUND' };
  }

  if (isRenewalCapReached(session.renewalCount)) {
    logger.warn({ sessionId: session.id, renewalCount: session.renewalCount }, 'refresh: SESSION_LIMIT_REACHED');
    await revokeSession(session.id);
    return { ok: false, error: 'SESSION_LIMIT_REACHED' };
  }

  // Token reuse: if a child session already exists, the old cookie was replayed
  if (await hasChildSession(session.id)) {
    logger.error({ sessionId: session.id, userId: session.userId }, 'refresh: TOKEN_REUSE_DETECTED — revoking ALL sessions for user');
    await revokeAllUserSessions(session.userId);
    return { ok: false, error: 'TOKEN_REUSE_DETECTED' };
  }

  logger.warn({ sessionId: session.id, renewal: session.renewalCount + 1 }, 'refresh: rotating session');
  await revokeSession(session.id);

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) {
    logger.error({ userId: session.userId }, 'refresh: USER_NOT_FOUND');
    return { ok: false, error: 'USER_NOT_FOUND' };
  }

  const accessToken = await signAccessToken({ sub: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified });
  const rawRefreshToken = await createSession(user.id, meta, session.id, session.renewalCount + 1);
  logger.warn({ userId: user.id }, 'refresh: new session created');
  return { ok: true, data: { accessToken, rawRefreshToken } };
}

/** Revoke the session matching the given raw token (best-effort — no error if not found). */
export async function logout(rawToken: string): Promise<void> {
  const session = await findSessionByToken(rawToken);
  if (session) await revokeSession(session.id);
}

/**
 * Upsert a user from a Google OAuth sign-in and create a session.
 * Always succeeds — Google has already authenticated the user.
 */
export async function loginWithGoogle(
  googleEmail: string,
  googleName: string,
  meta: SessionMeta,
): Promise<TokenPair> {
  // On conflict (existing account with same email): preserve the user's name if already set.
  // Only overwrite with Google name when the account has no name yet (empty string default).
  const [user] = await db
    .insert(users)
    .values({ email: googleEmail, name: googleName, emailVerified: true })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: sql`CASE WHEN ${users.name} = '' THEN EXCLUDED.name ELSE ${users.name} END`,
        emailVerified: true,
      },
    })
    .returning();

  const accessToken = await signAccessToken({ sub: user.id, email: user.email, name: user.name, emailVerified: true });
  const rawRefreshToken = await createSession(user.id, meta);
  return { accessToken, rawRefreshToken };
}
