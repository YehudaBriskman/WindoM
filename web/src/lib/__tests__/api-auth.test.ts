import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAccessToken, isTokenExpired, parseJwtExpMs } from '../api';

function tokenWithPayload(payload: object): string {
  return `header.${btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}.signature`;
}

beforeEach(() => vi.useRealTimers());

describe('access-token expiry', () => {
  it('decodes URL-safe JWT expiration', () => {
    expect(parseJwtExpMs(tokenWithPayload({ exp: 123 }))).toBe(123_000);
  });

  it.each(['', 'not-a-jwt', 'a.invalid-json.c', tokenWithPayload({}), tokenWithPayload({ exp: '123' })])(
    'treats malformed or missing expiry as expired: %s',
    (token) => expect(isTokenExpired(token)).toBe(true),
  );

  it('applies the expiry buffer at its exact boundary', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const nowSeconds = Date.now() / 1000;
    expect(isTokenExpired(tokenWithPayload({ exp: nowSeconds + 30 }), 30_000)).toBe(false);
    expect(isTokenExpired(tokenWithPayload({ exp: nowSeconds + 30 - 0.001 }), 30_000)).toBe(true);
  });

  it('does not return an expired stored token to the first API request', async () => {
    const expired = tokenWithPayload({ exp: 1 });
    vi.mocked(chrome.storage.local.get).mockResolvedValue({ windom_access_token: expired } as never);
    await expect(getAccessToken()).resolves.toBeNull();
  });

  it('returns a sufficiently fresh stored token', async () => {
    const fresh = tokenWithPayload({ exp: Math.floor(Date.now() / 1000) + 300 });
    vi.mocked(chrome.storage.local.get).mockResolvedValue({ windom_access_token: fresh } as never);
    await expect(getAccessToken()).resolves.toBe(fresh);
  });
});
