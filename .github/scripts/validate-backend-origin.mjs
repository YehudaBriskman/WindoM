import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * Asserts that the backend the extension is built against is actually reachable from
 * the extension, by checking the built-in `VITE_BACKEND_URL` origin against
 * `host_permissions` in the manifest.
 *
 * Chrome blocks any request to an origin absent from `host_permissions`, and the
 * failure surfaces only at runtime in a user's browser - never at build time. Issue
 * #302 is this exact class of fault: the manifest permits `https://api.windom.app/*`
 * while the backend answers on a different host, so every authenticated request fails
 * for every user while CI stays green.
 */

/** Converts a match pattern's host to a regex, honouring a single leading `*.` wildcard. */
function hostMatcher(patternHost) {
  if (patternHost === '*') return () => true;
  if (patternHost.startsWith('*.')) {
    const suffix = patternHost.slice(2).toLowerCase();
    // `*.example.com` matches sub.example.com and example.com itself, per Chrome's rules.
    return (host) => host === suffix || host.endsWith(`.${suffix}`);
  }
  const exact = patternHost.toLowerCase();
  return (host) => host === exact;
}

/** True when `pattern` (a Chrome match pattern) covers `url`'s scheme and host. */
export function patternCoversUrl(pattern, url) {
  if (typeof pattern !== 'string') return false;
  if (pattern === '<all_urls>') return true;

  const match = /^(\*|https?):\/\/([^/]+)(\/.*)?$/.exec(pattern.trim());
  if (!match) return false;

  const [, scheme, host] = match;
  if (scheme !== '*' && `${scheme}:` !== url.protocol) return false;
  return hostMatcher(host)(url.hostname.toLowerCase());
}

export function validateBackendOrigin(backendUrl, hostPermissions) {
  const errors = [];

  let url;
  try {
    url = new URL(String(backendUrl));
  } catch {
    errors.push('VITE_BACKEND_URL is not a valid URL');
    return errors;
  }

  if (url.protocol !== 'https:') {
    errors.push(`VITE_BACKEND_URL must use https, got ${url.protocol.replace(':', '')}`);
  }

  if (!Array.isArray(hostPermissions)) {
    errors.push('web/manifest.json has no host_permissions array');
    return errors;
  }

  if (!hostPermissions.some((pattern) => patternCoversUrl(pattern, url))) {
    errors.push(
      `web/manifest.json host_permissions does not cover the backend origin ${url.origin}. ` +
      `Add "${url.origin}/*" to host_permissions, or the extension will be blocked by ` +
      'Chrome from calling its own API at runtime.',
    );
  }
  return errors;
}

/** Reads `host_permissions`, returning undefined rather than throwing on a bad file. */
export function readHostPermissions(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8')).host_permissions;
  } catch {
    return undefined;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const backendUrl = process.env.VITE_BACKEND_URL ?? '';
  const errors = validateBackendOrigin(backendUrl, readHostPermissions('web/manifest.json'));
  for (const error of errors) console.error(error);
  if (!errors.length) console.log('Backend origin is covered by host_permissions.');
  process.exitCode = errors.length ? 1 : 0;
}
