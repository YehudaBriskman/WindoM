import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { revokeAllUserSessions } from './session.service.js';
import type { UserRecord } from '../types/auth.types.js';

export async function getUserById(id: string): Promise<UserRecord | null> {
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt, passwordHash: users.passwordHash, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, hasPassword: user.passwordHash !== null, emailVerified: user.emailVerified };
}

export async function getUserPasswordHash(id: string): Promise<string | null> {
  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row?.passwordHash ?? null;
}

export async function updateName(userId: string, name: string): Promise<UserRecord | null> {
  await db.update(users).set({ name }).where(eq(users.id, userId));
  return getUserById(userId);
}

export async function updatePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<'ok' | 'wrong_password' | 'no_password'> {
  const hash = await getUserPasswordHash(userId);
  if (!hash) return 'no_password';

  const { verifyPassword, hashPassword } = await import('../lib/password.js');
  const ok = await verifyPassword(currentPassword, hash);
  if (!ok) return 'wrong_password';

  const newHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));
  return 'ok';
}

export async function deleteAccount(userId: string): Promise<void> {
  await revokeAllUserSessions(userId);
  await db.delete(users).where(eq(users.id, userId));
}
