import type { FastifyInstance } from 'fastify';

export function healthRoutes(app: FastifyInstance): void {
  app.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Server health check',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok'] },
            ts: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async (_req, reply) => {
    return reply.status(200).send({ status: 'ok', ts: new Date().toISOString() });
  });
}
