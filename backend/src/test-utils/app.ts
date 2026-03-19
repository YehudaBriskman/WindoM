import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

/**
 * Creates a fully registered Fastify instance with logger disabled.
 * Use `app.inject()` to make requests without binding a real port.
 *
 * Always call `await app.close()` in afterAll to release the DB pool.
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  return buildApp({ logger: false });
}
