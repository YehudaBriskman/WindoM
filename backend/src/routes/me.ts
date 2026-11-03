import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import {
  getMeController,
  updateMeController,
  deleteAccountController,
  listSessionsController,
  revokeSessionController,
  exportMeController,
  revokeOtherSessionsController,
  listActivityController,
} from '../controllers/me.controller.js';

const security = [{ bearerAuth: [] }];
const errorResponse = { $ref: 'Error#' };

export function meRoutes(app: FastifyInstance): void {
  app.get('/me/sessions', {
    preHandler: authenticate,
    schema: {
      tags: ['Me'],
      summary: 'List active refresh sessions',
      description: 'Lists unexpired, non-revoked sessions owned by the caller, the calling session first (current: true), then most recently renewed. Dates describe the current refresh-token row; lastUsedAt is its creation (sign-in or renewal), not the last API request. device is a coarse "Browser · OS" label parsed at sign-in/renewal (null for older sessions); no IP address or location is stored or returned. deviceId is an anonymous UA hash prefix, kept for older clients.',
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
                required: ['id', 'deviceId', 'device', 'current', 'createdAt', 'lastUsedAt', 'expiresAt', 'renewalCount'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  deviceId: { type: 'string' },
                  device: { type: ['string', 'null'] },
                  current: { type: 'boolean' },
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

  app.delete('/me/sessions', {
    preHandler: authenticate,
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
    schema: {
      tags: ['Me'],
      summary: 'Revoke every other active session - requires ?others=true',
      description: 'Revokes all of the caller\'s active sessions except the one the access token was issued with. Existing access tokens on those devices remain valid until expiry (up to 15 minutes).',
      security,
      querystring: {
        type: 'object',
        properties: { others: { type: 'string', enum: ['true'] } },
      },
      response: {
        200: {
          type: 'object',
          required: ['revoked'],
          properties: { revoked: { type: 'integer' } },
        },
        400: errorResponse,
        401: errorResponse,
        409: errorResponse,
      },
    },
  }, revokeOtherSessionsController);

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

  app.get('/me/activity', {
    preHandler: authenticate,
    config: { rateLimit: { max: 30, timeWindow: '15 minutes' } },
    schema: {
      tags: ['Me'],
      summary: 'List the caller\'s recent security events, newest first - accepts ?limit=1..100 (default 20)',
      description: 'Sign-ins (and failed attempts), sign-outs, password and email changes, session revocations, integration connects/disconnects, token-reuse detection and data exports from the last 180 days. Each event carries only its action, time, the session it concerns and a coarse "Browser · OS" label; no IP address, user agent or email is stored.',
      security,
      querystring: {
        type: 'object',
        properties: { limit: { type: 'integer', minimum: 1, maximum: 100 } },
      },
      response: {
        200: {
          type: 'object',
          required: ['events'],
          properties: {
            events: {
              type: 'array',
              items: {
                type: 'object',
                required: ['action', 'createdAt', 'device', 'sessionId'],
                properties: {
                  action: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  device: { type: ['string', 'null'] },
                  sessionId: { type: ['string', 'null'], format: 'uuid' },
                },
              },
            },
          },
        },
        400: errorResponse,
        401: errorResponse,
        429: errorResponse,
      },
    },
  }, listActivityController);

  app.get('/me/export', {
    preHandler: authenticate,
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
    schema: {
      tags: ['Me'],
      summary: 'Download a JSON copy of the data stored about the caller (GDPR Art. 15/20)',
      description: 'Profile, synced settings, session metadata, integration connection status, email-token history and the security log. Never includes credentials: password hash, OAuth/GitHub tokens, session and email token hashes, and third-party API keys typed into settings are withheld and listed by name in `withheld`. Sent with Content-Disposition: attachment.',
      security,
      response: {
        200: { type: 'object', additionalProperties: true },
        401: errorResponse,
        404: errorResponse,
        429: errorResponse,
      },
    },
  }, exportMeController);

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
