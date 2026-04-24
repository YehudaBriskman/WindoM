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

const security = [{ bearerAuth: [] }];
const errorResponse = { $ref: 'Error#' };
const emptyOk = { type: 'object', properties: { success: { type: 'boolean' } } };

export function spotifyRoutes(app: FastifyInstance): void {
  app.get('/me', {
    preHandler: authenticate,
    schema: {
      tags: ['Spotify'],
      summary: 'Get linked Spotify user profile',
      security,
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            displayName: { type: 'string' },
            imageUrl: { type: 'string' },
          },
        },
        401: errorResponse,
        403: errorResponse,
      },
    },
  }, getSpotifyMeController);

  app.get('/now-playing', {
    preHandler: authenticate,
    schema: {
      tags: ['Spotify'],
      summary: 'Get currently playing track',
      security,
      response: {
        200: {
          type: 'object',
          nullable: true,
          properties: {
            isPlaying: { type: 'boolean' },
            trackName: { type: 'string' },
            artistName: { type: 'string' },
            albumName: { type: 'string' },
            albumImageUrl: { type: 'string' },
            progressMs: { type: 'integer' },
            durationMs: { type: 'integer' },
          },
        },
        401: errorResponse,
        403: errorResponse,
      },
    },
  }, getNowPlayingController);

  app.get('/top-tracks', {
    preHandler: authenticate,
    schema: {
      tags: ['Spotify'],
      summary: 'Get user top tracks — ?limit (1-50) &time_range (short|medium|long_term)',
      security,
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              artist: { type: 'string' },
              albumImageUrl: { type: 'string' },
            },
          },
        },
        401: errorResponse,
        403: errorResponse,
      },
    },
  }, getTopTracksController);

  app.post('/play', {
    preHandler: authenticate,
    schema: { tags: ['Spotify'], summary: 'Resume playback', security, response: { 200: emptyOk, 401: errorResponse, 403: errorResponse } },
  }, playController);

  app.post('/pause', {
    preHandler: authenticate,
    schema: { tags: ['Spotify'], summary: 'Pause playback', security, response: { 200: emptyOk, 401: errorResponse, 403: errorResponse } },
  }, pauseController);

  app.post('/next', {
    preHandler: authenticate,
    schema: { tags: ['Spotify'], summary: 'Skip to next track', security, response: { 200: emptyOk, 401: errorResponse, 403: errorResponse } },
  }, nextController);

  app.post('/previous', {
    preHandler: authenticate,
    schema: { tags: ['Spotify'], summary: 'Skip to previous track', security, response: { 200: emptyOk, 401: errorResponse, 403: errorResponse } },
  }, previousController);
}
