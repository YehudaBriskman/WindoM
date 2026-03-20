import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';
import { GOOGLE_AUTH_URL, CALENDAR_SCOPES } from '../types/constants.js';
import * as oauthService from '../services/oauth.service.js';
import { isAllowedRedirectUri } from '../lib/request.js';

const exchangeSchema = z.object({
  code: z.string(),
  state: z.string(),
  redirectUri: z.string().url(),
});

async function handleGoogleOAuthExchange(
  userId: string,
  code: string,
  redirectUri: string,
  reply: FastifyReply,
): Promise<void> {
  const exchangeResult = await oauthService.exchangeGoogleCode(
    code,
    redirectUri,
    config.GOOGLE_CLIENT_ID ?? '',
    config.GOOGLE_CLIENT_SECRET ?? '',
  );

  if (!exchangeResult.ok) {
    const status = exchangeResult.error === 'USERINFO_FAILED' ? 500 : 400;
    void reply.status(status).send({ error: exchangeResult.error });
    return;
  }

  const { tokens, userInfo } = exchangeResult.data;
  await oauthService.storeOAuthTokens(userId, 'google', {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
    scope: tokens.scope,
    providerUserId: userInfo.sub,
  });

  void reply.send({ status: 'linked' });
}

export async function startGoogleOAuthController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { redirectUri } = req.query as { redirectUri?: string };
  const effectiveUri = redirectUri ?? config.GOOGLE_OAUTH_REDIRECT_URI ?? '';

  if (!effectiveUri) {
    void reply.status(500).send({ error: 'No redirect URI configured' });
    return;
  }

  const state = await oauthService.createOAuthState('google', 'link', req.user.sub);
  const params = new URLSearchParams({
    client_id: config.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: effectiveUri,
    response_type: 'code',
    scope: CALENDAR_SCOPES,
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  void reply.send({ authUrl: `${GOOGLE_AUTH_URL}?${params}` });
}

export async function exchangeGoogleOAuthController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = exchangeSchema.safeParse(req.body);
  if (!parsed.success) {
    void reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0]?.message });
    return;
  }

  if (!isAllowedRedirectUri(parsed.data.redirectUri, config.GOOGLE_OAUTH_REDIRECT_URI)) {
    void reply.status(400).send({ error: 'Redirect URI not allowed' });
    return;
  }

  const stateResult = await oauthService.verifyAndConsumeOAuthState(parsed.data.state, 'google', 'link');
  if (!stateResult.ok || !stateResult.data.userId) {
    void reply.status(400).send({ error: 'Invalid or expired state' });
    return;
  }

  await handleGoogleOAuthExchange(stateResult.data.userId, parsed.data.code, parsed.data.redirectUri, reply);
}

export async function callbackGoogleOAuthController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { code, state, error } = req.query as Record<string, string>;

  if (error || !code || !state) {
    void reply.status(400).send({ error: error ?? 'invalid_callback' });
    return;
  }

  if (!config.GOOGLE_OAUTH_REDIRECT_URI) {
    void reply.status(500).send({ error: 'No redirect URI configured' });
    return;
  }

  const stateResult = await oauthService.verifyAndConsumeOAuthState(state, 'google', 'link');
  if (!stateResult.ok || !stateResult.data.userId) {
    void reply.status(400).send({ error: 'invalid_state' });
    return;
  }

  await handleGoogleOAuthExchange(stateResult.data.userId, code, config.GOOGLE_OAUTH_REDIRECT_URI, reply);
}
