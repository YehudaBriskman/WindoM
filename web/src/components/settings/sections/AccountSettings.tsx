import { useState, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { LoginScreen } from '../../auth/LoginScreen';
import { apiPost, apiPatch, apiFetch } from '../../../lib/api';
import { NAME_SAVE_MSG_DURATION_MS, PW_SAVE_MSG_DURATION_MS } from '../../../lib/timing-constants';

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
      // ignore - user can retry
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
    if (nameSaving) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === user?.name) return;
    if (trimmed.length > 100) { setNameMsg('Name must be 100 characters or less'); return; }
    setNameSaving(true);
    setNameMsg('');
    try {
      const updated = await apiPatch<{ name: string }>('/me', { name: trimmed });
      updateUser({ name: updated.name });
      await updateSetting('general', { userName: updated.name });
      setName(updated.name);
      setNameMsg('Saved');
      setTimeout(() => setNameMsg(''), NAME_SAVE_MSG_DURATION_MS);
    } catch (err) {
      setNameMsg(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setNameSaving(false);
    }
  }

  async function handlePasswordSave() {
    if (pwSaving) return;
    setPwError('');
    setPwMsg('');
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      await apiPatch('/me', { currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwMsg('Password updated');
      setTimeout(() => setPwMsg(''), PW_SAVE_MSG_DURATION_MS);
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
      <div className="settings-row-with-btn">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="settings-input"
          style={{ flex: 1 }}
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
        <div className="settings-section-mt" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="settings-hint" style={{ marginBottom: '2px' }}>Change password</label>
          <input
            type="password"
            placeholder="Current password"
            value={currentPw}
            onChange={(e) => { setCurrentPw(e.target.value); setPwError(''); }}
            autoComplete="current-password"
            className="settings-input"
          />
          <input
            type="password"
            placeholder="New password (min 8 characters)"
            value={newPw}
            onChange={(e) => { setNewPw(e.target.value); setPwError(''); }}
            autoComplete="new-password"
            className="settings-input"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPw}
            onChange={(e) => { setConfirmPw(e.target.value); setPwError(''); }}
            autoComplete="new-password"
            className="settings-input"
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
  const { settings, update } = useSettings();
  const [signingOut, setSigningOut] = useState(false);

  // Danger zone state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase();

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
      await update('integrations', {
        calendar: { ...settings.integrations.calendar, connected: false },
        spotify: { ...settings.integrations.spotify, connected: false },
      });
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


