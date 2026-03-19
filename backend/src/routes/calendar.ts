import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { getCalendarEventsController } from '../controllers/calendar.controller.js';

export function calendarRoutes(app: FastifyInstance): void {
  app.get('/events', { preHandler: authenticate }, getCalendarEventsController);
}
