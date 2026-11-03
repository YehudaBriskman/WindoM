import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as integrationsService from '../services/integrations.service.js';
import { recordAudit } from '../services/audit.service.js';
import { extractSessionMeta } from '../lib/request.js';
import { savePatController as saveGithubPatController } from './github.controller.js';

export { saveGithubPatController };

const providerSchema = z.enum(['google', 'spotify', 'github']);

export async function getIntegrationsController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const status = await integrationsService.getIntegrations(req.user.sub);
  reply.header('Cache-Control', 'private, max-age=60');
  void reply.send(status);
}

export async function deleteIntegrationController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = providerSchema.safeParse((req.params as Record<string, string>)['provider']);
  if (!parsed.success) {
    void reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Invalid provider' });
    return;
  }

  await integrationsService.unlinkProvider(req.user.sub, parsed.data);
  await recordAudit(`integration_disconnected_${parsed.data}`, { userId: req.user.sub, sessionId: req.user.sid, meta: extractSessionMeta(req) });
  void reply.send({ success: true });
}
