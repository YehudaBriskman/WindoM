import Fastify from 'fastify';
import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { config } from '../../config.js';
import { signAccessToken } from '../../lib/jwt.js';
import { authenticate } from '../authenticate.js';

const user = {
  sub: 'user-123',
  email: 'user@example.com',
  name: 'Test User',
  emailVerified: true,
};

async function request(authorization?: string) {
  const app = Fastify({ logger: false });
  app.get('/protected', { preHandler: authenticate }, (req) => req.user);
  const response = await app.inject({
    method: 'GET',
    url: '/protected',
    headers: authorization ? { authorization } : undefined,
  });
  await app.close();
  return response;
}

async function expiredToken(): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, emailVerified: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.sub)
    .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
    .setIssuer('windom-api')
    .setAudience('windom-extension')
    .sign(new TextEncoder().encode(config.JWT_ACCESS_SECRET));
}

describe('authenticate middleware', () => {
  it.each([undefined, '', 'Basic abc', 'bearer abc'])(
    'rejects a missing or unsupported Authorization header: %j',
    async (header) => {
      const response = await request(header);
      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({ message: 'Missing Bearer token' });
    },
  );

  it.each(['Bearer', 'Bearer ', 'Bearer not-a-jwt'])(
    'rejects an empty or malformed bearer token: %j',
    async (header) => {
      const response = await request(header);
      expect(response.statusCode).toBe(401);
    },
  );

  it('rejects a token signed with the wrong secret', async () => {
    const token = await new SignJWT({ email: user.email, name: user.name, emailVerified: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.sub)
      .setExpirationTime('15m')
      .setIssuer('windom-api')
      .setAudience('windom-extension')
      .sign(new TextEncoder().encode('wrong-secret-that-is-at-least-32-characters'));
    expect((await request(`Bearer ${token}`)).statusCode).toBe(401);
  });

  it('rejects an expired token', async () => {
    expect((await request(`Bearer ${await expiredToken()}`)).statusCode).toBe(401);
  });

  it('rejects a tampered payload with the original signature', async () => {
    const token = await signAccessToken(user);
    const [header, payload, signature] = token.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Record<string, unknown>;
    decoded['sub'] = 'attacker';
    const tampered = `${header}.${Buffer.from(JSON.stringify(decoded)).toString('base64url')}.${signature}`;
    expect((await request(`Bearer ${tampered}`)).statusCode).toBe(401);
  });

  it('sets req.user to the verified access-token fields', async () => {
    const response = await request(`Bearer ${await signAccessToken(user)}`);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(user);
  });
});
