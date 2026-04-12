import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { LoginScreen } from '../../auth/LoginScreen';
import { apiPost, apiFetch } from '../../../lib/api';
import { mapOAuthError } from '../../../lib/oauth-errors';

// ── Signed-out view ────────────────────────────────────────────────────────

function SignedOutView() {
  return (
    <div>
      <div className="settings-group">
        <p className="settings-label" style={{ opacity: 0.65, marginBottom: '16px', lineHeight: '1.5' }}>
          Sign in to connect Google Calendar and Spotify. The rest of the dashboard works without an account.
        </p>
        <LoginScreen />
      </div>
    </div>
  );
}

// ── Integration card ───────────────────────────────────────────────────────

interface IntegrationCardProps {
  provider: 'google' | 'spotify';
  name: string;
  connected: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  icon: React.ReactNode;
}

function IntegrationCard({ name, connected, onConnect, onDisconnect, icon, provider }: IntegrationCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handle(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="integration-card">
        <div className={`integration-icon ${provider}`}>{icon}</div>
        <div className="integration-info">
          <div className="integration-name">{name}</div>
          <div className={`integration-status ${connected ? 'connected' : ''}`}>
            {connected ? 'Connected' : 'Not connected'}
          </div>
        </div>
        {connected ? (
          <button
            className="integration-disconnect-btn"
            disabled={busy}
            onClick={() => handle(onDisconnect)}
          >
            {busy ? '…' : 'Disconnect'}
          </button>
        ) : (
          <button
            className="integration-connect-btn"
            disabled={busy}
            onClick={() => handle(onConnect)}
          >
            {busy ? '…' : 'Connect'}
          </button>
        )}
      </div>
      {error && <p className="integration-error">{error}</p>}
    </div>
  );
}

// ── Signed-in view ─────────────────────────────────────────────────────────

function SignedInView() {
  const { user, logout } = useAuth();
  const { get, update } = useSettings();
  const calendarConnected = get('calendarConnected');
  const spotifyConnected = get('spotifyConnected');
  const [signingOut, setSigningOut] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase();

  async function connectGoogle() {
    try {
      const redirectUri = chrome.identity.getRedirectURL();
      const { authUrl } = await apiPost<{ authUrl: string }>(`/oauth/google/start?redirectUri=${encodeURIComponent(redirectUri)}`);
      const redirectUrl = await launchWebAuth(authUrl);
      const params = new URL(redirectUrl).searchParams;
      if (params.get('error')) throw new Error(mapOAuthError(params.get('error')!));
      const code = params.get('code');
      const state = params.get('state');
      if (!code || !state) throw new Error('No auth code returned');
      const { status } = await apiPost<{ status: string }>('/oauth/google/exchange', { code, state, redirectUri });
      if (status !== 'linked') throw new Error('Linking failed');
      await update('calendarConnected', true);
    } catch (err) {
      throw new Error(mapIntegrationError(err));
    }
  }

  async function disconnectGoogle() {
    const res = await apiFetch('/integrations/google', { method: 'DELETE' });
    if (!res.ok) {
      console.error('[integrations] Failed to disconnect Google:', res.status);
      throw new Error('Failed to disconnect Google Calendar');
    }
    await update('calendarConnected', false);
  }

  async function connectSpotify() {
    try {
      const redirectUri = chrome.identity.getRedirectURL();
      const { authUrl } = await apiPost<{ authUrl: string }>(`/oauth/spotify/start?redirectUri=${encodeURIComponent(redirectUri)}`);
      const redirectUrl = await launchWebAuth(authUrl);
      const params = new URL(redirectUrl).searchParams;
      if (params.get('error')) throw new Error(mapOAuthError(params.get('error')!));
      const code = params.get('code');
      const state = params.get('state');
      if (!code || !state) throw new Error('No auth code returned');
      const { status } = await apiPost<{ status: string }>('/oauth/spotify/exchange', { code, state, redirectUri });
      if (status !== 'linked') throw new Error('Linking failed');
      await update('spotifyConnected', true);
    } catch (err) {
      throw new Error(mapIntegrationError(err));
    }
  }

  async function disconnectSpotify() {
    const res = await apiFetch('/integrations/spotify', { method: 'DELETE' });
    if (!res.ok) {
      console.error('[integrations] Failed to disconnect Spotify:', res.status);
      throw new Error('Failed to disconnect Spotify');
    }
    await update('spotifyConnected', false);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await logout();
    setSigningOut(false);
  }

  return (
    <div>
      {/* User card */}
      <div className="auth-user-card">
        <div className="auth-avatar">{initials}</div>
        <div className="auth-user-meta">
          <div className="auth-user-name">{user?.name || 'User'}</div>
          {user?.email && <div className="auth-user-email">{user.email}</div>}
        </div>
      </div>

      {/* Connected services */}
      <div className="settings-group">
        <label className="settings-label">Connected Services</label>
        <IntegrationCard
          provider="google"
          name="Google Calendar"
          connected={calendarConnected}
          onConnect={connectGoogle}
          onDisconnect={disconnectGoogle}
          icon={<GoogleCalendarIcon />}
        />
        <IntegrationCard
          provider="spotify"
          name="Spotify"
          connected={spotifyConnected}
          onConnect={connectSpotify}
          onDisconnect={disconnectSpotify}
          icon={<SpotifyIcon />}
        />
      </div>

      {/* Sign out */}
      <button
        className="auth-signout-btn"
        disabled={signingOut}
        onClick={handleSignOut}
      >
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}

// ── Root export ────────────────────────────────────────────────────────────

export function AccountSettings() {
  const { user, authLoading, sessionLimitReached } = useAuth();

  if (authLoading) {
    return <p className="settings-label" style={{ opacity: 0.5 }}>Loading…</p>;
  }

  if (sessionLimitReached) {
    return (
      <div className="settings-group">
        <p className="auth-error" style={{ marginBottom: '12px' }}>
          You've reached the maximum number of active sessions. Please sign out from another device to continue.
        </p>
        <SignedOutView />
      </div>
    );
  }

  return user ? <SignedInView /> : <SignedOutView />;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Map integration connection errors to user-friendly messages. */
function mapIntegrationError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/already.linked|account already linked/i.test(msg)) {
    return 'This account is already linked to a different user.';
  }
  if (/network|fetch|connection|failed to fetch/i.test(msg)) {
    return 'Connection failed. Check your internet and try again.';
  }
  // Route access_denied through mapOAuthError to get a friendly message
  if (msg === 'access_denied' || msg.includes('access_denied')) {
    return mapOAuthError(msg);
  }
  // Pass through user-friendly messages already set (e.g. from launchWebAuth / mapOAuthError)
  if (msg && msg !== 'Failed') return msg;
  return 'Something went wrong. Please try again.';
}

/** Launch an OAuth popup with a 2-minute timeout and friendly error messages. */
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

function SpotifyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}
