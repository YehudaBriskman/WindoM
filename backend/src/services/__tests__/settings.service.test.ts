import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/client.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

import { db } from '../../db/client.js';
import { getSettings, saveSettings } from '../settings.service.js';

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
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ data }]) }) }) });

    const result = await getSettings('user-1');
    expect(result).toEqual(data);
  });
});

describe('saveSettings', () => {
  it('upserts and returns the data', async () => {
    const data = { theme: 'light' };
    const onConflictMock = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictMock }) });

    const result = await saveSettings('user-1', data);

    expect(result).toEqual(data);
    expect(onConflictMock).toHaveBeenCalledOnce();
  });
});
