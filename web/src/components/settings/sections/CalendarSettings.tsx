import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useOAuthConnection } from '../../../hooks/useOAuthConnection';
import { GOOGLE_CALENDAR_OAUTH } from '../../../lib/google-oauth';
import { mapIntegrationError } from '../../../lib/oauth-connection';
import { GlassSelect } from '../../ui/GlassSelect';
import { SETTINGS_EVENT } from '../../../lib/settings-events';

function GoogleCalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="#4285F4" strokeWidth="1.5" />
      <path d="M3 9h18" stroke="#4285F4" strokeWidth="1.5" />
      <path d="M8 2v4M16 2v4" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="7" y="13" width="4" height="3" rx="0.5" fill="#4285F4" opacity="0.7" />
    </svg>
  );
}

export function CalendarSettings() {
  const { user } = useAuth();
  const { settings, update } = useSettings();
  const { calendar } = settings.integrations;
  const { gmail } = settings.integrations;
  const {
    busy,
    error,
    connect: connectGoogle,
    disconnect: disconnectGoogle,
  } = useOAuthConnection({
    provider: GOOGLE_CALENDAR_OAUTH,
    onConnected: () => update('integrations', { calendar: { ...calendar, connected: true } }),
    // The backend unlinks the whole Google account, Gmail scope included.
    onDisconnected: () =>
      update('integrations', {
        calendar: { ...calendar, connected: false },
        gmail: { ...gmail, connected: false },
      }),
    mapConnectError: mapIntegrationError,
    disconnectFailedMessage: 'Failed to disconnect Google Calendar',
  });

  // Not signed in - prompt to log in first
  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="integration-card">
          <div className="integration-icon google">
            <GoogleCalendarIcon />
          </div>
          <div className="integration-info">
            <div className="integration-name">Google Calendar</div>
            <div className="integration-status">Not connected</div>
          </div>
        </div>
        <div className="auth-required-notice">
          <p>
            Sign in to your WindoM account to connect Google Calendar.{' '}
            <button
              type="button"
              className="auth-required-link"
              onClick={() => document.dispatchEvent(new CustomEvent(SETTINGS_EVENT.OPEN_ACCOUNT))}
            >
              Go to Account
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Connection card */}
      <div>
        <div className="integration-card">
          <div className="integration-icon google">
            <GoogleCalendarIcon />
          </div>
          <div className="integration-info">
            <div className="integration-name">Google Calendar</div>
            <div className={`integration-status${calendar.connected ? ' connected' : ''}`}>
              {calendar.connected ? 'Connected' : 'Not connected'}
            </div>
          </div>
          {calendar.connected ? (
            <button className="integration-disconnect-btn" disabled={busy} onClick={() => void disconnectGoogle()}>
              {busy ? '…' : 'Disconnect'}
            </button>
          ) : (
            <button className="integration-connect-btn" disabled={busy} onClick={() => void connectGoogle()}>
              {busy ? 'Connecting…' : 'Connect'}
            </button>
          )}
        </div>
        {error && <p className="integration-error">{error}</p>}
      </div>

      {/* Look-ahead window - only meaningful when connected */}
      {calendar.connected && (
        <div className="settings-row">
          <label className="settings-label">Look-ahead window</label>
          <GlassSelect
            value={String(calendar.days)}
            onChange={(v) => void update('integrations', { calendar: { ...calendar, days: Number(v) as 7 | 14 | 30 } })}
            options={[
              { value: '7', label: '7 days' },
              { value: '14', label: '14 days' },
              { value: '30', label: '30 days' },
            ]}
          />
        </div>
      )}
    </div>
  );
}
