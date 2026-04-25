import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { getGmailSummaryController } from '../controllers/gmail.controller.js';

const security = [{ bearerAuth: [] }];
const errorResponse = { $ref: 'Error#' };

export function gmailRoutes(app: FastifyInstance): void {
  app.get('/summary', {
    preHandler: authenticate,
    schema: {
      tags: ['Gmail'],
      summary: 'Get Gmail unread count and recent messages',
      security,
      response: {
        200: {
          type: 'object',
          properties: {
            unreadCount: { type: 'integer' },
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  from: { type: 'string' },
                  subject: { type: 'string' },
                  snippet: { type: 'string' },
                  date: { type: 'string' },
                },
              },
            },
          },
        },
        401: errorResponse,
        403: errorResponse,
        404: errorResponse,
      },
    },
  }, getGmailSummaryController);
}
