import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import type { UserRecord } from '../types/auth.types.js';

export async function getUserById(id: string): Promise<UserRecord | null> {
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user ?? null;
}
