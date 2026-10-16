import { describe, expect, it } from 'vitest';
import { envSchema } from '../../config.js';
import { createRefreshCookieOptions } from '../cookies.js';
import { buildApp, requestLogSerializer } from '../../app.js';

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

  it('allows test environments without a production redirect base', () => {
    expect(envSchema.safeParse({ ...validEnv, NODE_ENV: 'test' }).success).toBe(true);
  });

  it('always secures SameSite=None refresh cookies', () => {
    expect(createRefreshCookieOptions(true)).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
  });

  it('includes the request correlation ID in structured request logs', () => {
    expect(requestLogSerializer({ id: 'req-42', method: 'GET', url: '/health', ip: '127.0.0.1' }))
      .toMatchObject({ id: 'req-42', method: 'GET', url: '/health' });
  });

  it('sets a request timeout and restrictive browser permissions', async () => {
    const app = await buildApp({ logger: false, skipRateLimit: true });
    expect(app.initialConfig.requestTimeout).toBe(30_000);

    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.headers['permissions-policy']).toBe(
      'geolocation=(), microphone=(), camera=()',
    );
    await app.close();
  });
});
