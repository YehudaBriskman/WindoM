import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { getMeController } from '../controllers/me.controller.js';

export function meRoutes(app: FastifyInstance): void {
  app.get('/me', { preHandler: authenticate }, getMeController);
}
