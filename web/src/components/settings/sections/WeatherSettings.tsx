import { useState, useRef, useCallback, useEffect, useId } from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import { GlassSelect } from '../../ui/GlassSelect';
import {
  geolocationPermission,
  requestCurrentLocation,
  watchGeolocationPermission,
  type GeoPermission,
} from '../../../hooks/useLocation';

// Shown under the Location field. Location is only ever requested from the
// button below (#449); a typed city never needs it.
const LOCATION_HINT: Record<'denied' | 'unavailable' | 'unsupported', string> = {
  denied:
    "Location access is blocked for WindoM. Type a city above instead - or allow location for this extension in Chrome's site settings and try again.",
  unavailable: 'Could not get your location just now. Type a city above instead, or try again.',
  unsupported: 'This browser cannot share your location. Type a city above instead.',
};

interface GeoResult {
  name: string;
  country: string;
  admin1?: string;
}

export function WeatherSettings() {
  const { settings, update } = useSettings();
  const [query, setQuery] = useState(settings.weather.location);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const unitLabelId = useId();
  const locationInputId = useId();
  const locationHintId = useId();
  const [permission, setPermission] = useState<GeoPermission>('prompt');
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<keyof typeof LOCATION_HINT | null>(null);

  useEffect(() => {
    let alive = true;
    const read = () => {
      void geolocationPermission().then((p) => {
        if (alive) setPermission(p);
      });
    };
    read();
    const unwatch = watchGeolocationPermission(read);
    return () => {
      alive = false;
      unwatch();
    };
  }, []);

  // A user gesture: this is the only place WindoM asks the browser for location.
  const locateMe = async () => {
    setLocateError(null);
    setLocating(true);
    const result = await requestCurrentLocation();
    setLocating(false);
    if (result.ok) {
      setPermission('granted');
      setQuery('');
      setResults([]);
      setOpen(false);
      await update('weather', { location: '' });
    } else {
      setLocateError(result.reason);
      if (result.reason === 'denied') setPermission('denied');
    }
  };

  const usingCurrentLocation = !settings.weather.location.trim() && permission === 'granted';
  const locationHint = locateError
    ? LOCATION_HINT[locateError]
    : permission === 'denied' && !settings.weather.location.trim()
      ? LOCATION_HINT.denied
      : usingCurrentLocation
        ? 'Using your current location.'
        : null;

  const search = useCallback(async (value: string) => {
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=6&language=en&format=json`,
      );
      const data = await res.json();
      setResults(data.results ?? []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      update('weather', { location: '' });
      setResults([]);
      setOpen(false);
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (result: GeoResult) => {
    setQuery(result.name);
    update('weather', { location: result.name });
    setResults([]);
    setOpen(false);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div>
      <div className="settings-group">
        <span id={unitLabelId} className="settings-label">
          Temperature Unit:
        </span>
        <GlassSelect
          labelledBy={unitLabelId}
          value={settings.weather.unit}
          onChange={(value) => update('weather', { unit: value as 'F' | 'C' })}
          options={[
            { value: 'F', label: 'Fahrenheit (°F)' },
            { value: 'C', label: 'Celsius (°C)' },
          ]}
        />
      </div>
      <div className="settings-group" ref={containerRef} style={{ position: 'relative' }}>
        <label htmlFor={locationInputId} className="settings-label">
          Location:
        </label>
        <input
          id={locationInputId}
          type="text"
          value={query}
          placeholder="City name, e.g. Tel Aviv"
          aria-describedby={locationHint ? locationHintId : undefined}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="settings-input glass-input"
          autoComplete="off"
        />
        {searching && <p className="settings-hint">Searching…</p>}
        {permission !== 'unsupported' && !usingCurrentLocation && (
          <button
            type="button"
            className="settings-save-btn"
            style={{ marginTop: '8px', padding: '8px 14px', fontSize: '14px', flex: 'none' }}
            disabled={locating}
            onClick={() => void locateMe()}
          >
            {locating ? 'Locating…' : 'Use my current location'}
          </button>
        )}
        {locationHint && (
          <p id={locationHintId} className="settings-hint" role={locateError ? 'status' : undefined}>
            {locationHint}
          </p>
        )}
        {open && results.length > 0 && (
          <div className="city-dropdown">
            {results.map((r) => (
              <button
                key={`${r.name}-${r.admin1 ?? ''}-${r.country}`}
                className="city-dropdown-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(r);
                }}
              >
                <span className="city-dropdown-name">{r.name}</span>
                <span className="city-dropdown-region">{[r.admin1, r.country].filter(Boolean).join(', ')}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="settings-hint">
        Weather data by{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo.com
        </a>{' '}
        (CC BY 4.0).
      </p>
    </div>
  );
}
