import type { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate } from '../middleware/authenticate.js';
import { z } from 'zod';

export async function integrationsRoutes(app: FastifyInstance) {
  // ── GET /integrations ──────────────────────────────────────────────────────
  app.get('/', { preHandler: authenticate }, async (req, reply) => {
    const accounts = await db
      .select({ provider: oauthAccounts.provider, scopes: oauthAccounts.scopes })
      .from(oauthAccounts)
      .where(eq(oauthAccounts.userId, req.user.sub));

    const google = accounts.find((a) => a.provider === 'google');
    const spotify = accounts.find((a) => a.provider === 'spotify');

    return reply.send({
      google: { connected: !!google, scopes: google?.scopes ?? [] },
      spotify: { connected: !!spotify, scopes: spotify?.scopes ?? [] },
    });
  });

  // ── DELETE /integrations/:provider ────────────────────────────────────────
  app.delete('/:provider', { preHandler: authenticate }, async (req, reply) => {
    const schema = z.object({ provider: z.enum(['google', 'spotify']) });
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Invalid provider' });
    }

    await db
      .delete(oauthAccounts)
      .where(and(eq(oauthAccounts.userId, req.user.sub), eq(oauthAccounts.provider, parsed.data.provider)));

    return reply.send({ success: true });
  });
}
