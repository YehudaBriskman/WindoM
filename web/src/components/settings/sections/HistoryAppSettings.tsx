import { useSettings } from '../../../contexts/SettingsContext';

export function HistoryAppSettings() {
  const { settings, update } = useSettings();
  const show = settings.general.showHistory;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="settings-group">
        <label className="settings-label">Browsing History</label>
        <p className="settings-hint" style={{ marginBottom: '12px' }}>
          Shows your 10 most-recent unique sites in the sidebar with favicons and timestamps.
          Uses Chrome's local history - nothing leaves your device.
        </p>
        <label className="visibility-row" style={{ cursor: 'pointer' }}>
          <span className="visibility-row-label">Show in sidebar</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => void update('general', { showHistory: e.target.checked })}
            />
            <span className="toggle-track"><span className="toggle-knob" /></span>
          </label>
        </label>
      </div>
    </div>
  );
}
