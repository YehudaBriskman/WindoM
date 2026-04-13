import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { COOKIE_NAME } from '../types/constants.js';
import { verifyPassword } from '../lib/password.js';
import * as meService from '../services/me.service.js';

const updateMeSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).optional(),
  })
  .refine((d) => d.name !== undefined || (d.currentPassword !== undefined && d.newPassword !== undefined), {
    message: 'Provide name, or both currentPassword and newPassword',
  });

export async function updateMeController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    void reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: parsed.error.issues[0]?.message });
    return;
  }

  const { name, currentPassword, newPassword } = parsed.data;

  if (name !== undefined) {
    const updated = await meService.updateName(req.user.sub, name);
    if (!updated) {
      void reply.status(404).send({ error: 'Not Found' });
      return;
    }
    void reply.send(updated);
    return;
  }

  if (currentPassword !== undefined && newPassword !== undefined) {
    const result = await meService.updatePassword(req.user.sub, currentPassword, newPassword);
    if (result === 'no_password') {
      void reply.status(400).send({ error: 'NO_PASSWORD_SET', message: 'This account uses Google sign-in and has no password to change' });
      return;
    }
    if (result === 'wrong_password') {
      void reply.status(403).send({ error: 'WRONG_PASSWORD', message: 'Current password is incorrect' });
      return;
    }
    void reply.send({ ok: true });
  }
}

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
