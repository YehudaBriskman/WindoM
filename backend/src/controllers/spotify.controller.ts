import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as spotifyService from '../services/spotify.service.js';
import type { PlaybackCommand } from '../services/spotify.service.js';

function sendSpotifyError(error: spotifyService.SpotifyError, reply: FastifyReply): void {
  if (error === 'NOT_CONNECTED') {
    void reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Spotify not connected' });
  } else if (error === 'FORBIDDEN') {
    void reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Spotify premium required or action not allowed' });
  } else {
    void reply.status(502).send({ statusCode: 502, error: 'Bad Gateway', message: 'Spotify API error' });
  }
}

export async function getNowPlayingController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const result = await spotifyService.getNowPlaying(req.user.sub);
  if (!result.ok) { sendSpotifyError(result.error, reply); return; }
  void reply.send(result.data);
}

export async function getTopTracksController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { limit = '10', time_range = 'short_term' } = req.query as { limit?: string; time_range?: string };
  const result = await spotifyService.getTopTracks(req.user.sub, parseInt(limit, 10) || 10, time_range);
  if (!result.ok) { sendSpotifyError(result.error, reply); return; }
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

// GET /spotify/me — proxy Spotify user profile
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
  return commandSchema.safeParse(value).success ? (value as PlaybackCommand) : null;
}
