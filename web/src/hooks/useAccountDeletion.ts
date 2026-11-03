import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { apiFetch } from '../lib/api';

/**
 * The "Delete account" danger-zone flow: open a confirm panel, take the
 * password (password accounts only), DELETE /me, mark the server-backed
 * integrations disconnected locally, then sign out.
 */
export function useAccountDeletion() {
  const { user, logout } = useAuth();
  const { settings, update } = useSettings();

  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const needsPassword = user?.hasPassword === true;

  function openConfirm() {
    setConfirming(true);
    setError('');
  }

  function cancel() {
    setConfirming(false);
    setPassword('');
    setError('');
  }

  async function deleteAccount() {
    setDeleting(true);
    setError('');
    try {
      const body: Record<string, string> = {};
      if (user?.hasPassword) body.password = password;
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
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setDeleting(false);
    }
  }

  return {
    confirming, openConfirm, cancel,
    needsPassword, password, setPassword,
    deleting, error,
    canSubmit: !deleting && !(needsPassword && password.length === 0),
    deleteAccount,
  };
}
