import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as spotifyService from '../services/spotify.service.js';
import type { PlaybackCommand } from '../services/spotify.service.js';

function sendSpotifyError(error: spotifyService.SpotifyError, reply: FastifyReply): void {
  if (error === 'NOT_CONNECTED') {
    void reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Spotify not connected' });
  } else if (error === 'NO_DEVICE') {
    void reply.status(422).send({ statusCode: 422, error: 'No Active Device', message: 'Open Spotify on any device to enable playback control' });
  } else if (error === 'FORBIDDEN') {
    void reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Spotify premium required or action not allowed' });
  } else {
    void reply.status(502).send({ statusCode: 502, error: 'Bad Gateway', message: 'Spotify API error' });
  }
}

export async function getNowPlayingController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const result = await spotifyService.getNowPlaying(req.user.sub);
  if (!result.ok) { sendSpotifyError(result.error, reply); return; }
  reply.header('Cache-Control', 'no-store');
  void reply.send(result.data);
}

const topTracksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  time_range: z.enum(['short_term', 'medium_term', 'long_term']).default('short_term'),
});

export async function getTopTracksController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = topTracksQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    void reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'limit must be 1–50; time_range must be short_term, medium_term, or long_term' });
    return;
  }
  const result = await spotifyService.getTopTracks(req.user.sub, parsed.data.limit, parsed.data.time_range);
  if (!result.ok) { sendSpotifyError(result.error, reply); return; }
  reply.header('Cache-Control', 'private, max-age=300');
  void reply.send({ tracks: result.data });
}

const commandSchema = z.enum(['play', 'pause', 'next', 'previous']);

/** Factory: returns a Fastify handler for the given playback command. */
export function playbackCommandController(
  command: PlaybackCommand,
): (req: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const result = await spotifyService.sendPlaybackCommand(req.user.sub, command);
    if (!result.ok) { sendSpotifyError(result.error, reply); return; }
    void reply.status(204).send();
  };
}

export const playController = playbackCommandController('play');
export const pauseController = playbackCommandController('pause');
export const nextController = playbackCommandController('next');
export const previousController = playbackCommandController('previous');

// GET /spotify/me - proxy Spotify user profile
export async function getSpotifyMeController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Re-use getNowPlaying token path via the service to get account
  // We only need to confirm connectivity; return raw Spotify /me data
  const { sub } = req.user;
  const nowPlayingResult = await spotifyService.getNowPlaying(sub);
  if (!nowPlayingResult.ok && nowPlayingResult.error === 'NOT_CONNECTED') {
    void reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Spotify not connected' });
    return;
  }
  // Return minimal connected status (the extension doesn't use full /me data)
  void reply.send({ connected: true });
}

// Validate that a value is a valid playback command
export function parsePlaybackCommand(value: string): PlaybackCommand | null {
  const result = commandSchema.safeParse(value);
  return result.success ? result.data : null;
}
