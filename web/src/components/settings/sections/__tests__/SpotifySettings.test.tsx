import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { defaultSettings, type Settings } from '../../../../types/settings';

vi.mock('../../../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../../../contexts/SettingsContext', () => ({ useSettings: vi.fn() }));
vi.mock('../../../../lib/api', () => ({ apiPost: vi.fn(), apiFetch: vi.fn() }));

import { useAuth } from '../../../../contexts/AuthContext';
import { useSettings } from '../../../../contexts/SettingsContext';
import { apiPost } from '../../../../lib/api';
import { SpotifySettings } from '../SpotifySettings';

const REDIRECT = 'https://abcdef.chromiumapp.org/';
const AUTH_URL = 'https://accounts.spotify.com/authorize?state=s-1';
const update = vi.fn().mockResolvedValue(true);
let settings: Settings;
let redirect: string | undefined;

beforeEach(() => {
  settings = structuredClone(defaultSettings);
  redirect = `${REDIRECT}?code=c&state=s-1`;
  sessionStorage.clear();
  vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' } } as unknown as ReturnType<typeof useAuth>);
  vi.mocked(useSettings).mockImplementation(
    () => ({ settings, update }) as unknown as ReturnType<typeof useSettings>,
  );
  vi.mocked(apiPost).mockImplementation(async (path: string) =>
    path.endsWith('/start') ? { authUrl: AUTH_URL } : { status: 'linked' },
  );
  const g = globalThis as unknown as { chrome: Record<string, unknown> };
  g.chrome.identity = {
    getRedirectURL: () => REDIRECT,
    launchWebAuthFlow: vi.fn((_o: unknown, cb: (u?: string) => void) => cb(redirect)),
  };
  g.chrome.runtime = { lastError: undefined };
});

function enterClientIdAndConnect(id: string) {
  fireEvent.change(screen.getByPlaceholderText('Spotify Client ID'), { target: { value: `  ${id} ` } });
  fireEvent.click(screen.getByRole('button', { name: 'Save & Connect' }));
}

describe('SpotifySettings', () => {
  it('saves the trimmed client ID only after the account is linked', async () => {
    render(<SpotifySettings />);
    await screen.findByPlaceholderText('Spotify Client ID');

    enterClientIdAndConnect('my-client');

    await waitFor(() =>
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ windom_spotify_client_id: 'my-client' }),
    );
    expect(update).toHaveBeenCalledWith('integrations', {
      spotify: { ...settings.integrations.spotify, connected: true },
    });
    expect(vi.mocked(apiPost).mock.calls[0][1]).toMatchObject({ clientId: 'my-client' });
  });

  it('keeps no client ID and shows the Spotify wording when the user cancels', async () => {
    redirect = undefined;
    (globalThis as unknown as { chrome: { runtime: unknown } }).chrome.runtime = {
      lastError: { message: 'The user did not approve access.' },
    };
    render(<SpotifySettings />);
    await screen.findByPlaceholderText('Spotify Client ID');

    enterClientIdAndConnect('my-client');

    expect(await screen.findByText('Connection cancelled.')).toBeTruthy();
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
