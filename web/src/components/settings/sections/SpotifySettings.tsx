import { useState, useEffect } from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { apiPost, apiFetch } from '../../../lib/api';
import { mapOAuthError } from '../../../lib/oauth-errors';
import { generateCodeVerifier, generateCodeChallenge } from '../../../lib/pkce';

const CLIENT_ID_KEY = 'windom_spotify_client_id';

// ── Spotify icon ────────────────────────────────────────────────────────────

function SpotifyIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

// ── Shared PKCE OAuth flow ──────────────────────────────────────────────────

async function runPkceFlow(clientId: string): Promise<void> {
  const redirectUri = chrome.identity.getRedirectURL();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const { authUrl } = await apiPost<{ authUrl: string }>('/oauth/spotify/start', {
    clientId,
    codeChallenge,
    codeChallengeMethod: 'S256',
    redirectUri,
  });

  const redirectUrl = await launchWebAuth(authUrl);
  const params = new URL(redirectUrl).searchParams;
  const error = params.get('error');
  if (error) throw new Error(mapOAuthError(error));

  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) throw new Error('No auth code returned');

  const { status } = await apiPost<{ status: string }>('/oauth/spotify/exchange', {
    code,
    state,
    redirectUri,
    codeVerifier,
  });
  if (status !== 'linked') throw new Error('Linking failed');
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

// ── State 1: No client ID saved ─────────────────────────────────────────────

function NoClientIdState({ onSaved }: { onSaved: () => void }) {
  const { update } = useSettings();
  const { user } = useAuth();
  const [clientIdInput, setClientIdInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const redirectUri = chrome.identity.getRedirectURL();

  async function handleCopy() {
    await navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveAndConnect() {
    const trimmed = clientIdInput.trim();
    if (!trimmed) return;
    setBusy(true);
    setError('');
    try {
      await runPkceFlow(trimmed);
      await chrome.storage.local.set({ [CLIENT_ID_KEY]: trimmed });
      await update('spotifyConnected', true);
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      if (/cancelled|canceled/i.test(msg)) {
        setError('Connection cancelled.');
      } else if (/invalid_client|INVALID_CLIENT/i.test(msg) || /Invalid Client/i.test(msg)) {
        setError('Invalid Client ID — check your app settings at developer.spotify.com.');
      } else if (!user) {
        setError('You must be signed in to connect Spotify.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="settings-group">
        <label className="settings-label">Connect Spotify</label>
        <p className="settings-hint" style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          Connect your own free Spotify Developer app — no shared quota, works for everyone.
        </p>

        <ol style={{ paddingLeft: '18px', margin: '0 0 16px', lineHeight: '1.7' }} className="settings-hint">
          <li>
            Go to{' '}
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#1DB954' }}
            >
              developer.spotify.com/dashboard
            </a>{' '}
            and create a free app.
          </li>
          <li>In your app settings, add this Redirect URI:</li>
        </ol>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
          <input
            type="text"
            readOnly
            value={redirectUri}
            className="settings-input"
            style={{ flex: 1, fontSize: '12px', fontFamily: 'monospace', opacity: 0.8, cursor: 'text' }}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            className="settings-save-btn"
            style={{ flexShrink: 0, padding: '8px 12px', fontSize: '12px' }}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <ol start={3} style={{ paddingLeft: '18px', margin: '0 0 12px', lineHeight: '1.7' }} className="settings-hint">
          <li>Copy your Client ID from the app dashboard and paste it below.</li>
        </ol>

        <input
          type="text"
          placeholder="Spotify Client ID"
          value={clientIdInput}
          onChange={(e) => { setClientIdInput(e.target.value); setError(''); }}
          className="settings-input"
          style={{ marginBottom: '8px', fontFamily: 'monospace', fontSize: '13px' }}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveAndConnect()}
        />
        {error && <p className="auth-field-error" style={{ marginBottom: '8px' }}>{error}</p>}
        <button
          type="button"
          className="integration-connect-btn"
          disabled={busy || !clientIdInput.trim() || !user}
          onClick={handleSaveAndConnect}
          style={{ width: '100%' }}
        >
          {busy ? 'Connecting…' : 'Save & Connect'}
        </button>
        {!user && (
          <p className="settings-hint" style={{ marginTop: '8px', opacity: 0.6 }}>
            Sign in to your WindoM account first to connect Spotify.
          </p>
        )}
      </div>
    </div>
  );
}

// ── State 2: Client ID saved but not connected ──────────────────────────────

function SavedNotConnectedState({ clientId, onConnected, onChangeApp }: { clientId: string; onConnected: () => void; onChangeApp: () => void }) {
  const { update } = useSettings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleConnect() {
    setBusy(true);
    setError('');
    try {
      await runPkceFlow(clientId);
      await update('spotifyConnected', true);
      onConnected();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      if (/cancelled|canceled/i.test(msg)) {
        setError('Connection cancelled.');
      } else if (/invalid_client|INVALID_CLIENT/i.test(msg) || /Invalid Client/i.test(msg)) {
        setError('Invalid Client ID — check your app settings at developer.spotify.com.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-group">
      <label className="settings-label">Spotify</label>
      <div className="integration-card">
        <div className="integration-icon spotify">
          <SpotifyIcon />
        </div>
        <div className="integration-info">
          <div className="integration-name">Spotify</div>
          <div className="integration-status">Not connected</div>
        </div>
        <button
          type="button"
          className="integration-connect-btn"
          disabled={busy}
          onClick={handleConnect}
        >
          {busy ? '…' : 'Connect'}
        </button>
      </div>
      {error && <p className="integration-error">{error}</p>}
      <p className="settings-hint" style={{ marginTop: '8px' }}>
        App: <code style={{ fontSize: '12px', opacity: 0.8 }}>{clientId.slice(0, 8)}…</code>
        {' '}
        <button
          type="button"
          className="auth-required-link"
          onClick={onChangeApp}
          style={{ fontSize: '12px' }}
        >
          Change app
        </button>
      </p>
    </div>
  );
}

// ── State 3: Connected ──────────────────────────────────────────────────────

function ConnectedState({ clientId, onDisconnected }: { clientId: string; onDisconnected: () => void }) {
  const { update } = useSettings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleDisconnect() {
    setBusy(true);
    setError('');
    try {
      const res = await apiFetch('/integrations/spotify', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to disconnect Spotify');
      await chrome.storage.local.remove(CLIENT_ID_KEY);
      await update('spotifyConnected', false);
      onDisconnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-group">
      <label className="settings-label">Spotify</label>
      <div className="integration-card">
        <div className="integration-icon spotify">
          <SpotifyIcon />
        </div>
        <div className="integration-info">
          <div className="integration-name">Spotify</div>
          <div className="integration-status connected">Connected</div>
        </div>
        <button
          type="button"
          className="integration-disconnect-btn"
          disabled={busy}
          onClick={handleDisconnect}
        >
          {busy ? '…' : 'Disconnect'}
        </button>
      </div>
      {error && <p className="integration-error">{error}</p>}
      <p className="settings-hint" style={{ marginTop: '8px', opacity: 0.6 }}>
        App: <code style={{ fontSize: '12px' }}>{clientId.slice(0, 8)}…</code>
      </p>
    </div>
  );
}

// ── Root component ──────────────────────────────────────────────────────────

type SpotifyState = 'loading' | 'no-client-id' | 'saved-not-connected' | 'connected';

export function SpotifySettings() {
  const { get } = useSettings();
  const spotifyConnected = get('spotifyConnected');

  const [uiState, setUiState] = useState<SpotifyState>('loading');
  const [savedClientId, setSavedClientId] = useState<string>('');

  useEffect(() => {
    void chrome.storage.local.get(CLIENT_ID_KEY, (result) => {
      const clientId = (result[CLIENT_ID_KEY] as string | undefined) ?? '';
      setSavedClientId(clientId);
      if (!clientId) {
        setUiState('no-client-id');
      } else if (spotifyConnected) {
        setUiState('connected');
      } else {
        setUiState('saved-not-connected');
      }
    });
  }, [spotifyConnected]);

  function handleChangeApp() {
    chrome.storage.local.remove(CLIENT_ID_KEY, () => {
      setSavedClientId('');
      setUiState('no-client-id');
    });
  }

  if (uiState === 'loading') {
    return <p className="settings-label" style={{ opacity: 0.5 }}>Loading…</p>;
  }

  if (uiState === 'no-client-id') {
    return <NoClientIdState onSaved={() => setUiState('connected')} />;
  }

  if (uiState === 'saved-not-connected') {
    return (
      <SavedNotConnectedState
        clientId={savedClientId}
        onConnected={() => setUiState('connected')}
        onChangeApp={handleChangeApp}
      />
    );
  }

  return (
    <ConnectedState
      clientId={savedClientId}
      onDisconnected={() => setUiState('no-client-id')}
    />
  );
}
