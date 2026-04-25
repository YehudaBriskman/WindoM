import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { apiPost, apiFetch } from '../../../lib/api';
import { mapOAuthError } from '../../../lib/oauth-errors';
import { SETTINGS_EVENT } from '../../../lib/settings-events';

function GmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#EA4335" strokeWidth="1.5"/>
      <polyline points="22,6 12,13 2,6" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round"/>
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

export function GmailSettings() {
  const { user } = useAuth();
  const { settings, update } = useSettings();
  const { gmail, calendar } = settings.integrations;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function connectGmail() {
    setBusy(true);
    setError('');
    try {
      const redirectUri = chrome.identity.getRedirectURL();
      // Request expanded gmail scopes so the token covers both Calendar and Gmail
      const { authUrl } = await apiPost<{ authUrl: string }>(
        `/oauth/google/start?redirectUri=${encodeURIComponent(redirectUri)}&features=gmail`
      );
      const redirectUrl = await launchWebAuth(authUrl);
      const params = new URL(redirectUrl).searchParams;
      if (params.get('error')) throw new Error(mapOAuthError(params.get('error')!));
      const code = params.get('code');
      const state = params.get('state');
      if (!code || !state) throw new Error('No auth code returned');
      const { status } = await apiPost<{ status: string }>('/oauth/google/exchange', { code, state, redirectUri });
      if (status !== 'linked') throw new Error('Linking failed');
      // Mark both gmail and calendar as connected since we granted combined scopes
      await update('integrations', {
        gmail: { ...gmail, connected: true },
        calendar: { ...calendar, connected: true },
      });
    } catch (err) {
      setError(mapIntegrationError(err));
    } finally {
      setBusy(false);
    }
  }

  async function disconnectGmail() {
    setBusy(true);
    setError('');
    try {
      const res = await apiFetch('/integrations/google', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to disconnect Gmail');
      await update('integrations', {
        gmail: { ...gmail, connected: false },
        calendar: { ...calendar, connected: false },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="integration-card">
          <div className="integration-icon" style={{ background: 'rgba(234,67,53,0.12)' }}>
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
          <div className="integration-icon" style={{ background: 'rgba(234,67,53,0.12)' }}>
            <GmailIcon />
          </div>
          <div className="integration-info">
            <div className="integration-name">Gmail</div>
            <div className={`integration-status${gmail.connected ? ' connected' : ''}`}>
              {gmail.connected ? 'Connected' : 'Not connected'}
            </div>
          </div>
          {gmail.connected ? (
            <button className="integration-disconnect-btn" disabled={busy} onClick={disconnectGmail}>
              {busy ? '…' : 'Disconnect'}
            </button>
          ) : (
            <button className="integration-connect-btn" disabled={busy} onClick={connectGmail}>
              {busy ? 'Connecting…' : 'Connect'}
            </button>
          )}
        </div>
        {error && <p className="integration-error">{error}</p>}
      </div>

      {!gmail.connected && calendar.connected && (
        <div className="auth-required-notice">
          <p>
            Your Google account is connected for Calendar but doesn&apos;t include Gmail access.
            Click <strong>Connect</strong> above to grant Gmail permission (you&apos;ll see a Google consent screen).
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
              <span className="toggle-track"><span className="toggle-knob" /></span>
            </label>
          </label>
        </div>
      )}
    </div>
  );
}
