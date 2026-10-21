import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * The default-off case, which is the one that matters commercially.
 *
 * gmail.readonly is a RESTRICTED Google scope: an app that requests it in
 * production needs a third-party CASA assessment at $500-4,500 a year. These
 * assertions are what stand between a config mistake and an unpublishable
 * listing, so they deliberately check the outgoing consent URL rather than any
 * internal flag.
 *
 * The config mock supplies Google credentials, which a CI runner has no reason
 * to hold, and spreads everything else through untouched - GMAIL_ENABLED very
 * much included. Without the credentials the start route never reaches the
 * code that chooses scopes, and the suite would pass for the wrong reason.
 */

vi.mock('../../config.js', async (importOriginal) => {
  const actual = await importOriginal<{ config: Record<string, unknown> }>();
  return {
    ...actual,
    config: {
      ...actual.config,
      GOOGLE_CLIENT_ID: 'google-client',
      GOOGLE_CLIENT_SECRET: 'google-secret',
      GOOGLE_OAUTH_REDIRECT_URI: 'https://link-extension.chromiumapp.org',
      EXTENSION_REDIRECT_BASE: 'https://link-extension.chromiumapp.org',
    },
  };
});
vi.mock('../../services/gmail.service.js', () => ({ getGmailSummary: vi.fn() }));
vi.mock('../../services/oauth.service.js', () => ({
  createOAuthState: vi.fn(() => Promise.resolve('state-1')),
  verifyAndConsumeOAuthState: vi.fn(),
  exchangeGoogleCode: vi.fn(),
  storeOAuthTokens: vi.fn(),
}));

import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { config } from '../../config.js';
import { signAccessToken } from '../../lib/jwt.js';
import * as gmailService from '../../services/gmail.service.js';

let app: FastifyInstance;
let authorization: string;

beforeAll(async () => {
  app = await buildApp({ logger: false, skipRateLimit: true });
  authorization = `Bearer ${await signAccessToken({
    sub: 'user-1', email: 'user@example.com', name: 'Alice', emailVerified: true,
  })}`;
});
afterAll(async () => app.close());

describe('with the Gmail feature at its default', () => {
  it('is off, so no deploy inherits a restricted scope by accident', () => {
    expect(config.GMAIL_ENABLED).toBe(false);
  });

  it('never puts gmail.readonly in the consent URL, even when asked for it', async () => {
    const redirectUri = config.GOOGLE_OAUTH_REDIRECT_URI ?? '';
    const response = await app.inject({
      method: 'POST',
      url: `/oauth/google/start?redirectUri=${encodeURIComponent(redirectUri)}&features=gmail&codeChallenge=challenge`,
      headers: { authorization },
    });

    // A misconfigured redirect would fail before scopes are chosen and pass
    // this test for the wrong reason.
    expect(response.statusCode).toBe(200);
    const scope = new URL(response.json<{ authUrl: string }>().authUrl).searchParams.get('scope') ?? '';
    expect(scope).not.toContain('gmail');
    expect(scope).toContain('calendar.readonly');
  });

  it('refuses the summary endpoint without calling Google', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/gmail/summary',
      headers: { authorization },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json<{ message: string }>().message).toMatch(/turned off/i);
    expect(gmailService.getGmailSummary).not.toHaveBeenCalled();
  });
});
