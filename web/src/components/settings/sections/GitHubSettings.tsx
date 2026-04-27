import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { apiPost, apiFetch } from '../../../lib/api';
import { SETTINGS_EVENT } from '../../../lib/settings-events';

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function GitHubSettings() {
  const { user } = useAuth();
  const { settings, update } = useSettings();
  const { github } = settings.integrations;
  const [busy, setBusy] = useState(false);
  const [pat, setPat] = useState('');
  const [error, setError] = useState('');

  async function connectGitHub() {
    if (!pat.trim()) {
      setError('Please enter a Personal Access Token.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await apiPost('/integrations/github/pat', { pat: pat.trim() });
      setPat('');
      await update('integrations', { github: { ...github, connected: true } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      if (/invalid pat|invalid.*token|401/i.test(msg)) {
        setError('Invalid token. Make sure the PAT has the notifications and repo scopes.');
      } else if (/network|fetch|connection/i.test(msg)) {
        setError('Connection failed. Check your internet and try again.');
      } else {
        setError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function disconnectGitHub() {
    setBusy(true);
    setError('');
    try {
      const res = await apiFetch('/integrations/github', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to disconnect GitHub');
      await update('integrations', { github: { ...github, connected: false } });
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
          <div className="integration-icon" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <GitHubIcon />
          </div>
          <div className="integration-info">
            <div className="integration-name">GitHub</div>
            <div className="integration-status">Not connected</div>
          </div>
        </div>
        <div className="auth-required-notice">
          <p>
            Sign in to your WindoM account to connect GitHub.{' '}
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
          <div className="integration-icon" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <GitHubIcon />
          </div>
          <div className="integration-info">
            <div className="integration-name">GitHub</div>
            <div className={`integration-status${github.connected ? ' connected' : ''}`}>
              {github.connected ? 'Connected' : 'Not connected'}
            </div>
          </div>
          {github.connected && (
            <button className="integration-disconnect-btn" disabled={busy} onClick={disconnectGitHub}>
              {busy ? '…' : 'Disconnect'}
            </button>
          )}
        </div>
        {error && <p className="integration-error">{error}</p>}
      </div>

      {!github.connected && (
        <div className="settings-group">
          <label className="settings-label">Personal Access Token</label>
          <p className="settings-hint" style={{ marginBottom: '8px' }}>
            Create a{' '}
            <a
              href="https://github.com/settings/tokens/new?scopes=notifications,repo&description=WindoM"
              target="_blank"
              rel="noreferrer"
              className="auth-required-link"
            >
              Classic PAT
            </a>{' '}
            with <code>notifications</code> and <code>repo</code> scopes.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="password"
              className="settings-input"
              placeholder="ghp_..."
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void connectGitHub(); }}
              disabled={busy}
              style={{ flex: 1 }}
            />
            <button className="integration-connect-btn" disabled={busy || !pat.trim()} onClick={() => void connectGitHub()}>
              {busy ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        </div>
      )}

      {github.connected && (
        <div className="settings-group">
          <label className="settings-label">Sidebar</label>
          <label className="visibility-row" style={{ cursor: 'pointer' }}>
            <span className="visibility-row-label">Show GitHub in sidebar</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={github.show}
                onChange={(e) => void update('integrations', { github: { ...github, show: e.target.checked } })}
              />
              <span className="toggle-track"><span className="toggle-knob" /></span>
            </label>
          </label>
        </div>
      )}
    </div>
  );
}
