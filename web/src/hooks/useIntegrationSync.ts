import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { apiGet } from '../lib/api';

interface IntegrationsResponse {
  google: { connected: boolean };
  spotify: { connected: boolean };
}

/**
 * Syncs calendarConnected / spotifyConnected from the server once both
 * settings storage and auth init have finished. Clears both flags on logout.
 *
 * Must be called inside a component below both AuthProvider and SettingsProvider.
 */
export function useIntegrationSync() {
  const { user, loading: authLoading } = useAuth();
  const { updateMultiple, loaded: settingsLoaded } = useSettings();

  useEffect(() => {
    // Wait until chrome.storage has loaded AND auth init has resolved.
    // Running before either completes causes a race where stale storage
    // overwrites a premature clear, or we fetch before we have a valid token.
    if (!settingsLoaded || authLoading) return;

    if (!user) {
      updateMultiple({ calendarConnected: false, spotifyConnected: false });
      return;
    }

    let cancelled = false;

    apiGet<IntegrationsResponse>('/integrations')
      .then(({ google, spotify }) => {
        if (cancelled) return;
        updateMultiple({
          calendarConnected: google.connected,
          spotifyConnected: spotify.connected,
        });
      })
      .catch(() => {
        // Backend unreachable — flags stay as loaded from storage
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, settingsLoaded, authLoading]);
}
