import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useOAuthConnection } from '../../../hooks/useOAuthConnection';
import { GOOGLE_GMAIL_OAUTH } from '../../../lib/google-oauth';
import { mapIntegrationError } from '../../../lib/oauth-connection';
import { SETTINGS_EVENT } from '../../../lib/settings-events';

function GmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke="#EA4335"
        strokeWidth="1.5"
      />
      <polyline points="22,6 12,13 2,6" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function GmailSettings() {
  const { user } = useAuth();
  const { settings, update } = useSettings();
  const { gmail, calendar } = settings.integrations;
  // One Google integration: the Gmail scopes include Calendar's, and unlinking removes both.
  const setGoogleConnected = (connected: boolean) =>
    update('integrations', {
      gmail: { ...gmail, connected },
      calendar: { ...calendar, connected },
    });
  const {
    busy,
    error,
    connect: connectGmail,
    disconnect: disconnectGmail,
  } = useOAuthConnection({
    provider: GOOGLE_GMAIL_OAUTH,
    onConnected: () => setGoogleConnected(true),
    onDisconnected: () => setGoogleConnected(false),
    mapConnectError: mapIntegrationError,
    disconnectFailedMessage: 'Failed to disconnect Gmail',
  });

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="integration-card">
          <div className="integration-icon" style={{ background: 'var(--brand-gmail-tint)' }}>
            <GmailIcon />
          </div>
          <div className="integration-info">
            <div className="integration-name">Gmail</div>
            <div className="integration-status">Not connected</div>
          </div>
        </div>
        <div className="auth-required-notice">
          <p>
            Sign in to your WindoM account to connect Gmail.{' '}
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
      <div>
        <div className="integration-card">
          <div className="integration-icon" style={{ background: 'var(--brand-gmail-tint)' }}>
            <GmailIcon />
          </div>
          <div className="integration-info">
            <div className="integration-name">Gmail</div>
            <div className={`integration-status${gmail.connected ? ' connected' : ''}`}>
              {gmail.connected ? 'Connected' : 'Not connected'}
            </div>
          </div>
          {gmail.connected ? (
            <button className="integration-disconnect-btn" disabled={busy} onClick={() => void disconnectGmail()}>
              {busy ? '…' : 'Disconnect'}
            </button>
          ) : (
            <button className="integration-connect-btn" disabled={busy} onClick={() => void connectGmail()}>
              {busy ? 'Connecting…' : 'Connect'}
            </button>
          )}
        </div>
        {error && <p className="integration-error">{error}</p>}
      </div>

      {!gmail.connected && calendar.connected && (
        <div className="auth-required-notice">
          <p>
            Your Google account is connected for Calendar but doesn&apos;t include Gmail access. Click{' '}
            <strong>Connect</strong> above to grant Gmail permission (you&apos;ll see a Google consent screen).
          </p>
        </div>
      )}

      {gmail.connected && (
        <div className="settings-group">
          <label className="settings-label">Sidebar</label>
          <label className="visibility-row" style={{ cursor: 'pointer' }}>
            <span className="visibility-row-label">Show Gmail in sidebar</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={gmail.show}
                onChange={(e) => void update('integrations', { gmail: { ...gmail, show: e.target.checked } })}
              />
              <span className="toggle-track">
                <span className="toggle-knob" />
              </span>
            </label>
          </label>
        </div>
      )}
    </div>
  );
}
