import { useSettings } from '../../../contexts/SettingsContext';

export function TodoAppSettings() {
  const { settings, update } = useSettings();
  const show = settings.general.showTodo;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="settings-group">
        <label className="settings-label">Tasks Widget</label>
        <p className="settings-hint" style={{ marginBottom: '12px' }}>
          A simple to-do list shown in the sidebar. Tasks are stored locally on this device.
        </p>
        <label className="visibility-row" style={{ cursor: 'pointer' }}>
          <span className="visibility-row-label">Show in sidebar</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => void update('general', { showTodo: e.target.checked })}
            />
            <span className="toggle-track"><span className="toggle-knob" /></span>
          </label>
        </label>
      </div>
    </div>
  );
}
