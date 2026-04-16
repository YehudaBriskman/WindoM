import type { FastifyRequest } from 'fastify';
import type { SessionMeta } from '../types/auth.types.js';

/**
 * Check whether a redirect URI is allowed for an OAuth exchange.
 * Accepts:
 *   - An exact match against `configured` (the server-side env value for this provider)
 *   - A https://*.chromiumapp.org URI — if `extensionRedirectBase` is set, only URIs that
 *     start with that base are accepted (locks to a specific extension ID); otherwise any
 *     chromiumapp.org URI is accepted (dev/test fallback).
 */
export function isAllowedRedirectUri(
  uri: string,
  configured: string | undefined,
  extensionRedirectBase?: string,
): boolean {
  if (configured && uri === configured) return true;
  try {
    const u = new URL(uri);
    if (u.protocol === 'https:' && u.hostname.endsWith('.chromiumapp.org')) {
      if (extensionRedirectBase) return uri.startsWith(extensionRedirectBase);
      return true; // dev/test: no specific extension ID configured, allow any
    }
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
