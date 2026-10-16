/** Only HTTP(S) destinations are supported for user-configurable links. */
export function isValidUrl(url: string): boolean {
  try {
    if (url.length > 2048) return false;
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Get favicon URL from Google's favicon service */
export function getFaviconUrl(url: string): string {
  if (!isValidUrl(url)) return '';
  try {
    const { hostname } = new URL(url);
    if (!hostname.includes('.')) return '';
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return '';
  }
}
