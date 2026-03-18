import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_req, reply) => {
    return reply.status(200).send({ status: 'ok', ts: new Date().toISOString() });
  });
}
