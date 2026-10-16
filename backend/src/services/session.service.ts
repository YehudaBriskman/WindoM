import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { refreshSessions } from '../db/schema.js';
import { REFRESH_WINDOW_DAYS, MAX_RENEWALS, BCRYPT_ROUNDS } from '../types/constants.js';
import type { SessionMeta } from '../types/auth.types.js';

type SessionRow = typeof refreshSessions.$inferSelect;

/** SHA-256 of raw token - used as a fast indexed lookup key. */
function sha256Hex(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new refresh session in the DB and return the raw (un-hashed) token.
 * The raw token is set in the HttpOnly cookie; only its hashes are stored.
 */
export async function createSession(
  userId: string,
  meta: SessionMeta,
  rotatedFromId?: string,
  renewalCount = 0,
): Promise<string> {
  const rawToken = crypto.randomBytes(48).toString('base64url');
  const tokenLookup = sha256Hex(rawToken);
  const tokenHash = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(refreshSessions).values({
    userId,
    tokenHash,
    tokenLookup,
    rotatedFromId: rotatedFromId ?? null,
    ip: sha256Hex(meta.ip),
    userAgent: sha256Hex(meta.userAgent),
    expiresAt,
    renewalCount,
  });

  return rawToken;
}

/**
 * Find a valid (non-revoked, non-expired) session by raw token.
 * Uses SHA-256 index for O(1) DB lookup, then bcrypt to authenticate.
 * Returns null if the token is invalid, expired, or revoked.
 */
export async function findSessionByToken(rawToken: string): Promise<SessionRow | null> {
  const [session] = await db
    .select()
    .from(refreshSessions)
    .where(eq(refreshSessions.tokenLookup, sha256Hex(rawToken)))
    .limit(1);

  if (!session) return null;
  if (session.revokedAt !== null) return null;
  if (new Date(session.expiresAt) < new Date()) return null;

  // bcrypt verify authenticates the lookup - prevents SHA-256 preimage attacks
  const valid = await bcrypt.compare(rawToken, session.tokenHash);
  return valid ? session : null;
}

/** Check whether a session already has a rotated child (token reuse detection). */
export async function hasChildSession(sessionId: string): Promise<boolean> {
  const [child] = await db
    .select({ id: refreshSessions.id })
    .from(refreshSessions)
    .where(eq(refreshSessions.rotatedFromId, sessionId))
    .limit(1);
  return !!child;
}

/** Whether a session has hit the renewal cap and must force re-login. */
export function isRenewalCapReached(renewalCount: number): boolean {
  return renewalCount >= MAX_RENEWALS;
}

export async function revokeSession(id: string): Promise<void> {
  await db.update(refreshSessions).set({ revokedAt: new Date() }).where(eq(refreshSessions.id, id));
}

/** Revoke every active session for a user (used on token reuse detection). */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db
    .update(refreshSessions)
    .set({ revokedAt: new Date() })
    .where(eq(refreshSessions.userId, userId));
}

export type SessionRotationError =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_LIMIT_REACHED'
  | 'TOKEN_REUSE_DETECTED';

export type SessionRotationResult =
  | { ok: true; rawRefreshToken: string }
  | { ok: false; error: SessionRotationError };

/**
 * Atomically revoke one refresh session and create its replacement.
 *
 * The row-level lock serializes concurrent rotations of the same session. The
 * revocation and replacement insert commit together, so a DB error can never
 * leave a valid client without either its old token or its replacement.
 */
export async function rotateSessionAtomically(
  sessionId: string,
  userId: string,
  meta: SessionMeta,
  renewalCount: number,
): Promise<SessionRotationResult> {
  // Hashing is intentionally outside the transaction to keep the row lock short.
  const rawRefreshToken = crypto.randomBytes(48).toString('base64url');
  const tokenLookup = sha256Hex(rawRefreshToken);
  const tokenHash = await bcrypt.hash(rawRefreshToken, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  return db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(refreshSessions)
      .where(eq(refreshSessions.id, sessionId))
      .for('update')
      .limit(1);

    if (
      !session ||
      session.userId !== userId ||
      session.revokedAt !== null ||
      new Date(session.expiresAt) < new Date()
    ) {
      return { ok: false, error: 'SESSION_NOT_FOUND' };
    }

    if (isRenewalCapReached(session.renewalCount)) {
      await tx
        .update(refreshSessions)
        .set({ revokedAt: new Date() })
        .where(eq(refreshSessions.id, session.id));
      return { ok: false, error: 'SESSION_LIMIT_REACHED' };
    }

    const [child] = await tx
      .select({ id: refreshSessions.id })
      .from(refreshSessions)
      .where(eq(refreshSessions.rotatedFromId, session.id))
      .limit(1);

    if (child) {
      await tx
        .update(refreshSessions)
        .set({ revokedAt: new Date() })
        .where(eq(refreshSessions.userId, userId));
      return { ok: false, error: 'TOKEN_REUSE_DETECTED' };
    }

    await tx
      .update(refreshSessions)
      .set({ revokedAt: new Date() })
      .where(eq(refreshSessions.id, session.id));

    await tx.insert(refreshSessions).values({
      userId,
      tokenHash,
      tokenLookup,
      rotatedFromId: session.id,
      ip: sha256Hex(meta.ip),
      userAgent: sha256Hex(meta.userAgent),
      expiresAt,
      renewalCount,
    });

    return { ok: true, rawRefreshToken };
  });
}
