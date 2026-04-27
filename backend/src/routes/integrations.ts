import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { getIntegrationsController, deleteIntegrationController, saveGithubPatController } from '../controllers/integrations.controller.js';

const security = [{ bearerAuth: [] }];
const errorResponse = { $ref: 'Error#' };

export function integrationsRoutes(app: FastifyInstance): void {
  app.get('/', {
    preHandler: authenticate,
    schema: {
      tags: ['Integrations'],
      summary: 'Get integration status for google, spotify, and github',
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
            github: {
              type: 'object',
              properties: {
                connected: { type: 'boolean' },
              },
            },
          },
        },
        401: errorResponse,
      },
    },
  }, getIntegrationsController);

  app.post('/github/pat', {
    preHandler: authenticate,
    schema: {
      tags: ['Integrations'],
      summary: 'Store an encrypted GitHub Personal Access Token',
      security,
      body: {
        type: 'object',
        required: ['pat'],
        properties: {
          pat: { type: 'string', minLength: 1, maxLength: 200 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            connected: { type: 'boolean' },
            username: { type: 'string' },
          },
        },
        400: errorResponse,
        401: errorResponse,
        503: errorResponse,
      },
    },
  }, saveGithubPatController);

  app.delete('/:provider', {
    preHandler: authenticate,
    schema: {
      tags: ['Integrations'],
      summary: 'Unlink an integration - :provider is google, spotify, or github',
      security,
      response: {
        200: { type: 'object', properties: { success: { type: 'boolean' } } },
        400: errorResponse,
        401: errorResponse,
      },
    },
  }, deleteIntegrationController);
}
