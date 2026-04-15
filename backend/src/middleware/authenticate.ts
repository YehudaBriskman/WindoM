import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken, type AccessTokenPayload } from '../lib/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: AccessTokenPayload;
  }
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Missing Bearer token' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    req.user = await verifyAccessToken(token);
  } catch {
    void reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid or expired token' });
    return;
  }
}
