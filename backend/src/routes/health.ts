import type { FastifyInstance } from 'fastify';

export function healthRoutes(app: FastifyInstance): void {
  app.get('/health', async (_req, reply) => {
    return reply.status(200).send({ status: 'ok', ts: new Date().toISOString() });
  });
}
