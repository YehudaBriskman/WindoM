import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import {
  startGoogleAuthController,
  exchangeGoogleAuthController,
  callbackGoogleAuthController,
} from '../controllers/auth-google.controller.js';

export function authGoogleRoutes(app: FastifyInstance): void {
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
    app.log.warn('Google OAuth not configured — /auth/google routes disabled');
    return;
  }

  app.get('/start', { config: { rateLimit: { max: 20, timeWindow: '15 minutes' } } }, startGoogleAuthController);
  app.post('/exchange', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, exchangeGoogleAuthController);
  app.get('/callback', { config: { rateLimit: { max: 20, timeWindow: '5 minutes' } } }, callbackGoogleAuthController);
}
