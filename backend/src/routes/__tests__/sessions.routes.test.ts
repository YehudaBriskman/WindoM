import Fastify, { type FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/session.service.js', () => ({
  listActiveSessions: vi.fn(),
  revokeOwnedSession: vi.fn(),
  revokeOtherSessions: vi.fn(),
}));

import { meRoutes } from '../me.js';
import { registerSwagger } from '../../plugins/swagger.js';
import { signAccessToken } from '../../lib/jwt.js';
import { listActiveSessions, revokeOtherSessions, revokeOwnedSession } from '../../services/session.service.js';

let app: FastifyInstance;
let authorization: string;
let currentAuthorization: string;
const sessionId = '11111111-1111-4111-8111-111111111111';
const currentId = '22222222-2222-4222-8222-222222222222';

beforeAll(async () => {
  app = Fastify({ logger: false });
  await registerSwagger(app, false);
  meRoutes(app);
  authorization = `Bearer ${await signAccessToken({
    sub: 'user-1',
    email: 'user@example.com',
    name: 'Alice',
    emailVerified: true,
  })}`;
  currentAuthorization = `Bearer ${await signAccessToken({
    sub: 'user-1',
    email: 'user@example.com',
    name: 'Alice',
    emailVerified: true,
    sid: currentId,
  })}`;
});
afterAll(async () => app.close());
beforeEach(() => vi.clearAllMocks());

describe('session management routes', () => {
  it.each([
    ['GET', '/me/sessions'],
    ['DELETE', `/me/sessions/${sessionId}`],
    ['DELETE', '/me/sessions?others=true'],
  ] as const)('rejects unauthenticated %s %s', async (method, url) => {
    expect((await app.inject({ method, url })).statusCode).toBe(401);
  });

  it('lists active sessions without caching sensitive metadata', async () => {
    const createdAt = new Date('2026-10-16T10:00:00Z');
    vi.mocked(listActiveSessions).mockResolvedValue([
      {
        id: sessionId,
        deviceId: 'abcdef012345',
        createdAt,
        lastUsedAt: createdAt,
        expiresAt: new Date('2026-10-23T10:00:00Z'),
        renewalCount: 1,
        device: 'Chrome · Windows',
        current: true,
      },
    ]);
    const response = await app.inject({
      method: 'GET',
      url: '/me/sessions',
      headers: { authorization: currentAuthorization },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    const { sessions } = response.json<{ sessions: Record<string, unknown>[] }>();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ device: 'Chrome · Windows', current: true });
    expect(listActiveSessions).toHaveBeenCalledWith('user-1', currentId);
  });

  it('serializes a null device label for sessions that predate labels', async () => {
    const createdAt = new Date('2026-10-16T10:00:00Z');
    vi.mocked(listActiveSessions).mockResolvedValue([
      {
        id: sessionId,
        deviceId: '',
        createdAt,
        lastUsedAt: createdAt,
        expiresAt: createdAt,
        renewalCount: 0,
        device: null,
        current: false,
      },
    ]);
    const response = await app.inject({ method: 'GET', url: '/me/sessions', headers: { authorization } });
    expect(response.json<{ sessions: Record<string, unknown>[] }>().sessions[0]).toMatchObject({
      device: null,
      current: false,
    });
    expect(listActiveSessions).toHaveBeenCalledWith('user-1', undefined);
  });

  it("revokes every other session, keeping the caller's", async () => {
    vi.mocked(revokeOtherSessions).mockResolvedValue(3);
    const response = await app.inject({
      method: 'DELETE',
      url: '/me/sessions?others=true',
      headers: { authorization: currentAuthorization },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ revoked: 3 });
    expect(revokeOtherSessions).toHaveBeenCalledWith('user-1', currentId);
  });

  it.each(['/me/sessions', '/me/sessions?others=false', '/me/sessions?others=1'])(
    'refuses a bulk revoke without the explicit others=true flag (%s)',
    async (url) => {
      const response = await app.inject({ method: 'DELETE', url, headers: { authorization: currentAuthorization } });
      expect(response.statusCode).toBe(400);
      expect(revokeOtherSessions).not.toHaveBeenCalled();
    },
  );

  it('refuses a bulk revoke from a token that does not name its session', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/me/sessions?others=true',
      headers: { authorization },
    });
    expect(response.statusCode).toBe(409);
    expect(revokeOtherSessions).not.toHaveBeenCalled();
  });

  it.each(['not-a-uuid', '11111111-1111-4111-8111', ''])('rejects malformed session ID %j', async (id) => {
    const response = await app.inject({ method: 'DELETE', url: `/me/sessions/${id}`, headers: { authorization } });
    expect([400, 404]).toContain(response.statusCode);
    expect(revokeOwnedSession).not.toHaveBeenCalled();
  });

  it('revokes an active session owned by the authenticated user', async () => {
    vi.mocked(revokeOwnedSession).mockResolvedValue(true);
    const response = await app.inject({
      method: 'DELETE',
      url: `/me/sessions/${sessionId}`,
      headers: { authorization },
    });
    expect(response.statusCode).toBe(204);
    expect(revokeOwnedSession).toHaveBeenCalledWith('user-1', sessionId);
  });

  it.each(['not owned', 'already revoked', 'expired', 'missing'])(
    'returns the same non-enumerating 404 for a %s session',
    async () => {
      vi.mocked(revokeOwnedSession).mockResolvedValue(false);
      const response = await app.inject({
        method: 'DELETE',
        url: `/me/sessions/${sessionId}`,
        headers: { authorization },
      });
      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({ message: 'Active session not found' });
    },
  );

  it('allows only one winner when concurrent revocations race', async () => {
    vi.mocked(revokeOwnedSession).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const [first, second] = await Promise.all([
      app.inject({ method: 'DELETE', url: `/me/sessions/${sessionId}`, headers: { authorization } }),
      app.inject({ method: 'DELETE', url: `/me/sessions/${sessionId}`, headers: { authorization } }),
    ]);
    expect([first.statusCode, second.statusCode].sort()).toEqual([204, 404]);
  });
});
