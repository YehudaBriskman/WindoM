import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../config.js', async (importOriginal) => {
  const actual = await importOriginal<{ config: Record<string, unknown> }>();
  return {
    ...actual,
    config: {
      ...actual.config,
      GOOGLE_CLIENT_ID: 'google-client',
      GOOGLE_CLIENT_SECRET: 'google-secret',
      GOOGLE_REDIRECT_URI: 'https://login-extension.chromiumapp.org',
      GOOGLE_OAUTH_REDIRECT_URI: 'https://link-extension.chromiumapp.org',
      EXTENSION_REDIRECT_BASE: 'https://link-extension.chromiumapp.org',
      // This suite asserts the Gmail scope is requested; that only happens on a
      // server configured to offer it. The default-off case is in
      // gmail-disabled.test.ts.
      GMAIL_ENABLED: true,
    },
  };
});
vi.mock('../../services/oauth.service.js', () => ({
  createOAuthState: vi.fn(),
  verifyAndConsumeOAuthState: vi.fn(),
  exchangeGoogleCode: vi.fn(),
  storeOAuthTokens: vi.fn(),
}));
vi.mock('../../services/auth.service.js', () => ({ loginWithGoogle: vi.fn() }));

import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { signAccessToken } from '../../lib/jwt.js';
import * as authService from '../../services/auth.service.js';
import * as oauthService from '../../services/oauth.service.js';

let app: FastifyInstance;
let authorization: string;
const linkRedirect = 'https://link-extension.chromiumapp.org';
const loginRedirect = 'https://login-extension.chromiumapp.org';

beforeAll(async () => {
  app = await buildApp({ logger: false, skipRateLimit: true });
  authorization = `Bearer ${await signAccessToken({ sub: 'user-1', email: 'a@b.com', name: 'Alice', emailVerified: true })}`;
});
afterAll(async () => app.close());
beforeEach(() => vi.clearAllMocks());

describe('Google OAuth routes', () => {
  it.each(['/oauth/google/start', '/oauth/google/exchange'])(
    'requires authentication for POST %s',
    async (url) => expect((await app.inject({ method: 'POST', url })).statusCode).toBe(401),
  );

  it('starts a link flow with user-bound state, requested Gmail scopes, and PKCE', async () => {
    vi.mocked(oauthService.createOAuthState).mockResolvedValue('state-1');
    const response = await app.inject({
      method: 'POST',
      url: `/oauth/google/start?redirectUri=${encodeURIComponent(linkRedirect)}&features=gmail&codeChallenge=challenge`,
      headers: { authorization },
    });
    expect(response.statusCode).toBe(200);
    const url = new URL(response.json<{ authUrl: string }>().authUrl);
    expect(url.searchParams.get('state')).toBe('state-1');
    expect(url.searchParams.get('code_challenge')).toBe('challenge');
    expect(url.searchParams.get('scope')).toContain('gmail');
    expect(oauthService.createOAuthState).toHaveBeenCalledWith('google', 'link', 'user-1');
  });

  it('rejects an unapproved link redirect before creating state', async () => {
    const response = await app.inject({
      method: 'POST', url: '/oauth/google/start?redirectUri=https://attacker.example/callback', headers: { authorization },
    });
    expect(response.statusCode).toBe(400);
    expect(oauthService.createOAuthState).not.toHaveBeenCalled();
  });

  it.each([{}, { code: 'code' }, { code: 'code', state: 'state', redirectUri: 'invalid' }])(
    'rejects malformed link exchange body %#',
    async (payload) => expect((await app.inject({
      method: 'POST', url: '/oauth/google/exchange', headers: { authorization }, payload,
    })).statusCode).toBe(400),
  );

  it('rejects mismatched or expired link state without contacting Google', async () => {
    vi.mocked(oauthService.verifyAndConsumeOAuthState).mockResolvedValue({ ok: false, error: 'STATE_INVALID' });
    const response = await app.inject({
      method: 'POST', url: '/oauth/google/exchange', headers: { authorization },
      payload: { code: 'code', state: 'wrong', redirectUri: linkRedirect },
    });
    expect(response.statusCode).toBe(400);
    expect(oauthService.exchangeGoogleCode).not.toHaveBeenCalled();
  });

  it('exchanges a valid link code and stores provider tokens for the state owner', async () => {
    vi.mocked(oauthService.verifyAndConsumeOAuthState).mockResolvedValue({
      ok: true, data: { id: 's1', userId: 'owner-1', provider: 'google', purpose: 'link', clientId: null },
    });
    vi.mocked(oauthService.exchangeGoogleCode).mockResolvedValue({
      ok: true,
      data: {
        tokens: { access_token: 'access', refresh_token: 'refresh', expires_in: 3600, scope: 'calendar' },
        userInfo: { sub: 'google-user', email: 'user@example.com', name: 'Alice' },
      },
    });
    const response = await app.inject({
      method: 'POST', url: '/oauth/google/exchange', headers: { authorization },
      payload: { code: 'code', state: 'state', redirectUri: linkRedirect },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'linked' });
    expect(oauthService.storeOAuthTokens).toHaveBeenCalledWith('owner-1', 'google', expect.objectContaining({ providerUserId: 'google-user' }));
  });

  it('maps a Google token exchange failure without storing tokens', async () => {
    vi.mocked(oauthService.verifyAndConsumeOAuthState).mockResolvedValue({
      ok: true, data: { id: 's1', userId: 'owner-1', provider: 'google', purpose: 'link', clientId: null },
    });
    vi.mocked(oauthService.exchangeGoogleCode).mockResolvedValue({ ok: false, error: 'TOKEN_EXCHANGE_FAILED' });
    const response = await app.inject({
      method: 'POST', url: '/oauth/google/exchange', headers: { authorization },
      payload: { code: 'bad', state: 'state', redirectUri: linkRedirect },
    });
    expect(response.statusCode).toBe(400);
    expect(oauthService.storeOAuthTokens).not.toHaveBeenCalled();
  });

  it('starts the login flow without an existing WindoM session', async () => {
    vi.mocked(oauthService.createOAuthState).mockResolvedValue('login-state');
    const response = await app.inject({
      method: 'GET', url: `/auth/google/start?redirectUri=${encodeURIComponent(loginRedirect)}`,
    });
    expect(response.statusCode).toBe(200);
    expect(oauthService.createOAuthState).toHaveBeenCalledWith('google', 'login');
  });

  it('exchanges a valid login state and returns an HttpOnly refresh cookie', async () => {
    vi.mocked(oauthService.verifyAndConsumeOAuthState).mockResolvedValue({
      ok: true, data: { id: 's1', userId: null, provider: 'google', purpose: 'login', clientId: null },
    });
    vi.mocked(oauthService.exchangeGoogleCode).mockResolvedValue({
      ok: true,
      data: {
        tokens: { access_token: 'provider-access', expires_in: 3600, scope: 'openid' },
        userInfo: { sub: 'google-user', email: 'user@example.com', name: 'Alice' },
      },
    });
    vi.mocked(authService.loginWithGoogle).mockResolvedValue({ accessToken: 'windom-access', rawRefreshToken: 'raw-refresh' });
    const response = await app.inject({
      method: 'POST', url: '/auth/google/exchange',
      payload: { code: 'code', state: 'state', redirectUri: loginRedirect },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ accessToken: 'windom-access' });
    expect(response.headers['set-cookie']).toContain('HttpOnly');
  });

  it.each(['/auth/google/callback', '/auth/google/callback?error=access_denied', '/oauth/google/callback'])
    ('rejects invalid callback %s', async (url) => {
      expect((await app.inject({ method: 'GET', url })).statusCode).toBe(400);
    });
});
