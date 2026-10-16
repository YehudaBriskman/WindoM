import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the DB client so no real Postgres connection is needed ───────────
vi.mock('../../db/client.js', () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    select: vi.fn(),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
    transaction: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$hash'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

import { db } from '../../db/client.js';
import bcrypt from 'bcryptjs';
import {
  isRenewalCapReached,
  revokeSession,
  revokeAllUserSessions,
  rotateSessionAtomically,
} from '../session.service.js';
import { MAX_RENEWALS } from '../../types/constants.js';

const mockDb = db as unknown as {
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  transaction: ReturnType<typeof vi.fn>;
};

beforeEach(() => vi.clearAllMocks());

describe('isRenewalCapReached', () => {
  it('returns false when below the cap', () => {
    expect(isRenewalCapReached(MAX_RENEWALS - 1)).toBe(false);
  });

  it('returns true when exactly at the cap', () => {
    expect(isRenewalCapReached(MAX_RENEWALS)).toBe(true);
  });

  it('returns true when above the cap', () => {
    expect(isRenewalCapReached(MAX_RENEWALS + 1)).toBe(true);
  });
});

describe('revokeSession', () => {
  it('calls db.update with revokedAt', async () => {
    const setSpy = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    mockDb.update.mockReturnValue({ set: setSpy });

    await revokeSession('session-id-1');

    expect(mockDb.update).toHaveBeenCalledOnce();
    const setArg = setSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(setArg['revokedAt']).toBeInstanceOf(Date);
  });
});

describe('revokeAllUserSessions', () => {
  it('calls db.update for the given userId', async () => {
    const setSpy = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    mockDb.update.mockReturnValue({ set: setSpy });

    await revokeAllUserSessions('user-abc');

    expect(mockDb.update).toHaveBeenCalledOnce();
  });
});

describe('createSession', () => {
  it('inserts a session and returns a raw token string', async () => {
    const valuesSpy = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: valuesSpy });

    const { createSession } = await import('../session.service.js');
    const token = await createSession('user-1', { ip: '1.2.3.4', userAgent: 'test' });

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
    expect(valuesSpy).toHaveBeenCalledOnce();

    const inserted = valuesSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(inserted['userId']).toBe('user-1');
    expect(inserted['tokenLookup']).toBeDefined();
    expect(inserted['tokenHash']).toBe('$2b$hash');
  });
});

describe('findSessionByToken', () => {
  it('returns null when no session found in DB', async () => {
    const whereSpy = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    mockDb.select.mockReturnValue({ from: fromSpy });

    const { findSessionByToken } = await import('../session.service.js');
    const result = await findSessionByToken('rawtoken');
    expect(result).toBeNull();
  });

  it('returns null when session is revoked', async () => {
    const session = { revokedAt: new Date(), expiresAt: new Date(Date.now() + 99999), tokenHash: '$2b$hash', tokenLookup: 'abc' };
    const whereSpy = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([session]) });
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereSpy }) });

    const { findSessionByToken } = await import('../session.service.js');
    const result = await findSessionByToken('rawtoken');
    expect(result).toBeNull();
  });

  it('returns null when session is expired', async () => {
    const session = { revokedAt: null, expiresAt: new Date(Date.now() - 1000), tokenHash: '$2b$hash', tokenLookup: 'abc' };
    const whereSpy = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([session]) });
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereSpy }) });

    const { findSessionByToken } = await import('../session.service.js');
    const result = await findSessionByToken('rawtoken');
    expect(result).toBeNull();
  });

  it('returns null when bcrypt compare fails', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as unknown as string);
    const session = { revokedAt: null, expiresAt: new Date(Date.now() + 99999), tokenHash: '$2b$hash', tokenLookup: 'abc' };
    const whereSpy = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([session]) });
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereSpy }) });

    const { findSessionByToken } = await import('../session.service.js');
    const result = await findSessionByToken('rawtoken');
    expect(result).toBeNull();
  });

  it('returns the session when valid', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as unknown as string);
    const session = { revokedAt: null, expiresAt: new Date(Date.now() + 99999), tokenHash: '$2b$hash', tokenLookup: 'abc', id: 'sid' };
    const whereSpy = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([session]) });
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereSpy }) });

    const { findSessionByToken } = await import('../session.service.js');
    const result = await findSessionByToken('rawtoken');
    expect(result).toEqual(session);
  });
});

describe('rotateSessionAtomically', () => {
  function transactionWith(
    lockedSession: Record<string, unknown> | undefined,
    child: Record<string, unknown> | undefined = undefined,
  ) {
    const lockedLimit = vi.fn().mockResolvedValue(lockedSession ? [lockedSession] : []);
    const childLimit = vi.fn().mockResolvedValue(child ? [child] : []);
    const select = vi
      .fn()
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            for: vi.fn().mockReturnValue({ limit: lockedLimit }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ limit: childLimit }),
        }),
      });
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: updateWhere }),
    });
    const values = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn().mockReturnValue({ values });
    const tx = { select, update, insert };
    mockDb.transaction.mockImplementationOnce(
      ((callback: (client: typeof tx) => unknown): unknown => callback(tx)) as never,
    );
    return { tx, updateWhere, values };
  }

  const activeSession = {
    id: 'session-1',
    userId: 'user-1',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    renewalCount: 2,
  };

  it('revokes the old row and inserts its replacement in one transaction', async () => {
    const { tx, values } = transactionWith(activeSession);

    const result = await rotateSessionAtomically(
      'session-1',
      'user-1',
      { ip: '1.2.3.4', userAgent: 'test-agent' },
      3,
    );

    expect(result.ok).toBe(true);
    expect(mockDb.transaction).toHaveBeenCalledOnce();
    expect(tx.update).toHaveBeenCalledOnce();
    expect(tx.insert).toHaveBeenCalledOnce();
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      rotatedFromId: 'session-1',
      renewalCount: 3,
    }));
  });

  it('rejects a session that was revoked while waiting for the row lock', async () => {
    const { tx } = transactionWith({ ...activeSession, revokedAt: new Date() });

    const result = await rotateSessionAtomically(
      'session-1',
      'user-1',
      { ip: '1.2.3.4', userAgent: 'test-agent' },
      3,
    );

    expect(result).toEqual({ ok: false, error: 'SESSION_NOT_FOUND' });
    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it('revokes the session without inserting when the renewal cap is reached', async () => {
    const { tx } = transactionWith({ ...activeSession, renewalCount: MAX_RENEWALS });

    const result = await rotateSessionAtomically(
      'session-1',
      'user-1',
      { ip: '1.2.3.4', userAgent: 'test-agent' },
      MAX_RENEWALS + 1,
    );

    expect(result).toEqual({ ok: false, error: 'SESSION_LIMIT_REACHED' });
    expect(tx.update).toHaveBeenCalledOnce();
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it('revokes the token family when a rotated child already exists', async () => {
    const { tx } = transactionWith(activeSession, { id: 'child-session' });

    const result = await rotateSessionAtomically(
      'session-1',
      'user-1',
      { ip: '1.2.3.4', userAgent: 'test-agent' },
      3,
    );

    expect(result).toEqual({ ok: false, error: 'TOKEN_REUSE_DETECTED' });
    expect(tx.update).toHaveBeenCalledOnce();
    expect(tx.insert).not.toHaveBeenCalled();
  });
});
