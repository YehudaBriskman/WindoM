import { db, pool } from '../db/client.js';
import { refreshSessions, oauthAccounts, oauthStates, userSettings, users } from '../db/schema.js';

/**
 * Truncates all tables in dependency order (children before parents).
 * Call in beforeEach for integration tests to ensure a clean slate.
 */
export async function truncateAll(): Promise<void> {
  await db.delete(refreshSessions);
  await db.delete(oauthAccounts);
  await db.delete(oauthStates);
  await db.delete(userSettings);
  await db.delete(users);
}

/**
 * Closes the database pool.
 * Call in afterAll to prevent open handles that block Vitest from exiting.
 */
export async function closeDb(): Promise<void> {
  await pool.end();
}
