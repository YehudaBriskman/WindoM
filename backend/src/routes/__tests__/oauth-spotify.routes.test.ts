import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../config.js', async (importOriginal) => {
  const actual = await importOriginal<{ config: Record<string, unknown> }>();
  return {
    ...actual,
    config: {
      ...actual.config,
      SPOTIFY_CLIENT_ID: 'shared-client',
      SPOTIFY_CLIENT_SECRET: 'shared-secret',
      SPOTIFY_REDIRECT_URI: 'https://shared.example/spotify/callback',
    },
  };
});
vi.mock('../../services/oauth.service.js', () => ({
  createOAuthState: vi.fn(),
  verifyAndConsumeOAuthState: vi.fn(),
  exchangeSpotifyCode: vi.fn(),
  storeOAuthTokens: vi.fn(),
  hasOAuthAccount: vi.fn(),
  checkOAuthConflict: vi.fn(),
}));

import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { signAccessToken } from '../../lib/jwt.js';
import * as oauthService from '../../services/oauth.service.js';

let app: FastifyInstance;
let authorization: string;
const pkceRedirect = 'https://user-extension.chromiumapp.org';

beforeAll(async () => {
  app = await buildApp({ logger: false, skipRateLimit: true });
  authorization = `Bearer ${await signAccessToken({ sub: 'user-1', email: 'a@b.com', name: 'Alice', emailVerified: true })}`;
});
afterAll(async () => app.close());
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(oauthService.hasOAuthAccount).mockResolvedValue(false);
  vi.mocked(oauthService.checkOAuthConflict).mockResolvedValue('none');
});

describe('Spotify OAuth routes', () => {
  it.each(['/oauth/spotify/start', '/oauth/spotify/exchange'])(
    'requires authentication for POST %s',
    async (url) => expect((await app.inject({ method: 'POST', url })).statusCode).toBe(401),
  );

  it('starts a BYOA PKCE flow with the supplied client and challenge', async () => {
    vi.mocked(oauthService.createOAuthState).mockResolvedValue('state-1');
    const response = await app.inject({
      method: 'POST', url: '/oauth/spotify/start', headers: { authorization },
      payload: {
        clientId: 'user-client', redirectUri: pkceRedirect,
        codeChallenge: 'challenge', codeChallengeMethod: 'S256',
      },
    });
    expect(response.statusCode).toBe(200);
    const url = new URL(response.json<{ authUrl: string }>().authUrl);
    expect(url.searchParams.get('client_id')).toBe('user-client');
    expect(url.searchParams.get('redirect_uri')).toBe(pkceRedirect);
    expect(url.searchParams.get('code_challenge')).toBe('challenge');
    expect(url.searchParams.get('show_dialog')).toBe('true');
    expect(oauthService.createOAuthState).toHaveBeenCalledWith('spotify', 'link', 'user-1', 'user-client');
  });

  it('omits forced account selection when Spotify is already linked', async () => {
    vi.mocked(oauthService.createOAuthState).mockResolvedValue('state-1');
    vi.mocked(oauthService.hasOAuthAccount).mockResolvedValue(true);
    const response = await app.inject({
      method: 'POST', url: '/oauth/spotify/start', headers: { authorization },
      payload: { clientId: 'user-client', redirectUri: pkceRedirect, codeChallenge: 'challenge' },
    });
    expect(new URL(response.json<{ authUrl: string }>().authUrl).searchParams.has('show_dialog')).toBe(false);
  });

  it('rejects an unapproved legacy redirect before creating state', async () => {
    const response = await app.inject({
      method: 'POST', url: '/oauth/spotify/start?redirectUri=https://attacker.example', headers: { authorization },
    });
    expect(response.statusCode).toBe(400);
    expect(oauthService.createOAuthState).not.toHaveBeenCalled();
  });

  it.each([{}, { code: 'code' }, { code: 'code', state: 'state', redirectUri: 'invalid' }])(
    'rejects malformed exchange body %#',
    async (payload) => expect((await app.inject({
      method: 'POST', url: '/oauth/spotify/exchange', headers: { authorization }, payload,
    })).statusCode).toBe(400),
  );

  it('rejects mismatched state without contacting Spotify', async () => {
    vi.mocked(oauthService.verifyAndConsumeOAuthState).mockResolvedValue({ ok: false, error: 'STATE_INVALID' });
    const response = await app.inject({
      method: 'POST', url: '/oauth/spotify/exchange', headers: { authorization },
      payload: { code: 'code', state: 'wrong', redirectUri: pkceRedirect, codeVerifier: 'verifier' },
    });
    expect(response.statusCode).toBe(400);
    expect(oauthService.exchangeSpotifyCode).not.toHaveBeenCalled();
  });

  it('exchanges PKCE code using the client bound to state and stores tokens', async () => {
    vi.mocked(oauthService.verifyAndConsumeOAuthState).mockResolvedValue({
      ok: true,
      data: { id: 's1', userId: 'owner-1', provider: 'spotify', purpose: 'link', clientId: 'user-client' },
    });
    vi.mocked(oauthService.exchangeSpotifyCode).mockResolvedValue({
      ok: true,
      data: {
        access_token: 'access', refresh_token: 'refresh', expires_in: 3600,
        scope: 'streaming', providerUserId: 'spotify-user',
      },
    });
    const response = await app.inject({
      method: 'POST', url: '/oauth/spotify/exchange', headers: { authorization },
      payload: { code: 'code', state: 'state', redirectUri: pkceRedirect, codeVerifier: 'verifier' },
    });
    expect(response.statusCode).toBe(200);
    expect(oauthService.exchangeSpotifyCode).toHaveBeenCalledWith('code', pkceRedirect, 'verifier', 'user-client');
    expect(oauthService.storeOAuthTokens).toHaveBeenCalledWith('owner-1', 'spotify', expect.objectContaining({
      providerUserId: 'spotify-user', providerClientId: 'user-client',
    }));
  });

  it('rejects a Spotify account already linked to another WindoM user', async () => {
    vi.mocked(oauthService.verifyAndConsumeOAuthState).mockResolvedValue({
      ok: true,
      data: { id: 's1', userId: 'owner-1', provider: 'spotify', purpose: 'link', clientId: 'user-client' },
    });
    vi.mocked(oauthService.exchangeSpotifyCode).mockResolvedValue({
      ok: true,
      data: { access_token: 'a', expires_in: 3600, scope: '', providerUserId: 'taken-user' },
    });
    vi.mocked(oauthService.checkOAuthConflict).mockResolvedValue('other_user');
    const response = await app.inject({
      method: 'POST', url: '/oauth/spotify/exchange', headers: { authorization },
      payload: { code: 'code', state: 'state', redirectUri: pkceRedirect, codeVerifier: 'verifier' },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: 'SPOTIFY_ACCOUNT_TAKEN' });
    expect(oauthService.storeOAuthTokens).not.toHaveBeenCalled();
  });

  it.each([
    ['TOKEN_EXCHANGE_FAILED', 400], ['USERINFO_FAILED', 500],
  ] as const)('maps provider %s to HTTP %s', async (error, statusCode) => {
    vi.mocked(oauthService.verifyAndConsumeOAuthState).mockResolvedValue({
      ok: true,
      data: { id: 's1', userId: 'owner-1', provider: 'spotify', purpose: 'link', clientId: 'user-client' },
    });
    vi.mocked(oauthService.exchangeSpotifyCode).mockResolvedValue({ ok: false, error });
    const response = await app.inject({
      method: 'POST', url: '/oauth/spotify/exchange', headers: { authorization },
      payload: { code: 'bad', state: 'state', redirectUri: pkceRedirect, codeVerifier: 'verifier' },
    });
    expect(response.statusCode).toBe(statusCode);
  });

  it.each(['/oauth/spotify/callback', '/oauth/spotify/callback?error=access_denied'])(
    'rejects invalid callback %s',
    async (url) => expect((await app.inject({ method: 'GET', url })).statusCode).toBe(400),
  );
});
