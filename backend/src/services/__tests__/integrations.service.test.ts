import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/client.js', () => ({
  db: {
    select: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from '../../db/client.js';
import { getIntegrations, unlinkProvider } from '../integrations.service.js';

const mockDb = db as unknown as { select: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe('getIntegrations', () => {
  it('returns both disconnected when no accounts exist', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) });

    const result = await getIntegrations('user-1');
    expect(result).toEqual({
      google: { connected: false, scopes: [] },
      spotify: { connected: false, scopes: [] },
    });
  });

  it('marks google as connected when account present', async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ provider: 'google', scopes: ['calendar.readonly'] }]),
      }),
    });

    const result = await getIntegrations('user-1');
    expect(result.google.connected).toBe(true);
    expect(result.google.scopes).toEqual(['calendar.readonly']);
    expect(result.spotify.connected).toBe(false);
  });

  it('marks both connected when both accounts present', async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { provider: 'google', scopes: [] },
          { provider: 'spotify', scopes: ['user-read-currently-playing'] },
        ]),
      }),
    });

    const result = await getIntegrations('user-1');
    expect(result.google.connected).toBe(true);
    expect(result.spotify.connected).toBe(true);
  });
});

describe('unlinkProvider', () => {
  it('calls db.delete for the given provider', async () => {
    const whereMock = vi.fn().mockResolvedValue(undefined);
    mockDb.delete.mockReturnValue({ where: whereMock });

    await unlinkProvider('user-1', 'spotify');

    expect(mockDb.delete).toHaveBeenCalledOnce();
    expect(whereMock).toHaveBeenCalledOnce();
  });
});
