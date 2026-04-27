import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as githubService from '../services/github.service.js';

const savePatBodySchema = z.object({
  pat: z.string().min(1).max(200),
});

export async function savePatController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = savePatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    void reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'pat is required' });
    return;
  }

  const result = await githubService.storePat(req.user.sub, parsed.data.pat);
  if (!result.ok) {
    if (result.error === 'INVALID_PAT') {
      void reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Invalid PAT. Check that the token has the notifications and repo scopes.' });
    } else {
      void reply.status(503).send({ statusCode: 503, error: 'Service Unavailable', message: 'Could not reach GitHub. Please try again.' });
    }
    return;
  }

  void reply.send({ connected: true, username: result.data.username });
}

export async function getGithubSummaryController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const result = await githubService.getGithubSummary(req.user.sub);

  if (!result.ok) {
    if (result.error === 'NOT_CONNECTED') {
      void reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'GitHub not connected' });
    } else if (result.error === 'INVALID_PAT') {
      void reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'GitHub PAT is invalid or expired. Please reconnect.' });
    } else {
      void reply.status(503).send({ statusCode: 503, error: 'Service Unavailable', message: 'Could not reach GitHub. Please try again.' });
    }
    return;
  }

  reply.header('Cache-Control', 'private, max-age=60');
  void reply.send(result.data);
}
