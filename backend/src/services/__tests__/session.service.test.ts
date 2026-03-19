import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the DB client so no real Postgres connection is needed ───────────
vi.mock('../../db/client.js', () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    select: vi.fn(),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
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
} from '../session.service.js';
import { MAX_RENEWALS } from '../../types/constants.js';

const mockDb = db as unknown as {
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
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
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false);
    const session = { revokedAt: null, expiresAt: new Date(Date.now() + 99999), tokenHash: '$2b$hash', tokenLookup: 'abc' };
    const whereSpy = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([session]) });
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereSpy }) });

    const { findSessionByToken } = await import('../session.service.js');
    const result = await findSessionByToken('rawtoken');
    expect(result).toBeNull();
  });

  it('returns the session when valid', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true);
    const session = { revokedAt: null, expiresAt: new Date(Date.now() + 99999), tokenHash: '$2b$hash', tokenLookup: 'abc', id: 'sid' };
    const whereSpy = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([session]) });
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereSpy }) });

    const { findSessionByToken } = await import('../session.service.js');
    const result = await findSessionByToken('rawtoken');
    expect(result).toEqual(session);
  });
});
