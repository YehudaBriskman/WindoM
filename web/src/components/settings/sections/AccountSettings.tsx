import { useState, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { LoginScreen } from '../../auth/LoginScreen';
import { apiPost, apiPatch, apiFetch } from '../../../lib/api';
import { mapOAuthError } from '../../../lib/oauth-errors';

// ── Signed-out view ────────────────────────────────────────────────────────

function SignedOutView() {
  return (
    <div>
      <div className="settings-group">
        <p className="settings-label" style={{ opacity: 0.65, marginBottom: '16px', lineHeight: '1.5' }}>
          Sign in to connect Google Calendar. The rest of the dashboard works without an account.
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

function EmailVerificationBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!user || user.emailVerified) return null;

  async function handleResend() {
    setSending(true);
    try {
      await apiPost('/auth/resend-verification', {});
      setSent(true);
      // Disable resend for 60s
      cooldownRef.current = setTimeout(() => setSent(false), 60_000);
    } catch {
      // ignore — user can retry
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="verification-banner">
      <span className="verification-banner-text">
        Please verify your email address. Check your inbox for a link.
      </span>
      <button
        className="verification-resend-btn"
        disabled={sending || sent}
        onClick={handleResend}
      >
        {sent ? 'Sent!' : sending ? '…' : 'Resend'}
      </button>
    </div>
  );
}

function ProfileSection() {
  const { user, updateUser } = useAuth();
  const { update: updateSetting } = useSettings();

  const [name, setName] = useState(user?.name ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  async function handleNameSave() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === user?.name) return;
    if (trimmed.length > 100) { setNameMsg('Name must be 100 characters or less'); return; }
    setNameSaving(true);
    setNameMsg('');
    try {
      const updated = await apiPatch<{ name: string }>('/me', { name: trimmed });
      updateUser({ name: updated.name });
      await updateSetting('userName', updated.name);
      setName(updated.name);
      setNameMsg('Saved');
      setTimeout(() => setNameMsg(''), 2000);
    } catch (err) {
      setNameMsg(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setNameSaving(false);
    }
  }

  async function handlePasswordSave() {
    setPwError('');
    setPwMsg('');
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      await apiPatch('/me', { currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwMsg('Password updated');
      setTimeout(() => setPwMsg(''), 3000);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="settings-group">
      <label className="settings-label">Profile</label>

      {/* Display name */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="settings-input"
          style={{ fontFamily: 'inherit', fontSize: '14px', flex: 1 }}
          onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
        />
        <button
          className="settings-save-btn"
          style={{ flexShrink: 0, padding: '8px 14px' }}
          disabled={nameSaving || !name.trim() || name.trim() === user?.name}
          onClick={handleNameSave}
        >
          {nameSaving ? '…' : 'Save'}
        </button>
      </div>
      {nameMsg && (
        <p className={nameMsg === 'Saved' ? 'auth-field-success' : 'auth-field-error'} style={{ marginBottom: '8px' }}>
          {nameMsg}
        </p>
      )}

      {/* Change password (only for password accounts) */}
      {user?.hasPassword && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="settings-hint" style={{ marginBottom: '2px' }}>Change password</label>
          <input
            type="password"
            placeholder="Current password"
            value={currentPw}
            onChange={(e) => { setCurrentPw(e.target.value); setPwError(''); }}
            autoComplete="current-password"
            className="settings-input"
            style={{ fontFamily: 'inherit', fontSize: '14px' }}
          />
          <input
            type="password"
            placeholder="New password (min 8 characters)"
            value={newPw}
            onChange={(e) => { setNewPw(e.target.value); setPwError(''); }}
            autoComplete="new-password"
            className="settings-input"
            style={{ fontFamily: 'inherit', fontSize: '14px' }}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPw}
            onChange={(e) => { setConfirmPw(e.target.value); setPwError(''); }}
            autoComplete="new-password"
            className="settings-input"
            style={{ fontFamily: 'inherit', fontSize: '14px' }}
          />
          {pwError && <p className="auth-field-error">{pwError}</p>}
          {pwMsg && <p className="auth-field-success">{pwMsg}</p>}
          <button
            className="settings-save-btn"
            disabled={pwSaving || !currentPw || !newPw || !confirmPw}
            onClick={handlePasswordSave}
          >
            {pwSaving ? 'Updating…' : 'Update password'}
          </button>
        </div>
      )}
    </div>
  );
}

function SignedInView() {
  const { user, logout } = useAuth();
  const { get, update } = useSettings();
  const calendarConnected = get('calendarConnected');
  const [signingOut, setSigningOut] = useState(false);

  // Danger zone state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  async function handleSignOut() {
    setSigningOut(true);
    await logout();
    setSigningOut(false);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError('');
    try {
      const body: Record<string, string> = {};
      if (user?.hasPassword) body.password = deletePassword;
      const res = await apiFetch('/me', { method: 'DELETE', body: JSON.stringify(body) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? 'Deletion failed');
      }
      await update('calendarConnected', false);
      await update('spotifyConnected', false);
      await logout();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong');
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Email verification banner */}
      <EmailVerificationBanner />

      {/* User card */}
      <div className="auth-user-card">
        <div className="auth-avatar">{initials}</div>
        <div className="auth-user-meta">
          <div className="auth-user-name">{user?.name || 'User'}</div>
          {user?.email && <div className="auth-user-email">{user.email}</div>}
        </div>
      </div>

      {/* Profile */}
      <ProfileSection />

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
      </div>

      {/* Sign out */}
      <button
        className="auth-signout-btn"
        disabled={signingOut}
        onClick={handleSignOut}
      >
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>

      {/* Danger zone */}
      <div className="danger-zone">
        <div className="danger-zone-label">Danger Zone</div>
        {!showDeleteConfirm ? (
          <button
            className="danger-delete-btn"
            onClick={() => { setShowDeleteConfirm(true); setDeleteError(''); }}
          >
            Delete account
          </button>
        ) : (
          <div className="danger-confirm-panel">
            <p className="danger-confirm-warning">
              This will permanently delete your account and all data, including Calendar and Spotify connections. This cannot be undone.
            </p>
            {user?.hasPassword && (
              <input
                className="settings-input"
                type="password"
                placeholder="Enter your password to confirm"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                disabled={deleting}
                autoComplete="current-password"
              />
            )}
            {deleteError && <p className="auth-error">{deleteError}</p>}
            <div className="danger-confirm-actions">
              <button
                className="danger-confirm-cancel"
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="danger-confirm-submit"
                onClick={handleDeleteAccount}
                disabled={deleting || (user?.hasPassword === true && deletePassword.length === 0)}
              >
                {deleting ? 'Deleting…' : 'Delete my account'}
              </button>
            </div>
          </div>
        )}
      </div>
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

