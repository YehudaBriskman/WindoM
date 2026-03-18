import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { z } from 'zod';
import { db } from '../db/client.js';
import { oauthAccounts, oauthStates } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate } from '../middleware/authenticate.js';
import { encryptToken } from '../lib/crypto.js';
import { config } from '../config.js';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-top-read',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');

interface SpotifyTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  error?: string;
}

async function storeSpotifyTokens(userId: string, tokens: SpotifyTokenResponse, redirectUri: string) {
  const basicAuth = Buffer.from(`${config.SPOTIFY_CLIENT_ID}:${config.SPOTIFY_CLIENT_SECRET}`).toString('base64');

  const meRes = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const spotifyUser = (await meRes.json()) as { id: string };

  const accessEnc = await encryptToken(tokens.access_token);
  const refreshEnc = tokens.refresh_token ? await encryptToken(tokens.refresh_token) : null;
  const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const scopes = tokens.scope?.split(' ') ?? [];

  // suppress unused warning
  void basicAuth;

  await db
    .insert(oauthAccounts)
    .values({
      userId,
      provider: 'spotify',
      providerUserId: spotifyUser.id,
      accessTokenEnc: accessEnc,
      refreshTokenEnc: refreshEnc,
      tokenExpiresAt,
      scopes,
    })
    .onConflictDoUpdate({
      target: [oauthAccounts.provider, oauthAccounts.providerUserId],
      set: {
        accessTokenEnc: accessEnc,
        ...(refreshEnc ? { refreshTokenEnc: refreshEnc } : {}),
        tokenExpiresAt,
        scopes,
        updatedAt: new Date(),
      },
    });

  void redirectUri;
}

async function exchangeSpotifyCode(code: string, redirectUri: string): Promise<SpotifyTokenResponse> {
  const basicAuth = Buffer.from(`${config.SPOTIFY_CLIENT_ID}:${config.SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  return res.json() as Promise<SpotifyTokenResponse>;
}

export async function oauthSpotifyRoutes(app: FastifyInstance) {
  if (!config.SPOTIFY_CLIENT_ID || !config.SPOTIFY_CLIENT_SECRET) {
    app.log.warn('Spotify OAuth not configured — /oauth/spotify routes disabled');
    return;
  }

  // ── Start ──────────────────────────────────────────────────────────────────
  // Accepts ?redirectUri= from the extension (chromiumapp.org URL).
  app.post('/start', { preHandler: authenticate }, async (req, reply) => {
    const { redirectUri } = req.query as { redirectUri?: string };
    const effectiveRedirectUri = redirectUri ?? config.SPOTIFY_REDIRECT_URI ?? '';

    if (!effectiveRedirectUri) {
      return reply.status(500).send({ error: 'No redirect URI configured' });
    }

    const stateValue = crypto.randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(oauthStates).values({
      state: stateValue,
      userId: req.user.sub,
      provider: 'spotify',
      purpose: 'link',
      expiresAt,
    });

    const params = new URLSearchParams({
      client_id: config.SPOTIFY_CLIENT_ID!,
      redirect_uri: effectiveRedirectUri,
      response_type: 'code',
      scope: SPOTIFY_SCOPES,
      state: stateValue,
    });

    return reply.send({ authUrl: `${SPOTIFY_AUTH_URL}?${params}` });
  });

  // ── Exchange ───────────────────────────────────────────────────────────────
  app.post('/exchange', { preHandler: authenticate }, async (req, reply) => {
    const schema = z.object({
      code: z.string(),
      state: z.string(),
      redirectUri: z.string().url(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0]?.message });
    }

    const { code, state, redirectUri } = parsed.data;

    const [stateRow] = await db
      .select()
      .from(oauthStates)
      .where(and(eq(oauthStates.state, state), eq(oauthStates.provider, 'spotify'), eq(oauthStates.used, false)))
      .limit(1);

    if (!stateRow || new Date(stateRow.expiresAt) < new Date() || !stateRow.userId) {
      return reply.status(400).send({ error: 'Invalid or expired state' });
    }

    await db.update(oauthStates).set({ used: true }).where(eq(oauthStates.id, stateRow.id));

    let tokens: SpotifyTokenResponse;
    try {
      tokens = await exchangeSpotifyCode(code, redirectUri);
    } catch {
      return reply.status(500).send({ error: 'Token exchange failed' });
    }

    if (!tokens.access_token || tokens.error) {
      return reply.status(400).send({ error: 'Token exchange failed', detail: tokens.error });
    }

    try {
      await storeSpotifyTokens(stateRow.userId, tokens, redirectUri);
    } catch {
      return reply.status(500).send({ error: 'Failed to store tokens' });
    }

    return reply.send({ status: 'linked' });
  });

  // ── Server-side callback (kept for non-extension flows) ────────────────────
  app.get('/callback', async (req, reply) => {
    const { code, state, error } = req.query as Record<string, string>;

    if (error || !code || !state) {
      return reply.status(400).send({ error: error ?? 'invalid_callback' });
    }

    const [stateRow] = await db
      .select()
      .from(oauthStates)
      .where(and(eq(oauthStates.state, state), eq(oauthStates.provider, 'spotify'), eq(oauthStates.used, false)))
      .limit(1);

    if (!stateRow || new Date(stateRow.expiresAt) < new Date() || !stateRow.userId) {
      return reply.status(400).send({ error: 'invalid_state' });
    }

    await db.update(oauthStates).set({ used: true }).where(eq(oauthStates.id, stateRow.id));

    if (!config.SPOTIFY_REDIRECT_URI) {
      return reply.status(500).send({ error: 'No redirect URI configured' });
    }

    let tokens: SpotifyTokenResponse;
    try {
      tokens = await exchangeSpotifyCode(code, config.SPOTIFY_REDIRECT_URI);
    } catch {
      return reply.status(500).send({ error: 'token_exchange_failed' });
    }

    if (!tokens.access_token) {
      return reply.status(400).send({ error: 'token_exchange_failed' });
    }

    await storeSpotifyTokens(stateRow.userId, tokens, config.SPOTIFY_REDIRECT_URI);
    return reply.send({ status: 'linked' });
  });
}
