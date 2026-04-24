import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { getMeController, updateMeController, deleteAccountController } from '../controllers/me.controller.js';

const security = [{ bearerAuth: [] }];
const errorResponse = { $ref: 'Error#' };

export function meRoutes(app: FastifyInstance): void {
  app.get('/me', {
    preHandler: authenticate,
    schema: {
      tags: ['Me'],
      summary: 'Get authenticated user profile',
      security,
      response: {
        200: { $ref: 'User#' },
        401: errorResponse,
      },
    },
  }, getMeController);

  app.patch('/me', {
    preHandler: authenticate,
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
    schema: {
      tags: ['Me'],
      summary: 'Update user name — accepts { name?: string }',
      security,
      response: {
        200: { $ref: 'User#' },
        400: errorResponse,
        401: errorResponse,
      },
    },
  }, updateMeController);

  app.delete('/me', {
    preHandler: authenticate,
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
    schema: {
      tags: ['Me'],
      summary: 'Delete account and all associated data',
      security,
      response: {
        200: {
          type: 'object',
          properties: { success: { type: 'boolean' } },
        },
        401: errorResponse,
      },
    },
  }, deleteAccountController);
}
