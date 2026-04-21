import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as calendarService from '../services/calendar.service.js';

const calendarQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function getCalendarEventsController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = calendarQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    void reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: parsed.error.issues[0]?.message ?? 'Invalid query params' });
    return;
  }
  const { days, limit, offset } = parsed.data;
  const result = await calendarService.getCalendarEvents(req.user.sub, days);

  if (!result.ok) {
    if (result.error === 'NOT_CONNECTED') {
      void reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Google Calendar not connected' });
    } else {
      void reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Could not refresh Google token. Please reconnect.' });
    }
    return;
  }

  const all = result.data;
  const page = all.slice(offset, offset + limit);

  reply.header('Cache-Control', 'private, max-age=60');
  void reply.send({ events: page, total: all.length, limit, offset });
}
