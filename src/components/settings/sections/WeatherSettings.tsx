import { useSettings } from '../../../contexts/SettingsContext';
import { GlassSelect } from '../../ui/GlassSelect';

export function WeatherSettings() {
  const { settings, update } = useSettings();

  return (
    <div>
      <div className="settings-group">
        <label className="settings-label">Temperature Unit:</label>
        <GlassSelect
          value={settings.temperatureUnit}
          onChange={(value) => update('temperatureUnit', value as 'F' | 'C')}
          options={[
            { value: 'F', label: 'Fahrenheit (°F)' },
            { value: 'C', label: 'Celsius (°C)' },
          ]}
        />
      </div>
      <div className="settings-group">
        <label className="settings-label">Location:</label>
        <input
          type="text"
          defaultValue={settings.location}
          placeholder="City name or leave empty for auto-detect"
          onChange={(e) => update('location', e.target.value)}
          className="settings-input glass-input"
        />
      </div>
      <div className="settings-group">
        <label className="settings-label">OpenWeather API Key (optional):</label>
        <input
          type="text"
          defaultValue={settings.weatherApiKey}
          placeholder="Your API key"
          onChange={(e) => update('weatherApiKey', e.target.value)}
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
