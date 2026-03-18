import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { z } from 'zod';
import { db } from '../db/client.js';
import { oauthAccounts, oauthStates } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate } from '../middleware/authenticate.js';
import { encryptToken } from '../lib/crypto.js';
import { config } from '../config.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'openid',
  'email',
  'profile',
].join(' ');

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  error?: string;
}

async function storeGoogleTokens(userId: string, tokens: GoogleTokenResponse) {
  const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = (await infoRes.json()) as { sub: string };

  const accessEnc = await encryptToken(tokens.access_token);
  const refreshEnc = tokens.refresh_token ? await encryptToken(tokens.refresh_token) : null;
  const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const scopes = tokens.scope?.split(' ') ?? [];

  await db
    .insert(oauthAccounts)
    .values({
      userId,
      provider: 'google',
      providerUserId: userInfo.sub,
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
}

export async function oauthGoogleRoutes(app: FastifyInstance) {
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
    app.log.warn('Google OAuth not configured — /oauth/google routes disabled');
    return;
  }

  // ── Start ──────────────────────────────────────────────────────────────────
  // Accepts ?redirectUri= from the extension (chromiumapp.org URL).
  app.post('/start', { preHandler: authenticate }, async (req, reply) => {
    const { redirectUri } = req.query as { redirectUri?: string };
    const effectiveRedirectUri = redirectUri ?? config.GOOGLE_OAUTH_REDIRECT_URI ?? '';

    if (!effectiveRedirectUri) {
      return reply.status(500).send({ error: 'No redirect URI configured' });
    }

    const stateValue = crypto.randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(oauthStates).values({
      state: stateValue,
      userId: req.user.sub,
      provider: 'google',
      purpose: 'link',
      expiresAt,
    });

    const params = new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID!,
      redirect_uri: effectiveRedirectUri,
      response_type: 'code',
      scope: CALENDAR_SCOPES,
      state: stateValue,
      access_type: 'offline',
      prompt: 'consent',
    });

    return reply.send({ authUrl: `${GOOGLE_AUTH_URL}?${params}` });
  });

  // ── Exchange ───────────────────────────────────────────────────────────────
  // Extension sends back the code captured by launchWebAuthFlow.
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
      .where(and(eq(oauthStates.state, state), eq(oauthStates.provider, 'google'), eq(oauthStates.used, false)))
      .limit(1);

    if (!stateRow || new Date(stateRow.expiresAt) < new Date() || !stateRow.userId) {
      return reply.status(400).send({ error: 'Invalid or expired state' });
    }

    await db.update(oauthStates).set({ used: true }).where(eq(oauthStates.id, stateRow.id));

    let tokens: GoogleTokenResponse;
    try {
      const res = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: config.GOOGLE_CLIENT_ID!,
          client_secret: config.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      tokens = (await res.json()) as GoogleTokenResponse;
    } catch {
      return reply.status(500).send({ error: 'Token exchange failed' });
    }

    if (!tokens.access_token || tokens.error) {
      return reply.status(400).send({ error: 'Token exchange failed', detail: tokens.error });
    }

    try {
      await storeGoogleTokens(stateRow.userId, tokens);
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
      .where(and(eq(oauthStates.state, state), eq(oauthStates.provider, 'google'), eq(oauthStates.used, false)))
      .limit(1);

    if (!stateRow || new Date(stateRow.expiresAt) < new Date() || !stateRow.userId) {
      return reply.status(400).send({ error: 'invalid_state' });
    }

    await db.update(oauthStates).set({ used: true }).where(eq(oauthStates.id, stateRow.id));

    if (!config.GOOGLE_OAUTH_REDIRECT_URI) {
      return reply.status(500).send({ error: 'No redirect URI configured' });
    }

    let tokens: GoogleTokenResponse;
    try {
      const res = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: config.GOOGLE_CLIENT_ID!,
          client_secret: config.GOOGLE_CLIENT_SECRET!,
          redirect_uri: config.GOOGLE_OAUTH_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });
      tokens = (await res.json()) as GoogleTokenResponse;
    } catch {
      return reply.status(500).send({ error: 'token_exchange_failed' });
    }

    if (!tokens.access_token) {
      return reply.status(400).send({ error: 'token_exchange_failed' });
    }

    await storeGoogleTokens(stateRow.userId, tokens);
    return reply.send({ status: 'linked' });
  });
}
