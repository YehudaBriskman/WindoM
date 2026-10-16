import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/calendar.service.js', () => ({ getCalendarEvents: vi.fn() }));
vi.mock('../../services/gmail.service.js', () => ({ getGmailSummary: vi.fn() }));
vi.mock('../../services/spotify.service.js', () => ({
  getNowPlaying: vi.fn(),
  getTopTracks: vi.fn(),
  sendPlaybackCommand: vi.fn(),
}));

import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { signAccessToken } from '../../lib/jwt.js';
import * as calendarService from '../../services/calendar.service.js';
import * as gmailService from '../../services/gmail.service.js';
import * as spotifyService from '../../services/spotify.service.js';

let app: FastifyInstance;
let authorization: string;

beforeAll(async () => {
  app = await buildApp({ logger: false, skipRateLimit: true });
  authorization = `Bearer ${await signAccessToken({
    sub: 'user-1', email: 'user@example.com', name: 'Alice', emailVerified: true,
  })}`;
});

afterAll(async () => app.close());
beforeEach(() => vi.clearAllMocks());

describe('integration route adapters', () => {
  it.each([
    '/calendar/events', '/gmail/summary', '/spotify/now-playing', '/spotify/top-tracks',
  ])('rejects unauthenticated GET %s', async (url) => {
    expect((await app.inject({ method: 'GET', url })).statusCode).toBe(401);
  });

  it.each(['/spotify/play', '/spotify/pause', '/spotify/next', '/spotify/previous'])(
    'rejects unauthenticated POST %s',
    async (url) => expect((await app.inject({ method: 'POST', url })).statusCode).toBe(401),
  );

  it.each(['?days=0', '?days=91', '?days=1.5', '?limit=0', '?limit=201', '?offset=-1'])(
    'rejects invalid calendar query %s',
    async (query) => {
      const response = await app.inject({ method: 'GET', url: `/calendar/events${query}`, headers: { authorization } });
      expect(response.statusCode).toBe(400);
      expect(calendarService.getCalendarEvents).not.toHaveBeenCalled();
    },
  );

  it('paginates calendar results and sets private cache policy', async () => {
    vi.mocked(calendarService.getCalendarEvents).mockResolvedValue({
      ok: true,
      data: [
        { id: '1', title: 'One', date: '2026-01-01', description: '' },
        { id: '2', title: 'Two', date: '2026-01-02', description: '' },
      ],
    });
    const response = await app.inject({
      method: 'GET', url: '/calendar/events?days=14&limit=1&offset=1', headers: { authorization },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ total: 2, limit: 1, offset: 1, events: [{ id: '2' }] });
    expect(response.headers['cache-control']).toBe('private, max-age=60');
    expect(calendarService.getCalendarEvents).toHaveBeenCalledWith('user-1', 14);
  });

  it.each([
    ['NOT_CONNECTED', 404], ['TOKEN_REFRESH_FAILED', 401], ['TOKEN_REFRESH_REVOKED', 401],
  ] as const)('maps calendar %s to HTTP %s', async (error, statusCode) => {
    vi.mocked(calendarService.getCalendarEvents).mockResolvedValue({ ok: false, error });
    expect((await app.inject({ method: 'GET', url: '/calendar/events', headers: { authorization } })).statusCode)
      .toBe(statusCode);
  });

  it.each([
    ['NOT_CONNECTED', 404],
    ['INSUFFICIENT_SCOPES', 403],
    ['GMAIL_API_FORBIDDEN', 403],
    ['TOKEN_REFRESH_REVOKED', 403],
    ['TOKEN_REFRESH_FAILED', 403],
    ['TOKEN_REFRESH_NETWORK_ERROR', 503],
  ] as const)('maps Gmail %s to HTTP %s', async (error, statusCode) => {
    vi.mocked(gmailService.getGmailSummary).mockResolvedValue({ ok: false, error });
    expect((await app.inject({ method: 'GET', url: '/gmail/summary', headers: { authorization } })).statusCode)
      .toBe(statusCode);
  });

  it('returns the Gmail response shape and cache policy', async () => {
    vi.mocked(gmailService.getGmailSummary).mockResolvedValue({ ok: true, data: { unreadCount: 0, messages: [] } });
    const response = await app.inject({ method: 'GET', url: '/gmail/summary', headers: { authorization } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ unreadCount: 0, messages: [] });
    expect(response.headers['cache-control']).toBe('private, max-age=45');
  });

  it.each(['?limit=0', '?limit=51', '?limit=1.5', '?time_range=invalid'])(
    'rejects invalid Spotify top-track query %s',
    async (query) => {
      const response = await app.inject({ method: 'GET', url: `/spotify/top-tracks${query}`, headers: { authorization } });
      expect(response.statusCode).toBe(400);
      expect(spotifyService.getTopTracks).not.toHaveBeenCalled();
    },
  );

  it('returns Spotify top tracks without schema truncation', async () => {
    vi.mocked(spotifyService.getTopTracks).mockResolvedValue({
      ok: true,
      data: [{ name: 'Song', artist: 'Artist', album: 'Album', albumArt: null, durationMs: 123, url: 'https://spotify.test/song' }],
    });
    const response = await app.inject({ method: 'GET', url: '/spotify/top-tracks?limit=1&time_range=long_term', headers: { authorization } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ tracks: [{ name: 'Song', artist: 'Artist', album: 'Album', albumArt: null, durationMs: 123, url: 'https://spotify.test/song' }] });
    expect(spotifyService.getTopTracks).toHaveBeenCalledWith('user-1', 1, 'long_term');
  });

  it.each([
    ['NOT_CONNECTED', 404], ['NO_DEVICE', 422], ['FORBIDDEN', 403], ['API_ERROR', 502],
  ] as const)('maps Spotify playback %s to HTTP %s', async (error, statusCode) => {
    vi.mocked(spotifyService.sendPlaybackCommand).mockResolvedValue({ ok: false, error });
    expect((await app.inject({ method: 'POST', url: '/spotify/play', headers: { authorization } })).statusCode)
      .toBe(statusCode);
  });

  it.each([
    ['/spotify/play', 'play'], ['/spotify/pause', 'pause'], ['/spotify/next', 'next'], ['/spotify/previous', 'previous'],
  ] as const)('dispatches %s to the %s command', async (url, command) => {
    vi.mocked(spotifyService.sendPlaybackCommand).mockResolvedValue({ ok: true, data: undefined });
    const response = await app.inject({ method: 'POST', url, headers: { authorization } });
    expect(response.statusCode).toBe(204);
    expect(spotifyService.sendPlaybackCommand).toHaveBeenCalledWith('user-1', command);
  });
});
