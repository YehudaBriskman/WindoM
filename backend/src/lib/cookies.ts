import type { CookieSerializeOptions } from '@fastify/cookie';
import { config } from '../config.js';
import { COOKIE_MAX_AGE_SECONDS } from '../types/constants.js';

export function createRefreshCookieOptions(isProd: boolean): CookieSerializeOptions {
  const options: CookieSerializeOptions = {
    httpOnly: true,
    // Always true: refresh tokens must never travel over plaintext HTTP.
    secure: true,
    // Extension requests are cross-site in production; localhost is same-site.
    sameSite: isProd ? 'none' : 'lax',
    path: '/auth',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };

  if (options.sameSite === 'none' && options.secure !== true) {
    throw new Error('SameSite=None requires Secure');
  }

  return options;
}

export const refreshCookieOptions = createRefreshCookieOptions(config.isProd);
