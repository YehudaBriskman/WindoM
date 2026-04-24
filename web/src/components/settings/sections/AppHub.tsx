import { useSettings } from '../../../contexts/SettingsContext';

export type AppId = 'calendar' | 'spotify';

interface AppDef {
  id: AppId;
  label: string;
  icon: React.ReactNode;
  connected: (settings: ReturnType<typeof useSettings>['settings']) => boolean;
}

function CalendarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

const APP_DEFS: AppDef[] = [
  {
    id: 'calendar',
    label: 'Calendar',
    icon: <CalendarIcon />,
    connected: (s) => s.integrations.calendar.connected,
  },
  {
    id: 'spotify',
    label: 'Spotify',
    icon: <SpotifyIcon />,
    connected: (s) => s.integrations.spotify.connected,
  },
];

interface AppHubProps {
  onOpenApp: (id: AppId) => void;
}

export function AppHub({ onOpenApp }: AppHubProps) {
  const { settings } = useSettings();

  return (
    <div className="app-hub">
      <p className="settings-hint" style={{ marginBottom: '16px' }}>
        Connect and manage your integrations. Click an app to configure it.
      </p>
      <div className="app-hub-grid">
        {APP_DEFS.map((app) => {
          const isConnected = app.connected(settings);
          return (
            <button
              key={app.id}
              type="button"
              className="app-hub-card"
              onClick={() => onOpenApp(app.id)}
              aria-label={`${app.label} — ${isConnected ? 'connected' : 'not connected'}`}
            >
              <div className="app-hub-icon">{app.icon}</div>
              <span className="app-hub-label">{app.label}</span>
              <span className={`app-hub-badge${isConnected ? ' connected' : ''}`}>
                {isConnected ? 'Connected' : 'Not connected'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
