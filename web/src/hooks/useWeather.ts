import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useLocation } from './useLocation';
import { localStore as ls } from '../lib/chrome-storage';
import { convertTemperature } from '../utils/temperature';
import type { WeatherData } from '../types/weather';

const CACHE_EXPIRY = 30 * 60 * 1000;

type WeatherState =
  | { status: 'loading' }
  | { status: 'placeholder'; message: string }
  | { status: 'error' }
  | { status: 'ready'; data: WeatherData; displayTemp: number };

/** WMO weather code → condition string */
function mapWmoCode(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Partly Cloudy';
  if (code === 3) return 'Clouds';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain';
  if (code === 85 || code === 86) return 'Snow';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Clouds';
}

/** WMO weather code → human-readable description */
function wmoDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Icy fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Dense drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    95: 'Thunderstorm',
  };
  return descriptions[code] ?? 'Unknown';
}

export function useWeather() {
  const { settings } = useSettings();
  const { getLocation } = useLocation();
  const [state, setState] = useState<WeatherState>({ status: 'placeholder', message: 'Weather' });
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  // Each effect run gets a unique ID. fetchWeather checks this before every setState
  // so a stale in-flight request from a previous run can never overwrite fresh state.
  const runIdRef = useRef(0);

  // runId is passed in so fetchWeather can guard against being stale
  const fetchWeather = useCallback(async (runId: number) => {
    const manualLocation = settings.location.trim();
    let lat: number;
    let lon: number;
    let resolvedCity: string;

    if (manualLocation) {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(manualLocation)}&count=1&language=en&format=json`
      );
      if (runIdRef.current !== runId) return;
      if (!geoRes.ok) throw new Error(`Geocoding error: ${geoRes.status}`);
      const geoData = await geoRes.json();
      if (runIdRef.current !== runId) return;
      if (!geoData.results?.length) {
        setState({ status: 'placeholder', message: 'City not found' });
        return;
      }
      lat = geoData.results[0].latitude;
      lon = geoData.results[0].longitude;
      resolvedCity = geoData.results[0].name;
    } else {
      const coords = await getLocation();
      if (runIdRef.current !== runId) return;
      if (!coords) {
        setState({ status: 'placeholder', message: 'Set location in settings' });
        return;
      }
      lat = coords.lat;
      lon = coords.lon;

      try {
        const revRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const revData = await revRes.json();
        resolvedCity =
          revData.address?.city ??
          revData.address?.town ??
          revData.address?.village ??
          revData.address?.county ??
          '';
      } catch {
        resolvedCity = '';
      }
      if (runIdRef.current !== runId) return;
    }

    setState({ status: 'loading' });

    const tempUnit = settings.temperatureUnit === 'C' ? 'celsius' : 'fahrenheit';
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&temperature_unit=${tempUnit}&timezone=auto`
    );
    if (runIdRef.current !== runId) return;
    if (!weatherRes.ok) throw new Error(`Weather error: ${weatherRes.status}`);
    const weatherData = await weatherRes.json();
    if (runIdRef.current !== runId) return;

    const current = weatherData.current;
    const weatherRecord: WeatherData = {
      temp: Math.round(current.temperature_2m),
      condition: mapWmoCode(current.weather_code),
      description: wmoDescription(current.weather_code),
      iconCode: undefined,
      isDay: current.is_day === 1,
      city: resolvedCity,
      unit: settings.temperatureUnit,
      timestamp: Date.now(),
    };

    await ls.set('weatherCache', weatherRecord);
    if (runIdRef.current !== runId) return;
    setState({ status: 'ready', data: weatherRecord, displayTemp: weatherRecord.temp });
  }, [settings.location, settings.temperatureUnit, getLocation]);

  useEffect(() => {
    // Claim this run; any prior in-flight fetch will see a stale runId and bail out
    const runId = ++runIdRef.current;

    (async () => {
      const cached = await ls.get<WeatherData | null>('weatherCache', null);
      if (runIdRef.current !== runId) return;

      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
        const displayTemp = cached.unit !== settings.temperatureUnit
          ? convertTemperature(cached.temp, cached.unit, settings.temperatureUnit)
          : cached.temp;
        setState({ status: 'ready', data: cached, displayTemp });
      }

      try {
        await fetchWeather(runId);
      } catch (error) {
        if (runIdRef.current !== runId) return;
        console.error('Error fetching weather:', error);
        const fallback = await ls.get<WeatherData | null>('weatherCache', null);
        if (fallback) {
          const displayTemp = fallback.unit !== settings.temperatureUnit
            ? convertTemperature(fallback.temp, fallback.unit, settings.temperatureUnit)
            : fallback.temp;
          setState({ status: 'ready', data: fallback, displayTemp });
        } else {
          setState({ status: 'error' });
        }
      }

      if (runIdRef.current !== runId) return;
      intervalRef.current = setInterval(async () => {
        try {
          await fetchWeather(runId);
        } catch {
          // silently ignore periodic refresh errors
        }
      }, CACHE_EXPIRY);
    })();

    return () => clearInterval(intervalRef.current);
    // settings.temperatureUnit is listed directly so the cache conversion in the effect
    // body always runs with the current unit, not just when fetchWeather recreates.
  }, [fetchWeather, settings.temperatureUnit]);

  return state;
}
