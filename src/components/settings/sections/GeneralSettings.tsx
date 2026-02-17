import { useSettings } from '../../../contexts/SettingsContext';

interface Props {
  formRef: React.MutableRefObject<Record<string, string | boolean>>;
}

export function GeneralSettings({ formRef }: Props) {
  const { settings } = useSettings();

  return (
    <div>
      <div className="settings-group">
        <label className="settings-label">Your Name:</label>
        <input
          type="text"
          defaultValue={settings.userName}
          placeholder="Friend"
          onChange={(e) => (formRef.current.userName = e.target.value)}
          className="settings-input glass-input"
        />
      </div>
      <div className="settings-group">
        <label className="settings-label">Time Format:</label>
        <select
          defaultValue={settings.timeFormat}
          onChange={(e) => (formRef.current.timeFormat = e.target.value)}
          className="settings-select glass-input"
        >
          <option value="12h">12-hour (AM/PM)</option>
          <option value="24h">24-hour</option>
        </select>
      </div>
      <div className="settings-group">
        <label className="settings-label">Temperature Unit:</label>
        <select
          defaultValue={settings.temperatureUnit}
          onChange={(e) => (formRef.current.temperatureUnit = e.target.value)}
          className="settings-select glass-input"
        >
          <option value="F">Fahrenheit (&deg;F)</option>
          <option value="C">Celsius (&deg;C)</option>
        </select>
      </div>
    </div>
  );
}
