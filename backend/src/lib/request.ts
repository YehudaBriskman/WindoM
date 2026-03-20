import type { FastifyRequest } from 'fastify';
import type { SessionMeta } from '../types/auth.types.js';

/**
 * Check whether a redirect URI is allowed for an OAuth exchange.
 * Accepts:
 *   - An exact match against `configured` (the server-side env value for this provider)
 *   - Any https://*.chromiumapp.org/* URI (Chrome identity API flow, varies by extension ID)
 */
export function isAllowedRedirectUri(uri: string, configured: string | undefined): boolean {
  if (configured && uri === configured) return true;
  try {
    const u = new URL(uri);
    if (u.protocol === 'https:' && u.hostname.endsWith('.chromiumapp.org')) return true;
  } catch { return false; }
  return false;
}

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
