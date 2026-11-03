import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { apiPatch } from '../lib/api';
import { NAME_SAVE_MSG_DURATION_MS } from '../lib/timing-constants';

/**
 * The account display name field. Saving PATCHes /me, then mirrors the new
 * name into the auth user and into `general.userName` (the greeting).
 * `message` is 'Saved' on success, otherwise an error to show.
 */
export function useDisplayName() {
  const { user, updateUser } = useAuth();
  const { update: updateSetting } = useSettings();

  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function save() {
    if (saving) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === user?.name) return;
    if (trimmed.length > 100) {
      setMessage('Name must be 100 characters or less');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const updated = await apiPatch<{ name: string }>('/me', { name: trimmed });
      updateUser({ name: updated.name });
      await updateSetting('general', { userName: updated.name });
      setName(updated.name);
      setMessage('Saved');
      setTimeout(() => setMessage(''), NAME_SAVE_MSG_DURATION_MS);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return {
    name,
    setName,
    saving,
    message,
    saved: message === 'Saved',
    canSave: !saving && !!name.trim() && name.trim() !== user?.name,
    save,
  };
}
