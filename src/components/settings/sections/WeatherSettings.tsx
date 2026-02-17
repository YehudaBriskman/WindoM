import { useSettings } from '../../../contexts/SettingsContext';

interface Props {
  formRef: React.MutableRefObject<Record<string, string | boolean>>;
}

export function WeatherSettings({ formRef }: Props) {
  const { settings } = useSettings();

  return (
    <div>
      <div className="settings-group">
        <label className="settings-label">Location:</label>
        <input
          type="text"
          defaultValue={settings.location}
          placeholder="City name or leave empty for auto-detect"
          onChange={(e) => (formRef.current.location = e.target.value)}
          className="settings-input glass-input"
        />
      </div>
      <div className="settings-group">
        <label className="settings-label">OpenWeather API Key (optional):</label>
        <input
          type="text"
          defaultValue={settings.weatherApiKey}
          placeholder="Your API key"
          onChange={(e) => (formRef.current.weatherApiKey = e.target.value)}
          className="settings-input glass-input"
        />
        <small className="settings-hint">
          Get your key at{' '}
          <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer">
            openweathermap.org/api
          </a>
        </small>
      </div>
    </div>
  );
}
