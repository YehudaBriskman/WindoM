import { describe, expect, it } from 'vitest';
import { isValidUrl } from './url';

describe('quick-link URL policy', () => {
  it.each(['https://example.com', 'http://localhost:8080/path?q=1#top', 'HTTPS://example.com',
    'https://例え.jp', 'http://[::1]:8080', ' https://example.com ',
  ])('accepts HTTP(S) URL %s', (url) => expect(isValidUrl(url)).toBe(true));

  it.each(['', 'https://', 'example.com', '//example.com', '/path', 'javascript:alert(1)',
    'JaVaScRiPt:alert(1)', 'java\nscript:alert(1)', 'data:text/html,test', 'file:///tmp/test',
    'chrome://settings', 'chrome-extension://id/page', 'ftp://example.com', 'mailto:a@b.com',
    'https://example.com:99999', 'https://example.com/' + 'a'.repeat(2048),
  ])('rejects unsupported URL %s', (url) => expect(isValidUrl(url)).toBe(false));
});
