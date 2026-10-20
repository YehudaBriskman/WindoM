import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * Asserts that a release tag agrees with every version declared in the repo.
 *
 * A tag is the only trigger for both the backend deploy and the Chrome Web Store
 * publish, so a tag that disagrees with `web/manifest.json` ships an extension whose
 * displayed version is not the version that was released. The store also rejects a
 * re-upload of a version it already holds, which turns the mismatch into a failed
 * publish after the backend has already deployed - a half-applied release.
 */

/** Strips a leading `v` and any pre-release/build suffix is preserved as-is. */
export function versionFromTag(tag) {
  return typeof tag === 'string' ? tag.trim().replace(/^refs\/tags\//, '').replace(/^v/, '') : '';
}

/** Sources are declared here so the error messages can name the file to edit. */
export const versionSources = [
  { label: 'backend/package.json', key: 'backendVersion' },
  { label: 'web/package.json', key: 'webVersion' },
  { label: 'web/manifest.json', key: 'manifestVersion' },
];

export function validateReleaseVersion({ tag, backendVersion, webVersion, manifestVersion }) {
  const errors = [];
  const expected = versionFromTag(tag);

  if (!expected) {
    errors.push('Missing release tag: expected something like v1.5.0');
    return errors;
  }

  // Chrome requires a dot-separated integer version of one to four parts, so a
  // pre-release tag such as v1.5.0-rc.1 cannot be published even though npm accepts it.
  if (!/^\d+(\.\d+){0,3}$/.test(expected)) {
    errors.push(
      `Tag "${tag}" is not publishable to the Chrome Web Store: a version must be one to ` +
      'four dot-separated integers (for example 1.5.0). Pre-release suffixes are not accepted.',
    );
  }

  const values = { backendVersion, webVersion, manifestVersion };
  for (const { label, key } of versionSources) {
    const actual = values[key];
    if (typeof actual !== 'string' || !actual.trim()) {
      errors.push(`Missing version in ${label}`);
    } else if (actual.trim() !== expected) {
      errors.push(`Version mismatch: tag is ${expected} but ${label} declares ${actual.trim()}`);
    }
  }
  return errors;
}

/** Reads a `version` field, returning undefined rather than throwing on a bad file. */
export function readVersion(path) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    return typeof parsed.version === 'string' ? parsed.version : undefined;
  } catch {
    return undefined;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = validateReleaseVersion({
    tag: process.env.RELEASE_TAG ?? process.env.GITHUB_REF ?? '',
    backendVersion: readVersion('backend/package.json'),
    webVersion: readVersion('web/package.json'),
    manifestVersion: readVersion('web/manifest.json'),
  });
  for (const error of errors) console.error(error);
  if (!errors.length) console.log('Release versions agree with the tag.');
  process.exitCode = errors.length ? 1 : 0;
}
