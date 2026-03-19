import type { FastifyRequest, FastifyReply } from 'fastify';
import * as settingsService from '../services/settings.service.js';

export async function getSettingsController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await settingsService.getSettings(req.user.sub);
  void reply.send({ data });
}

export async function putSettingsController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await settingsService.saveSettings(req.user.sub, req.body as Record<string, unknown>);
  void reply.send({ data });
}
