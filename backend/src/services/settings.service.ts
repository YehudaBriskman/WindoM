import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { userSettings } from '../db/schema.js';

export async function getSettings(userId: string): Promise<Record<string, unknown> | null> {
  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return (row?.data as Record<string, unknown>) ?? null;
}

export async function saveSettings(
  userId: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  await db
    .insert(userSettings)
    .values({ userId, data, updatedAt: new Date() })
    .onConflictDoUpdate({ target: userSettings.userId, set: { data, updatedAt: new Date() } });
  return data;
}
