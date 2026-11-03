import { useState } from 'react';
import { useWeather } from '../../hooks/useWeather';
import { useSettings } from '../../contexts/SettingsContext';
import { WeatherIcon } from './WeatherIcon';
import { Thermometer, AlertTriangle, MapPin } from 'lucide-react';
import { useLiquidGlass } from '../../hooks/useLiquidGlass';
import { SETTINGS_EVENT } from '../../lib/settings-events';

// The pill is the button: no chrome of its own, so the glass-dock shape and the
// hover expansion read exactly as the ready state does.
const pillButton: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '100%',
  padding: 0,
  border: 0,
  background: 'none',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
  borderRadius: 'inherit',
};

export function WeatherWidget() {
  const glassRef = useLiquidGlass<HTMLDivElement>('dock');
  const { settings } = useSettings();
  const state = useWeather();
  const [hovered, setHovered] = useState(false);

  if (!settings.weather.show) return null;

  const unit = settings.weather.unit ?? 'F';

  // No city and no location permission: offer to set one rather than asking the
  // browser for coordinates on load (#449). Opens Settings → Weather.
  if (state.status === 'placeholder' && state.needsLocation) {
    return (
      <div
        ref={glassRef}
        className={`weather-widget glass-dock text-shadow-sm${hovered ? ' weather-widget--open' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          type="button"
          style={pillButton}
          aria-label="Set weather location"
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          onClick={() => document.dispatchEvent(new CustomEvent(SETTINGS_EVENT.OPEN_WEATHER))}
        >
          <span className="weather-circle">
            <MapPin size={18} style={{ opacity: 0.6 }} aria-hidden="true" />
          </span>
          <span className="weather-expand" aria-hidden="true">
            <span className="weather-expand-inner">
              <span className="weather-city">{state.message}</span>
            </span>
          </span>
        </button>
      </div>
    );
  }

  if (state.status === 'placeholder' || state.status === 'error') {
    return (
      <div ref={glassRef} className="weather-widget glass-dock text-shadow-sm">
        <div className="weather-circle">
          {state.status === 'error' ? (
            <AlertTriangle size={18} style={{ opacity: 0.6 }} />
          ) : (
            <Thermometer size={18} style={{ opacity: 0.5 }} />
          )}
        </div>
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div ref={glassRef} className="weather-widget glass-dock text-shadow-sm">
        <div className="weather-circle">
          <span className="weather-temp">…</span>
        </div>
      </div>
    );
  }

  // status === 'ready'
  return (
    <div
      ref={glassRef}
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
          <WeatherIcon
            iconCode={state.data.iconCode}
            condition={state.data.condition}
            isDay={state.data.isDay}
            size={22}
            className="weather-icon"
          />
          <div className="weather-detail">
            <span className="weather-city">{state.data.city}</span>
            <span className="weather-condition">{state.data.condition}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
