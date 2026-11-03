import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { userSettings } from '../db/schema.js';

/**
 * The settings row's `updated_at` doubles as the sync revision (#251): it is
 * assigned here, from the server clock only, and strictly increases per user,
 * so two writes can never share one. Clients treat it as an opaque token and
 * compare it for equality - never against their own clock.
 */
export interface SettingsRecord {
  data: Record<string, unknown>;
  /** Server revision in epoch ms. */
  updatedAt: number;
}

export interface SettingsWriteResult extends SettingsRecord {
  /** The revision this write replaced; null when it created the row. */
  previousUpdatedAt: number | null;
}

export async function getSettingsRecord(userId: string): Promise<SettingsRecord | null> {
  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  if (!row) return null;
  return { data: (row.data as Record<string, unknown>) ?? {}, updatedAt: row.updatedAt.getTime() };
}

export async function getSettings(userId: string): Promise<Record<string, unknown> | null> {
  return (await getSettingsRecord(userId))?.data ?? null;
}

/**
 * Read-modify-write the settings blob under a row lock, so two devices pushing
 * different sections at the same moment cannot drop each other's write, and
 * every write gets a fresh revision.
 */
export async function updateSettings(
  userId: string,
  merge: (existing: Record<string, unknown>) => Record<string, unknown>,
): Promise<SettingsWriteResult> {
  return db.transaction(async (tx) => {
    // Creates the row if missing; a concurrent first write waits on the unique
    // key here and then finds the row below, instead of overwriting it.
    const inserted = await tx
      .insert(userSettings)
      .values({ userId, data: {}, updatedAt: new Date(0) })
      .onConflictDoNothing()
      .returning({ userId: userSettings.userId });

    const [row] = await tx
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .for('update')
      .limit(1);

    const previous = row.updatedAt.getTime();
    const updatedAt = Math.max(Date.now(), previous + 1);
    const data = merge((row.data as Record<string, unknown>) ?? {});

    await tx
      .update(userSettings)
      .set({ data, updatedAt: new Date(updatedAt) })
      .where(eq(userSettings.userId, userId));

    return { data, updatedAt, previousUpdatedAt: inserted.length > 0 ? null : previous };
  });
}
