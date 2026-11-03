import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { defaultSettings, type Settings } from '../../types/settings';

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../contexts/SettingsContext', () => ({ useSettings: vi.fn() }));
vi.mock('../../lib/api', () => ({ apiFetch: vi.fn() }));

import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { apiFetch } from '../../lib/api';
import { useAccountDeletion } from '../useAccountDeletion';

const logout = vi.fn();
const update = vi.fn();
let hasPassword: boolean;
let settings: Settings;

const reply = (ok: boolean, body: unknown = {}) => ({ ok, json: () => Promise.resolve(body) }) as unknown as Response;

beforeEach(() => {
  vi.resetAllMocks();
  logout.mockResolvedValue(undefined);
  update.mockResolvedValue(undefined);
  hasPassword = true;
  settings = structuredClone(defaultSettings);
  settings.integrations.calendar.connected = true;
  settings.integrations.spotify.connected = true;
  vi.mocked(useAuth).mockImplementation(
    () => ({ user: { id: 'u1', hasPassword }, logout }) as unknown as ReturnType<typeof useAuth>,
  );
  vi.mocked(useSettings).mockImplementation(() => ({ settings, update }) as unknown as ReturnType<typeof useSettings>);
});

describe('useAccountDeletion', () => {
  it('opens and cancels the confirm panel, clearing password and error', async () => {
    vi.mocked(apiFetch).mockResolvedValue(reply(false));
    const { result } = renderHook(() => useAccountDeletion());
    act(() => result.current.openConfirm());
    act(() => result.current.setPassword('pw'));
    await act(() => result.current.deleteAccount());
    expect(result.current).toMatchObject({ confirming: true, password: 'pw', error: 'Deletion failed' });

    act(() => result.current.cancel());
    expect(result.current).toMatchObject({ confirming: false, password: '', error: '' });
  });

  it('requires a password for password accounts only', () => {
    const { result } = renderHook(() => useAccountDeletion());
    expect(result.current.needsPassword).toBe(true);
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.setPassword('pw'));
    expect(result.current.canSubmit).toBe(true);

    hasPassword = false;
    const oauth = renderHook(() => useAccountDeletion()).result;
    expect(oauth.current.needsPassword).toBe(false);
    expect(oauth.current.canSubmit).toBe(true);
  });

  it('DELETEs /me with the password, disconnects integrations, then signs out', async () => {
    vi.mocked(apiFetch).mockResolvedValue(reply(true));
    const { result } = renderHook(() => useAccountDeletion());
    act(() => result.current.setPassword('pw'));
    await act(() => result.current.deleteAccount());

    expect(apiFetch).toHaveBeenCalledWith('/me', { method: 'DELETE', body: JSON.stringify({ password: 'pw' }) });
    expect(update).toHaveBeenCalledWith('integrations', {
      calendar: { ...settings.integrations.calendar, connected: false },
      spotify: { ...settings.integrations.spotify, connected: false },
    });
    expect(logout).toHaveBeenCalledTimes(1);
    expect(update.mock.invocationCallOrder[0]).toBeLessThan(logout.mock.invocationCallOrder[0]!);
  });

  it('sends an empty body for an account without a password', async () => {
    hasPassword = false;
    vi.mocked(apiFetch).mockResolvedValue(reply(true));
    const { result } = renderHook(() => useAccountDeletion());
    await act(() => result.current.deleteAccount());
    expect(apiFetch).toHaveBeenCalledWith('/me', { method: 'DELETE', body: '{}' });
  });

  it('shows the server message on failure and does not sign out', async () => {
    vi.mocked(apiFetch).mockResolvedValue(reply(false, { message: 'Incorrect password' }));
    const { result } = renderHook(() => useAccountDeletion());
    act(() => result.current.setPassword('bad'));
    await act(() => result.current.deleteAccount());
    expect(result.current).toMatchObject({ error: 'Incorrect password', deleting: false });
    expect(update).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when the request itself throws a non-Error', async () => {
    vi.mocked(apiFetch).mockRejectedValue('offline');
    const { result } = renderHook(() => useAccountDeletion());
    await act(() => result.current.deleteAccount());
    expect(result.current.error).toBe('Something went wrong');
  });
});
