import { useState, useRef, useCallback, useEffect } from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import { GlassSelect } from '../../ui/GlassSelect';

interface GeoResult {
  name: string;
  country: string;
  admin1?: string;
}

export function WeatherSettings() {
  const { settings, update } = useSettings();
  const [query, setQuery] = useState(settings.location);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (value: string) => {
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=6&language=en&format=json`
      );
      const data = await res.json();
      setResults(data.results ?? []);
      setOpen(true);
    } catch {
      setResults([]);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      update('location', '');
      setResults([]);
      setOpen(false);
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (result: GeoResult) => {
    setQuery(result.name);
    update('location', result.name);
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
      <div className="settings-group" ref={containerRef} style={{ position: 'relative' }}>
        <label className="settings-label">Location:</label>
        <input
          type="text"
          value={query}
          placeholder="City name or leave empty for auto-detect"
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="settings-input glass-input"
          autoComplete="off"
        />
        {open && results.length > 0 && (
          <div className="city-dropdown">
            {results.map((r, i) => (
              <button
                key={i}
                className="city-dropdown-item"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
              >
                <span className="city-dropdown-name">{r.name}</span>
                <span className="city-dropdown-region">
                  {[r.admin1, r.country].filter(Boolean).join(', ')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
