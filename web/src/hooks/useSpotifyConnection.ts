import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  SPOTIFY_OAUTH,
  clearSpotifyClientId,
  loadSpotifyClientId,
  mapSpotifyConnectError,
  saveSpotifyClientId,
} from '../lib/spotify-oauth';
import { useOAuthConnection, type OAuthConnectionConfig } from './useOAuthConnection';

export type SpotifySetupState = 'loading' | 'no-client-id' | 'saved-not-connected' | 'connected';

/**
 * Which of Spotify's three settings screens to show: no client ID yet, a saved
 * client ID that is not connected, or connected. Re-derived from storage
 * whenever the synced `connected` flag changes.
 */
export function useSpotifySetup() {
  const { settings } = useSettings();
  const spotifyConnected = settings.integrations.spotify.connected;

  const [state, setState] = useState<SpotifySetupState>('loading');
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    void loadSpotifyClientId().then((saved) => {
      setClientId(saved);
      if (!saved) setState('no-client-id');
      else if (spotifyConnected) setState('connected');
      else setState('saved-not-connected');
    });
  }, [spotifyConnected]);

  async function changeApp() {
    await clearSpotifyClientId();
    setClientId('');
    setState('no-client-id');
  }

  return { state, setState, clientId, changeApp };
}

/**
 * Connect/disconnect for one of Spotify's settings screens. Each screen calls
 * it for its own busy/error state. `afterConnect` runs once the backend reports the account
 * linked, after the synced `connected` flag is written.
 */
export function useSpotifyConnection({
  afterConnect = () => {},
  afterDisconnect = () => {},
  saveClientId = false,
}: {
  afterConnect?: () => void;
  afterDisconnect?: () => void;
  saveClientId?: boolean;
}) {
  const { settings, update } = useSettings();
  const { user } = useAuth();
  const setConnected = (connected: boolean) =>
    update('integrations', { spotify: { ...settings.integrations.spotify, connected } });

  const config: OAuthConnectionConfig<string> = {
    provider: SPOTIFY_OAUTH,
    async onConnected(clientId) {
      // Saved only after a successful link, so a mistyped ID is never kept.
      if (saveClientId) await saveSpotifyClientId(clientId);
      await setConnected(true);
      afterConnect();
    },
    async onDisconnected() {
      await clearSpotifyClientId();
      await setConnected(false);
      afterDisconnect();
    },
    mapConnectError: (err) => mapSpotifyConnectError(err, user !== null),
    disconnectFailedMessage: 'Failed to disconnect Spotify',
  };
  return useOAuthConnection(config);
}
