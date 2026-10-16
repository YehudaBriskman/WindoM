import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import {
  getMeController,
  updateMeController,
  deleteAccountController,
  listSessionsController,
  revokeSessionController,
} from '../controllers/me.controller.js';

const security = [{ bearerAuth: [] }];
const errorResponse = { $ref: 'Error#' };

export function meRoutes(app: FastifyInstance): void {
  app.get('/me/sessions', {
    preHandler: authenticate,
    schema: {
      tags: ['Me'],
      summary: 'List active refresh sessions',
      description: 'Lists unexpired, non-revoked sessions owned by the caller. Dates describe the current refresh-token row; lastUsedAt is its creation (sign-in or renewal), not the last API request. deviceId is an anonymous UA hash prefix and may be shared across devices.',
      security,
      response: {
        200: {
          type: 'object',
          required: ['sessions'],
          properties: {
            sessions: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'deviceId', 'createdAt', 'lastUsedAt', 'expiresAt', 'renewalCount'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  deviceId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  lastUsedAt: { type: 'string', format: 'date-time' },
                  expiresAt: { type: 'string', format: 'date-time' },
                  renewalCount: { type: 'integer' },
                },
              },
            },
          },
        },
        401: errorResponse,
      },
    },
  }, listSessionsController);

  app.delete('/me/sessions/:id', {
    preHandler: authenticate,
    schema: {
      tags: ['Me'],
      summary: 'Revoke one active refresh session',
      description: 'Prevents further renewal. Existing access tokens remain valid until expiry (up to 15 minutes). A session that rotated since listing returns 404; reload the list and retry with its new ID.',
      security,
      response: { 400: errorResponse, 401: errorResponse, 404: errorResponse },
    },
  }, revokeSessionController);

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
      summary: 'Update user name - accepts { name?: string }',
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
