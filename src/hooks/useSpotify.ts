import { useState, useEffect, useRef } from 'react';
import { apiGet } from '../lib/api';
import { syncStorage } from '../lib/chrome-storage';

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

function useIsSpotifyConnected(): boolean {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    syncStorage.get<boolean>('spotifyConnected', false).then(setConnected);
    return syncStorage.onChange((changes) => {
      if (changes.spotifyConnected) setConnected(changes.spotifyConnected.newValue as boolean);
    });
  }, []);
  return connected;
}

export function useSpotify() {
  const spotifyConnected = useIsSpotifyConnected();
  const [state, setState] = useState<NowPlayingState>({ isPlaying: false, progressMs: 0, track: null });
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchNowPlaying() {
    try {
      const data = await apiGet<NowPlayingState>('/spotify/now-playing');
      setState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    }
  }

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
