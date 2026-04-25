import type { FastifyRequest, FastifyReply } from 'fastify';
import * as gmailService from '../services/gmail.service.js';

export async function getGmailSummaryController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const result = await gmailService.getGmailSummary(req.user.sub);

  if (!result.ok) {
    req.log.warn({ userId: req.user.sub, error: result.error }, '[gmail] getGmailSummary failed');

    if (result.error === 'NOT_CONNECTED') {
      void reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Gmail not connected' });
    } else if (result.error === 'INSUFFICIENT_SCOPES') {
      void reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Gmail permission not granted. Please disconnect and reconnect via the Gmail settings.' });
    } else if (result.error === 'GMAIL_API_FORBIDDEN') {
      void reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Gmail API access denied. Ensure the Gmail API is enabled in your Google Cloud project and that Gmail permission was granted during sign-in.' });
    } else if (result.error === 'TOKEN_REFRESH_REVOKED' || result.error === 'TOKEN_REFRESH_FAILED') {
      void reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Gmail access was revoked. Please disconnect and reconnect via the Gmail settings.' });
    } else {
      void reply.status(503).send({ statusCode: 503, error: 'Service Unavailable', message: 'Could not reach Gmail. Please try again shortly.' });
    }
    return;
  }

  reply.header('Cache-Control', 'private, max-age=45');
  void reply.send(result.data);
}
