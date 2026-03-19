import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import {
  getSpotifyMeController,
  getNowPlayingController,
  getTopTracksController,
  playController,
  pauseController,
  nextController,
  previousController,
} from '../controllers/spotify.controller.js';

export function spotifyRoutes(app: FastifyInstance): void {
  app.get('/me', { preHandler: authenticate }, getSpotifyMeController);
  app.get('/now-playing', { preHandler: authenticate }, getNowPlayingController);
  app.get('/top-tracks', { preHandler: authenticate }, getTopTracksController);
  app.post('/play', { preHandler: authenticate }, playController);
  app.post('/pause', { preHandler: authenticate }, pauseController);
  app.post('/next', { preHandler: authenticate }, nextController);
  app.post('/previous', { preHandler: authenticate }, previousController);
}
