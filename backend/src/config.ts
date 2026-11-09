import 'dotenv/config';
import { z } from 'zod';

/**
 * Placeholders shipped in .env.example. Booting production on any of them would mean
 * signing tokens / encrypting OAuth tokens with a publicly known secret.
 */
const PLACEHOLDER_SECRETS = new Set([
  'change-me-access-secret-32-chars-minimum-x',
  'change-me-refresh-secret-32-chars-minimum',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
]);

/** Template markers such as `<your-google-client-id>` or `change-me...` left unedited. */
function looksLikePlaceholder(value: string): boolean {
  const v = value.trim().toLowerCase();
  return PLACEHOLDER_SECRETS.has(value.trim()) || v.startsWith('change-me') || /<[^>]*>/.test(v);
}

/** True when every byte of the key is identical (all zeros, all 0xFF, ...). */
function isUniformKey(base64: string): boolean {
  const raw = Buffer.from(base64, 'base64');
  return raw.length > 0 && raw.every((b) => b === raw[0]);
}

const PRODUCTION_SECRET_KEYS = [
  'JWT_ACCESS_SECRET',
  'REFRESH_TOKEN_SECRET',
  'TOKEN_ENC_KEY_BASE64',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SMTP_USER',
  'SMTP_PASS',
] as const;

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(8080),
    DATABASE_URL: z.string().url(),
    JWT_ACCESS_SECRET: z.string().min(32),
    REFRESH_TOKEN_SECRET: z.string().min(32),
    TOKEN_ENC_KEY_BASE64: z
      .string()
      .min(1)
      .refine(
        (val) => {
          try {
            return Buffer.from(val, 'base64').length === 32;
          } catch {
            return false;
          }
        },
        { message: 'TOKEN_ENC_KEY_BASE64 must decode to exactly 32 bytes (AES-256 key)' },
      ),
    CHROME_EXTENSION_ID: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REDIRECT_URI: z.string().url().optional(),
    GOOGLE_OAUTH_REDIRECT_URI: z.string().url().optional(),
    // The Gmail widget needs https://www.googleapis.com/auth/gmail.readonly, which
    // Google classes as a RESTRICTED scope. Publishing an app that requests it
    // requires a third-party CASA security assessment at $500-4,500 a year,
    // recurring - because the data passes through this server rather than staying
    // in the browser. Off by default so the consent screen asks only for Calendar
    // and sign-in, which verify for free.
    //
    // Turning this on without having completed CASA is what makes the listing
    // unpublishable, so it is deliberately an explicit opt-in rather than a
    // default that a deploy could inherit by accident. See issue #321.
    GMAIL_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    SPOTIFY_CLIENT_ID: z.string().optional(),
    SPOTIFY_CLIENT_SECRET: z.string().optional(),
    SPOTIFY_REDIRECT_URI: z.string().url().optional(),
    CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
    EXTENSION_REDIRECT_BASE: z
      .string()
      .url()
      .refine((value) => {
        try {
          const url = new URL(value);
          return url.protocol === 'https:' && url.hostname.endsWith('.chromiumapp.org');
        } catch {
          return false;
        }
      }, 'EXTENSION_REDIRECT_BASE must be an HTTPS chromiumapp.org URL')
      .optional(),
    // Host and port are configurable so the mail provider can be changed with a secret
    // update rather than a code change - which is also what makes switching back a
    // one-command rollback. Defaults reproduce the previous hardcoded Gmail behaviour
    // exactly, so setting neither variable changes nothing.
    SMTP_HOST: z.string().min(1).default('smtp.gmail.com'),
    SMTP_PORT: z.coerce.number().int().positive().max(65535).default(465),
    // Deliberately NOT .email(): several providers use a non-email SMTP username
    // (Resend uses the literal "resend", Brevo uses a numeric login), and requiring an
    // address here would reject valid credentials at config load.
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().optional(),
    FROM_EMAIL: z.string().email().default('noreply@windom.app'),
    APP_URL: z.string().url().default('https://windom-api.fly.dev'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production') {
      for (const key of PRODUCTION_SECRET_KEYS) {
        const value = env[key];
        if (value !== undefined && looksLikePlaceholder(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is still a placeholder from .env.example; set a real value in production`,
          });
        }
      }
      if (isUniformKey(env.TOKEN_ENC_KEY_BASE64)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['TOKEN_ENC_KEY_BASE64'],
          message: 'TOKEN_ENC_KEY_BASE64 is a uniform (e.g. all-zero) key; generate 32 random bytes',
        });
      }
    }
    if (env.NODE_ENV === 'production' && !env.EXTENSION_REDIRECT_BASE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['EXTENSION_REDIRECT_BASE'],
        message: 'EXTENSION_REDIRECT_BASE is required in production',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  corsAllowedOrigins: parsed.data.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim()),
  isProd: parsed.data.NODE_ENV === 'production',
} as const;
