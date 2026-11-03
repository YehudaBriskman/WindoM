import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestCurrentLocation, useLocation } from '../useLocation';
import { WeatherSettings } from '../../components/settings/sections/WeatherSettings';

// Location is opt-in (#449). These tests pin the contract: loading a new tab
// never calls navigator.geolocation unless the browser already reports the
// permission as granted, the settings button is what asks, and a denial
// becomes a hint to type a city rather than a repeated prompt.

const update = vi.fn().mockResolvedValue(undefined);
let location = '';
vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: { weather: { show: true, unit: 'C', location, apiKey: '' } }, update }),
}));

let permissionState: PermissionState = 'prompt';
const changeListeners = new Set<() => void>();
const getCurrentPosition = vi.fn();
const fetchMock = vi.fn();

beforeEach(() => {
  location = '';
  permissionState = 'prompt';
  changeListeners.clear();
  update.mockClear();
  getCurrentPosition.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition } });
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: {
      query: vi.fn(async () => ({
        get state() { return permissionState; },
        addEventListener: (_: string, l: () => void) => changeListeners.add(l),
        removeEventListener: (_: string, l: () => void) => changeListeners.delete(l),
      })),
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const succeed = () =>
  getCurrentPosition.mockImplementation((ok: PositionCallback) =>
    ok({ coords: { latitude: 32.08, longitude: 34.78 } } as GeolocationPosition));
const fail = (code: number) =>
  getCurrentPosition.mockImplementation((_ok: PositionCallback, err: PositionErrorCallback) =>
    err({ code } as GeolocationPositionError));

describe('useLocation().getLocation (the passive path a new tab runs)', () => {
  it.each<PermissionState>(['prompt', 'denied'])('never asks the browser when permission is %s', async (state) => {
    permissionState = state;
    const { result } = renderHook(() => useLocation());
    await expect(result.current.getLocation()).resolves.toBeNull();
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled(); // no silent IP lookup either
  });

  it('never asks without a Permissions API', async () => {
    Object.defineProperty(navigator, 'permissions', { configurable: true, value: undefined });
    const { result } = renderHook(() => useLocation());
    await expect(result.current.getLocation()).resolves.toBeNull();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('reads coordinates once location is already granted', async () => {
    permissionState = 'granted';
    succeed();
    const { result } = renderHook(() => useLocation());
    await expect(result.current.getLocation()).resolves.toEqual({ lat: 32.08, lon: 34.78 });
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });
});

describe('requestCurrentLocation (the explicit ask)', () => {
  it('maps a denial to "denied"', async () => {
    fail(1);
    await expect(requestCurrentLocation()).resolves.toEqual({ ok: false, reason: 'denied' });
  });

  it('maps a timeout to "unavailable"', async () => {
    fail(3);
    await expect(requestCurrentLocation()).resolves.toEqual({ ok: false, reason: 'unavailable' });
  });
});

describe('WeatherSettings', () => {
  it('does not touch geolocation on render, and asks only when the button is pressed', async () => {
    succeed();
    render(<WeatherSettings />);
    const button = await screen.findByRole('button', { name: 'Use my current location' });
    expect(getCurrentPosition).not.toHaveBeenCalled();

    fireEvent.click(button);
    await waitFor(() => expect(getCurrentPosition).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(update).toHaveBeenCalledWith('weather', { location: '' }));
  });

  it('turns a denial into a hint to type a city', async () => {
    fail(1);
    render(<WeatherSettings />);
    fireEvent.click(await screen.findByRole('button', { name: 'Use my current location' }));
    expect(await screen.findByText(/Location access is blocked/)).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
  });

  it('shows the blocked hint up front when the browser already denied it', async () => {
    permissionState = 'denied';
    render(<WeatherSettings />);
    expect(await screen.findByText(/Location access is blocked/)).toBeTruthy();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('picks up a permission change made elsewhere', async () => {
    render(<WeatherSettings />);
    await screen.findByRole('button', { name: 'Use my current location' });
    permissionState = 'granted';
    act(() => changeListeners.forEach((l) => l()));
    expect(await screen.findByText('Using your current location.')).toBeTruthy();
  });
});
