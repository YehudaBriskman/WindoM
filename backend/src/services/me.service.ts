import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { revokeAllUserSessions } from './session.service.js';
import type { UserRecord } from '../types/auth.types.js';

export async function getUserById(id: string): Promise<UserRecord | null> {
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, hasPassword: user.passwordHash !== null };
}

export async function getUserPasswordHash(id: string): Promise<string | null> {
  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row?.passwordHash ?? null;
}

export async function deleteAccount(userId: string): Promise<void> {
  await revokeAllUserSessions(userId);
  await db.delete(users).where(eq(users.id, userId));
}
