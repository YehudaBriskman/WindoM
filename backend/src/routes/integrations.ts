import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { getIntegrationsController, deleteIntegrationController } from '../controllers/integrations.controller.js';

const security = [{ bearerAuth: [] }];
const errorResponse = { $ref: 'Error#' };

export function integrationsRoutes(app: FastifyInstance): void {
  app.get('/', {
    preHandler: authenticate,
    schema: {
      tags: ['Integrations'],
      summary: 'List linked OAuth integrations',
      security,
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string', enum: ['google', 'spotify'] },
              connectedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        401: errorResponse,
      },
    },
  }, getIntegrationsController);

  app.delete('/:provider', {
    preHandler: authenticate,
    schema: {
      tags: ['Integrations'],
      summary: 'Unlink an OAuth integration',
      security,
      params: {
        type: 'object',
        properties: {
          provider: { type: 'string', enum: ['google', 'spotify'] },
        },
      },
      response: {
        200: { type: 'object', properties: { success: { type: 'boolean' } } },
        401: errorResponse,
        404: errorResponse,
      },
    },
  }, deleteIntegrationController);
}
