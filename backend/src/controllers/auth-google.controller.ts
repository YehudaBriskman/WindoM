import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';
import { COOKIE_NAME, COOKIE_MAX_AGE_SECONDS, GOOGLE_AUTH_URL } from '../types/constants.js';
import { extractSessionMeta, isAllowedRedirectUri } from '../lib/request.js';
import * as authService from '../services/auth.service.js';
import * as oauthService from '../services/oauth.service.js';

const cookieOpts = {
  httpOnly: true,
  // Always true — modern browsers exempt localhost from the Secure requirement,
  // so local dev still works. Never send refresh tokens over plain HTTP.
  secure: true,
  // SameSite=None is required for cross-origin requests from the extension;
  // in dev use Lax (localhost is same-site for the backend).
  sameSite: config.isProd ? ('none' as const) : ('lax' as const),
  // Path is /auth (not /auth/refresh) so the cookie is also sent to /auth/logout,
  // allowing the logout handler to revoke the session server-side.
  path: '/auth',
  maxAge: COOKIE_MAX_AGE_SECONDS,
};

const exchangeSchema = z.object({
  code: z.string(),
  state: z.string(),
  redirectUri: z.string().url(),
  codeVerifier: z.string().optional(),
});

async function handleGoogleCodeExchange(
  code: string,
  redirectUri: string,
  req: FastifyRequest,
  reply: FastifyReply,
  codeVerifier?: string,
): Promise<void> {
  const exchangeResult = await oauthService.exchangeGoogleCode(
    code,
    redirectUri,
    config.GOOGLE_CLIENT_ID ?? '',
    config.GOOGLE_CLIENT_SECRET ?? '',
    codeVerifier,
  );

  if (!exchangeResult.ok) {
    const status = exchangeResult.error === 'USERINFO_FAILED' ? 500 : 400;
    const messages: Record<string, string> = {
      TOKEN_EXCHANGE_FAILED: 'Failed to complete sign-in with Google. Please try again.',
      USERINFO_FAILED: 'Could not retrieve your Google profile. Please try again.',
    };
    void reply.status(status).send({ error: exchangeResult.error, message: messages[exchangeResult.error] ?? exchangeResult.error });
    return;
  }

  const { userInfo } = exchangeResult.data;
  const tokens = await authService.loginWithGoogle(userInfo.email, userInfo.name, extractSessionMeta(req));

  reply.setCookie(COOKIE_NAME, tokens.rawRefreshToken, cookieOpts);
  void reply.send({ accessToken: tokens.accessToken, refreshToken: tokens.rawRefreshToken });
}

export async function startGoogleAuthController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { redirectUri, codeChallenge, codeChallengeMethod } = req.query as {
    redirectUri?: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
  };
  const effectiveUri = redirectUri ?? config.GOOGLE_REDIRECT_URI ?? '';

  if (!effectiveUri) {
    void reply.status(500).send({ error: 'No redirect URI configured' });
    return;
  }

  // Validate redirect URI before creating state (fail fast — avoids orphaned state rows)
  if (!isAllowedRedirectUri(effectiveUri, config.GOOGLE_REDIRECT_URI, config.EXTENSION_REDIRECT_BASE)) {
    void reply.status(400).send({ error: 'Redirect URI not allowed', message: 'This extension ID is not registered for Google sign-in. Contact support.' });
    return;
  }

  const state = await oauthService.createOAuthState('google', 'login');
  const params = new URLSearchParams({
    client_id: config.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: effectiveUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });
  if (codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', codeChallengeMethod ?? 'S256');
  }

  void reply.send({ authUrl: `${GOOGLE_AUTH_URL}?${params}` });
}

export async function exchangeGoogleAuthController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = exchangeSchema.safeParse(req.body);
  if (!parsed.success) {
    void reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0]?.message });
    return;
  }

  if (!isAllowedRedirectUri(parsed.data.redirectUri, config.GOOGLE_REDIRECT_URI, config.EXTENSION_REDIRECT_BASE)) {
    void reply.status(400).send({ error: 'Redirect URI not allowed' });
    return;
  }

  const stateResult = await oauthService.verifyAndConsumeOAuthState(parsed.data.state, 'google', 'login');
  if (!stateResult.ok) {
    void reply.status(400).send({ error: 'Invalid or expired state' });
    return;
  }

  await handleGoogleCodeExchange(parsed.data.code, parsed.data.redirectUri, req, reply, parsed.data.codeVerifier);
}

export async function callbackGoogleAuthController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { code, state, error } = req.query as Record<string, string>;

  if (error || !code || !state) {
    void reply.status(400).send({ error: error ?? 'invalid_callback' });
    return;
  }

  if (!config.GOOGLE_REDIRECT_URI) {
    void reply.status(500).send({ error: 'No redirect URI configured' });
    return;
  }

  const stateResult = await oauthService.verifyAndConsumeOAuthState(state, 'google', 'login');
  if (!stateResult.ok) {
    void reply.status(400).send({ error: 'invalid_state' });
    return;
  }

  await handleGoogleCodeExchange(code, config.GOOGLE_REDIRECT_URI, req, reply);
}
