import Fastify, { type FastifyError } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import { config } from './config.js';
import { registerCors } from './plugins/cors.js';
import { registerRateLimit } from './plugins/rate-limit.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import { authGoogleRoutes } from './routes/auth-google.js';
import { oauthGoogleRoutes } from './routes/oauth-google.js';
import { oauthSpotifyRoutes } from './routes/oauth-spotify.js';
import { integrationsRoutes } from './routes/integrations.js';
import { calendarRoutes } from './routes/calendar.js';
import { spotifyRoutes } from './routes/spotify.js';

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
});

// ── Plugins ────────────────────────────────────────────────────────────────

await app.register(fastifyCookie, {
  secret: config.REFRESH_TOKEN_SECRET, // for signed cookies if needed
});

await registerCors(app);
await registerRateLimit(app);

// ── Routes ─────────────────────────────────────────────────────────────────

await app.register(healthRoutes);
await app.register(authRoutes, { prefix: '/auth' });
await app.register(meRoutes);
await app.register(authGoogleRoutes, { prefix: '/auth/google' });
await app.register(oauthGoogleRoutes, { prefix: '/oauth/google' });
await app.register(oauthSpotifyRoutes, { prefix: '/oauth/spotify' });
await app.register(integrationsRoutes, { prefix: '/integrations' });
await app.register(calendarRoutes, { prefix: '/calendar' });
await app.register(spotifyRoutes, { prefix: '/spotify' });

// ── Global error handler ───────────────────────────────────────────────────

app.setErrorHandler((error: FastifyError, _req, reply) => {
  const statusCode = error.statusCode ?? 500;
  app.log.error({ statusCode, message: error.message }, 'Request error');
  reply.status(statusCode).send({
    statusCode,
    error: error.name,
    message: error.message,
  });
});

// ── Start ──────────────────────────────────────────────────────────────────

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' });
  console.log(`✅ WindoM API listening on port ${config.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
