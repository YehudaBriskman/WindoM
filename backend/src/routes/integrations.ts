import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { getIntegrationsController, deleteIntegrationController } from '../controllers/integrations.controller.js';

export function integrationsRoutes(app: FastifyInstance): void {
  app.get('/', { preHandler: authenticate }, getIntegrationsController);
  app.delete('/:provider', { preHandler: authenticate }, deleteIntegrationController);
}
