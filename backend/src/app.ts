import Fastify, { type FastifyInstance, type FastifyServerOptions, type FastifyError } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyFormbody from '@fastify/formbody';
import fastifyHelmet from '@fastify/helmet';
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
    // Hard limit on incoming request body size (covers both JSON and form data).
    // 700 KB covers the largest legitimate payload (localBackground base64 image ≤ 600 KB + overhead).
    bodyLimit: 700_000,
    ...overrides,
  });

  // ── Plugins ────────────────────────────────────────────────────────────────

  await app.register(fastifyCookie, {
    secret: config.REFRESH_TOKEN_SECRET,
  });

  // Parse application/x-www-form-urlencoded (used by the reset-password HTML form)
  await app.register(fastifyFormbody);

  // Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, etc.
  // CSP is permissive here because most responses are JSON; the HTML pages served
  // (reset-password, verify-email) load fonts from Google so we allow that origin.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- @fastify/helmet options type doesn't satisfy FastifyPluginCallback generic exactly; safe in practice
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: config.isProd
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow extension to fetch the API
  });

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
    // Postgres pool exhaustion: connectionTimeoutMillis exceeded → 503
    const isPoolTimeout =
      error.message === 'timeout expired' ||
      error.message?.includes('Connection terminated') ||
      (error as { code?: string }).code === 'CONNECTION_TIMEOUT';
    if (isPoolTimeout) {
      app.log.warn('DB pool connection timeout — returning 503');
      void reply.status(503).send({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'The server is temporarily unable to handle the request. Please try again shortly.',
      });
      return;
    }

    const statusCode = error.statusCode ?? 500;
    app.log.error({ statusCode, message: error.message, stack: error.stack }, 'Request error');
    // In production, never leak internal error messages or stack traces to clients.
    const isClientError = statusCode >= 400 && statusCode < 500;
    void reply.status(statusCode).send({
      statusCode,
      error: isClientError ? error.name : 'Internal Server Error',
      message: isClientError || !config.isProd ? error.message : 'An unexpected error occurred',
    });
  });

  return app;
}
