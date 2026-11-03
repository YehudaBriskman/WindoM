import { describe, expect, it } from 'vitest';
import { parseDeviceLabel } from '../device-label.js';

const UA = {
  chromeWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  edgeWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
  firefoxLinux: 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
  firefoxMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  safariIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  chromeIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  chromeOs: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
};

describe('parseDeviceLabel', () => {
  it.each([
    [UA.chromeWin, 'Chrome · Windows'],
    [UA.edgeWin, 'Edge · Windows'],
    [UA.firefoxLinux, 'Firefox · Linux'],
    [UA.firefoxMac, 'Firefox · macOS'],
    [UA.safariMac, 'Safari · macOS'],
    [UA.safariIphone, 'Safari · iOS'],
    [UA.chromeIos, 'Chrome · iOS'],
    [UA.chromeAndroid, 'Chrome · Android'],
    [UA.chromeOs, 'Chrome · ChromeOS'],
  ])('labels %s', (ua, label) => {
    expect(parseDeviceLabel(ua)).toBe(label);
  });

  it('prefers client hints, which are the only way to tell Brave from Chrome', () => {
    expect(parseDeviceLabel(UA.chromeWin, {
      brands: '"Chromium";v="130", "Brave";v="130", "Not?A_Brand";v="99"',
      platform: '"Linux"',
    })).toBe('Brave · Linux');
    expect(parseDeviceLabel(UA.chromeWin, { platform: '"Chrome OS"' })).toBe('Chrome · ChromeOS');
  });

  it('falls back to the User-Agent for an unrecognised hint', () => {
    expect(parseDeviceLabel(UA.chromeWin, { brands: '"Chromium";v="130"', platform: '"Fuchsia"' })).toBe('Chrome · Windows');
  });

  it('names an unknown half and returns null when nothing is recognisable', () => {
    expect(parseDeviceLabel('curl/8.5.0')).toBeNull();
    expect(parseDeviceLabel('')).toBeNull();
    expect(parseDeviceLabel('SomeBot (Windows)')).toBe('Unknown browser · Windows');
  });

  it('carries no version numbers', () => {
    for (const ua of Object.values(UA)) expect(parseDeviceLabel(ua)).not.toMatch(/\d/);
  });
});
