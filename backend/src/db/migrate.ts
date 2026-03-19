import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { config } from '../config.js';

const pool = new pg.Pool({ connectionString: config.DATABASE_URL });
const db = drizzle(pool);

// eslint-disable-next-line no-console
console.log('[migrate] Running pending migrations...');
await migrate(db, { migrationsFolder: './drizzle' });
// eslint-disable-next-line no-console
console.log('[migrate] All migrations applied.');

await pool.end();
