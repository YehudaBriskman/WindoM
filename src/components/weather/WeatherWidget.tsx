import { useWeather } from '../../hooks/useWeather';
import { WeatherIcon } from './WeatherIcon';
import { Thermometer, AlertTriangle } from 'lucide-react';

export function WeatherWidget() {
  const state = useWeather();

  if (state.status === 'loading') {
    return (
      <div className="weather-widget glass-panel text-shadow-sm">
        <Thermometer size={28} className="weather-icon" />
        <span className="weather-temp">...</span>
        <span className="weather-city">Loading...</span>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="weather-widget glass-panel text-shadow-sm weather-error">
        <AlertTriangle size={28} className="weather-icon" />
        <span className="weather-city">Error</span>
      </div>
    );
  }

  if (state.status === 'placeholder') {
    return (
      <div className="weather-widget glass-panel text-shadow-sm weather-placeholder">
        <Thermometer size={28} className="weather-icon" />
        <span className="weather-city">{state.message}</span>
      </div>
    );
  }

  // status === 'ready'
  return (
    <div className="weather-widget glass-panel text-shadow-sm">
      <WeatherIcon iconCode={state.data.iconCode} condition={state.data.condition} size={28} className="weather-icon" />
      <span className="weather-temp">{state.displayTemp}&deg;</span>
      <span className="weather-city">{state.data.city}</span>
    </div>
  );
}
