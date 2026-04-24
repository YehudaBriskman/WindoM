import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';
import * as schema from './schema.js';

const { Pool } = pg;

// 10 connections in production: Fly.io shared-1x machines have ~25 Postgres connection slots.
// Keeping max at 10 leaves headroom for migrations, drizzle-kit, and pgAdmin.
// connectionTimeoutMillis: requests that cannot acquire a connection within 5 s
// will throw — the global error handler converts these to 503 responses.
export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: config.isProd ? 10 : 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  allowExitOnIdle: true,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle Postgres client');
});

// Log when pool approaches exhaustion (≥ 80% utilised) to catch leaks before they cause 503s.
pool.on('connect', () => {
  const utilisation = pool.totalCount / (config.isProd ? 10 : 5);
  if (utilisation >= 0.8) {
    logger.warn({ total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount }, 'DB pool approaching max connections');
  }
});

export const db = drizzle(pool, { schema });
