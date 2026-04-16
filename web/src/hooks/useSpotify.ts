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

const POLL_INTERVAL_MS = 60_000;

export function useSpotify() {
  const { settings } = useSettings();
  const spotifyConnected = settings.spotifyConnected;
  const [state, setState] = useState<NowPlayingState>({ isPlaying: false, progressMs: 0, track: null });
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use refs so these helpers are always fresh inside useCallback closures
  const stopTicker = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }, []);

  const startTicker = useCallback((playing: boolean, duration: number) => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (!playing || duration <= 0) return;
    tickRef.current = setInterval(() => {
      setState((prev) => {
        const next = Math.min(prev.progressMs + 1000, duration);
        if (next >= duration && tickRef.current) {
          clearInterval(tickRef.current);
          tickRef.current = null;
        }
        return { ...prev, progressMs: next };
      });
    }, 1000);
  }, []);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const data = await apiGet<NowPlayingState>('/spotify/now-playing');
      setState(data);
      setError(null);
      startTicker(data.isPlaying, data.track?.durationMs ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch';
      // NO_DEVICE is a normal state (Spotify closed) — show friendly message, not error
      if (msg.includes('No active') || msg.includes('NO_DEVICE') || msg.includes('422')) {
        setState({ isPlaying: false, progressMs: 0, track: null });
        setError('Open Spotify on a device to start playing');
      } else {
        setError(msg);
      }
      stopTicker();
    }
  }, [startTicker, stopTicker]);

  useEffect(() => {
    if (!spotifyConnected) {
      setState({ isPlaying: false, progressMs: 0, track: null });
      setError(null);
      stopTicker();
      return;
    }

    void fetchNowPlaying();
    pollRef.current = setInterval(() => { void fetchNowPlaying(); }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      stopTicker();
    };
  }, [spotifyConnected, fetchNowPlaying, stopTicker]);

  const control = useCallback(async (action: 'play' | 'pause' | 'next' | 'previous') => {
    // Optimistic update so the UI responds instantly before the re-fetch
    if (action === 'pause') {
      setState((prev) => ({ ...prev, isPlaying: false }));
      stopTicker();
    } else if (action === 'play') {
      setState((prev) => ({ ...prev, isPlaying: true }));
      // Ticker will be (re)started by the fetchNowPlaying below once duration is confirmed
    }

    const res = await apiFetch(`/spotify/${action}`, { method: 'POST' }).catch((err: unknown) => {
      console.error('[spotify] control fetch error:', err);
      return null;
    });

    if (!res) {
      setError('Network error — could not reach server');
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string; reason?: string; spotifyStatus?: number };
      if (res.status === 422 || body.error === 'NO_DEVICE') {
        setError('Open Spotify on a device to control playback');
      } else if (res.status === 401) {
        setError('Session expired — sign in again via Settings → Account');
      } else if (res.status === 403) {
        setError('Spotify Premium required for playback control');
      } else {
        setError(`Control failed: ${body.error ?? 'unknown error'}`);
      }
      // Revert optimistic update on failure
      if (action === 'pause') setState((prev) => ({ ...prev, isPlaying: true }));
      if (action === 'play') setState((prev) => ({ ...prev, isPlaying: false }));
      return;
    }

    // Re-fetch after short delay to confirm actual Spotify state
    setTimeout(() => { void fetchNowPlaying(); }, 400);
  }, [fetchNowPlaying, stopTicker]);

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
