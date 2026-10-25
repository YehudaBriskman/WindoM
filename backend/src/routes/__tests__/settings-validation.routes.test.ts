import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../../app.js';
import { signAccessToken } from '../../lib/jwt.js';
import { getSettings, saveSettings } from '../../services/settings.service.js';

vi.mock('../../services/settings.service.js', () => ({ getSettings: vi.fn(), saveSettings: vi.fn() }));

let app: FastifyInstance;
let authorization: string;
beforeAll(async () => {
  app = await buildApp({ logger: false, skipRateLimit: true });
  authorization = `Bearer ${await signAccessToken({ sub: 'user-1', email: 'user@example.com', name: '', emailVerified: true })}`;
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSettings).mockResolvedValue(null);
  vi.mocked(saveSettings).mockImplementation((_userId, data) => Promise.resolve(data));
});
afterAll(async () => app.close());

function saveLink(url: unknown): ReturnType<typeof app.inject> {
  return app.inject({ method: 'PUT', url: '/settings', headers: { authorization },
    payload: { widgets: { quickLinks: [{ name: 'Example', url }] } } });
}

describe('settings link validation', () => {
  it.each(['https://example.com', 'http://localhost:8080/path?q=1#top', 'HTTPS://example.com',
    'https://例え.jp', 'http://[::1]:8080', ' https://example.com ',
  ])('accepts HTTP(S) link %s', async (url) => {
    const response = await saveLink(url);
    expect(response.statusCode).toBe(200);
    // Stored trimmed: the validator normalises surrounding whitespace rather
    // than persisting a link that renders with a space in it and breaks any
    // consumer that feeds it to `new URL()`.
    expect(saveSettings).toHaveBeenCalledWith('user-1',
      { widgets: { quickLinks: [{ name: 'Example', url: url.trim() }] } });
  });

  it.each(['', 'https://', 'example.com', '//example.com', '/path', 'javascript:alert(1)',
    'JaVaScRiPt:alert(1)', 'java\nscript:alert(1)', 'data:text/html,test', 'file:///tmp/test',
    'chrome://settings', 'chrome-extension://id/page', 'ftp://example.com', 'mailto:a@b.com',
    'https://example.com:99999', 'https://example.com/' + 'a'.repeat(2048), null, 42, {}, [],
  ].map((value) => [value]))('rejects invalid destination %j before touching stored settings', async (url) => {
    const response = await saveLink(url);
    expect(response.statusCode).toBe(400);
    expect(getSettings).not.toHaveBeenCalled();
    expect(saveSettings).not.toHaveBeenCalled();
  });

  it('rejects an entire batch if even one link is unsafe', async () => {
    const response = await app.inject({ method: 'PUT', url: '/settings', headers: { authorization }, payload: {
      widgets: { quickLinks: [{ name: 'Safe', url: 'https://example.com' }, { name: 'Unsafe', url: 'javascript:alert(1)' }] },
    } });
    expect(response.statusCode).toBe(400);
    expect(saveSettings).not.toHaveBeenCalled();
  });

  it('preserves unrelated settings when saving valid links', async () => {
    vi.mocked(getSettings).mockResolvedValue({ clock: { showSeconds: true }, widgets: { showLinks: false } });
    expect((await saveLink('https://example.com')).statusCode).toBe(200);
    expect(saveSettings).toHaveBeenCalledWith('user-1', {
      clock: { showSeconds: true }, widgets: { showLinks: false, quickLinks: [{ name: 'Example', url: 'https://example.com' }] },
    });
  });

  it('requires authentication before saving', async () => {
    const response = await app.inject({ method: 'PUT', url: '/settings', payload: { widgets: { quickLinks: [] } } });
    expect(response.statusCode).toBe(401);
    expect(saveSettings).not.toHaveBeenCalled();
  });

  it('allows clearing the link list', async () => {
    const response = await app.inject({ method: 'PUT', url: '/settings', headers: { authorization },
      payload: { widgets: { quickLinks: [] } } });
    expect(response.statusCode).toBe(200);
    expect(saveSettings).toHaveBeenCalledWith('user-1', { widgets: { quickLinks: [] } });
  });
});
