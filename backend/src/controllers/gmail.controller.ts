import type { FastifyRequest, FastifyReply } from 'fastify';
import * as gmailService from '../services/gmail.service.js';

export async function getGmailSummaryController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const result = await gmailService.getGmailSummary(req.user.sub);

  if (!result.ok) {
    if (result.error === 'NOT_CONNECTED') {
      void reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Gmail not connected' });
    } else if (result.error === 'INSUFFICIENT_SCOPES') {
      void reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Gmail scope not granted. Please reconnect with Gmail access.' });
    } else {
      void reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Could not refresh Google token. Please reconnect.' });
    }
    return;
  }

  reply.header('Cache-Control', 'private, max-age=45');
  void reply.send(result.data);
}
