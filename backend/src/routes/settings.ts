import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { db } from '../db/client.js';
import { userSettings } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function settingsRoutes(app: FastifyInstance) {
  // ── GET /settings ─────────────────────────────────────────────────────────
  app.get('/settings', { preHandler: authenticate }, async (req, reply) => {
    const [row] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, req.user.sub))
      .limit(1);

    return reply.send({ data: row?.data ?? null });
  });

  // ── PUT /settings ─────────────────────────────────────────────────────────
  app.put('/settings', { preHandler: authenticate }, async (req, reply) => {
    const data = req.body as Record<string, unknown>;

    await db
      .insert(userSettings)
      .values({ userId: req.user.sub, data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { data, updatedAt: new Date() },
      });

    return reply.send({ data });
  });
}
