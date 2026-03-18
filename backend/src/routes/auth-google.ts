import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { z } from 'zod';
import { db } from '../db/client.js';
import { users, oauthStates, refreshSessions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { signAccessToken } from '../lib/jwt.js';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

const REFRESH_TTL_DAYS = 30;
const COOKIE_NAME = 'windom_refresh';

const cookieOpts = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'none' as const,
  path: '/auth/refresh',
  maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60,
};

function getClientIp(req: import('fastify').FastifyRequest): string {
  return (
    (req.headers['fly-client-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    '0.0.0.0'
  );
}

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  error?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
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
  return res.json() as Promise<GoogleTokenResponse>;
}

async function fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json() as Promise<GoogleUserInfo>;
}

async function createUserSession(
  userInfo: GoogleUserInfo,
  req: import('fastify').FastifyRequest,
  reply: import('fastify').FastifyReply,
): Promise<string> {
  const [user] = await db
    .insert(users)
    .values({ email: userInfo.email, name: userInfo.name })
    .onConflictDoUpdate({ target: users.email, set: { name: userInfo.name } })
    .returning();

  const rawRefresh = crypto.randomBytes(48).toString('base64url');
  const tokenHash = await bcrypt.hash(rawRefresh, 10);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(refreshSessions).values({
    userId: user.id,
    tokenHash,
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'] ?? '',
    expiresAt,
  });

  const accessToken = await signAccessToken({ sub: user.id, email: user.email, name: user.name });
  reply.setCookie(COOKIE_NAME, rawRefresh, cookieOpts);
  return accessToken;
}

export async function authGoogleRoutes(app: FastifyInstance) {
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
    app.log.warn('Google OAuth not configured — /auth/google routes disabled');
    return;
  }

  // ── Start ──────────────────────────────────────────────────────────────────
  // Accepts optional ?redirectUri= from the extension (chromiumapp.org URL).
  // Falls back to the server-side GOOGLE_REDIRECT_URI env var.
  app.get('/start', {
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
    handler: async (req, reply) => {
      const { redirectUri } = req.query as { redirectUri?: string };
      const effectiveRedirectUri = redirectUri ?? config.GOOGLE_REDIRECT_URI ?? '';

      if (!effectiveRedirectUri) {
        return reply.status(500).send({ error: 'No redirect URI configured' });
      }

      const stateValue = crypto.randomBytes(24).toString('base64url');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await db.insert(oauthStates).values({
        state: stateValue,
        provider: 'google',
        purpose: 'login',
        expiresAt,
      });

      const params = new URLSearchParams({
        client_id: config.GOOGLE_CLIENT_ID!,
        redirect_uri: effectiveRedirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state: stateValue,
        access_type: 'offline',
        prompt: 'select_account',
      });

      return reply.send({ authUrl: `${GOOGLE_AUTH_URL}?${params}` });
    },
  });

  // ── Exchange ───────────────────────────────────────────────────────────────
  // Extension-native flow: extension captures ?code= directly via launchWebAuthFlow
  // and POSTs it here for server-side token exchange.
  app.post('/exchange', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
    handler: async (req, reply) => {
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

      // Validate state
      const [stateRow] = await db
        .select()
        .from(oauthStates)
        .where(and(eq(oauthStates.state, state), eq(oauthStates.provider, 'google'), eq(oauthStates.used, false)))
        .limit(1);

      if (!stateRow || new Date(stateRow.expiresAt) < new Date()) {
        return reply.status(400).send({ error: 'Invalid or expired state' });
      }

      await db.update(oauthStates).set({ used: true }).where(eq(oauthStates.id, stateRow.id));

      // Exchange code for Google tokens
      let googleTokens: GoogleTokenResponse;
      try {
        googleTokens = await exchangeCodeForTokens(code, redirectUri);
      } catch {
        return reply.status(500).send({ error: 'Token exchange failed' });
      }

      if (!googleTokens.access_token || googleTokens.error) {
        return reply.status(400).send({ error: 'Token exchange failed', detail: googleTokens.error });
      }

      // Get user info
      let userInfo: GoogleUserInfo;
      try {
        userInfo = await fetchUserInfo(googleTokens.access_token);
      } catch {
        return reply.status(500).send({ error: 'Failed to fetch user info' });
      }

      const accessToken = await createUserSession(userInfo, req, reply);
      return reply.send({ accessToken });
    },
  });

  // ── Server-side callback (kept for non-extension flows) ────────────────────
  app.get('/callback', {
    handler: async (req, reply) => {
      const { code, state, error } = req.query as Record<string, string>;

      if (error || !code || !state) {
        return reply.status(400).send({ error: error ?? 'invalid_callback' });
      }

      const [stateRow] = await db
        .select()
        .from(oauthStates)
        .where(and(eq(oauthStates.state, state), eq(oauthStates.provider, 'google'), eq(oauthStates.used, false)))
        .limit(1);

      if (!stateRow || new Date(stateRow.expiresAt) < new Date()) {
        return reply.status(400).send({ error: 'invalid_state' });
      }

      await db.update(oauthStates).set({ used: true }).where(eq(oauthStates.id, stateRow.id));

      if (!config.GOOGLE_REDIRECT_URI) {
        return reply.status(500).send({ error: 'No redirect URI configured' });
      }

      let googleTokens: GoogleTokenResponse;
      try {
        googleTokens = await exchangeCodeForTokens(code, config.GOOGLE_REDIRECT_URI);
      } catch {
        return reply.status(500).send({ error: 'token_exchange_failed' });
      }

      if (!googleTokens.access_token) {
        return reply.status(400).send({ error: 'token_exchange_failed' });
      }

      let userInfo: GoogleUserInfo;
      try {
        userInfo = await fetchUserInfo(googleTokens.access_token);
      } catch {
        return reply.status(500).send({ error: 'userinfo_failed' });
      }

      const accessToken = await createUserSession(userInfo, req, reply);
      return reply.send({ accessToken });
    },
  });
}
