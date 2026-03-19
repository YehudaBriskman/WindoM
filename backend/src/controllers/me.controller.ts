import type { FastifyRequest, FastifyReply } from 'fastify';
import * as meService from '../services/me.service.js';

export async function getMeController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = await meService.getUserById(req.user.sub);
  if (!user) {
    void reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'User not found' });
    return;
  }
  void reply.send(user);
}
