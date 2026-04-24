import { useState } from 'react';
import { useWeather } from '../../hooks/useWeather';
import { useSettings } from '../../contexts/SettingsContext';
import { WeatherIcon } from './WeatherIcon';
import { Thermometer, AlertTriangle } from 'lucide-react';

export function WeatherWidget() {
  const { settings } = useSettings();
  const state = useWeather();
  const [hovered, setHovered] = useState(false);

  if (!settings.weather.show) return null;

  const unit = settings.weather.unit ?? 'F';

  if (state.status === 'placeholder' || state.status === 'error') {
    return (
      <div className="weather-widget glass-dock text-shadow-sm">
        <div className="weather-circle">
          {state.status === 'error'
            ? <AlertTriangle size={18} style={{ opacity: 0.6 }} />
            : <Thermometer size={18} style={{ opacity: 0.5 }} />}
        </div>
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className="weather-widget glass-dock text-shadow-sm">
        <div className="weather-circle">
          <span className="weather-temp">…</span>
        </div>
      </div>
    );
  }

  // status === 'ready'
  return (
    <div
      className={`weather-widget glass-dock text-shadow-sm${hovered ? ' weather-widget--open' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="weather-circle">
        <span className="weather-temp">{state.displayTemp}</span>
        <span className="weather-unit">{unit}</span>
      </div>
      <div className="weather-expand">
        <div className="weather-expand-inner">
          <WeatherIcon iconCode={state.data.iconCode} condition={state.data.condition} isDay={state.data.isDay} size={22} className="weather-icon" />
          <div className="weather-detail">
            <span className="weather-city">{state.data.city}</span>
            <span className="weather-condition">{state.data.condition}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
