/** Validate a URL string */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/** Get favicon URL from Google's favicon service */
export function getFaviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    if (!hostname.includes('.')) return '';
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return '';
  }
}
