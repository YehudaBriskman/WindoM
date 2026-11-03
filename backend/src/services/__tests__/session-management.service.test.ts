import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../db/client.js', () => ({ db: { select: vi.fn(), update: vi.fn() } }));

import { db } from '../../db/client.js';
import { listActiveSessions, revokeOtherSessions, revokeOwnedSession } from '../session.service.js';

const mockDb = db as unknown as { select: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe('session management service', () => {
  it('returns privacy-preserving active-session metadata', async () => {
    const createdAt = new Date('2026-10-16T10:00:00Z');
    const expiresAt = new Date('2026-10-23T10:00:00Z');
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          {
            id: '11111111-1111-4111-8111-111111111111',
            userAgent: 'abcdef0123456789raw-hash-remainder',
            deviceLabel: 'Firefox · Linux',
            createdAt,
            expiresAt,
            renewalCount: 3,
          },
        ]),
      }),
    });

    await expect(listActiveSessions('user-1')).resolves.toEqual([
      {
        id: '11111111-1111-4111-8111-111111111111',
        deviceId: 'abcdef012345',
        createdAt,
        lastUsedAt: createdAt,
        expiresAt,
        renewalCount: 3,
        device: 'Firefox · Linux',
        current: false,
      },
    ]);
  });

  it('marks the calling session current and orders it first, then by recency', async () => {
    const row = (id: string, at: string) => ({
      id,
      userAgent: 'x'.repeat(64),
      deviceLabel: null,
      createdAt: new Date(at),
      expiresAt: new Date('2026-12-01T00:00:00Z'),
      renewalCount: 0,
    });
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi
          .fn()
          .mockResolvedValue([
            row('old', '2026-10-01T00:00:00Z'),
            row('mine', '2026-10-02T00:00:00Z'),
            row('newest', '2026-10-03T00:00:00Z'),
          ]),
      }),
    });
    const sessions = await listActiveSessions('user-1', 'mine');
    expect(sessions.map((s) => [s.id, s.current])).toEqual([
      ['mine', true],
      ['newest', false],
      ['old', false],
    ]);
    expect(sessions[0]?.device).toBeNull();
  });

  it('counts the sessions revoked by revokeOtherSessions', async () => {
    const returning = vi.fn().mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning }) }),
    });
    await expect(revokeOtherSessions('user-1', 'mine')).resolves.toBe(2);
  });

  it('returns an empty list when no active sessions remain', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) });
    await expect(listActiveSessions('user-1')).resolves.toEqual([]);
  });

  it('reports successful owned-session revocation', async () => {
    const returning = vi.fn().mockResolvedValue([{ id: 'session-1' }]);
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning }) }),
    });
    await expect(revokeOwnedSession('user-1', 'session-1')).resolves.toBe(true);
  });

  it.each(['not-owned', 'already-revoked', 'expired', 'missing'])(
    'does not report revocation for a %s session',
    async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
        }),
      });
      await expect(revokeOwnedSession('user-1', 'session-1')).resolves.toBe(false);
    },
  );
});
