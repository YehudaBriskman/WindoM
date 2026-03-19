import type { FastifyRequest, FastifyReply } from 'fastify';
import * as calendarService from '../services/calendar.service.js';

export async function getCalendarEventsController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { days = '7' } = req.query as { days?: string };
  const result = await calendarService.getCalendarEvents(req.user.sub, parseInt(days, 10) || 7);

  if (!result.ok) {
    if (result.error === 'NOT_CONNECTED') {
      void reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Google Calendar not connected' });
    } else {
      void reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Could not refresh Google token. Please reconnect.' });
    }
    return;
  }

  void reply.send({ events: result.data });
}
