import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../lib/api', () => ({ apiPatch: vi.fn() }));

import { apiPatch } from '../../lib/api';
import { PW_SAVE_MSG_DURATION_MS } from '../../lib/timing-constants';
import { usePasswordChange } from '../usePasswordChange';

function fill(result: { current: ReturnType<typeof usePasswordChange> }, cur: string, next: string, confirm: string) {
  act(() => {
    result.current.setCurrentPw(cur);
    result.current.setNewPw(next);
    result.current.setConfirmPw(confirm);
  });
}

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.useRealTimers());

describe('usePasswordChange', () => {
  it('cannot submit until all three fields are filled', () => {
    const { result } = renderHook(() => usePasswordChange());
    expect(result.current.canSubmit).toBe(false);
    act(() => { result.current.setCurrentPw('old'); result.current.setNewPw('newpassword'); });
    expect(result.current.canSubmit).toBe(false);
    act(() => { result.current.setConfirmPw('newpassword'); });
    expect(result.current.canSubmit).toBe(true);
  });

  it('rejects a short password without calling the API', async () => {
    const { result } = renderHook(() => usePasswordChange());
    fill(result, 'old', 'short', 'short');
    await act(() => result.current.save());
    expect(result.current.error).toBe('New password must be at least 8 characters');
    expect(apiPatch).not.toHaveBeenCalled();
  });

  it('rejects a mismatched confirmation, and editing a field clears the error', async () => {
    const { result } = renderHook(() => usePasswordChange());
    fill(result, 'old', 'longenough', 'different1');
    await act(() => result.current.save());
    expect(result.current.error).toBe('Passwords do not match');
    expect(apiPatch).not.toHaveBeenCalled();
    act(() => result.current.setConfirmPw('longenough'));
    expect(result.current.error).toBe('');
  });

  it('PATCHes /me, clears the fields and shows a message that expires', async () => {
    vi.useFakeTimers();
    vi.mocked(apiPatch).mockResolvedValue({});
    const { result } = renderHook(() => usePasswordChange());
    fill(result, 'old', 'longenough', 'longenough');
    await act(() => result.current.save());

    expect(apiPatch).toHaveBeenCalledWith('/me', { currentPassword: 'old', newPassword: 'longenough' });
    expect(result.current).toMatchObject({ currentPw: '', newPw: '', confirmPw: '', message: 'Password updated', saving: false });
    act(() => { vi.advanceTimersByTime(PW_SAVE_MSG_DURATION_MS); });
    expect(result.current.message).toBe('');
  });

  it('surfaces the server error and keeps the fields', async () => {
    vi.mocked(apiPatch).mockRejectedValue(new Error('Current password is incorrect'));
    const { result } = renderHook(() => usePasswordChange());
    fill(result, 'wrong', 'longenough', 'longenough');
    await act(() => result.current.save());
    expect(result.current.error).toBe('Current password is incorrect');
    expect(result.current.currentPw).toBe('wrong');
    expect(result.current.saving).toBe(false);
  });

  it('falls back to a generic message for a non-Error rejection', async () => {
    vi.mocked(apiPatch).mockRejectedValue('nope');
    const { result } = renderHook(() => usePasswordChange());
    fill(result, 'old', 'longenough', 'longenough');
    await act(() => result.current.save());
    expect(result.current.error).toBe('Failed to update password');
  });
});
