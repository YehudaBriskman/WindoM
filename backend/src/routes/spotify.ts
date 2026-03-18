import type { FastifyInstance, FastifyReply } from 'fastify';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate } from '../middleware/authenticate.js';
import { decryptToken, encryptToken } from '../lib/crypto.js';
import { config } from '../config.js';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API = 'https://api.spotify.com/v1';

interface SpotifyRefreshResponse {
  access_token: string;
  expires_in: number;
}

interface SpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  external_urls: { spotify: string };
  duration_ms: number;
}

interface SpotifyNowPlayingResponse {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack | null;
}

interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
}

async function getValidSpotifyToken(account: typeof oauthAccounts.$inferSelect): Promise<string | null> {
  const now = new Date();
  const expiresAt = account.tokenExpiresAt ? new Date(account.tokenExpiresAt) : null;

  if (expiresAt && expiresAt.getTime() - now.getTime() > 60_000) {
    return decryptToken(account.accessTokenEnc);
  }

  if (!account.refreshTokenEnc) return null;
  const refreshToken = await decryptToken(account.refreshTokenEnc);

  const basicAuth = Buffer.from(`${config.SPOTIFY_CLIENT_ID}:${config.SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as SpotifyRefreshResponse;

  const newAccessEnc = await encryptToken(data.access_token);
  const newExpiry = new Date(Date.now() + data.expires_in * 1000);
  await db
    .update(oauthAccounts)
    .set({ accessTokenEnc: newAccessEnc, tokenExpiresAt: newExpiry, updatedAt: new Date() })
    .where(eq(oauthAccounts.id, account.id));

  return data.access_token;
}

export async function spotifyRoutes(app: FastifyInstance) {
  // GET /spotify/me
  app.get('/me', { preHandler: authenticate }, async (req, reply) => {
    const [account] = await db
      .select()
      .from(oauthAccounts)
      .where(and(eq(oauthAccounts.userId, req.user.sub), eq(oauthAccounts.provider, 'spotify')))
      .limit(1);

    if (!account) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Spotify not connected' });
    }

    const token = await getValidSpotifyToken(account);
    if (!token) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Could not refresh Spotify token' });

    const res = await fetch(`${SPOTIFY_API}/me`, { headers: { Authorization: `Bearer ${token}` } });
    const user = await res.json();
    return reply.send(user);
  });

  // GET /spotify/now-playing
  app.get('/now-playing', { preHandler: authenticate }, async (req, reply) => {
    const [account] = await db
      .select()
      .from(oauthAccounts)
      .where(and(eq(oauthAccounts.userId, req.user.sub), eq(oauthAccounts.provider, 'spotify')))
      .limit(1);

    if (!account) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Spotify not connected' });
    }

    const token = await getValidSpotifyToken(account);
    if (!token) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Could not refresh Spotify token' });

    const res = await fetch(`${SPOTIFY_API}/me/player/currently-playing`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 204 = nothing playing
    if (res.status === 204) {
      return reply.send({ isPlaying: false, track: null });
    }

    if (!res.ok) {
      return reply.status(502).send({ statusCode: 502, error: 'Bad Gateway', message: 'Spotify API error' });
    }

    const data = (await res.json()) as SpotifyNowPlayingResponse;
    if (!data.item) {
      return reply.send({ isPlaying: false, track: null });
    }

    return reply.send({
      isPlaying: data.is_playing,
      progressMs: data.progress_ms,
      track: {
        name: data.item.name,
        artist: data.item.artists.map((a) => a.name).join(', '),
        album: data.item.album.name,
        albumArt: data.item.album.images[0]?.url ?? null,
        durationMs: data.item.duration_ms,
        url: data.item.external_urls.spotify,
      },
    });
  });

  // GET /spotify/top-tracks?limit=10&time_range=short_term
  app.get('/top-tracks', { preHandler: authenticate }, async (req, reply) => {
    const { limit = '10', time_range = 'short_term' } = req.query as { limit?: string; time_range?: string };

    const [account] = await db
      .select()
      .from(oauthAccounts)
      .where(and(eq(oauthAccounts.userId, req.user.sub), eq(oauthAccounts.provider, 'spotify')))
      .limit(1);

    if (!account) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Spotify not connected' });
    }

    const token = await getValidSpotifyToken(account);
    if (!token) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Could not refresh Spotify token' });

    const params = new URLSearchParams({
      limit: String(Math.min(50, Math.max(1, parseInt(limit, 10) || 10))),
      time_range: ['short_term', 'medium_term', 'long_term'].includes(time_range) ? time_range : 'short_term',
    });

    const res = await fetch(`${SPOTIFY_API}/me/top/tracks?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return reply.status(502).send({ statusCode: 502, error: 'Bad Gateway', message: 'Spotify API error' });
    }

    const data = (await res.json()) as SpotifyTopTracksResponse;
    const tracks = (data.items ?? []).map((item) => ({
      name: item.name,
      artist: item.artists.map((a) => a.name).join(', '),
      album: item.album.name,
      albumArt: item.album.images[0]?.url ?? null,
      durationMs: item.duration_ms,
      url: item.external_urls.spotify,
    }));

    return reply.send({ tracks });
  });

  // ── Playback controls ────────────────────────────────────────────────────
  async function getAccountAndToken(userId: string) {
    const [account] = await db
      .select()
      .from(oauthAccounts)
      .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, 'spotify')))
      .limit(1);
    if (!account) return null;
    return getValidSpotifyToken(account);
  }

  interface SpotifyPlayerState {
    device?: { id: string; name: string; type: string; is_active: boolean };
  }
  interface SpotifyDevicesResponse {
    devices: Array<{ id: string; name: string; type: string; is_active: boolean }>;
  }

  /** Fetch the best device_id to send commands to.
   *  1. Try GET /me/player (currently playing device)
   *  2. Fall back to GET /me/player/devices (pick active, else first available)
   */
  async function getActiveDeviceId(token: string): Promise<string | null> {
    const headers = { Authorization: `Bearer ${token}` };

    // 1. Try current player state first
    const playerRes = await fetch(`${SPOTIFY_API}/me/player`, { headers });
    if (playerRes.ok && playerRes.status !== 204) {
      const data = (await playerRes.json()) as SpotifyPlayerState;
      if (data?.device?.id) {
        app.log.info({ deviceId: data.device.id, deviceName: data.device.name, isActive: data.device.is_active, source: 'player' }, '[spotify-control] device resolved');
        return data.device.id;
      }
    }

    // 2. Fall back to device list
    const devicesRes = await fetch(`${SPOTIFY_API}/me/player/devices`, { headers });
    if (!devicesRes.ok) {
      app.log.warn({ status: devicesRes.status }, '[spotify-control] could not fetch devices');
      return null;
    }
    const { devices } = (await devicesRes.json()) as SpotifyDevicesResponse;
    app.log.info({ devices: devices.map(d => ({ id: d.id, name: d.name, type: d.type, active: d.is_active })) }, '[spotify-control] available devices');

    const active = devices.find(d => d.is_active) ?? devices[0] ?? null;
    if (active) {
      app.log.info({ deviceId: active.id, deviceName: active.name, source: 'devices-list' }, '[spotify-control] device resolved');
      return active.id;
    }

    app.log.warn('[spotify-control] no device found');
    return null;
  }

  /** Proxy a Spotify playback command, forwarding any error back to the client */
  async function spotifyControl(
    token: string,
    method: 'PUT' | 'POST',
    endpoint: string,
    reply: FastifyReply,
  ) {
    // Always resolve the active device_id and pin it to the request
    const deviceId = await getActiveDeviceId(token);
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = deviceId
      ? `${SPOTIFY_API}${endpoint}${separator}device_id=${deviceId}`
      : `${SPOTIFY_API}${endpoint}`;

    app.log.info({ method, url, deviceId }, '[spotify-control] sending request to Spotify');

    const spotifyRes = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });

    app.log.info({ status: spotifyRes.status, endpoint }, '[spotify-control] Spotify responded');

    if (spotifyRes.status === 204 || spotifyRes.status === 200) {
      return reply.status(204).send();
    }

    const body = await spotifyRes.json().catch(() => ({})) as { error?: { message?: string; reason?: string } };
    app.log.error({ status: spotifyRes.status, body, endpoint, deviceId }, '[spotify-control] Spotify error');
    return reply.status(spotifyRes.status === 403 ? 403 : 502).send({
      error: body?.error?.message ?? 'Spotify API error',
      reason: body?.error?.reason,
      spotifyStatus: spotifyRes.status,
    });
  }

  // POST /spotify/play
  app.post('/play', { preHandler: authenticate }, async (req, reply) => {
    const token = await getAccountAndToken(req.user.sub);
    if (!token) return reply.status(404).send({ error: 'Spotify not connected' });
    return spotifyControl(token, 'PUT', '/me/player/play', reply);
  });

  // POST /spotify/pause
  app.post('/pause', { preHandler: authenticate }, async (req, reply) => {
    const token = await getAccountAndToken(req.user.sub);
    if (!token) return reply.status(404).send({ error: 'Spotify not connected' });
    return spotifyControl(token, 'PUT', '/me/player/pause', reply);
  });

  // POST /spotify/next
  app.post('/next', { preHandler: authenticate }, async (req, reply) => {
    const token = await getAccountAndToken(req.user.sub);
    if (!token) return reply.status(404).send({ error: 'Spotify not connected' });
    return spotifyControl(token, 'POST', '/me/player/next', reply);
  });

  // POST /spotify/previous
  app.post('/previous', { preHandler: authenticate }, async (req, reply) => {
    const token = await getAccountAndToken(req.user.sub);
    if (!token) return reply.status(404).send({ error: 'Spotify not connected' });
    return spotifyControl(token, 'POST', '/me/player/previous', reply);
  });
}
