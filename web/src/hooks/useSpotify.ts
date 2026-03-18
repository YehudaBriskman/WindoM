import { useState, useEffect, useRef, useCallback } from 'react';
import { apiGet, apiFetch } from '../lib/api';
import { useSettings } from '../contexts/SettingsContext';

export interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;
  durationMs: number;
  url: string;
}

export interface NowPlayingState {
  isPlaying: boolean;
  progressMs: number;
  track: SpotifyTrack | null;
}

const POLL_INTERVAL_MS = 30_000;

export function useSpotify() {
  const { settings } = useSettings();
  const spotifyConnected = settings.spotifyConnected;
  const [state, setState] = useState<NowPlayingState>({ isPlaying: false, progressMs: 0, track: null });
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTicker = () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  };

  const startTicker = (playing: boolean, duration: number) => {
    stopTicker();
    if (!playing || duration <= 0) return;
    tickRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        progressMs: Math.min(prev.progressMs + 1000, duration),
      }));
    }, 1000);
  };

  const fetchNowPlaying = useCallback(async () => {
    try {
      const data = await apiGet<NowPlayingState>('/spotify/now-playing');
      setState(data);
      setError(null);
      startTicker(data.isPlaying, data.track?.durationMs ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    }
  }, []);

  useEffect(() => {
    if (!spotifyConnected) {
      setState({ isPlaying: false, progressMs: 0, track: null });
      stopTicker();
      return;
    }

    fetchNowPlaying();
    pollRef.current = setInterval(fetchNowPlaying, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      stopTicker();
    };
  }, [spotifyConnected]);

  const control = useCallback(async (action: 'play' | 'pause' | 'next' | 'previous') => {
    console.log(`[spotify] control: ${action}`);
    const res = await apiFetch(`/spotify/${action}`, { method: 'POST' }).catch((err) => {
      console.error('[spotify] control fetch error:', err);
      return null;
    });
    if (!res) return;
    console.log(`[spotify] control response status: ${res.status}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string; reason?: string; spotifyStatus?: number };
      console.error('[spotify] control error body:', body);
      if (res.status === 401) {
        setError('Session expired — please log in again via Settings → Account');
      } else {
        setError(`Control failed (${body.spotifyStatus ?? res.status}): ${body.error ?? 'unknown'}${body.reason ? ` — ${body.reason}` : ''}`);
      }
      return;
    }
    // Re-fetch after a short delay to reflect updated state
    setTimeout(fetchNowPlaying, 400);
  }, [fetchNowPlaying]);

  return { ...state, spotifyConnected, error, control };
}

export function useSpotifyTopTracks() {
  const { settings } = useSettings();
  const spotifyConnected = settings.spotifyConnected;
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);

  useEffect(() => {
    if (!spotifyConnected) { setTracks([]); return; }
    apiGet<{ tracks: SpotifyTrack[] }>('/spotify/top-tracks?limit=10&time_range=short_term')
      .then((data) => setTracks(data.tracks))
      .catch(() => setTracks([]));
  }, [spotifyConnected]);

  return { tracks };
}
