/**
 * A coarse, human label for a session's device - "Chrome · Windows" - parsed once
 * at sign-in/renewal so the raw User-Agent never has to be stored.
 *
 * Deliberately tiny and dependency-free: it names the browser family and the OS
 * family and nothing else (no versions, no device model), so the label carries no
 * more fingerprinting entropy than the user already sees on screen.
 *
 * Low-entropy client hints (Sec-CH-UA, Sec-CH-UA-Platform) are preferred when the
 * browser sends them: they are the only way to tell Brave from Chrome, whose
 * User-Agent strings are identical.
 */

export interface ClientHints {
  /** Raw `Sec-CH-UA` header, e.g. `"Chromium";v="130", "Brave";v="130"`. */
  brands?: string;
  /** Raw `Sec-CH-UA-Platform` header, e.g. `"Windows"`. */
  platform?: string;
}

const HINT_BROWSERS: Array<[RegExp, string]> = [
  [/"Brave"/i, 'Brave'],
  [/"Microsoft Edge"/i, 'Edge'],
  [/"Opera"/i, 'Opera'],
  [/"Google Chrome"/i, 'Chrome'],
];

// Order matters: Edge and Opera also say "Chrome/", every Chromium says "Safari/".
const UA_BROWSERS: Array<[RegExp, string]> = [
  [/\bEdg(?:e|A|iOS)?\//, 'Edge'],
  [/\bOPR\/|\bOPiOS\//, 'Opera'],
  [/\bFirefox\/|\bFxiOS\//, 'Firefox'],
  [/\bChrome\/|\bCriOS\//, 'Chrome'],
  [/\bVersion\/[\d.]+.*\bSafari\//, 'Safari'],
];

const HINT_PLATFORMS: Record<string, string> = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  'chrome os': 'ChromeOS',
  chromeos: 'ChromeOS',
  android: 'Android',
  ios: 'iOS',
};

// Order matters: Android UAs say "Linux", iOS UAs say "like Mac OS X".
const UA_PLATFORMS: Array<[RegExp, string]> = [
  [/\b(?:iPhone|iPad|iPod)\b/, 'iOS'],
  [/\bAndroid\b/, 'Android'],
  [/\bCrOS\b/, 'ChromeOS'],
  [/\bWindows\b/, 'Windows'],
  [/\bMacintosh\b|\bMac OS X\b/, 'macOS'],
  [/\bLinux\b|\bX11\b/, 'Linux'],
];

function match(list: Array<[RegExp, string]>, value: string): string | null {
  for (const [pattern, name] of list) if (pattern.test(value)) return name;
  return null;
}

/** Returns e.g. "Firefox · macOS", or null when neither part is recognisable. */
export function parseDeviceLabel(userAgent: string, hints: ClientHints = {}): string | null {
  const browser = (hints.brands && match(HINT_BROWSERS, hints.brands)) || match(UA_BROWSERS, userAgent);
  const hintPlatform = hints.platform?.replace(/"/g, '').trim().toLowerCase();
  const os = (hintPlatform && HINT_PLATFORMS[hintPlatform]) || match(UA_PLATFORMS, userAgent);
  if (!browser && !os) return null;
  return `${browser ?? 'Unknown browser'} · ${os ?? 'Unknown OS'}`;
}
