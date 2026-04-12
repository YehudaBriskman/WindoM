import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { getMeController, deleteAccountController } from '../controllers/me.controller.js';

export function meRoutes(app: FastifyInstance): void {
  app.get('/me', { preHandler: authenticate }, getMeController);

  app.delete('/me', {
    preHandler: authenticate,
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
  }, deleteAccountController);
}
