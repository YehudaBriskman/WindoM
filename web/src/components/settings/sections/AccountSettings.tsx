import { useAuth } from '../../../contexts/AuthContext';
import { LoginScreen } from '../../auth/LoginScreen';
import { ActiveSessions } from './ActiveSessions';
import { useAccountDeletion } from '../../../hooks/useAccountDeletion';
import { useDisplayName } from '../../../hooks/useDisplayName';
import { useEmailVerificationResend } from '../../../hooks/useEmailVerificationResend';
import { usePasswordChange } from '../../../hooks/usePasswordChange';
import { useSignOut } from '../../../hooks/useSignOut';

// The account flows (name, password, deletion, verification resend, sign-out)
// live in their own hooks; this file is layout and composition only.

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

// ── Signed-in view ─────────────────────────────────────────────────────────

function EmailVerificationBanner() {
  const { user } = useAuth();
  const { sending, sent, resend } = useEmailVerificationResend();

  if (!user || user.emailVerified) return null;

  return (
    <div className="verification-banner">
      <span className="verification-banner-text">
        Please verify your email address. Check your inbox for a link.
      </span>
      <button
        className="verification-resend-btn"
        disabled={sending || sent}
        onClick={resend}
      >
        {sent ? 'Sent!' : sending ? '…' : 'Resend'}
      </button>
    </div>
  );
}

function DisplayNameField() {
  const n = useDisplayName();

  return (
    <>
      <div className="settings-row-with-btn">
        <input
          type="text"
          value={n.name}
          onChange={(e) => n.setName(e.target.value)}
          placeholder="Your name"
          className="settings-input"
          style={{ flex: 1 }}
          onKeyDown={(e) => e.key === 'Enter' && n.save()}
        />
        <button
          className="settings-save-btn"
          style={{ flexShrink: 0, padding: '8px 14px' }}
          disabled={!n.canSave}
          onClick={n.save}
        >
          {n.saving ? '…' : 'Save'}
        </button>
      </div>
      {n.message && (
        <p className={n.saved ? 'auth-field-success' : 'auth-field-error'} style={{ marginBottom: '8px' }}>
          {n.message}
        </p>
      )}
    </>
  );
}

function PasswordChangeForm() {
  const pw = usePasswordChange();

  return (
    <div className="settings-section-mt" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label className="settings-hint" style={{ marginBottom: '2px' }}>Change password</label>
      <input
        type="password"
        placeholder="Current password"
        value={pw.currentPw}
        onChange={(e) => pw.setCurrentPw(e.target.value)}
        autoComplete="current-password"
        className="settings-input"
      />
      <input
        type="password"
        placeholder="New password (min 8 characters)"
        value={pw.newPw}
        onChange={(e) => pw.setNewPw(e.target.value)}
        autoComplete="new-password"
        className="settings-input"
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={pw.confirmPw}
        onChange={(e) => pw.setConfirmPw(e.target.value)}
        autoComplete="new-password"
        className="settings-input"
      />
      {pw.error && <p className="auth-field-error">{pw.error}</p>}
      {pw.message && <p className="auth-field-success">{pw.message}</p>}
      <button
        className="settings-save-btn"
        disabled={!pw.canSubmit}
        onClick={pw.save}
      >
        {pw.saving ? 'Updating…' : 'Update password'}
      </button>
    </div>
  );
}

function ProfileSection() {
  const { user } = useAuth();

  return (
    <div className="settings-group">
      <label className="settings-label">Profile</label>
      <DisplayNameField />
      {/* Change password (only for password accounts) */}
      {user?.hasPassword && <PasswordChangeForm />}
    </div>
  );
}

function DangerZone() {
  const d = useAccountDeletion();

  return (
    <div className="danger-zone">
      <div className="danger-zone-label">Danger Zone</div>
      {!d.confirming ? (
        <button className="danger-delete-btn" onClick={d.openConfirm}>
          Delete account
        </button>
      ) : (
        <div className="danger-confirm-panel">
          <p className="danger-confirm-warning">
            This will permanently delete your account and all data, including Calendar and Spotify connections. This cannot be undone.
          </p>
          {d.needsPassword && (
            <input
              className="settings-input"
              type="password"
              placeholder="Enter your password to confirm"
              value={d.password}
              onChange={(e) => d.setPassword(e.target.value)}
              disabled={d.deleting}
              autoComplete="current-password"
            />
          )}
          {d.error && <p className="auth-error">{d.error}</p>}
          <div className="danger-confirm-actions">
            <button className="danger-confirm-cancel" onClick={d.cancel} disabled={d.deleting}>
              Cancel
            </button>
            <button className="danger-confirm-submit" onClick={d.deleteAccount} disabled={!d.canSubmit}>
              {d.deleting ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function initialsOf(user: { name: string; email: string | null } | null): string {
  return user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase();
}

function SignedInView() {
  const { user } = useAuth();
  const { signingOut, signOut } = useSignOut();

  return (
    <div>
      <EmailVerificationBanner />

      {/* User card */}
      <div className="auth-user-card">
        <div className="auth-avatar">{initialsOf(user)}</div>
        <div className="auth-user-meta">
          <div className="auth-user-name">{user?.name || 'User'}</div>
          {user?.email && <div className="auth-user-email">{user.email}</div>}
        </div>
      </div>

      <ProfileSection />
      <ActiveSessions key={user?.id} />

      <button className="auth-signout-btn" disabled={signingOut} onClick={signOut}>
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>

      <DangerZone />
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
