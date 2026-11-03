import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../contexts/SettingsContext', () => ({ useSettings: vi.fn() }));
vi.mock('../../lib/api', () => ({ apiPatch: vi.fn() }));

import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { apiPatch } from '../../lib/api';
import { useDisplayName } from '../useDisplayName';

const updateUser = vi.fn();
const update = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  update.mockResolvedValue(undefined);
  vi.mocked(useAuth).mockImplementation(
    () => ({ user: { name: 'Ada' }, updateUser }) as unknown as ReturnType<typeof useAuth>,
  );
  vi.mocked(useSettings).mockImplementation(
    () => ({ update }) as unknown as ReturnType<typeof useSettings>,
  );
});

describe('useDisplayName', () => {
  it('starts from the account name and cannot save it unchanged or blank', () => {
    const { result } = renderHook(() => useDisplayName());
    expect(result.current.name).toBe('Ada');
    expect(result.current.canSave).toBe(false);
    act(() => result.current.setName('   '));
    expect(result.current.canSave).toBe(false);
    act(() => result.current.setName('Ada L'));
    expect(result.current.canSave).toBe(true);
  });

  it('rejects a name over 100 characters without calling the API', async () => {
    const { result } = renderHook(() => useDisplayName());
    act(() => result.current.setName('x'.repeat(101)));
    await act(() => result.current.save());
    expect(result.current.message).toBe('Name must be 100 characters or less');
    expect(result.current.saved).toBe(false);
    expect(apiPatch).not.toHaveBeenCalled();
  });

  it('saves the trimmed name to the server, the auth user and the greeting setting', async () => {
    vi.mocked(apiPatch).mockResolvedValue({ name: 'Ada L' });
    const { result } = renderHook(() => useDisplayName());
    act(() => result.current.setName('  Ada L  '));
    await act(() => result.current.save());
    expect(apiPatch).toHaveBeenCalledWith('/me', { name: 'Ada L' });
    expect(updateUser).toHaveBeenCalledWith({ name: 'Ada L' });
    expect(update).toHaveBeenCalledWith('general', { userName: 'Ada L' });
    expect(result.current).toMatchObject({ name: 'Ada L', message: 'Saved', saved: true });
  });

  it('shows the error when the save fails', async () => {
    vi.mocked(apiPatch).mockRejectedValue(new Error('Too fast'));
    const { result } = renderHook(() => useDisplayName());
    act(() => result.current.setName('Bob'));
    await act(() => result.current.save());
    expect(result.current).toMatchObject({ message: 'Too fast', saved: false, saving: false });
    expect(updateUser).not.toHaveBeenCalled();
  });
});
