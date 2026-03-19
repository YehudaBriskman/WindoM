import type { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(fastifyRateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    // Stricter limits on auth routes are applied per-route via config
    keyGenerator: (req) => {
      // Use forwarded IP (Fly.io sets Fly-Client-IP)
      return (
        (req.headers['fly-client-ip'] as string) ||
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.ip
      );
    },
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.after}.`,
    }),
  });
}
