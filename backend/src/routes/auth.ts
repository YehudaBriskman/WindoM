import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'node:crypto';
import { db } from '../db/client.js';
import { users, refreshSessions } from '../db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signAccessToken } from '../lib/jwt.js';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';

const REFRESH_WINDOW_DAYS = 7;  // sliding window per token
const MAX_RENEWALS = 4;         // 5 total windows × 7 days ≈ 35 days, then force re-login
const COOKIE_NAME = 'windom_refresh';

const cookieOpts = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'none' as const,
  path: '/auth/refresh',
  maxAge: REFRESH_WINDOW_DAYS * 24 * 60 * 60, // seconds (sliding — reset on each rotation)
};

function getClientIp(req: import('fastify').FastifyRequest): string {
  return (
    (req.headers['fly-client-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    '0.0.0.0'
  );
}

async function createSession(
  userId: string,
  req: import('fastify').FastifyRequest,
  rotatedFromId?: string,
  renewalCount = 0,
): Promise<string> {
  const rawToken = crypto.randomBytes(48).toString('base64url');
  const tokenHash = await bcrypt.hash(rawToken, 10);
  const expiresAt = new Date(Date.now() + REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(refreshSessions).values({
    userId,
    tokenHash,
    rotatedFromId: rotatedFromId ?? null,
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'] ?? '',
    expiresAt,
    renewalCount,
  });

  return rawToken;
}

async function issueTokenPair(
  user: { id: string; email: string | null; name: string },
  req: import('fastify').FastifyRequest,
  reply: import('fastify').FastifyReply,
  rotatedFromId?: string,
  renewalCount = 0,
) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: user.id, email: user.email, name: user.name }),
    createSession(user.id, req, rotatedFromId, renewalCount),
  ]);

  reply.setCookie(COOKIE_NAME, refreshToken, cookieOpts);
  return { accessToken };
}

export async function authRoutes(app: FastifyInstance) {
  // ── Register ─────────────────────────────────────────────────────────────
  app.post('/register', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
    handler: async (req, reply) => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1).max(100),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: parsed.error.issues[0]?.message });
      }

      const { email, password, name } = parsed.data;

      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        return reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'Email already registered' });
      }

      const passwordHash = await hashPassword(password);
      const [user] = await db.insert(users).values({ email, name, passwordHash }).returning();

      return issueTokenPair(user, req, reply);
    },
  });

  // ── Login ─────────────────────────────────────────────────────────────────
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
    handler: async (req, reply) => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: parsed.error.issues[0]?.message });
      }

      const { email, password } = parsed.data;

      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      // Constant-time rejection even if user not found
      const dummyHash = '$2b$12$invalidhashpadding000000000000000000000000000000000000';
      const passwordOk = user?.passwordHash
        ? await verifyPassword(password, user.passwordHash)
        : await verifyPassword(password, dummyHash).then(() => false);

      if (!user || !passwordOk) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid email or password' });
      }

      return issueTokenPair(user, req, reply);
    },
  });

  // ── Refresh ───────────────────────────────────────────────────────────────
  app.post('/refresh', {
    config: { rateLimit: { max: 30, timeWindow: '15 minutes' } },
    handler: async (req, reply) => {
      const rawToken = req.cookies[COOKIE_NAME];
      if (!rawToken) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'No refresh token' });
      }

      // Find all non-revoked sessions; we need to compare token hashes
      // (No index on token_hash — bcrypt compare is intentionally slow)
      const sessions = await db
        .select()
        .from(refreshSessions)
        .where(and(isNull(refreshSessions.revokedAt)))
        .limit(1000); // safety cap

      // Find matching session
      let matchedSession: (typeof sessions)[0] | null = null;
      for (const session of sessions) {
        if (new Date(session.expiresAt) < new Date()) continue;
        const ok = await bcrypt.compare(rawToken, session.tokenHash);
        if (ok) {
          matchedSession = session;
          break;
        }
      }

      if (!matchedSession) {
        // Possible reuse — revoke all sessions for this token chain if we can find it
        reply.clearCookie(COOKIE_NAME, { path: '/auth/refresh' });
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid or expired refresh token' });
      }

      // Check renewal cap — after MAX_RENEWALS the user must log in again
      if (matchedSession.renewalCount >= MAX_RENEWALS) {
        await db.update(refreshSessions).set({ revokedAt: new Date() }).where(eq(refreshSessions.id, matchedSession.id));
        reply.clearCookie(COOKIE_NAME, { path: '/auth/refresh' });
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', code: 'SESSION_LIMIT_REACHED', message: 'Session expired. Please log in again.' });
      }

      // Check for reuse: if this session was already rotated (has a child session), revoke the whole chain
      const childSessions = await db
        .select()
        .from(refreshSessions)
        .where(eq(refreshSessions.rotatedFromId, matchedSession.id))
        .limit(1);

      if (childSessions.length > 0) {
        // Token reuse detected — revoke entire chain
        await db
          .update(refreshSessions)
          .set({ revokedAt: new Date() })
          .where(eq(refreshSessions.userId, matchedSession.userId));

        reply.clearCookie(COOKIE_NAME, { path: '/auth/refresh' });
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Refresh token reuse detected. Please log in again.' });
      }

      // Revoke old session
      await db.update(refreshSessions).set({ revokedAt: new Date() }).where(eq(refreshSessions.id, matchedSession.id));

      // Load user
      const [user] = await db.select().from(users).where(eq(users.id, matchedSession.userId)).limit(1);
      if (!user) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not found' });
      }

      return issueTokenPair(user, req, reply, matchedSession.id, matchedSession.renewalCount + 1);
    },
  });

  // ── Logout ────────────────────────────────────────────────────────────────
  app.post('/logout', {
    handler: async (req, reply) => {
      const rawToken = req.cookies[COOKIE_NAME];
      if (rawToken) {
        // Best-effort: find and revoke the session
        const sessions = await db
          .select()
          .from(refreshSessions)
          .where(isNull(refreshSessions.revokedAt))
          .limit(1000);

        for (const session of sessions) {
          const ok = await bcrypt.compare(rawToken, session.tokenHash);
          if (ok) {
            await db.update(refreshSessions).set({ revokedAt: new Date() }).where(eq(refreshSessions.id, session.id));
            break;
          }
        }
      }

      reply.clearCookie(COOKIE_NAME, { path: '/auth/refresh' });
      return reply.status(200).send({ success: true });
    },
  });
}
