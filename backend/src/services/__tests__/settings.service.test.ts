import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/client.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

import { db } from '../../db/client.js';
import { getSettings, getSettingsRecord } from '../settings.service.js';

const mockDb = db as unknown as { select: ReturnType<typeof vi.fn>; insert: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe('getSettings', () => {
  it('returns null when no settings row exists', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) });

    const result = await getSettings('user-1');
    expect(result).toBeNull();
  });

  it('returns data from the settings row', async () => {
    const data = { theme: 'dark', language: 'en' };
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ data, updatedAt: new Date(1_000) }]) }) }) });

    const result = await getSettings('user-1');
    expect(result).toEqual(data);
  });
});

// updateSettings runs a locked transaction; it is covered against a real
// database in routes/__tests__/e2e.test.ts (Journey 5b).
describe('getSettingsRecord', () => {
  it('returns the server revision as epoch ms beside the data', async () => {
    const data = { general: { userName: 'A' } };
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ data, updatedAt: new Date(1_700_000_000_123) }]) }) }) });

    expect(await getSettingsRecord('user-1')).toEqual({ data, updatedAt: 1_700_000_000_123 });
  });
});
