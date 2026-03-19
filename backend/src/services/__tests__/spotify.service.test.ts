import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/client.js', () => ({ db: { select: vi.fn() } }));
vi.mock('../token-refresh.service.js', () => ({ getValidAccessToken: vi.fn() }));
vi.mock('../../config.js', () => ({
  config: { SPOTIFY_CLIENT_ID: 'spot-id', SPOTIFY_CLIENT_SECRET: 'spot-secret' },
}));

import { db } from '../../db/client.js';
import { getValidAccessToken } from '../token-refresh.service.js';
import { getNowPlaying, getTopTracks, sendPlaybackCommand } from '../spotify.service.js';

const mockDb = db as unknown as { select: ReturnType<typeof vi.fn> };
const mockGetToken = getValidAccessToken as ReturnType<typeof vi.fn>;

function dbReturnsAccount(account: Record<string, unknown> | null): void {
  const limitMock = vi.fn().mockResolvedValue(account ? [account] : []);
  mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: limitMock }) }) });
}

const rawTrack = {
  name: 'Song',
  artists: [{ name: 'Artist' }],
  album: { name: 'Album', images: [{ url: 'https://img.example.com/art.jpg' }] },
  external_urls: { spotify: 'https://open.spotify.com/track/1' },
  duration_ms: 210000,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

// ── getNowPlaying ──────────────────────────────────────────────────────────

describe('getNowPlaying', () => {
  it('returns NOT_CONNECTED when no spotify account exists', async () => {
    dbReturnsAccount(null);
    mockGetToken.mockResolvedValue(null);

    const result = await getNowPlaying('user-1');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NOT_CONNECTED');
  });

  it('returns isPlaying: false and null track on 204 response', async () => {
    dbReturnsAccount({ id: 'acct-1' });
    mockGetToken.mockResolvedValue('token');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 204, ok: true }));

    const result = await getNowPlaying('user-1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.isPlaying).toBe(false);
      expect(result.data.track).toBeNull();
    }
  });

  it('returns API_ERROR on non-ok response', async () => {
    dbReturnsAccount({ id: 'acct-1' });
    mockGetToken.mockResolvedValue('token');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 500, ok: false }));

    const result = await getNowPlaying('user-1');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('API_ERROR');
  });

  it('returns normalized track data when playing', async () => {
    dbReturnsAccount({ id: 'acct-1' });
    mockGetToken.mockResolvedValue('token');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ is_playing: true, progress_ms: 12000, item: rawTrack }),
    }));

    const result = await getNowPlaying('user-1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.isPlaying).toBe(true);
      expect(result.data.track?.name).toBe('Song');
      expect(result.data.track?.artist).toBe('Artist');
    }
  });
});

// ── getTopTracks ───────────────────────────────────────────────────────────

describe('getTopTracks', () => {
  it('returns NOT_CONNECTED when token is unavailable', async () => {
    dbReturnsAccount(null);
    mockGetToken.mockResolvedValue(null);

    const result = await getTopTracks('user-1', 10, 'short_term');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NOT_CONNECTED');
  });

  it('returns API_ERROR on non-ok response', async () => {
    dbReturnsAccount({ id: 'acct-1' });
    mockGetToken.mockResolvedValue('token');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const result = await getTopTracks('user-1', 10, 'short_term');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('API_ERROR');
  });

  it('returns normalized tracks on success', async () => {
    dbReturnsAccount({ id: 'acct-1' });
    mockGetToken.mockResolvedValue('token');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [rawTrack, rawTrack] }),
    }));

    const result = await getTopTracks('user-1', 2, 'medium_term');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Song');
    }
  });

  it('defaults to short_term for unknown time range', async () => {
    dbReturnsAccount({ id: 'acct-1' });
    mockGetToken.mockResolvedValue('token');

    let capturedUrl = '';
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
    }));

    await getTopTracks('user-1', 10, 'unknown_range');

    expect(capturedUrl).toContain('time_range=short_term');
  });
});

// ── sendPlaybackCommand ────────────────────────────────────────────────────

describe('sendPlaybackCommand', () => {
  function mockFetchSequence(...responses: Array<{ status: number; ok: boolean; body?: unknown }>): void {
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      const r = responses[callCount] ?? responses[responses.length - 1];
      callCount++;
      return Promise.resolve({
        status: r.status,
        ok: r.ok,
        json: () => Promise.resolve(r.body ?? {}),
      });
    }));
  }

  it('returns NOT_CONNECTED when token is unavailable', async () => {
    dbReturnsAccount(null);
    mockGetToken.mockResolvedValue(null);

    const result = await sendPlaybackCommand('user-1', 'play');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NOT_CONNECTED');
  });

  it('returns ok:true for a successful play command (204)', async () => {
    dbReturnsAccount({ id: 'acct-1' });
    mockGetToken.mockResolvedValue('token');

    // player state (no device), devices list (empty), then command succeeds
    mockFetchSequence(
      { status: 200, ok: true, body: { device: { id: 'dev-1', name: 'PC', is_active: true } } },
      { status: 204, ok: true },
    );

    const result = await sendPlaybackCommand('user-1', 'play');

    expect(result.ok).toBe(true);
  });

  it('returns FORBIDDEN on 403', async () => {
    dbReturnsAccount({ id: 'acct-1' });
    mockGetToken.mockResolvedValue('token');

    mockFetchSequence(
      { status: 200, ok: true, body: { device: { id: 'dev-1', name: 'PC', is_active: true } } },
      { status: 403, ok: false },
    );

    const result = await sendPlaybackCommand('user-1', 'play');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('FORBIDDEN');
  });

  it('returns API_ERROR on generic failure', async () => {
    dbReturnsAccount({ id: 'acct-1' });
    mockGetToken.mockResolvedValue('token');

    mockFetchSequence(
      { status: 200, ok: true, body: { device: { id: 'dev-1', name: 'PC', is_active: true } } },
      { status: 500, ok: false },
    );

    const result = await sendPlaybackCommand('user-1', 'next');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('API_ERROR');
  });
});
