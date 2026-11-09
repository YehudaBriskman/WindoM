import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { and, eq, gt, isNull, lt, ne, or } from 'drizzle-orm';
import { db } from '../db/client.js';
import { refreshSessions } from '../db/schema.js';
import { REFRESH_WINDOW_DAYS, MAX_RENEWALS, BCRYPT_ROUNDS } from '../types/constants.js';
import type { SessionMeta } from '../types/auth.types.js';
import { config } from '../config.js';
import { parseDeviceLabel } from '../lib/device-label.js';

type SessionRow = typeof refreshSessions.$inferSelect;

export interface ActiveSession {
  id: string;
  deviceId: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  renewalCount: number;
  /** "Browser · OS", or null when the row predates labels or the UA was unrecognisable. */
  device: string | null;
  /** True for the session the caller's access token was issued with. */
  current: boolean;
}

function deviceLabelFor(meta: SessionMeta): string | null {
  return parseDeviceLabel(meta.userAgent, { brands: meta.uaBrands, platform: meta.uaPlatform });
}

/** SHA-256 of raw token - used as a fast indexed lookup key. */
function sha256Hex(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Keyed digest for client metadata (IP, User-Agent): HMAC-SHA-256 under a server secret.
 * Unsalted SHA-256 of an IPv4 address is brute-forceable (2^32 inputs); without the key
 * the stored value cannot be reversed. The key is derived from REFRESH_TOKEN_SECRET with a
 * domain-separation label so it is never used raw for another purpose.
 *
 * Compatibility: rows written before this change hold plain SHA-256 digests and are not
 * migrated; they will not match new digests. Only correlation of old sessions is affected.
 */
function metaDigest(value: string): string {
  const key = crypto.createHmac('sha256', config.REFRESH_TOKEN_SECRET).update('windom:meta-digest:v1').digest();
  return crypto.createHmac('sha256', key).update(value).digest('hex');
}

/**
 * Grace period after a session expires or is revoked before its row is deleted. Keeps
 * recently ended rows around for token-reuse detection and support, then drops them.
 */
export const SESSION_PURGE_GRACE_DAYS = 30;

/** Delete sessions that expired or were revoked more than the grace period ago. */
export async function purgeStaleSessions(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - SESSION_PURGE_GRACE_DAYS * 24 * 60 * 60 * 1000);
  const deleted = await db
    .delete(refreshSessions)
    .where(or(lt(refreshSessions.expiresAt, cutoff), lt(refreshSessions.revokedAt, cutoff)))
    .returning({ id: refreshSessions.id });
  return deleted.length;
}

/**
 * Create a new refresh session in the DB and return the raw (un-hashed) token.
 * The raw token is set in the HttpOnly cookie; only its hashes are stored.
 * Pass `id` to choose the row ID up front, so an access token can name its session.
 */
export async function createSession(
  userId: string,
  meta: SessionMeta,
  rotatedFromId?: string,
  renewalCount = 0,
  id?: string,
): Promise<string> {
  const rawToken = crypto.randomBytes(48).toString('base64url');
  const tokenLookup = sha256Hex(rawToken);
  const tokenHash = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(refreshSessions).values({
    ...(id ? { id } : {}),
    userId,
    tokenHash,
    tokenLookup,
    rotatedFromId: rotatedFromId ?? null,
    ip: metaDigest(meta.ip),
    userAgent: metaDigest(meta.userAgent),
    deviceLabel: deviceLabelFor(meta),
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
  await db.update(refreshSessions).set({ revokedAt: new Date() }).where(eq(refreshSessions.userId, userId));
}

/**
 * List only active sessions, exposing a coarse device label rather than raw client data.
 * The caller's own session comes first, then the most recently renewed.
 */
export async function listActiveSessions(userId: string, currentSessionId?: string): Promise<ActiveSession[]> {
  const rows = await db
    .select({
      id: refreshSessions.id,
      userAgent: refreshSessions.userAgent,
      deviceLabel: refreshSessions.deviceLabel,
      createdAt: refreshSessions.createdAt,
      expiresAt: refreshSessions.expiresAt,
      renewalCount: refreshSessions.renewalCount,
    })
    .from(refreshSessions)
    .where(
      and(
        eq(refreshSessions.userId, userId),
        isNull(refreshSessions.revokedAt),
        gt(refreshSessions.expiresAt, new Date()),
      ),
    );

  return rows
    .map((row) => ({
      id: row.id,
      deviceId: row.userAgent.slice(0, 12),
      createdAt: row.createdAt,
      // Refresh rotation creates a new row, so the active row's creation marks last use.
      lastUsedAt: row.createdAt,
      expiresAt: row.expiresAt,
      renewalCount: row.renewalCount,
      device: row.deviceLabel,
      current: currentSessionId !== undefined && row.id === currentSessionId,
    }))
    .sort((a, b) => Number(b.current) - Number(a.current) || b.lastUsedAt.getTime() - a.lastUsedAt.getTime());
}

/** Revoke every active session of the user except the caller's own. Returns how many ended. */
export async function revokeOtherSessions(userId: string, currentSessionId: string): Promise<number> {
  const revoked = await db
    .update(refreshSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshSessions.userId, userId),
        ne(refreshSessions.id, currentSessionId),
        isNull(refreshSessions.revokedAt),
        gt(refreshSessions.expiresAt, new Date()),
      ),
    )
    .returning({ id: refreshSessions.id });
  return revoked.length;
}

/** Revoke one active session only when it belongs to the authenticated user. */
export async function revokeOwnedSession(userId: string, sessionId: string): Promise<boolean> {
  const revoked = await db
    .update(refreshSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshSessions.id, sessionId),
        eq(refreshSessions.userId, userId),
        isNull(refreshSessions.revokedAt),
        gt(refreshSessions.expiresAt, new Date()),
      ),
    )
    .returning({ id: refreshSessions.id });
  return revoked.length > 0;
}

export type SessionRotationError = 'SESSION_NOT_FOUND' | 'SESSION_LIMIT_REACHED' | 'TOKEN_REUSE_DETECTED';

export type SessionRotationResult =
  { ok: true; rawRefreshToken: string; sessionId: string } | { ok: false; error: SessionRotationError };

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
  const newSessionId = crypto.randomUUID();

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
      await tx.update(refreshSessions).set({ revokedAt: new Date() }).where(eq(refreshSessions.id, session.id));
      return { ok: false, error: 'SESSION_LIMIT_REACHED' };
    }

    const [child] = await tx
      .select({ id: refreshSessions.id })
      .from(refreshSessions)
      .where(eq(refreshSessions.rotatedFromId, session.id))
      .limit(1);

    if (child) {
      await tx.update(refreshSessions).set({ revokedAt: new Date() }).where(eq(refreshSessions.userId, userId));
      return { ok: false, error: 'TOKEN_REUSE_DETECTED' };
    }

    await tx.update(refreshSessions).set({ revokedAt: new Date() }).where(eq(refreshSessions.id, session.id));

    await tx.insert(refreshSessions).values({
      id: newSessionId,
      userId,
      tokenHash,
      tokenLookup,
      rotatedFromId: session.id,
      ip: metaDigest(meta.ip),
      userAgent: metaDigest(meta.userAgent),
      deviceLabel: deviceLabelFor(meta),
      expiresAt,
      renewalCount,
    });

    return { ok: true, rawRefreshToken, sessionId: newSessionId };
  });
}
