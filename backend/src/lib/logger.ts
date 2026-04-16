import pino from 'pino';
import { config } from '../config.js';

/**
 * Module-level pino logger for service/library code that runs outside a
 * request context (no `req.log` available). Uses the same log level as the
 * Fastify app so dev and production verbosity is consistent.
 */
export const logger = pino({ level: config.isProd ? 'info' : 'debug' });
