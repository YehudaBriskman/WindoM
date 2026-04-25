import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { getSettingsController, putSettingsController } from '../controllers/settings.controller.js';

const security = [{ bearerAuth: [] }];
const errorResponse = { $ref: 'Error#' };

export function settingsRoutes(app: FastifyInstance): void {
  app.get('/settings', {
    preHandler: authenticate,
    schema: {
      tags: ['Settings'],
      summary: 'Get synced extension settings',
      security,
      response: {
        200: { type: 'object', additionalProperties: true },
        401: errorResponse,
      },
    },
  }, getSettingsController);

  app.put('/settings', {
    preHandler: authenticate,
    schema: {
      tags: ['Settings'],
      summary: 'Replace synced extension settings - accepts any JSON object',
      security,
      response: {
        200: { type: 'object', additionalProperties: true },
        401: errorResponse,
      },
    },
  }, putSettingsController);
}
