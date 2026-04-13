import { randomBytes } from 'crypto';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users, emailTokens } from '../db/schema.js';
import { hashPassword } from '../lib/password.js';
import { revokeAllUserSessions } from './session.service.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendGoogleOnlyResetEmail,
} from '../lib/email.js';

type TokenType = 'verify_email' | 'password_reset';

async function createToken(userId: string, type: TokenType, ttlMs: number): Promise<string> {
  // Delete any prior unused token of the same type for this user
  await db
    .delete(emailTokens)
    .where(and(eq(emailTokens.userId, userId), eq(emailTokens.type, type), isNull(emailTokens.usedAt)));

  const token = randomBytes(32).toString('hex');
  await db.insert(emailTokens).values({
    userId,
    token,
    type,
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return token;
}

async function consumeToken(token: string, type: TokenType): Promise<string | null> {
  const [row] = await db
    .select()
    .from(emailTokens)
    .where(
      and(
        eq(emailTokens.token, token),
        eq(emailTokens.type, type),
        isNull(emailTokens.usedAt),
        gt(emailTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row) return null;
  await db.update(emailTokens).set({ usedAt: new Date() }).where(eq(emailTokens.id, row.id));
  return row.userId;
}

// ── Email verification ─────────────────────────────────────────────────────

export async function sendVerification(userId: string): Promise<'ok' | 'already_verified' | 'no_email'> {
  const [user] = await db
    .select({ email: users.email, name: users.name, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.email) return 'no_email';
  if (user.emailVerified) return 'already_verified';

  const token = await createToken(userId, 'verify_email', 24 * 60 * 60 * 1000);
  await sendVerificationEmail(user.email, user.name, token);
  return 'ok';
}

export async function verifyEmail(token: string): Promise<'ok' | 'invalid'> {
  const userId = await consumeToken(token, 'verify_email');
  if (!userId) return 'invalid';
  await db.update(users).set({ emailVerified: true }).where(eq(users.id, userId));
  return 'ok';
}

// ── Password reset ─────────────────────────────────────────────────────────

export async function sendPasswordReset(email: string): Promise<void> {
  const [user] = await db
    .select({ id: users.id, name: users.name, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) return; // silent — no user enumeration

  if (!user.passwordHash) {
    await sendGoogleOnlyResetEmail(email, user.name);
    return;
  }

  const token = await createToken(user.id, 'password_reset', 60 * 60 * 1000);
  await sendPasswordResetEmail(email, user.name, token);
}

export async function resetPassword(token: string, newPassword: string): Promise<'ok' | 'invalid'> {
  const userId = await consumeToken(token, 'password_reset');
  if (!userId) return 'invalid';

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  await revokeAllUserSessions(userId);
  return 'ok';
}
