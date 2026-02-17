import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useLocation } from './useLocation';
import { localStorage as ls } from '../lib/chrome-storage';
import { convertTemperature } from '../utils/temperature';
import type { WeatherData } from '../types/weather';

const CACHE_EXPIRY = 30 * 60 * 1000;

type WeatherState =
  | { status: 'loading' }
  | { status: 'placeholder'; message: string }
  | { status: 'error' }
  | { status: 'ready'; data: WeatherData; displayTemp: number };

export function useWeather() {
  const { settings } = useSettings();
  const { getLocation } = useLocation();
  const [state, setState] = useState<WeatherState>({ status: 'placeholder', message: 'Weather' });
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchWeather = useCallback(async () => {
    const apiKey = settings.weatherApiKey;
    if (!apiKey) {
      setState({ status: 'placeholder', message: 'Set API key in settings' });
      return;
    }

    // Determine location
    const manualLocation = settings.location.trim();
    let locationParam: { type: 'city'; value: string } | { type: 'coords'; value: { lat: number; lon: number } } | null = null;

    if (manualLocation) {
      locationParam = { type: 'city', value: manualLocation };
    } else {
      const coords = await getLocation();
      if (coords) {
        locationParam = { type: 'coords', value: coords };
      }
    }

    if (!locationParam) {
      setState({ status: 'placeholder', message: 'Set location in settings' });
      return;
    }

    setState({ status: 'loading' });

    try {
      const units = settings.temperatureUnit === 'C' ? 'metric' : 'imperial';
      let url: string;
      if (locationParam.type === 'city') {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationParam.value)}&appid=${apiKey}&units=${units}`;
      } else {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${locationParam.value.lat}&lon=${locationParam.value.lon}&appid=${apiKey}&units=${units}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      const weatherData: WeatherData = {
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        iconCode: data.weather[0].icon,
        city: data.name,
        unit: settings.temperatureUnit,
        timestamp: Date.now(),
      };

      await ls.set('weatherCache', weatherData);
      setState({ status: 'ready', data: weatherData, displayTemp: weatherData.temp });
    } catch (error) {
      console.error('Error fetching weather:', error);
      const cached = await ls.get<WeatherData | null>('weatherCache', null);
      if (cached) {
        const displayTemp = cached.unit !== settings.temperatureUnit
          ? convertTemperature(cached.temp, cached.unit, settings.temperatureUnit)
          : cached.temp;
        setState({ status: 'ready', data: cached, displayTemp });
      } else {
        setState({ status: 'error' });
      }
    }
  }, [settings.weatherApiKey, settings.location, settings.temperatureUnit, getLocation]);

  // Load cached data on mount then fetch fresh
  useEffect(() => {
    (async () => {
      const cached = await ls.get<WeatherData | null>('weatherCache', null);
      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
        const displayTemp = cached.unit !== settings.temperatureUnit
          ? convertTemperature(cached.temp, cached.unit, settings.temperatureUnit)
          : cached.temp;
        setState({ status: 'ready', data: cached, displayTemp });
      }
      fetchWeather();
    })();

    // Refresh every 30 minutes
    intervalRef.current = setInterval(fetchWeather, CACHE_EXPIRY);
    return () => clearInterval(intervalRef.current);
  }, [fetchWeather]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
