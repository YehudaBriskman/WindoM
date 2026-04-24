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

  if (state.status === 'placeholder') {
    return (
      <div className="weather-widget glass-dock text-shadow-sm">
        <Thermometer size={28} className="weather-icon" />
        <span className="weather-city">{state.message}</span>
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className="weather-widget glass-dock text-shadow-sm">
        <Thermometer size={28} className="weather-icon" />
        <span className="weather-temp">...</span>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="weather-widget glass-dock text-shadow-sm weather-error">
        <AlertTriangle size={28} className="weather-icon" />
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
      <WeatherIcon iconCode={state.data.iconCode} condition={state.data.condition} isDay={state.data.isDay} size={28} className="weather-icon" />
      <span className="weather-temp">{state.displayTemp}&deg;</span>
      <div className="weather-expand">
        <div className="weather-expand-inner">
          <span className="weather-city">{state.data.city}</span>
          <span className="weather-condition">{state.data.condition}</span>
        </div>
      </div>
    </div>
  );
}
