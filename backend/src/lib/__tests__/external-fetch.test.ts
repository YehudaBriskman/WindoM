import { afterEach, describe, expect, it, vi } from 'vitest';
import { EXTERNAL_FETCH_TIMEOUT_MS, fetchWithTimeout } from '../external-fetch.js';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('fetchWithTimeout', () => {
  it('passes request input and options through with an active signal', async () => {
    const response = new Response('ok');
    const fetchMock = vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWithTimeout('https://provider.example/data', {
      method: 'POST',
      headers: { Authorization: 'Bearer token' },
      body: 'payload',
    })).resolves.toBe(response);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://provider.example/data',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: 'payload',
      }),
    );
    const passedInit = fetchMock.mock.calls[0]?.[1];
    expect(passedInit?.signal?.aborted).toBe(false);
  });

  it('aborts a stalled request at the default deadline', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const reason: unknown = init.signal?.reason;
          reject(reason instanceof Error ? reason : new Error('request aborted'));
        }, { once: true });
      })));

    const request = fetchWithTimeout('https://provider.example/stalled');
    const rejection = expect(request).rejects.toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(EXTERNAL_FETCH_TIMEOUT_MS);
    await rejection;
  });

  it('supports a shorter per-request timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const reason: unknown = init.signal?.reason;
          reject(reason instanceof Error ? reason : new Error('request aborted'));
        }, { once: true });
      })));

    const request = fetchWithTimeout('https://provider.example/stalled', {}, 25);
    const rejection = expect(request).rejects.toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(24);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await rejection;
  });

  it('forwards a caller abort and its reason', async () => {
    const caller = new AbortController();
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const reason: unknown = init.signal?.reason;
          reject(reason instanceof Error ? reason : new Error('request aborted'));
        }, { once: true });
      })));

    const request = fetchWithTimeout('https://provider.example/data', { signal: caller.signal });
    caller.abort(new Error('caller cancelled'));

    await expect(request).rejects.toThrow('caller cancelled');
  });

  it('forwards a signal that was already aborted', async () => {
    const caller = new AbortController();
    caller.abort(new Error('already cancelled'));
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.signal?.aborted).toBe(true);
      const reason: unknown = init?.signal?.reason;
      return Promise.reject(reason instanceof Error ? reason : new Error('request aborted'));
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWithTimeout('https://provider.example/data', { signal: caller.signal }))
      .rejects.toThrow('already cancelled');
  });

  it('clears its deadline after success and after fetch rejection', async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('ok'))
      .mockRejectedValueOnce(new Error('network failed'));
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithTimeout('https://provider.example/success');
    await expect(fetchWithTimeout('https://provider.example/failure')).rejects.toThrow('network failed');

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });
});
