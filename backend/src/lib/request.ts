import type { FastifyRequest } from 'fastify';
import type { SessionMeta } from '../types/auth.types.js';

/** Extract IP + user-agent from a Fastify request for session audit logging. */
export function extractSessionMeta(req: FastifyRequest): SessionMeta {
  return {
    ip:
      (req.headers['fly-client-ip'] as string) ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      '0.0.0.0',
    userAgent: req.headers['user-agent'] ?? '',
  };
}
