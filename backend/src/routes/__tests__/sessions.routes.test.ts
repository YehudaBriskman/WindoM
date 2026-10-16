import Fastify, { type FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/session.service.js', () => ({
  listActiveSessions: vi.fn(),
  revokeOwnedSession: vi.fn(),
}));

import { meRoutes } from '../me.js';
import { registerSwagger } from '../../plugins/swagger.js';
import { signAccessToken } from '../../lib/jwt.js';
import { listActiveSessions, revokeOwnedSession } from '../../services/session.service.js';

let app: FastifyInstance;
let authorization: string;
const sessionId = '11111111-1111-4111-8111-111111111111';

beforeAll(async () => {
  app = Fastify({ logger: false });
  await registerSwagger(app, false);
  meRoutes(app);
  authorization = `Bearer ${await signAccessToken({
    sub: 'user-1', email: 'user@example.com', name: 'Alice', emailVerified: true,
  })}`;
});
afterAll(async () => app.close());
beforeEach(() => vi.clearAllMocks());

describe('session management routes', () => {
  it.each([
    ['GET', '/me/sessions'],
    ['DELETE', `/me/sessions/${sessionId}`],
  ] as const)('rejects unauthenticated %s %s', async (method, url) => {
    expect((await app.inject({ method, url })).statusCode).toBe(401);
  });

  it('lists active sessions without caching sensitive metadata', async () => {
    const createdAt = new Date('2026-10-16T10:00:00Z');
    vi.mocked(listActiveSessions).mockResolvedValue([{
      id: sessionId,
      deviceId: 'abcdef012345',
      createdAt,
      lastUsedAt: createdAt,
      expiresAt: new Date('2026-10-23T10:00:00Z'),
      renewalCount: 1,
    }]);
    const response = await app.inject({ method: 'GET', url: '/me/sessions', headers: { authorization } });
    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.json<{ sessions: unknown[] }>().sessions).toHaveLength(1);
    expect(listActiveSessions).toHaveBeenCalledWith('user-1');
  });

  it.each(['not-a-uuid', '11111111-1111-4111-8111', ''])(
    'rejects malformed session ID %j',
    async (id) => {
      const response = await app.inject({ method: 'DELETE', url: `/me/sessions/${id}`, headers: { authorization } });
      expect([400, 404]).toContain(response.statusCode);
      expect(revokeOwnedSession).not.toHaveBeenCalled();
    },
  );

  it('revokes an active session owned by the authenticated user', async () => {
    vi.mocked(revokeOwnedSession).mockResolvedValue(true);
    const response = await app.inject({ method: 'DELETE', url: `/me/sessions/${sessionId}`, headers: { authorization } });
    expect(response.statusCode).toBe(204);
    expect(revokeOwnedSession).toHaveBeenCalledWith('user-1', sessionId);
  });

  it.each(['not owned', 'already revoked', 'expired', 'missing'])(
    'returns the same non-enumerating 404 for a %s session',
    async () => {
      vi.mocked(revokeOwnedSession).mockResolvedValue(false);
      const response = await app.inject({ method: 'DELETE', url: `/me/sessions/${sessionId}`, headers: { authorization } });
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
