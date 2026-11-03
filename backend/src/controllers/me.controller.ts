import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { COOKIE_NAME } from '../types/constants.js';
import { verifyPassword } from '../lib/password.js';
import * as meService from '../services/me.service.js';
import { listActiveSessions, revokeOtherSessions, revokeOwnedSession } from '../services/session.service.js';
import { buildUserExport } from '../services/export.service.js';
import { listUserActivity, recordAudit } from '../services/audit.service.js';
import { extractSessionMeta } from '../lib/request.js';

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
    await recordAudit('password_changed', { userId: req.user.sub, sessionId: req.user.sid, meta: extractSessionMeta(req) });
    void reply.send({ ok: true });
  }
}

export async function getMeController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = await meService.getUserById(req.user.sub);
  if (!user) {
    void reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'User not found' });
    return;
  }
  reply.header('Cache-Control', 'private, max-age=60');
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
  // The user's own audit rows cascaded with the account; this tombstone names no one.
  await recordAudit('account_deleted', { userId: null });
  reply.clearCookie(COOKIE_NAME, { path: '/auth' });
  void reply.status(204).send();
}

export async function listSessionsController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const sessions = await listActiveSessions(req.user.sub, req.user.sid);
  reply.header('Cache-Control', 'no-store');
  void reply.send({ sessions });
}

const sessionParamsSchema = z.object({ id: z.string().uuid() });

export async function revokeSessionController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = sessionParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    void reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Invalid session ID' });
    return;
  }

  const revoked = await revokeOwnedSession(req.user.sub, parsed.data.id);
  if (!revoked) {
    void reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Active session not found' });
    return;
  }
  await recordAudit('session_revoked', { userId: req.user.sub, sessionId: parsed.data.id, meta: extractSessionMeta(req) });
  void reply.status(204).send();
}

export async function exportMeController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const data = await buildUserExport(req.user.sub);
  if (!data.profile) {
    void reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'User not found' });
    return;
  }
  await recordAudit('data_exported', { userId: req.user.sub, sessionId: req.user.sid, meta: extractSessionMeta(req) });
  const date = data.exportedAt.slice(0, 10);
  reply.header('Cache-Control', 'no-store');
  reply.header('Content-Disposition', `attachment; filename="windom-export-${date}.json"`);
  void reply.type('application/json; charset=utf-8').send(data);
}

const activityQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) });

/** GET /me/activity - the caller's recent security events (#232). */
export async function listActivityController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = activityQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    void reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'limit must be 1-100' });
    return;
  }
  const events = await listUserActivity(req.user.sub, parsed.data.limit);
  reply.header('Cache-Control', 'no-store');
  void reply.send({ events });
}

const revokeOthersQuerySchema = z.object({ others: z.literal('true') });

/** DELETE /me/sessions?others=true - sign out everywhere except the calling session. */
export async function revokeOtherSessionsController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Require the explicit flag so a bare DELETE /me/sessions can never mean "everything".
  if (!revokeOthersQuerySchema.safeParse(req.query).success) {
    void reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Pass others=true to revoke every other session' });
    return;
  }
  // Tokens issued before the session claim existed cannot say which session to keep.
  if (!req.user.sid) {
    void reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'Current session unknown; sign in again and retry' });
    return;
  }
  const revoked = await revokeOtherSessions(req.user.sub, req.user.sid);
  await recordAudit('sessions_revoked_others', { userId: req.user.sub, sessionId: req.user.sid, meta: extractSessionMeta(req) });
  void reply.send({ revoked });
}
