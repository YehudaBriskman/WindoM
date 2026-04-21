import type { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import { config } from '../config.js';

export async function registerCors(app: FastifyInstance): Promise<void> {
  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (server-to-server, CLI tools like curl).
      // In production this is acceptable because the API is authenticated via Bearer token.
      // Browser-initiated requests always send an Origin header, so no-origin requests
      // cannot abuse CORS credentials.
      if (!origin) return cb(null, true);

      if (config.corsAllowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      // Allow the server's own origin - needed for the reset-password HTML form
      // that is served from APP_URL and POSTs back to the same server.
      if (config.APP_URL && origin === config.APP_URL) {
        return cb(null, true);
      }

      // When CHROME_EXTENSION_ID is set, enforce the specific extension origin in all envs.
      if (config.CHROME_EXTENSION_ID) {
        if (origin === `chrome-extension://${config.CHROME_EXTENSION_ID}`) return cb(null, true);
      } else if (!config.isProd && origin.startsWith('chrome-extension://')) {
        // In dev without a pinned ID, allow any extension origin (ID changes between builds).
        return cb(null, true);
      }

      cb(new Error(`CORS: origin not allowed`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
