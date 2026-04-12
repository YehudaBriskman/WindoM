import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/client.js', () => ({
  db: { select: vi.fn() },
}));

import { db } from '../../db/client.js';
import { getUserById } from '../me.service.js';

const mockDb = db as unknown as { select: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe('getUserById', () => {
  it('returns null when user not found', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) });

    const result = await getUserById('non-existent');
    expect(result).toBeNull();
  });

  it('returns the user record when found', async () => {
    const user = { id: 'u1', email: 'a@b.com', name: 'Alice', createdAt: new Date(), passwordHash: 'hash' };
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([user]) }) }) });

    const result = await getUserById('u1');
    expect(result).toEqual({ id: 'u1', email: 'a@b.com', name: 'Alice', createdAt: user.createdAt, hasPassword: true });
  });
});
