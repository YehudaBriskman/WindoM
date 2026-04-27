import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { getCalendarEventsController } from '../controllers/calendar.controller.js';

const security = [{ bearerAuth: [] }];
const errorResponse = { $ref: 'Error#' };

export function calendarRoutes(app: FastifyInstance): void {
  app.get('/events', {
    preHandler: authenticate,
    schema: {
      tags: ['Calendar'],
      summary: 'List upcoming Google Calendar events',
      security,
      response: {
        200: {
          type: 'object',
          properties: {
            events: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  date: { type: 'string' },
                  description: { type: 'string' },
                  color: { type: 'string' },
                  calendarId: { type: 'string' },
                  htmlLink: { type: 'string' },
                },
              },
            },
            total: { type: 'integer' },
            limit: { type: 'integer' },
            offset: { type: 'integer' },
          },
        },
        401: errorResponse,
        403: errorResponse,
      },
    },
  }, getCalendarEventsController);
}
