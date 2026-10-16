import { describe, expect, it } from 'vitest';
import { envSchema } from '../../config.js';
import { assertRefreshCookieSecurity, createRefreshCookieOptions } from '../cookies.js';
import { buildApp, requestLogSerializer } from '../../app.js';
import { COOKIE_MAX_AGE_SECONDS } from '../../types/constants.js';

const validEnv = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/windom',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  REFRESH_TOKEN_SECRET: 'b'.repeat(32),
  TOKEN_ENC_KEY_BASE64: Buffer.alloc(32).toString('base64'),
};

describe('backend security baseline', () => {
  it('requires the extension redirect base in production', () => {
    const result = envSchema.safeParse({ ...validEnv, NODE_ENV: 'production' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.EXTENSION_REDIRECT_BASE).toContain(
        'EXTENSION_REDIRECT_BASE is required in production',
      );
    }
  });

  it.each(['development', 'test'] as const)(
    'allows %s environments without a production redirect base',
    (NODE_ENV) => {
      expect(envSchema.safeParse({ ...validEnv, NODE_ENV }).success).toBe(true);
    },
  );

  it('accepts an HTTPS chromiumapp.org redirect base in production', () => {
    expect(envSchema.safeParse({
      ...validEnv,
      NODE_ENV: 'production',
      EXTENSION_REDIRECT_BASE: 'https://abcdefghijklmnop.chromiumapp.org',
    }).success).toBe(true);
  });

  it.each([
    '',
    'not-a-url',
    'http://abcdefghijklmnop.chromiumapp.org',
    'https://chromiumapp.org.evil.example',
    'https://example.com',
  ])('rejects an unsafe production redirect base: %j', (EXTENSION_REDIRECT_BASE) => {
    expect(envSchema.safeParse({
      ...validEnv,
      NODE_ENV: 'production',
      EXTENSION_REDIRECT_BASE,
    }).success).toBe(false);
  });

  it('creates a complete secure production refresh-cookie policy', () => {
    expect(createRefreshCookieOptions(true)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/auth',
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });
  });

  it('uses SameSite=Lax while retaining Secure in development', () => {
    expect(createRefreshCookieOptions(false)).toMatchObject({ secure: true, sameSite: 'lax' });
  });

  it.each([false, undefined])(
    'rejects SameSite=None when Secure is %s',
    (secure) => {
      expect(() => assertRefreshCookieSecurity({ sameSite: 'none', secure }))
        .toThrow('SameSite=None requires Secure');
    },
  );

  it('allows secure SameSite=None and non-cross-site cookie policies', () => {
    expect(() => assertRefreshCookieSecurity({ sameSite: 'none', secure: true })).not.toThrow();
    expect(() => assertRefreshCookieSecurity({ sameSite: 'lax', secure: false })).not.toThrow();
  });

  it('includes the request correlation ID in structured request logs', () => {
    expect(requestLogSerializer({ id: 'req-42', method: 'GET', url: '/health', ip: '127.0.0.1' }))
      .toEqual({
        id: 'req-42',
        method: 'GET',
        url: '/health',
        remoteAddress: '127.0.0.1',
      });
  });

  it('sets the default request timeout', async () => {
    const app = await buildApp({ logger: false, skipRateLimit: true });
    expect(app.initialConfig.requestTimeout).toBe(30_000);
    await app.close();
  });

  it('allows an explicit request-timeout override for tests and specialized servers', async () => {
    const app = await buildApp({ logger: false, skipRateLimit: true, requestTimeout: 1_000 });
    expect(app.initialConfig.requestTimeout).toBe(1_000);
    await app.close();
  });

  it.each(['/health', '/definitely-missing'])(
    'sets restrictive browser permissions on %s responses',
    async (url) => {
      const app = await buildApp({ logger: false, skipRateLimit: true });
      const response = await app.inject({ method: 'GET', url });
      expect(response.headers['permissions-policy']).toBe(
        'geolocation=(), microphone=(), camera=()',
      );
      await app.close();
    },
  );
});
