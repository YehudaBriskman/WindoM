import { useState } from 'react';
import { apiPatch } from '../lib/api';
import { PW_SAVE_MSG_DURATION_MS } from '../lib/timing-constants';

/**
 * The "Change password" form: three fields, client-side validation, and the
 * PATCH /me call. Editing any field clears the current error.
 */
export function usePasswordChange() {
  const [currentPw, setCurrentPwState] = useState('');
  const [newPw, setNewPwState] = useState('');
  const [confirmPw, setConfirmPwState] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function setCurrentPw(value: string) {
    setCurrentPwState(value);
    setError('');
  }
  function setNewPw(value: string) {
    setNewPwState(value);
    setError('');
  }
  function setConfirmPw(value: string) {
    setConfirmPwState(value);
    setError('');
  }

  async function save() {
    if (saving) return;
    setError('');
    setMessage('');
    if (newPw.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPw !== confirmPw) {
      setError('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await apiPatch('/me', { currentPassword: currentPw, newPassword: newPw });
      setCurrentPwState('');
      setNewPwState('');
      setConfirmPwState('');
      setMessage('Password updated');
      setTimeout(() => setMessage(''), PW_SAVE_MSG_DURATION_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  }

  return {
    currentPw,
    newPw,
    confirmPw,
    setCurrentPw,
    setNewPw,
    setConfirmPw,
    saving,
    message,
    error,
    canSubmit: !saving && !!currentPw && !!newPw && !!confirmPw,
    save,
  };
}
