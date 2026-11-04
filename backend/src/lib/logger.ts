import { createRequire } from 'node:module';
import type pinoFactory from 'pino';
import { config } from '../config.js';

// Loaded through `require`, not `import`, on purpose (#476). The OpenTelemetry pino
// instrumentation wraps the pino factory as it is REQUIRED; an ESM `import` of this
// CommonJS package reads the original, unwrapped export, and every log line from this
// logger would silently miss OpenTelemetry. Fastify requires pino itself, so `app.log`
// and `req.log` are covered either way. With telemetry off this is plain pino.
const pino = createRequire(import.meta.url)('pino') as typeof pinoFactory;

/**
 * Module-level pino logger for service/library code that runs outside a
 * request context (no `req.log` available). Uses the same log level as the
 * Fastify app so dev and production verbosity is consistent.
 */
export const logger = pino({ level: config.isProd ? 'info' : 'debug' });
