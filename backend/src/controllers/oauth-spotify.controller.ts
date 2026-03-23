import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';
import { SPOTIFY_AUTH_URL, SPOTIFY_SCOPES } from '../types/constants.js';
import * as oauthService from '../services/oauth.service.js';
import { isAllowedRedirectUri } from '../lib/request.js';

const exchangeSchema = z.object({
  code: z.string(),
  state: z.string(),
  redirectUri: z.string().url(),
});

async function handleSpotifyCodeExchange(
  userId: string,
  code: string,
  redirectUri: string,
  reply: FastifyReply,
): Promise<void> {
  const exchangeResult = await oauthService.exchangeSpotifyCode(code, redirectUri);

  if (!exchangeResult.ok) {
    const status = exchangeResult.error === 'USERINFO_FAILED' ? 500 : 400;
    void reply.status(status).send({ error: exchangeResult.error });
    return;
  }

  const { access_token, refresh_token, expires_in, scope, providerUserId } = exchangeResult.data;

  // Guard: if this Spotify account is already owned by a different WindoM user,
  // reject rather than silently re-linking. This prevents the case where a user
  // connects while their browser is logged into someone else's Spotify account.
  const conflict = await oauthService.checkOAuthConflict(userId, 'spotify', providerUserId);
  if (conflict === 'other_user') {
    void reply.status(409).send({
      error: 'SPOTIFY_ACCOUNT_TAKEN',
      message: 'This Spotify account is already linked to a different WindoM account. Please log into your own Spotify account in the browser and try again.',
    });
    return;
  }

  await oauthService.storeOAuthTokens(userId, 'spotify', {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
    scope,
    providerUserId,
  });

  void reply.send({ status: 'linked' });
}

export async function startSpotifyOAuthController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { redirectUri } = req.query as { redirectUri?: string };
  const effectiveUri = redirectUri ?? config.SPOTIFY_REDIRECT_URI ?? '';

  if (!effectiveUri) {
    void reply.status(500).send({ error: 'No redirect URI configured' });
    return;
  }

  const state = await oauthService.createOAuthState('spotify', 'link', req.user.sub);

  // Only force the account-chooser dialog when the user has no existing Spotify
  // connection. This prevents silent reuse of another browser user's cached
  // Spotify session. Users who already have a row (re-linking) skip the dialog.
  const hasExisting = await oauthService.hasOAuthAccount(req.user.sub, 'spotify');

  const params = new URLSearchParams({
    client_id: config.SPOTIFY_CLIENT_ID ?? '',
    redirect_uri: effectiveUri,
    response_type: 'code',
    scope: SPOTIFY_SCOPES,
    state,
    ...(hasExisting ? {} : { show_dialog: 'true' }),
  });

  void reply.send({ authUrl: `${SPOTIFY_AUTH_URL}?${params}` });
}

export async function exchangeSpotifyOAuthController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = exchangeSchema.safeParse(req.body);
  if (!parsed.success) {
    void reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0]?.message });
    return;
  }

  if (!isAllowedRedirectUri(parsed.data.redirectUri, config.SPOTIFY_REDIRECT_URI)) {
    void reply.status(400).send({ error: 'Redirect URI not allowed' });
    return;
  }

  const stateResult = await oauthService.verifyAndConsumeOAuthState(parsed.data.state, 'spotify', 'link');
  if (!stateResult.ok || !stateResult.data.userId) {
    void reply.status(400).send({ error: 'Invalid or expired state' });
    return;
  }

  await handleSpotifyCodeExchange(stateResult.data.userId, parsed.data.code, parsed.data.redirectUri, reply);
}

export async function callbackSpotifyOAuthController(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { code, state, error } = req.query as Record<string, string>;

  if (error || !code || !state) {
    void reply.status(400).send({ error: error ?? 'invalid_callback' });
    return;
  }

  if (!config.SPOTIFY_REDIRECT_URI) {
    void reply.status(500).send({ error: 'No redirect URI configured' });
    return;
  }

  const stateResult = await oauthService.verifyAndConsumeOAuthState(state, 'spotify', 'link');
  if (!stateResult.ok || !stateResult.data.userId) {
    void reply.status(400).send({ error: 'invalid_state' });
    return;
  }

  await handleSpotifyCodeExchange(stateResult.data.userId, code, config.SPOTIFY_REDIRECT_URI, reply);
}
