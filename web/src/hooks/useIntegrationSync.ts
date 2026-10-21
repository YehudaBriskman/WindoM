import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { apiGet } from '../lib/api';
import { setGmailAvailable } from '../lib/server-features';

interface IntegrationsResponse {
  google: { connected: boolean; scopes: string[] };
  spotify: { connected: boolean };
  github: { connected: boolean };
  /** Absent on servers older than the Gmail feature flag; treated as on. */
  features?: { gmail?: boolean };
}

/**
 * Syncs calendar/spotify connected state from the server once both
 * settings storage and auth init have finished. Clears both flags on logout.
 *
 * Must be called inside a component below both AuthProvider and SettingsProvider.
 */
export function useIntegrationSync() {
  const { user, authLoading } = useAuth();
  const { settings, updateMultiple, loaded: settingsLoaded } = useSettings();

  useEffect(() => {
    if (!settingsLoaded || authLoading) return;

    if (!user) {
      void updateMultiple({
        integrations: {
          ...settings.integrations,
          calendar: { ...settings.integrations.calendar, connected: false },
          spotify: { ...settings.integrations.spotify, connected: false },
          gmail: { ...settings.integrations.gmail, connected: false },
          github: { ...settings.integrations.github, connected: false },
        },
      });
      return;
    }

    let cancelled = false;

    apiGet<IntegrationsResponse>('/integrations')
      .then(({ google, spotify, github, features }) => {
        if (cancelled) return;
        // A server with Gmail off never grants the scope, so a stale `connected`
        // flag from before it was turned off would keep the widget polling an
        // endpoint that now refuses it.
        const gmailOffered = features?.gmail !== false;
        setGmailAvailable(gmailOffered);
        const hasGmailScope = gmailOffered && google.scopes.some((s) => s.includes('gmail'));
        void updateMultiple({
          integrations: {
            ...settings.integrations,
            calendar: { ...settings.integrations.calendar, connected: google.connected },
            spotify: { ...settings.integrations.spotify, connected: spotify.connected },
            gmail: { ...settings.integrations.gmail, connected: google.connected && hasGmailScope },
            github: { ...settings.integrations.github, connected: github.connected },
          },
        });
      })
      .catch((err: unknown) => {
        console.error('[integrations] Failed to sync integration status:', err);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, settingsLoaded, authLoading]);
}
