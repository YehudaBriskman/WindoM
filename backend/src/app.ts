import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
  type FastifyError,
  type FastifyRequest,
} from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyFormbody from '@fastify/formbody';
import fastifyHelmet from '@fastify/helmet';
import { config } from './config.js';
import { pool } from './db/client.js';
import { redactUrlQuery } from './lib/redact.js';
import {
  EVENT_DB_POOL_EXHAUSTED,
  EVENT_HTTP_SERVER_ERROR,
  EVENT_NAME_KEY,
  recordPoolExhausted,
} from './telemetry/events.js';
import { registerCors } from './plugins/cors.js';
import { registerSwagger } from './plugins/swagger.js';
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
import { gmailRoutes } from './routes/gmail.js';
import { githubRoutes } from './routes/github.js';

export interface BuildAppOptions extends FastifyServerOptions {
  /** Skip rate limiting - set to true in tests to prevent limit accumulation across test runs. */
  skipRateLimit?: boolean;
}

export { redactUrlQuery };

export function requestLogSerializer(req: { id: string; method: string; url: string; ip: string }): {
  id: string;
  method: string;
  url: string;
  remoteAddress: string;
} {
  return {
    id: req.id,
    method: req.method,
    url: redactUrlQuery(req.url),
    // Never log Authorization headers or cookie values.
    remoteAddress: req.ip,
  };
}

/**
 * Builds and fully registers the Fastify application.
 * Does NOT bind a port - call app.listen() in the entry point.
 *
 * Accepts optional overrides so tests can disable the logger and rate limiter.
 */
export async function buildApp({ skipRateLimit, ...overrides }: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.isProd ? 'info' : 'debug',
      serializers: {
        req: requestLogSerializer,
      },
    },
    trustProxy: config.isProd, // trust X-Forwarded-For from Fly.io proxy
    // Hard limit on incoming request body size (covers both JSON and form data).
    // 700 KB covers the largest legitimate payload (localBackground base64 image ≤ 600 KB + overhead).
    bodyLimit: 700_000,
    requestTimeout: 30_000,
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
    hsts: config.isProd ? { maxAge: 31_536_000, includeSubDomains: true, preload: true } : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow extension to fetch the API
  });

  app.addHook('onSend', (_req, reply, _payload, done) => {
    reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    done();
  });

  // Requests whose 5xx the error handler already reported, so the onResponse fallback
  // below makes `http.server.error` exactly one log line per 5xx (#476).
  const serverErrorReported = new WeakSet<FastifyRequest>();

  // A handler that answers 5xx itself (`reply.status(502).send(...)`) never reaches the
  // error handler, so it is reported here. Registered before the routes so it covers them.
  app.addHook('onResponse', (req, reply, done) => {
    if (reply.statusCode >= 500 && !serverErrorReported.has(req)) {
      app.log.error(
        {
          [EVENT_NAME_KEY]: EVENT_HTTP_SERVER_ERROR,
          'http.route': req.routeOptions.url,
          'http.request.method': req.method,
          statusCode: reply.statusCode,
        },
        'Server error response',
      );
    }
    done();
  });

  await registerSwagger(app, !config.isProd);
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
  await app.register(gmailRoutes, { prefix: '/gmail' });
  await app.register(githubRoutes, { prefix: '/github' });

  // ── Global error handler ───────────────────────────────────────────────────

  app.setErrorHandler((error: FastifyError, req, reply) => {
    // The route TEMPLATE (`/me/sessions/:id`), never the raw URL: raw URLs carry ids and,
    // in the query string, one-time secrets.
    const route = req.routeOptions.url;

    // Postgres pool exhaustion: connectionTimeoutMillis exceeded → 503
    const isPoolTimeout =
      error.message === 'timeout expired' ||
      error.message?.includes('Connection terminated') ||
      (error as { code?: string }).code === 'CONNECTION_TIMEOUT';
    if (isPoolTimeout) {
      serverErrorReported.add(req);
      // `event.name` is what the alert matches (#476); the message text is free to change.
      app.log.warn(
        {
          [EVENT_NAME_KEY]: EVENT_DB_POOL_EXHAUSTED,
          'http.route': route,
          'http.request.method': req.method,
          pool: {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount,
            max: pool.options.max ?? 0,
          },
        },
        'DB pool connection timeout - returning 503',
      );
      recordPoolExhausted(route);
      void reply.status(503).send({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'The server is temporarily unable to handle the request. Please try again shortly.',
      });
      return;
    }

    const statusCode = error.statusCode ?? 500;
    // 4xx are the client's mistake and would only be noise to an alert; 5xx are ours.
    if (statusCode >= 500) {
      serverErrorReported.add(req);
      app.log.error(
        {
          [EVENT_NAME_KEY]: EVENT_HTTP_SERVER_ERROR,
          'http.route': route,
          'http.request.method': req.method,
          statusCode,
          message: error.message,
          stack: error.stack,
        },
        'Request error',
      );
    } else {
      app.log.error({ statusCode, message: error.message, stack: error.stack }, 'Request error');
    }
    const isClientError = statusCode >= 400 && statusCode < 500;
    // In production, never send internal error details to clients - log-only.
    void reply.status(statusCode).send({
      statusCode,
      error: isClientError ? error.name : 'Internal Server Error',
      message: !config.isProd ? error.message : isClientError ? 'Invalid request' : 'An unexpected error occurred',
    });
  });

  return app;
}
