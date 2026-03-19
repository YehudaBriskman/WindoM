import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { getSettingsController, putSettingsController } from '../controllers/settings.controller.js';

export function settingsRoutes(app: FastifyInstance): void {
  app.get('/settings', { preHandler: authenticate }, getSettingsController);
  app.put('/settings', { preHandler: authenticate }, putSettingsController);
}
