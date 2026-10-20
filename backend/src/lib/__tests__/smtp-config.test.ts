import { describe, expect, it, vi, beforeEach } from 'vitest';
import { envSchema } from '../../config.js';

/**
 * Covers the SMTP transport configuration that lets the mail provider be changed with a
 * secret update instead of a deploy. The defaults matter as much as the overrides: the
 * migration off Google Workspace depends on being able to roll back by setting the
 * Gmail values again, so "no variables set" must keep behaving exactly as before.
 */

/** Minimum environment config.ts demands, so these tests exercise only the SMTP fields. */
function baseEnv(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    REFRESH_TOKEN_SECRET: 'b'.repeat(32),
    TOKEN_ENC_KEY_BASE64: Buffer.alloc(32, 7).toString('base64'),
    ...overrides,
  };
}

describe('SMTP environment schema', () => {
  it('defaults to the previously hardcoded Gmail host and port', () => {
    const parsed = envSchema.parse(baseEnv());
    expect(parsed.SMTP_HOST).toBe('smtp.gmail.com');
    expect(parsed.SMTP_PORT).toBe(465);
  });

  it('accepts an alternative provider', () => {
    const parsed = envSchema.parse(baseEnv({ SMTP_HOST: 'smtp.resend.com', SMTP_PORT: '465' }));
    expect(parsed.SMTP_HOST).toBe('smtp.resend.com');
    expect(parsed.SMTP_PORT).toBe(465);
  });

  it('coerces a string port to a number, since env vars are always strings', () => {
    expect(envSchema.parse(baseEnv({ SMTP_PORT: '587' })).SMTP_PORT).toBe(587);
  });

  // Resend authenticates with the literal username "resend" and Brevo with a numeric
  // login. Requiring an email address here would reject valid credentials at startup,
  // which is exactly the kind of failure that only shows up mid-migration.
  it.each(['resend', '901f3a', 'apikey', 'postmaster@windom.app'])(
    'accepts the non-email SMTP username %s',
    (user) => {
      expect(envSchema.parse(baseEnv({ SMTP_USER: user })).SMTP_USER).toBe(user);
    },
  );

  it('rejects a blank username rather than treating it as configured', () => {
    expect(() => envSchema.parse(baseEnv({ SMTP_USER: '' }))).toThrow();
  });

  it.each(['0', '-1', '70000', 'not-a-port'])('rejects the invalid port %s', (port) => {
    expect(() => envSchema.parse(baseEnv({ SMTP_PORT: port }))).toThrow();
  });

  it('rejects a blank host rather than silently falling back', () => {
    expect(() => envSchema.parse(baseEnv({ SMTP_HOST: '' }))).toThrow();
  });
});

describe('SMTP transport wiring', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  /** Imports email.ts against a stubbed config and returns the transport options used. */
  async function transportOptionsFor(
    smtp: { SMTP_HOST?: string; SMTP_PORT?: number; SMTP_USER?: string; SMTP_PASS?: string },
  ): Promise<Record<string, unknown> | undefined> {
    const createTransport = vi.fn().mockReturnValue({ sendMail: vi.fn() });
    vi.doMock('nodemailer', () => ({ default: { createTransport } }));
    vi.doMock('../../config.js', () => ({
      config: {
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: 465,
        FROM_EMAIL: 'noreply@windom.app',
        APP_URL: 'https://windom-api.fly.dev',
        ...smtp,
      },
    }));
    await import('../email.js');
    return createTransport.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
  }

  it('uses implicit TLS on port 465', async () => {
    const opts = await transportOptionsFor({ SMTP_USER: 'u', SMTP_PASS: 'p' });
    expect(opts).toMatchObject({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      requireTLS: false,
    });
  });

  // Getting this backwards breaks the handshake outright, and it is provider-dependent:
  // Brevo's relay is 587-only, so the wrong flag would surface only after switching.
  it('negotiates STARTTLS on port 587 and still demands encryption', async () => {
    const opts = await transportOptionsFor({
      SMTP_HOST: 'smtp-relay.brevo.com', SMTP_PORT: 587, SMTP_USER: 'u', SMTP_PASS: 'p',
    });
    expect(opts).toMatchObject({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      requireTLS: true,
    });
  });

  it('passes the configured credentials through unchanged', async () => {
    const opts = await transportOptionsFor({
      SMTP_HOST: 'smtp.resend.com', SMTP_USER: 'resend', SMTP_PASS: 're_secret',
    });
    expect(opts?.['auth']).toEqual({ user: 'resend', pass: 're_secret' });
  });

  // Dev convenience that must not regress: without credentials the app logs mail to the
  // console instead of constructing a transport that would fail on first send.
  it('builds no transport at all when credentials are absent', async () => {
    expect(await transportOptionsFor({})).toBeUndefined();
  });

  it('builds no transport when only a username is set', async () => {
    expect(await transportOptionsFor({ SMTP_USER: 'u' })).toBeUndefined();
  });
});
