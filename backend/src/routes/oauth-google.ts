import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  startGoogleOAuthController,
  exchangeGoogleOAuthController,
  callbackGoogleOAuthController,
} from '../controllers/oauth-google.controller.js';

export function oauthGoogleRoutes(app: FastifyInstance): void {
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
    app.log.warn('Google OAuth not configured — /oauth/google routes disabled');
    return;
  }

  app.post('/start', { preHandler: authenticate }, startGoogleOAuthController);
  app.post('/exchange', { preHandler: authenticate }, exchangeGoogleOAuthController);
  app.get('/callback', callbackGoogleOAuthController);
}
