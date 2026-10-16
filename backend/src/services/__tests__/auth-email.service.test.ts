import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../db/client.js', () => ({
  db: { select: vi.fn(), delete: vi.fn(), insert: vi.fn(), update: vi.fn() },
}));
vi.mock('../../lib/email.js', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendGoogleOnlyResetEmail: vi.fn(),
}));
vi.mock('../../lib/password.js', () => ({ hashPassword: vi.fn() }));
vi.mock('../session.service.js', () => ({ revokeAllUserSessions: vi.fn() }));

import { db } from '../../db/client.js';
import { sendGoogleOnlyResetEmail, sendPasswordResetEmail, sendVerificationEmail } from '../../lib/email.js';
import { hashPassword } from '../../lib/password.js';
import { resetPassword, sendPasswordReset, sendVerification, verifyEmail } from '../auth-email.service.js';
import { revokeAllUserSessions } from '../session.service.js';

const mockDb = db as unknown as Record<'select' | 'delete' | 'insert' | 'update', ReturnType<typeof vi.fn>>;

function selectReturns(rows: unknown[]): void {
  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(rows) }),
    }),
  });
}

function enableWrites(): { inserted: ReturnType<typeof vi.fn>; updated: ReturnType<typeof vi.fn> } {
  const inserted = vi.fn().mockResolvedValue(undefined);
  const updated = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  mockDb.delete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  mockDb.insert.mockReturnValue({ values: inserted });
  mockDb.update.mockReturnValue({ set: updated });
  return { inserted, updated };
}

beforeEach(() => vi.clearAllMocks());

describe('auth email tokens', () => {
  it('stores verification tokens only as hashes and emails the raw token', async () => {
    selectReturns([{ email: 'user@example.com', name: 'Alice', emailVerified: false }]);
    const { inserted } = enableWrites();

    await expect(sendVerification('user-1')).resolves.toBe('ok');
    const rawToken = vi.mocked(sendVerificationEmail).mock.calls[0]?.[2];
    const stored = inserted.mock.calls[0]?.[0] as { token: string; tokenHash: string; tokenLookup: string };

    expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.token).not.toBe(rawToken);
    expect(stored.tokenHash).toBe(stored.token);
    expect(stored.tokenLookup).not.toBe(rawToken);
    await expect(bcrypt.compare(rawToken, stored.tokenHash)).resolves.toBe(true);
  });

  it.each([
    [[], 'no_email'],
    [[{ email: null, name: 'Alice', emailVerified: false }], 'no_email'],
    [[{ email: 'user@example.com', name: 'Alice', emailVerified: true }], 'already_verified'],
  ] as const)('does not create a verification token for ineligible users', async (rows, result) => {
    selectReturns([...rows]);
    enableWrites();
    await expect(sendVerification('user-1')).resolves.toBe(result);
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('verifies the correct raw token, consumes it, and marks the user verified', async () => {
    const raw = 'correct-token';
    const hash = await bcrypt.hash(raw, 4);
    selectReturns([{ id: 'token-1', userId: 'user-1', tokenHash: hash }]);
    const { updated } = enableWrites();

    await expect(verifyEmail(raw)).resolves.toBe('ok');
    const consumedUpdate = updated.mock.calls[0]?.[0] as { usedAt?: unknown };
    expect(consumedUpdate.usedAt).toBeInstanceOf(Date);
    expect(updated).toHaveBeenNthCalledWith(2, { emailVerified: true });
  });

  it('rejects a wrong raw token even if a lookup row is returned', async () => {
    selectReturns([{ id: 'token-1', userId: 'user-1', tokenHash: await bcrypt.hash('correct', 4) }]);
    enableWrites();
    await expect(verifyEmail('wrong')).resolves.toBe('invalid');
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it.each(['expired', 'consumed'] as const)('rejects an %s token when no eligible row remains', async () => {
    selectReturns([]);
    enableWrites();
    await expect(verifyEmail('unusable')).resolves.toBe('invalid');
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('silently ignores password reset for an unknown email', async () => {
    selectReturns([]);
    enableWrites();
    await sendPasswordReset('missing@example.com');
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(sendGoogleOnlyResetEmail).not.toHaveBeenCalled();
  });

  it('sends guidance instead of a reset token for Google-only users', async () => {
    selectReturns([{ id: 'user-1', name: 'Alice', passwordHash: null }]);
    enableWrites();
    await sendPasswordReset('user@example.com');
    expect(sendGoogleOnlyResetEmail).toHaveBeenCalledWith('user@example.com', 'Alice');
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('resets a password and revokes every existing session', async () => {
    const raw = 'reset-token';
    selectReturns([{ id: 'token-1', userId: 'user-1', tokenHash: await bcrypt.hash(raw, 4) }]);
    const { updated } = enableWrites();
    vi.mocked(hashPassword).mockResolvedValue('new-password-hash');

    await expect(resetPassword(raw, 'new-password')).resolves.toBe('ok');
    expect(updated).toHaveBeenNthCalledWith(2, { passwordHash: 'new-password-hash' });
    expect(revokeAllUserSessions).toHaveBeenCalledWith('user-1');
  });

  it('does not change password or revoke sessions for an invalid reset token', async () => {
    selectReturns([]);
    enableWrites();
    await expect(resetPassword('invalid', 'new-password')).resolves.toBe('invalid');
    expect(hashPassword).not.toHaveBeenCalled();
    expect(revokeAllUserSessions).not.toHaveBeenCalled();
  });
});
