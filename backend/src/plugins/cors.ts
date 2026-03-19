import type { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import { config } from '../config.js';

export async function registerCors(app: FastifyInstance): Promise<void> {
  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return cb(null, true);

      if (config.corsAllowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      // Chrome extensions have a unique origin format — allow any chrome-extension:// if in dev
      if (!config.isProd && origin.startsWith('chrome-extension://')) {
        return cb(null, true);
      }

      cb(new Error(`CORS: origin ${origin} not allowed`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
