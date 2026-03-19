import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as integrationsService from '../services/integrations.service.js';

const providerSchema = z.enum(['google', 'spotify']);

export async function getIntegrationsController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const status = await integrationsService.getIntegrations(req.user.sub);
  void reply.send(status);
}

export async function deleteIntegrationController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = providerSchema.safeParse((req.params as Record<string, string>)['provider']);
  if (!parsed.success) {
    void reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Invalid provider' });
    return;
  }

  await integrationsService.unlinkProvider(req.user.sub, parsed.data);
  void reply.send({ success: true });
}
