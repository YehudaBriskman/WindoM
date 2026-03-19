import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  startSpotifyOAuthController,
  exchangeSpotifyOAuthController,
  callbackSpotifyOAuthController,
} from '../controllers/oauth-spotify.controller.js';

export function oauthSpotifyRoutes(app: FastifyInstance): void {
  if (!config.SPOTIFY_CLIENT_ID || !config.SPOTIFY_CLIENT_SECRET) {
    app.log.warn('Spotify OAuth not configured — /oauth/spotify routes disabled');
    return;
  }

  app.post('/start', { preHandler: authenticate }, startSpotifyOAuthController);
  app.post('/exchange', { preHandler: authenticate }, exchangeSpotifyOAuthController);
  app.get('/callback', callbackSpotifyOAuthController);
}
