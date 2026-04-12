import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import { getValidAccessToken } from './token-refresh.service.js';
import { config } from '../config.js';
import { SPOTIFY_TOKEN_URL, SPOTIFY_API, MAX_TOP_TRACKS, DEFAULT_TOP_TRACKS } from '../types/constants.js';
import type { Result } from '../types/auth.types.js';
import type { OAuthError } from '../types/oauth.types.js';

export type SpotifyError = OAuthError | 'NOT_CONNECTED' | 'NO_DEVICE';

export type PlaybackCommand = 'play' | 'pause' | 'next' | 'previous';

export const VALID_TIME_RANGES = ['short_term', 'medium_term', 'long_term'] as const;
export type TimeRange = (typeof VALID_TIME_RANGES)[number];

export interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;
  durationMs: number;
  url: string;
}

export interface NowPlayingResult {
  isPlaying: boolean;
  progressMs?: number;
  track: SpotifyTrack | null;
}

interface RawSpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string; images: Array<{ url: string }> };
  external_urls: { spotify: string };
  duration_ms: number;
}

interface SpotifyNowPlayingResponse {
  is_playing: boolean;
  progress_ms: number;
  item: RawSpotifyTrack | null;
}

interface SpotifyTopTracksResponse {
  items: RawSpotifyTrack[];
}

interface SpotifyPlayerState {
  device?: { id: string; name: string; is_active: boolean };
}

interface SpotifyDevicesResponse {
  devices: Array<{ id: string; name: string; is_active: boolean }>;
}

const COMMAND_CONFIG: Record<PlaybackCommand, { method: 'PUT' | 'POST'; endpoint: string }> = {
  play: { method: 'PUT', endpoint: '/me/player/play' },
  pause: { method: 'PUT', endpoint: '/me/player/pause' },
  next: { method: 'POST', endpoint: '/me/player/next' },
  previous: { method: 'POST', endpoint: '/me/player/previous' },
};

function spotifyBasicAuth(): string {
  return `Basic ${Buffer.from(`${config.SPOTIFY_CLIENT_ID}:${config.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`;
}

function normalizeTrack(item: RawSpotifyTrack): SpotifyTrack {
  return {
    name: item.name,
    artist: item.artists.map((a) => a.name).join(', '),
    album: item.album.name,
    albumArt: item.album.images[0]?.url ?? null,
    durationMs: item.duration_ms,
    url: item.external_urls.spotify,
  };
}

async function getSpotifyToken(userId: string): Promise<string | null> {
  const [account] = await db
    .select()
    .from(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, 'spotify')))
    .limit(1);

  if (!account) return null;
  return getValidAccessToken(account, { tokenUrl: SPOTIFY_TOKEN_URL, authHeader: spotifyBasicAuth(), extraBody: {} });
}

/** Resolve the best available Spotify device ID to target for playback commands. */
async function resolveActiveDeviceId(token: string): Promise<string | null> {
  const headers = { Authorization: `Bearer ${token}` };

  const playerRes = await fetch(`${SPOTIFY_API}/me/player`, { headers });
  if (playerRes.ok && playerRes.status !== 204) {
    const data = (await playerRes.json()) as SpotifyPlayerState;
    if (data?.device?.id) return data.device.id;
  }

  const devicesRes = await fetch(`${SPOTIFY_API}/me/player/devices`, { headers });
  if (!devicesRes.ok) return null;

  const { devices } = (await devicesRes.json()) as SpotifyDevicesResponse;
  const active = devices.find((d) => d.is_active) ?? devices[0] ?? null;
  return active?.id ?? null;
}

const NOW_PLAYING_TTL_MS = 15_000;
const nowPlayingCache = new Map<string, { data: Result<NowPlayingResult, SpotifyError>; expiresAt: number }>();

export async function getNowPlaying(userId: string): Promise<Result<NowPlayingResult, SpotifyError>> {
  const cached = nowPlayingCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const token = await getSpotifyToken(userId);
  if (!token) return { ok: false, error: 'NOT_CONNECTED' };

  const res = await fetch(`${SPOTIFY_API}/me/player/currently-playing`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 204) {
    const result: Result<NowPlayingResult, SpotifyError> = { ok: true, data: { isPlaying: false, track: null } };
    nowPlayingCache.set(userId, { data: result, expiresAt: Date.now() + NOW_PLAYING_TTL_MS });
    return result;
  }
  if (!res.ok) return { ok: false, error: 'API_ERROR' };

  const data = (await res.json()) as SpotifyNowPlayingResponse;
  if (!data.item) {
    const result: Result<NowPlayingResult, SpotifyError> = { ok: true, data: { isPlaying: false, track: null } };
    nowPlayingCache.set(userId, { data: result, expiresAt: Date.now() + NOW_PLAYING_TTL_MS });
    return result;
  }

  const result: Result<NowPlayingResult, SpotifyError> = {
    ok: true,
    data: { isPlaying: data.is_playing, progressMs: data.progress_ms, track: normalizeTrack(data.item) },
  };
  nowPlayingCache.set(userId, { data: result, expiresAt: Date.now() + NOW_PLAYING_TTL_MS });
  return result;
}

/** Invalidate the now-playing cache for a user (e.g. on disconnect). */
export function invalidateNowPlayingCache(userId: string): void {
  nowPlayingCache.delete(userId);
}

/** Clear the entire now-playing cache. Only intended for use in tests. */
export function clearNowPlayingCacheForTest(): void {
  nowPlayingCache.clear();
}

export async function getTopTracks(
  userId: string,
  limit: number,
  timeRange: string,
): Promise<Result<SpotifyTrack[], SpotifyError>> {
  const token = await getSpotifyToken(userId);
  if (!token) return { ok: false, error: 'NOT_CONNECTED' };

  const safeLimit = Math.min(MAX_TOP_TRACKS, Math.max(1, limit || DEFAULT_TOP_TRACKS));
  const safeRange: TimeRange = VALID_TIME_RANGES.includes(timeRange as TimeRange)
    ? (timeRange as TimeRange)
    : 'short_term';

  const params = new URLSearchParams({ limit: String(safeLimit), time_range: safeRange });
  const res = await fetch(`${SPOTIFY_API}/me/top/tracks?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return { ok: false, error: 'API_ERROR' };

  const data = (await res.json()) as SpotifyTopTracksResponse;
  return { ok: true, data: (data.items ?? []).map(normalizeTrack) };
}

export async function sendPlaybackCommand(
  userId: string,
  command: PlaybackCommand,
): Promise<Result<void, SpotifyError>> {
  const token = await getSpotifyToken(userId);
  if (!token) return { ok: false, error: 'NOT_CONNECTED' };

  const deviceId = await resolveActiveDeviceId(token);
  if (!deviceId) return { ok: false, error: 'NO_DEVICE' };

  const { method, endpoint } = COMMAND_CONFIG[command];
  const sep = endpoint.includes('?') ? '&' : '?';
  const url = `${SPOTIFY_API}${endpoint}${sep}device_id=${deviceId}`;

  const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` } });

  if (res.status === 204 || res.status === 200) return { ok: true, data: undefined };
  if (res.status === 403) return { ok: false, error: 'FORBIDDEN' };
  return { ok: false, error: 'API_ERROR' };
}
