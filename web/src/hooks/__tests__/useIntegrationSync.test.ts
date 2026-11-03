import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { defaultSettings, type Settings } from '../../types/settings';

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../contexts/SettingsContext', () => ({ useSettings: vi.fn() }));
vi.mock('../../lib/api', () => ({ apiGet: vi.fn() }));
vi.mock('../../lib/server-features', () => ({ setGmailAvailable: vi.fn() }));

import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { apiGet } from '../../lib/api';
import { useIntegrationSync } from '../useIntegrationSync';

type Integrations = Settings['integrations'];

const updateMultiple = vi.fn().mockResolvedValue(undefined);
let settings: Settings;
let user: { id: string } | null;

function mockContexts() {
  vi.mocked(useAuth).mockImplementation(
    () => ({ user, authLoading: false }) as unknown as ReturnType<typeof useAuth>,
  );
  vi.mocked(useSettings).mockImplementation(
    () => ({ settings, updateMultiple, loaded: true }) as unknown as ReturnType<typeof useSettings>,
  );
}

function withIntegrations(patch: Partial<Integrations>): Settings {
  return { ...settings, integrations: { ...settings.integrations, ...patch } };
}

const serverReply = {
  google: { connected: true, scopes: ['calendar', 'gmail.readonly'] },
  spotify: { connected: false },
  github: { connected: true },
  features: { gmail: true },
};

beforeEach(() => {
  vi.clearAllMocks();
  settings = structuredClone(defaultSettings);
  user = { id: 'u1' };
  mockContexts();
});

describe('useIntegrationSync', () => {
  it('writes the server state once and does not loop when its own write re-renders', async () => {
    vi.mocked(apiGet).mockResolvedValue(serverReply);
    const { rerender } = renderHook(() => useIntegrationSync());

    await waitFor(() => expect(updateMultiple).toHaveBeenCalledTimes(1));
    const written = updateMultiple.mock.calls[0][0].integrations as Integrations;
    expect(written.calendar.connected).toBe(true);
    expect(written.gmail.connected).toBe(true);
    expect(written.github.connected).toBe(true);
    expect(written.spotify.connected).toBe(false);

    // Simulate the provider re-rendering with the section the hook just wrote.
    settings = withIntegrations(written);
    rerender();
    settings = withIntegrations({ calendar: { ...written.calendar, days: 30 } });
    rerender();
    await act(async () => {});

    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(updateMultiple).toHaveBeenCalledTimes(1);
  });

  it('merges into the integrations section current when the reply lands, not the one at mount', async () => {
    let resolve!: (v: typeof serverReply) => void;
    vi.mocked(apiGet).mockReturnValue(new Promise((r) => { resolve = r; }));
    const { rerender } = renderHook(() => useIntegrationSync());

    // The user changes a calendar preference while /integrations is in flight.
    settings = withIntegrations({ calendar: { ...settings.integrations.calendar, days: 14 } });
    rerender();

    await act(async () => { resolve(serverReply); });

    const written = updateMultiple.mock.calls[0][0].integrations as Integrations;
    expect(written.calendar).toEqual({ days: 14, connected: true });
  });

  it('clears every connected flag once when signed out, keeping other fields', async () => {
    user = null;
    settings = withIntegrations({ spotify: { connected: true, showTopTracks: true } });
    const { rerender } = renderHook(() => useIntegrationSync());

    expect(updateMultiple).toHaveBeenCalledTimes(1);
    const written = updateMultiple.mock.calls[0][0].integrations as Integrations;
    expect(written.spotify).toEqual({ connected: false, showTopTracks: true });
    expect(apiGet).not.toHaveBeenCalled();

    settings = withIntegrations(written);
    rerender();
    expect(updateMultiple).toHaveBeenCalledTimes(1);
  });
});
