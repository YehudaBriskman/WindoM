import { useSettings } from '../../../contexts/SettingsContext';

export function ClockSettings() {
  const { settings, update } = useSettings();

  return (
    <div>
      <div className="settings-group">
        <label className="settings-label">Time Format:</label>
        <select
          value={settings.timeFormat}
          onChange={(e) => update('timeFormat', e.target.value as '12h' | '24h')}
          className="settings-select glass-input"
        >
          <option value="12h">12-hour (AM/PM)</option>
          <option value="24h">24-hour</option>
        </select>
      </div>
    </div>
  );
}
