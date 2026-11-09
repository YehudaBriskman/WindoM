import { describe, it, expect, type Mock } from 'vitest';
import {
  SECRETS_KEY,
  applySecrets,
  extractSecrets,
  migrateSecretsFromSync,
  saveSecrets,
  stripSecrets,
} from '../secret-settings';
import { loadLocalSettings } from '../settings-load';
import { pickSyncable } from '../settings-store';
import { defaultSettings } from '../../types/settings';

const chromeMock = (globalThis as unknown as { chrome: typeof chrome }).chrome;
const syncSet = chromeMock.storage.sync.set as Mock;
const localSet = chromeMock.storage.local.set as Mock;

describe('stripSecrets', () => {
  it('removes the Unsplash key and the unused weather apiKey, leaving other fields', () => {
    const out = stripSecrets({
      background: { source: 'unsplash', unsplashApiKey: 'abc', unsplashCollectionId: 'c1' },
      weather: { show: true, apiKey: 'old' },
      general: { userName: 'Ada' },
    });
    expect(out).toEqual({
      background: { source: 'unsplash', unsplashCollectionId: 'c1' },
      weather: { show: true },
      general: { userName: 'Ada' },
    });
  });

  it('does not mutate its input', () => {
    const input = { background: { unsplashApiKey: 'abc' } };
    stripSecrets(input);
    expect(input.background.unsplashApiKey).toBe('abc');
  });
});

describe('pickSyncable (what reaches the backend)', () => {
  it('never includes API keys', () => {
    const out = pickSyncable({
      ...defaultSettings,
      background: { ...defaultSettings.background, unsplashApiKey: 'abc' },
    });
    expect(JSON.stringify(out)).not.toContain('abc');
    expect(out.background).not.toHaveProperty('unsplashApiKey');
  });
});

describe('extract / apply', () => {
  it('round-trips the key through the local entry shape', () => {
    const secrets = extractSecrets({ background: { unsplashApiKey: 'k', source: 'local' } });
    expect(secrets).toEqual({ background: { unsplashApiKey: 'k' } });
    expect(applySecrets({ background: { source: 'local' } }, secrets)).toEqual({
      background: { source: 'local', unsplashApiKey: 'k' },
    });
  });
});

describe('migrateSecretsFromSync', () => {
  it('copies the key to local storage, then removes it from sync', async () => {
    const order: string[] = [];
    localSet.mockImplementation(async () => void order.push('local'));
    syncSet.mockImplementation(async () => void order.push('sync'));
    const moved = await migrateSecretsFromSync({
      background: { source: 'unsplash', unsplashApiKey: 'abc', unsplashCollectionId: '' },
      weather: { show: true, apiKey: 'w' },
    });
    expect(moved).toBe(true);
    expect(order).toEqual(['local', 'sync']);
    expect(localSet).toHaveBeenCalledWith({ [SECRETS_KEY]: { background: { unsplashApiKey: 'abc' } } });
    const written = syncSet.mock.calls[0][0] as Record<string, object>;
    expect(written.background).toEqual({ source: 'unsplash', unsplashCollectionId: '' });
    expect(written.weather).toEqual({ show: true });
  });

  it('keeps the synced copy when the local write fails', async () => {
    localSet.mockRejectedValue(new Error('quota'));
    const moved = await migrateSecretsFromSync({ background: { unsplashApiKey: 'abc' } });
    expect(moved).toBe(false);
    expect(syncSet).not.toHaveBeenCalled();
  });

  it('is idempotent: nothing to do once sync holds no key', async () => {
    expect(await migrateSecretsFromSync({ background: { source: 'local' }, weather: { show: true } })).toBe(false);
    expect(localSet).not.toHaveBeenCalled();
    expect(syncSet).not.toHaveBeenCalled();
  });

  it('does not overwrite a key already stored on this device', async () => {
    (chromeMock.storage.local.get as Mock).mockResolvedValue({
      [SECRETS_KEY]: { background: { unsplashApiKey: 'mine' } },
    });
    await migrateSecretsFromSync({ background: { unsplashApiKey: 'synced' } });
    expect(localSet).not.toHaveBeenCalled();
    expect(syncSet).toHaveBeenCalled();
  });
});

describe('saveSecrets', () => {
  it('merges into the existing local entry', async () => {
    (chromeMock.storage.local.get as Mock).mockResolvedValue({
      [SECRETS_KEY]: { background: { unsplashApiKey: 'a' } },
    });
    await saveSecrets({ background: { unsplashApiKey: 'b' } });
    expect(localSet).toHaveBeenCalledWith({ [SECRETS_KEY]: { background: { unsplashApiKey: 'b' } } });
  });
});

describe('loadLocalSettings', () => {
  it('migrates a synced key and returns it in memory', async () => {
    (chromeMock.storage.sync.get as Mock).mockResolvedValue({
      ...defaultSettings,
      background: { source: 'unsplash', unsplashApiKey: 'abc', unsplashCollectionId: '' },
    });
    const s = await loadLocalSettings();
    expect(s.background.unsplashApiKey).toBe('abc');
    expect(localSet).toHaveBeenCalledWith({ [SECRETS_KEY]: { background: { unsplashApiKey: 'abc' } } });
    expect(JSON.stringify(syncSet.mock.calls)).not.toContain('abc');
  });

  it('reads the key from local storage when sync has none', async () => {
    (chromeMock.storage.local.get as Mock).mockResolvedValue({
      [SECRETS_KEY]: { background: { unsplashApiKey: 'local-key' } },
    });
    const s = await loadLocalSettings();
    expect(s.background.unsplashApiKey).toBe('local-key');
  });
});
