import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../lib/api', () => ({ apiPost: vi.fn() }));

import { useAuth } from '../../contexts/AuthContext';
import { apiPost } from '../../lib/api';
import { RESEND_COOLDOWN_MS, useEmailVerificationResend } from '../useEmailVerificationResend';
import { useSignOut } from '../useSignOut';

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.useRealTimers());

describe('useEmailVerificationResend', () => {
  it('posts the resend request and holds "sent" for the cooldown', async () => {
    vi.useFakeTimers();
    vi.mocked(apiPost).mockResolvedValue({});
    const { result } = renderHook(() => useEmailVerificationResend());
    await act(() => result.current.resend());

    expect(apiPost).toHaveBeenCalledWith('/auth/resend-verification', {});
    expect(result.current).toMatchObject({ sent: true, sending: false });
    act(() => {
      vi.advanceTimersByTime(RESEND_COOLDOWN_MS - 1);
    });
    expect(result.current.sent).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.sent).toBe(false);
  });

  it('swallows a failure so the user can retry', async () => {
    vi.mocked(apiPost).mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useEmailVerificationResend());
    await act(() => result.current.resend());
    expect(result.current).toMatchObject({ sent: false, sending: false });
  });
});

describe('useSignOut', () => {
  it('reports signingOut while logout is in flight', async () => {
    let finish!: () => void;
    const logout = vi.fn(
      () =>
        new Promise<void>((r) => {
          finish = r;
        }),
    );
    vi.mocked(useAuth).mockImplementation(() => ({ logout }) as unknown as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => useSignOut());

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.signOut();
    });
    expect(result.current.signingOut).toBe(true);
    await act(async () => {
      finish();
      await pending;
    });
    expect(logout).toHaveBeenCalledTimes(1);
    expect(result.current.signingOut).toBe(false);
  });
});
