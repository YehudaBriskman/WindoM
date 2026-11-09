import { describe, expect, it } from 'vitest';
import { envSchema } from '../../config.js';

function prodEnv(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    REFRESH_TOKEN_SECRET: 'b'.repeat(32),
    TOKEN_ENC_KEY_BASE64: Buffer.from('0123456789abcdef0123456789ABCDEF').toString('base64'),
    EXTENSION_REDIRECT_BASE: 'https://abc.chromiumapp.org',
    ...overrides,
  };
}

describe('production placeholder-secret guard', () => {
  it('accepts real secrets in production', () => {
    expect(envSchema.safeParse(prodEnv()).success).toBe(true);
  });

  it.each([
    ['JWT_ACCESS_SECRET', 'change-me-access-secret-32-chars-minimum-x'],
    ['REFRESH_TOKEN_SECRET', 'change-me-refresh-secret-32-chars-minimum'],
    ['TOKEN_ENC_KEY_BASE64', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='],
    ['TOKEN_ENC_KEY_BASE64', Buffer.alloc(32, 0xff).toString('base64')],
    ['GOOGLE_CLIENT_SECRET', '<your-google-client-secret>'],
    ['SMTP_PASS', '<smtp-password-or-api-key>'],
  ])('rejects %s=%s in production', (key, value) => {
    const result = envSchema.safeParse(prodEnv({ [key]: value }));
    expect(result.success).toBe(false);
  });

  it('still accepts the placeholders outside production', () => {
    const env = prodEnv({
      NODE_ENV: 'development',
      JWT_ACCESS_SECRET: 'change-me-access-secret-32-chars-minimum-x',
      TOKEN_ENC_KEY_BASE64: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    });
    expect(envSchema.safeParse(env).success).toBe(true);
  });
});
