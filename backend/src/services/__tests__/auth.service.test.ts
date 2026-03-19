import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/client.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('../session.service.js', () => ({
  createSession: vi.fn().mockResolvedValue('raw-refresh-token'),
  findSessionByToken: vi.fn(),
  hasChildSession: vi.fn().mockResolvedValue(false),
  isRenewalCapReached: vi.fn().mockReturnValue(false),
  revokeSession: vi.fn().mockResolvedValue(undefined),
  revokeAllUserSessions: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/password.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('$hashed'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../lib/jwt.js', () => ({
  signAccessToken: vi.fn().mockResolvedValue('access-token-xyz'),
}));

import { db } from '../../db/client.js';
import * as sessionService from '../session.service.js';
import { verifyPassword } from '../../lib/password.js';
import { register, login, refresh, logout, loginWithGoogle } from '../auth.service.js';

const mockDb = db as unknown as { select: ReturnType<typeof vi.fn>; insert: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

// ── register ──────────────────────────────────────────────────────────────

describe('register', () => {
  it('returns EMAIL_TAKEN when email already exists', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ id: '1' }]) }) }) });

    const result = await register('a@b.com', 'password123', 'Alice', { ip: '1.1.1.1', userAgent: '' });

    expect(result).toEqual({ ok: false, error: 'EMAIL_TAKEN' });
  });

  it('creates user and returns token pair on success', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) });
    const returningMock = vi.fn().mockResolvedValue([{ id: 'u1', email: 'a@b.com', name: 'Alice' }]);
    mockDb.insert.mockReturnValue({ values: vi.fn().mockReturnValue({ returning: returningMock }) });

    const result = await register('a@b.com', 'password123', 'Alice', { ip: '1.1.1.1', userAgent: '' });

    expect(result).toEqual({ ok: true, data: { accessToken: 'access-token-xyz', rawRefreshToken: 'raw-refresh-token' } });
  });
});

// ── login ─────────────────────────────────────────────────────────────────

describe('login', () => {
  it('returns INVALID_CREDENTIALS when user not found', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) });
    vi.mocked(verifyPassword).mockResolvedValueOnce(false);

    const result = await login('x@x.com', 'pass', { ip: '1.1.1.1', userAgent: '' });
    expect(result).toEqual({ ok: false, error: 'INVALID_CREDENTIALS' });
  });

  it('returns INVALID_CREDENTIALS when password is wrong', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ id: 'u1', email: 'a@b.com', name: 'Alice', passwordHash: '$hashed' }]) }) }) });
    vi.mocked(verifyPassword).mockResolvedValueOnce(false);

    const result = await login('a@b.com', 'wrongpass', { ip: '1.1.1.1', userAgent: '' });
    expect(result).toEqual({ ok: false, error: 'INVALID_CREDENTIALS' });
  });

  it('returns token pair on success', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ id: 'u1', email: 'a@b.com', name: 'Alice', passwordHash: '$hashed' }]) }) }) });
    vi.mocked(verifyPassword).mockResolvedValueOnce(true);

    const result = await login('a@b.com', 'correct', { ip: '1.1.1.1', userAgent: '' });
    expect(result).toEqual({ ok: true, data: { accessToken: 'access-token-xyz', rawRefreshToken: 'raw-refresh-token' } });
  });
});

// ── refresh ───────────────────────────────────────────────────────────────

describe('refresh', () => {
  const validSession = { id: 's1', userId: 'u1', renewalCount: 0 };

  it('returns SESSION_NOT_FOUND when token is invalid', async () => {
    vi.mocked(sessionService.findSessionByToken).mockResolvedValueOnce(null);

    const result = await refresh('bad-token', { ip: '1.1.1.1', userAgent: '' });
    expect(result).toEqual({ ok: false, error: 'SESSION_NOT_FOUND' });
  });

  it('returns SESSION_LIMIT_REACHED when renewal cap exceeded', async () => {
    vi.mocked(sessionService.findSessionByToken).mockResolvedValueOnce(validSession as never);
    vi.mocked(sessionService.isRenewalCapReached).mockReturnValueOnce(true);

    const result = await refresh('token', { ip: '1.1.1.1', userAgent: '' });
    expect(result).toEqual({ ok: false, error: 'SESSION_LIMIT_REACHED' });
    expect(sessionService.revokeSession).toHaveBeenCalledWith('s1');
  });

  it('returns TOKEN_REUSE_DETECTED and revokes all sessions on reuse', async () => {
    vi.mocked(sessionService.findSessionByToken).mockResolvedValueOnce(validSession as never);
    vi.mocked(sessionService.isRenewalCapReached).mockReturnValueOnce(false);
    vi.mocked(sessionService.hasChildSession).mockResolvedValueOnce(true);

    const result = await refresh('token', { ip: '1.1.1.1', userAgent: '' });
    expect(result).toEqual({ ok: false, error: 'TOKEN_REUSE_DETECTED' });
    expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith('u1');
  });

  it('returns USER_NOT_FOUND when user is gone from DB', async () => {
    vi.mocked(sessionService.findSessionByToken).mockResolvedValueOnce(validSession as never);
    vi.mocked(sessionService.isRenewalCapReached).mockReturnValueOnce(false);
    vi.mocked(sessionService.hasChildSession).mockResolvedValueOnce(false);
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) });

    const result = await refresh('token', { ip: '1.1.1.1', userAgent: '' });
    expect(result).toEqual({ ok: false, error: 'USER_NOT_FOUND' });
  });

  it('rotates session and returns new token pair on success', async () => {
    vi.mocked(sessionService.findSessionByToken).mockResolvedValueOnce(validSession as never);
    vi.mocked(sessionService.isRenewalCapReached).mockReturnValueOnce(false);
    vi.mocked(sessionService.hasChildSession).mockResolvedValueOnce(false);
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ id: 'u1', email: 'a@b.com', name: 'Alice' }]) }) }) });

    const result = await refresh('token', { ip: '1.1.1.1', userAgent: '' });
    expect(result).toEqual({ ok: true, data: { accessToken: 'access-token-xyz', rawRefreshToken: 'raw-refresh-token' } });
    expect(sessionService.revokeSession).toHaveBeenCalledWith('s1');
    expect(sessionService.createSession).toHaveBeenCalledWith('u1', expect.anything(), 's1', 1);
  });
});

// ── logout ────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('revokes the session if found', async () => {
    vi.mocked(sessionService.findSessionByToken).mockResolvedValueOnce({ id: 's1' } as never);

    await logout('raw-token');
    expect(sessionService.revokeSession).toHaveBeenCalledWith('s1');
  });

  it('does nothing if session not found (best-effort)', async () => {
    vi.mocked(sessionService.findSessionByToken).mockResolvedValueOnce(null);

    await logout('invalid-token');
    expect(sessionService.revokeSession).not.toHaveBeenCalled();
  });
});

// ── loginWithGoogle ───────────────────────────────────────────────────────

describe('loginWithGoogle', () => {
  it('upserts user and returns token pair', async () => {
    const returningMock = vi.fn().mockResolvedValue([{ id: 'u1', email: 'g@g.com', name: 'Goog' }]);
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({ returning: returningMock }),
      }),
    });

    const result = await loginWithGoogle('g@g.com', 'Goog', { ip: '1.1.1.1', userAgent: '' });
    expect(result).toEqual({ accessToken: 'access-token-xyz', rawRefreshToken: 'raw-refresh-token' });
  });
});
