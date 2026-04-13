import Fastify, { type FastifyInstance, type FastifyServerOptions, type FastifyError } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyFormbody from '@fastify/formbody';
import { config } from './config.js';
import { registerCors } from './plugins/cors.js';
import { registerRateLimit } from './plugins/rate-limit.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import { authEmailRoutes } from './routes/auth-email.js';
import { authGoogleRoutes } from './routes/auth-google.js';
import { oauthGoogleRoutes } from './routes/oauth-google.js';
import { oauthSpotifyRoutes } from './routes/oauth-spotify.js';
import { integrationsRoutes } from './routes/integrations.js';
import { calendarRoutes } from './routes/calendar.js';
import { spotifyRoutes } from './routes/spotify.js';
import { settingsRoutes } from './routes/settings.js';

export interface BuildAppOptions extends FastifyServerOptions {
  /** Skip rate limiting — set to true in tests to prevent limit accumulation across test runs. */
  skipRateLimit?: boolean;
}

/**
 * Builds and fully registers the Fastify application.
 * Does NOT bind a port — call app.listen() in the entry point.
 *
 * Accepts optional overrides so tests can disable the logger and rate limiter.
 */
export async function buildApp({ skipRateLimit, ...overrides }: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.isProd ? 'info' : 'debug',
      serializers: {
        req(req) {
          return {
            method: req.method,
            url: req.url,
            // Never log Authorization header or cookie values
            remoteAddress: req.ip,
          };
        },
      },
    },
    trustProxy: config.isProd, // trust X-Forwarded-For from Fly.io proxy
    ...overrides,
  });

  // ── Plugins ────────────────────────────────────────────────────────────────

  await app.register(fastifyCookie, {
    secret: config.REFRESH_TOKEN_SECRET,
  });

  // Parse application/x-www-form-urlencoded (used by the reset-password HTML form)
  await app.register(fastifyFormbody);

  await registerCors(app);
  if (!skipRateLimit) await registerRateLimit(app);

  // ── Routes ─────────────────────────────────────────────────────────────────

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(authEmailRoutes, { prefix: '/auth' });
  await app.register(meRoutes);
  await app.register(authGoogleRoutes, { prefix: '/auth/google' });
  await app.register(oauthGoogleRoutes, { prefix: '/oauth/google' });
  await app.register(oauthSpotifyRoutes, { prefix: '/oauth/spotify' });
  await app.register(integrationsRoutes, { prefix: '/integrations' });
  await app.register(calendarRoutes, { prefix: '/calendar' });
  await app.register(spotifyRoutes, { prefix: '/spotify' });
  await app.register(settingsRoutes);

  // ── Global error handler ───────────────────────────────────────────────────

  app.setErrorHandler((error: FastifyError, _req, reply) => {
    const statusCode = error.statusCode ?? 500;
    app.log.error({ statusCode, message: error.message }, 'Request error');
    void reply.status(statusCode).send({
      statusCode,
      error: error.name,
      message: error.message,
    });
  });

  return app;
}
