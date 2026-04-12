import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { COOKIE_NAME } from '../types/constants.js';
import { verifyPassword } from '../lib/password.js';
import * as meService from '../services/me.service.js';

export async function getMeController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = await meService.getUserById(req.user.sub);
  if (!user) {
    void reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'User not found' });
    return;
  }
  void reply.send(user);
}

const deleteAccountSchema = z.object({ password: z.string().optional() });

export async function deleteAccountController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = deleteAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    void reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Invalid request body' });
    return;
  }

  const passwordHash = await meService.getUserPasswordHash(req.user.sub);

  // Password accounts must re-confirm their password before deletion
  if (passwordHash !== null) {
    const provided = parsed.data.password;
    if (!provided) {
      void reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Password required to delete account' });
      return;
    }
    const ok = await verifyPassword(provided, passwordHash);
    if (!ok) {
      void reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Incorrect password' });
      return;
    }
  }

  await meService.deleteAccount(req.user.sub);
  reply.clearCookie(COOKIE_NAME, { path: '/auth' });
  void reply.status(204).send();
}
