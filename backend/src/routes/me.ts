import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function meRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: authenticate }, async (req, reply) => {
    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, req.user.sub))
      .limit(1);

    if (!user) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'User not found' });
    }

    return reply.send(user);
  });
}
