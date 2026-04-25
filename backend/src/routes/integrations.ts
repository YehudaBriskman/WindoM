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
      summary: 'Get integration status for google and spotify',
      security,
      response: {
        200: {
          type: 'object',
          properties: {
            google: {
              type: 'object',
              properties: {
                connected: { type: 'boolean' },
                scopes: { type: 'array', items: { type: 'string' } },
              },
            },
            spotify: {
              type: 'object',
              properties: {
                connected: { type: 'boolean' },
                scopes: { type: 'array', items: { type: 'string' } },
              },
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
      summary: 'Unlink an OAuth integration - :provider is google or spotify',
      security,
      response: {
        200: { type: 'object', properties: { success: { type: 'boolean' } } },
        400: errorResponse,
        401: errorResponse,
      },
    },
  }, deleteIntegrationController);
}
