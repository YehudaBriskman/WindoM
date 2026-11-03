import { useCallback } from 'react';
import { localStore as ls } from '../lib/chrome-storage';
import type { LocationCoords, CachedLocation } from '../types/weather';

// Location is opt-in (#449). A new tab never calls
// navigator.geolocation on its own: Chrome would show its "wants to know your
// location" prompt to someone who has not asked for weather by location yet.
//
//   - `getLocation()` (the passive path, run by the weather widget on every new
//     tab) only reads coordinates when the browser already reports the
//     permission as `granted`. Anything else - `prompt`, `denied`, no
//     Permissions API - returns null and the widget asks for a city instead.
//   - `requestCurrentLocation()` is the only call that can make Chrome prompt.
//     It runs from the "Use my current location" button in Settings → Weather.
//
// A denial is remembered by the browser itself (state `denied`), so the passive
// path never re-prompts after one; nothing extra has to be stored for that.

const GEO_TIMEOUT_MS = 10_000;
const GEO_MAX_AGE_MS = 600_000;
const LOCATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type GeoPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

export type LocationRequestResult =
  { ok: true; coords: LocationCoords } | { ok: false; reason: 'denied' | 'unavailable' | 'unsupported' };

class GeoError extends Error {
  constructor(
    readonly code: number,
    message: string,
  ) {
    super(message);
  }
}

function getCoordinates(): Promise<LocationCoords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new GeoError(0, 'Geolocation not supported'));
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
        reject(new GeoError(err.code, msgs[err.code] || 'Unknown geolocation error'));
      },
      { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: GEO_MAX_AGE_MS },
    );
  });
}

async function getLocationFromIp(): Promise<LocationCoords | null> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      return { lat: data.latitude, lon: data.longitude };
    }
    return null;
  } catch (err) {
    console.warn('[location] IP fallback failed:', err);
    return null;
  }
}

async function permissionStatus(): Promise<PermissionStatus | null> {
  try {
    return (await navigator.permissions?.query({ name: 'geolocation' })) ?? null;
  } catch {
    return null;
  }
}

/** The browser's geolocation permission, read without prompting. */
export async function geolocationPermission(): Promise<GeoPermission> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return 'unsupported';
  const status = await permissionStatus();
  // No Permissions API: we cannot tell without prompting, so treat it as "not yet".
  return status?.state ?? 'prompt';
}

/** Calls `onChange` whenever the geolocation permission changes (granted in settings, revoked in Chrome). */
export function watchGeolocationPermission(onChange: () => void): () => void {
  let status: PermissionStatus | null = null;
  let cancelled = false;
  void permissionStatus().then((s) => {
    if (cancelled || !s) return;
    status = s;
    status.addEventListener('change', onChange);
  });
  return () => {
    cancelled = true;
    status?.removeEventListener('change', onChange);
  };
}

/**
 * Asks the browser for the current position - this is the call that may show
 * Chrome's permission prompt, so only run it from a user gesture.
 */
export async function requestCurrentLocation(): Promise<LocationRequestResult> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { ok: false, reason: 'unsupported' };
  }
  try {
    const coords = await getCoordinates();
    await ls.set('lastKnownLocation', { ...coords, timestamp: Date.now() });
    return { ok: true, coords };
  } catch (err) {
    const code = err instanceof GeoError ? err.code : 2;
    return { ok: false, reason: code === 1 ? 'denied' : 'unavailable' };
  }
}

export function useLocation() {
  /** Passive: never prompts. Null unless location was already granted. */
  const getLocation = useCallback(async (): Promise<LocationCoords | null> => {
    if ((await geolocationPermission()) !== 'granted') return null;

    // 1. Browser geolocation (already granted, so no prompt)
    try {
      const coords = await getCoordinates();
      await ls.set('lastKnownLocation', { ...coords, timestamp: Date.now() });
      return coords;
    } catch (err) {
      console.warn('[location] Geolocation failed, falling through:', err);
    }

    // 2. Fallback to cached coords (within 24h)
    const cached = await ls.get<CachedLocation | null>('lastKnownLocation', null);
    if (cached && Date.now() - cached.timestamp < LOCATION_CACHE_TTL_MS) {
      return { lat: cached.lat, lon: cached.lon };
    }

    // 3. Last resort, for a user who allowed location but whose browser
    //    could not get a fix: a rough IP-based lookup.
    const ipCoords = await getLocationFromIp();
    if (ipCoords) {
      await ls.set('lastKnownLocation', { ...ipCoords, timestamp: Date.now() });
    }
    return ipCoords;
  }, []);

  return { getLocation };
}
