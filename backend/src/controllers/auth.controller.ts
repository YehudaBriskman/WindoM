import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';
import { COOKIE_NAME, COOKIE_MAX_AGE_SECONDS } from '../types/constants.js';
import { extractSessionMeta } from '../lib/request.js';
import * as authService from '../services/auth.service.js';

const cookieOpts = {
  httpOnly: true,
  secure: config.isProd,
  // SameSite=None requires Secure; in dev use Lax so the cookie works over plain HTTP.
  sameSite: config.isProd ? ('none' as const) : ('lax' as const),
  // Path is /auth (not /auth/refresh) so the cookie is also sent to /auth/logout,
  // allowing the logout handler to revoke the session server-side.
  path: '/auth',
  maxAge: COOKIE_MAX_AGE_SECONDS,
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function registerController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    void reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: parsed.error.issues[0]?.message });
    return;
  }

  const result = await authService.register(
    parsed.data.email,
    parsed.data.password,
    parsed.data.name,
    extractSessionMeta(req),
  );

  if (!result.ok) {
    void reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'Email already registered' });
    return;
  }

  reply.setCookie(COOKIE_NAME, result.data.rawRefreshToken, cookieOpts);
  void reply.send({ accessToken: result.data.accessToken });
}

export async function loginController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    void reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: parsed.error.issues[0]?.message });
    return;
  }

  const result = await authService.login(parsed.data.email, parsed.data.password, extractSessionMeta(req));

  if (!result.ok) {
    void reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid email or password' });
    return;
  }

  reply.setCookie(COOKIE_NAME, result.data.rawRefreshToken, cookieOpts);
  void reply.send({ accessToken: result.data.accessToken });
}

export async function refreshController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const rawToken = req.cookies[COOKIE_NAME];
  if (!rawToken) {
    req.log.warn('refresh: no refresh token cookie present');
    void reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'No refresh token' });
    return;
  }

  req.log.info('refresh: attempting token rotation');
  const result = await authService.refresh(rawToken, extractSessionMeta(req));

  if (!result.ok) {
    req.log.warn({ reason: result.error }, 'refresh: token rotation failed');
    reply.clearCookie(COOKIE_NAME, { path: '/auth' });
    if (result.error === 'SESSION_LIMIT_REACHED') {
      void reply.status(401).send({ statusCode: 401, error: 'Unauthorized', code: 'SESSION_LIMIT_REACHED', message: 'Session expired. Please log in again.' });
    } else if (result.error === 'TOKEN_REUSE_DETECTED') {
      req.log.error('refresh: TOKEN_REUSE_DETECTED — all sessions for user revoked');
      void reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Refresh token reuse detected. Please log in again.' });
    } else {
      void reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid or expired refresh token' });
    }
    return;
  }

  req.log.info('refresh: rotation succeeded, new session created');
  reply.setCookie(COOKIE_NAME, result.data.rawRefreshToken, cookieOpts);
  void reply.send({ accessToken: result.data.accessToken });
}

export async function logoutController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const rawToken = req.cookies[COOKIE_NAME];
  if (rawToken) {
    req.log.info('logout: revoking session');
    await authService.logout(rawToken);
  } else {
    req.log.warn('logout: no refresh token cookie — session not revoked server-side');
  }
  reply.clearCookie(COOKIE_NAME, { path: '/auth' });
  void reply.send({ success: true });
}
