import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';
import * as schema from './schema.js';

const { Pool } = pg;

// Use 20 connections in production for better concurrency headroom.
// connectionTimeoutMillis: requests that cannot acquire a connection within 5 s
// will throw — the global error handler converts these to 503 responses.
export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: config.isProd ? 20 : 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle Postgres client');
});

export const db = drizzle(pool, { schema });
