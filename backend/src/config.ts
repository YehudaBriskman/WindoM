import 'dotenv/config';
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  TOKEN_ENC_KEY_BASE64: z.string().min(1).refine(
    (val) => { try { return Buffer.from(val, 'base64').length === 32; } catch { return false; } },
    { message: 'TOKEN_ENC_KEY_BASE64 must decode to exactly 32 bytes (AES-256 key)' },
  ),
  CHROME_EXTENSION_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().url().optional(),
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_REDIRECT_URI: z.string().url().optional(),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  EXTENSION_REDIRECT_BASE: z.string().url().refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname.endsWith('.chromiumapp.org');
    } catch {
      return false;
    }
  }, 'EXTENSION_REDIRECT_BASE must be an HTTPS chromiumapp.org URL').optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().default('noreply@windom.app'),
  APP_URL: z.string().url().default('https://windom-api.fly.dev'),
}).superRefine((env, ctx) => {
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
