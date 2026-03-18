import { useState, useEffect, useRef, useCallback } from 'react';
import { apiGet } from '../lib/api';
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const data = await apiGet<NowPlayingState>('/spotify/now-playing');
      setState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    }
  }, []);

  useEffect(() => {
    if (!spotifyConnected) {
      setState({ isPlaying: false, progressMs: 0, track: null });
      return;
    }

    fetchNowPlaying();
    timerRef.current = setInterval(fetchNowPlaying, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [spotifyConnected]);

  return { ...state, spotifyConnected, error };
}
