import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { apiPost, apiFetch } from '../../../lib/api';
import { mapOAuthError } from '../../../lib/oauth-errors';
import { GlassSelect } from '../../ui/GlassSelect';
import { SETTINGS_EVENT } from '../../../lib/settings-events';

function GoogleCalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="#4285F4" strokeWidth="1.5"/>
      <path d="M3 9h18" stroke="#4285F4" strokeWidth="1.5"/>
      <path d="M8 2v4M16 2v4" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="7" y="13" width="4" height="3" rx="0.5" fill="#4285F4" opacity="0.7"/>
    </svg>
  );
}

function launchWebAuth(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      reject(new Error('Sign-in timed out. Please try again.'));
    }, 120_000);
    chrome.identity.launchWebAuthFlow({ url, interactive: true }, (redirectUrl) => {
      clearTimeout(timer);
      if (settled) return;
      if (chrome.runtime.lastError || !redirectUrl) {
        reject(new Error(mapOAuthError(chrome.runtime.lastError?.message ?? 'Auth cancelled')));
      } else {
        resolve(redirectUrl);
      }
    });
  });
}

function mapIntegrationError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/already.linked|account already linked/i.test(msg)) return 'This account is already linked to a different user.';
  if (/network|fetch|connection|failed to fetch/i.test(msg)) return 'Connection failed. Check your internet and try again.';
  if (msg === 'access_denied' || msg.includes('access_denied')) return mapOAuthError(msg);
  if (msg && msg !== 'Failed') return msg;
  return 'Something went wrong. Please try again.';
}

export function CalendarSettings() {
  const { user } = useAuth();
  const { settings, update } = useSettings();
  const { calendar } = settings.integrations;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function connectGoogle() {
    setBusy(true);
    setError('');
    try {
      const redirectUri = chrome.identity.getRedirectURL();
      const { authUrl } = await apiPost<{ authUrl: string }>(
        `/oauth/google/start?redirectUri=${encodeURIComponent(redirectUri)}`
      );
      const redirectUrl = await launchWebAuth(authUrl);
      const params = new URL(redirectUrl).searchParams;
      if (params.get('error')) throw new Error(mapOAuthError(params.get('error')!));
      const code = params.get('code');
      const state = params.get('state');
      if (!code || !state) throw new Error('No auth code returned');
      const { status } = await apiPost<{ status: string }>('/oauth/google/exchange', { code, state, redirectUri });
      if (status !== 'linked') throw new Error('Linking failed');
      await update('integrations', { calendar: { ...calendar, connected: true } });
    } catch (err) {
      setError(mapIntegrationError(err));
    } finally {
      setBusy(false);
    }
  }

  async function disconnectGoogle() {
    setBusy(true);
    setError('');
    try {
      const res = await apiFetch('/integrations/google', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to disconnect Google Calendar');
      await update('integrations', { calendar: { ...calendar, connected: false } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    } finally {
      setBusy(false);
    }
  }

  // Not signed in — prompt to log in first
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
            <button
              className="integration-disconnect-btn"
              disabled={busy}
              onClick={disconnectGoogle}
            >
              {busy ? '…' : 'Disconnect'}
            </button>
          ) : (
            <button
              className="integration-connect-btn"
              disabled={busy}
              onClick={connectGoogle}
            >
              {busy ? 'Connecting…' : 'Connect'}
            </button>
          )}
        </div>
        {error && <p className="integration-error">{error}</p>}
      </div>

      {/* Look-ahead window — only meaningful when connected */}
      {calendar.connected && (
        <div className="settings-row">
          <label className="settings-label">Look-ahead window</label>
          <GlassSelect
            value={String(calendar.days)}
            onChange={(v) =>
              void update('integrations', { calendar: { ...calendar, days: Number(v) as 7 | 14 | 30 } })
            }
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
