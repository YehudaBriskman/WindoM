import type { FastifyInstance } from 'fastify';
import { pool } from '../db/client.js';
import { logger } from '../lib/logger.js';

/** Outcome of probing the database for reachability and write capability. */
export interface DbProbe {
  /** 'up' = reachable and writable, 'read-only' = reachable but rejects writes, 'down' = unreachable. */
  status: 'up' | 'read-only' | 'down';
  /** Round-trip time of the probe query in milliseconds. */
  latencyMs: number;
  /** Present only on a failed probe, for operator diagnosis. */
  error?: string;
}

/**
 * Probes the database for both reachability and write capability.
 *
 * `default_transaction_read_only` is the signal that caught us out in incident #307:
 * Postgres sat in archive recovery for four months, answering reads perfectly while
 * rejecting every write. A liveness check that only opens a connection reports such a
 * cluster as healthy, which is why that outage ran undetected for so long. Postgres also
 * enables read-only mode on its own once a volume passes 90% usage, so this is a
 * recurring state rather than a one-off.
 */
export async function probeDb(): Promise<DbProbe> {
  const startedAt = Date.now();
  try {
    const result = await pool.query<{ read_only: string }>(
      'select current_setting($1) as read_only',
      ['transaction_read_only'],
    );
    const latencyMs = Date.now() - startedAt;
    const readOnly = result.rows[0]?.read_only === 'on';
    return { status: readOnly ? 'read-only' : 'up', latencyMs };
  } catch (err) {
    return {
      status: 'down',
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : 'unknown error',
    };
  }
}

export function healthRoutes(app: FastifyInstance): void {
  // ── Liveness ──────────────────────────────────────────────────────────────
  // Fly's [[http_service.checks]] polls this, so it MUST stay 200 while the process
  // is alive, even when the database is unusable. Returning non-200 here would make
  // Fly replace or stop a machine that is merely degraded - the exact cascade that
  // took production fully down in #307. Database state is reported, never enforced.
  app.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Server liveness check',
      description:
        'Always 200 while the process is running. Reports database state without ' +
        'failing on it, so a degraded database cannot trigger machine replacement. ' +
        'Use /health/ready for alerting.',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded'] },
            ts: { type: 'string', format: 'date-time' },
            db: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['up', 'read-only', 'down'] },
                latencyMs: { type: 'number' },
                error: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (_req, reply) => {
    const db = await probeDb();
    if (db.status !== 'up') {
      logger.error({ db }, 'health: database is not writable');
    }
    return reply.status(200).send({
      status: db.status === 'up' ? 'ok' : 'degraded',
      ts: new Date().toISOString(),
      db,
    });
  });

  // ── Readiness ─────────────────────────────────────────────────────────────
  // Returns 503 when the database cannot serve writes. Intended for monitoring and
  // alerting (and for post-deploy verification in CI) - deliberately NOT wired to
  // Fly's machine health check, so a degraded database raises an alarm instead of
  // restarting the API.
  app.get('/health/ready', {
    schema: {
      tags: ['Health'],
      summary: 'Readiness check (fails when the database cannot accept writes)',
      description:
        'Returns 503 when the database is unreachable or read-only. Use this for ' +
        'alerting and post-deploy verification, not as a machine health check.',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ready'] },
            ts: { type: 'string', format: 'date-time' },
            db: { type: 'object', additionalProperties: true },
          },
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['not-ready'] },
            ts: { type: 'string', format: 'date-time' },
            db: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
  }, async (_req, reply) => {
    const db = await probeDb();
    const ready = db.status === 'up';
    if (!ready) {
      logger.error({ db }, 'readiness: database cannot accept writes');
    }
    return reply.status(ready ? 200 : 503).send({
      status: ready ? 'ready' : 'not-ready',
      ts: new Date().toISOString(),
      db,
    });
  });
}
