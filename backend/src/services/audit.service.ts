import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { db } from '../db/client.js';
import { auditLogs, type AuditAction } from '../db/schema.js';
import { parseDeviceLabel } from '../lib/device-label.js';
import { logger } from '../lib/logger.js';
import { purgeStaleSessions } from './session.service.js';
import type { SessionMeta } from '../types/auth.types.js';

/**
 * Security log of sensitive account actions (#232).
 *
 * What a row holds is fixed by the table: user, action, time, session id and a coarse
 * "Browser · OS" label. The request metadata passed in is used only to derive that label;
 * the IP and the raw User-Agent are never written.
 *
 * Retention: rows older than AUDIT_RETENTION_DAYS are deleted. The backend has no scheduler
 * or periodic job, so the purge runs opportunistically from recordAudit(), at most once per
 * AUDIT_PURGE_INTERVAL_MS per process. Any write after the interval triggers it, and the
 * DELETE is idempotent, so several machines purging is harmless.
 */

export const AUDIT_RETENTION_DAYS = 180;
const AUDIT_PURGE_INTERVAL_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

let lastPurgeAt = 0;

export interface AuditEntry {
  /** Null when there is no account to attribute the event to (unknown email, deleted account). */
  userId: string | null;
  sessionId?: string | null;
  /** Request metadata; only the derived device label is stored. */
  meta?: SessionMeta;
}

/**
 * Record one event. Never throws: a failed audit write is logged and the action it
 * describes goes ahead, because losing a log line is better than failing a sign-in.
 */
export async function recordAudit(action: AuditAction, entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId,
      action,
      sessionId: entry.sessionId ?? null,
      deviceLabel: entry.meta
        ? parseDeviceLabel(entry.meta.userAgent, { brands: entry.meta.uaBrands, platform: entry.meta.uaPlatform })
        : null,
    });
  } catch (err) {
    logger.error({ err, action }, 'audit: failed to record event');
  }

  if (Date.now() - lastPurgeAt >= AUDIT_PURGE_INTERVAL_MS) {
    lastPurgeAt = Date.now();
    await purgeExpiredAuditLogs().catch((err: unknown) => {
      logger.error({ err }, 'audit: retention purge failed');
    });
    // Same trigger for stale refresh sessions (expired/revoked past their grace period).
    try {
      await purgeStaleSessions();
    } catch (err: unknown) {
      logger.error({ err }, 'session: stale purge failed');
    }
  }
}

/** Delete audit rows older than the retention window. Returns how many were removed. */
export async function purgeExpiredAuditLogs(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - AUDIT_RETENTION_DAYS * DAY_MS);
  const deleted = await db.delete(auditLogs).where(lt(auditLogs.createdAt, cutoff)).returning({ id: auditLogs.id });
  return deleted.length;
}

export interface ActivityEntry {
  action: AuditAction;
  createdAt: Date;
  device: string | null;
  sessionId: string | null;
}

/** The caller's most recent events, newest first, within the retention window. */
export async function listUserActivity(userId: string, limit: number): Promise<ActivityEntry[]> {
  // Rows past retention may linger until the next purge; never show them.
  const cutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * DAY_MS);
  return db
    .select({
      action: auditLogs.action,
      createdAt: auditLogs.createdAt,
      device: auditLogs.deviceLabel,
      sessionId: auditLogs.sessionId,
    })
    .from(auditLogs)
    .where(and(eq(auditLogs.userId, userId), gte(auditLogs.createdAt, cutoff)))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
