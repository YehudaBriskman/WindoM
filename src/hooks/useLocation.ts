import { useCallback } from 'react';
import { localStorage as ls } from '../lib/chrome-storage';
import type { LocationCoords, CachedLocation } from '../types/weather';

function getCoordinates(): Promise<LocationCoords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => {
        const msgs: Record<number, string> = {
          1: 'User denied geolocation permission',
          2: 'Location information unavailable',
          3: 'Geolocation request timed out',
        };
        reject(new Error(msgs[err.code] || 'Unknown geolocation error'));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  });
}

export function useLocation() {
  const getLocation = useCallback(async (): Promise<LocationCoords | null> => {
    try {
      const coords = await getCoordinates();
      await ls.set('lastKnownLocation', { ...coords, timestamp: Date.now() });
      return coords;
    } catch {
      // Fallback to cached
      const cached = await ls.get<CachedLocation | null>('lastKnownLocation', null);
      if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
        return { lat: cached.lat, lon: cached.lon };
      }
      return null;
    }
  }, []);

  return { getLocation };
}
