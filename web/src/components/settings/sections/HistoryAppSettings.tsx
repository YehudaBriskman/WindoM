import { useState } from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useHistoryPermission } from '../../../hooks/useHistory';

export function HistoryAppSettings() {
  const { settings, update } = useSettings();
  const { granted, request, release } = useHistoryPermission();
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  // The feature is on only when the setting is on AND Chrome has granted the
  // optional `history` permission to this install. Either alone shows "off".
  const on = settings.general.showHistory && granted === true;

  async function handleChange(checked: boolean) {
    setDenied(false);
    setBusy(true);
    try {
      if (checked) {
        // `request` must run inside this change handler: Chrome only shows
        // its permission prompt during a user gesture.
        const ok = await request();
        if (!ok) {
          setDenied(true);
          return;
        }
        await update('general', { showHistory: true });
      } else {
        await update('general', { showHistory: false });
        // Give the permission back, so the extension holds it only while the
        // feature is in use.
        await release();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="settings-group">
        <label className="settings-label">Browsing History</label>
        <p className="settings-hint" style={{ marginBottom: '12px' }}>
          Shows your 10 most-recent unique sites in the sidebar, and suggests pages you visited as you type in search.
          Turning it on asks Chrome for permission to read your browsing history; turning it off gives that permission
          back. Uses Chrome's local history - nothing leaves your device.
        </p>
        <label className="visibility-row" style={{ cursor: 'pointer' }}>
          <span className="visibility-row-label">Show in sidebar and search</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={on}
              disabled={busy || granted === null}
              onChange={(e) => void handleChange(e.target.checked)}
            />
            <span className="toggle-track">
              <span className="toggle-knob" />
            </span>
          </label>
        </label>
        {denied && (
          <p role="alert" className="settings-hint" style={{ marginTop: '8px' }}>
            Chrome did not grant access to your browsing history, so this stays off. You can turn it on again at any
            time.
          </p>
        )}
        {settings.general.showHistory && granted === false && !denied && (
          <p role="status" className="settings-hint" style={{ marginTop: '8px' }}>
            History access was removed from this browser. Turn this on to allow it again.
          </p>
        )}
      </div>
    </div>
  );
}
