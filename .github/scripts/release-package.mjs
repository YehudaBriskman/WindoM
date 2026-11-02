import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * The extension ZIP is built once, in the release gate, and published as-is.
 *
 * Before, the gate built and checked web/dist, then the publish job ran
 * `npm ci && npm run build` a second time and uploaded THAT. What reached the
 * store was a rebuild nobody had checked. Its dependency tree was re-resolved,
 * and its backend origin came from a different expression (the gate fell back to
 * the production URL; the publish used the secret alone).
 *
 * Now the gate's web job zips the dist it validated and writes
 * release-info.json beside it: the ZIP's sha256, the tag, the commit and the
 * backend origin it was built against. The publish job downloads both and
 * refuses to upload unless every one of them matches what this release is.
 */

const SHA256 = /^[0-9a-f]{64}$/;
const COMMIT = /^[0-9a-f]{40}$/;

/** Origin only, so a trailing slash or path cannot make equal URLs differ. */
export function originOf(url) {
  try {
    const u = new URL(String(url ?? '').trim());
    return u.protocol === 'https:' && !u.username && !u.password ? u.origin : null;
  } catch {
    return null;
  }
}

const bareVersion = (tag) => String(tag ?? '').trim().replace(/^refs\/tags\//, '').replace(/^v/, '');

/**
 * @param {object} info      the parsed release-info.json the gate wrote
 * @param {string} zipSha256 the sha256 of the ZIP as downloaded
 * @param {object} expected  { tag, sha, backendUrl } for the release being published
 * @returns {string[]} one message per problem; empty means publish exactly this file
 */
export function packageErrors(info, zipSha256, expected) {
  if (!info || typeof info !== 'object') return ['release-info.json is missing or not JSON'];
  const errors = [];

  if (!SHA256.test(info.sha256 ?? '')) errors.push('release-info.json records no sha256 for the ZIP');
  else if (info.sha256 !== zipSha256) {
    errors.push(`The ZIP's sha256 is ${zipSha256}, but the gate recorded ${info.sha256}. This is not the file the gate checked.`);
  }

  if (!COMMIT.test(expected.sha ?? '')) errors.push(`No commit to compare against (got "${expected.sha}")`);
  else if (info.sha !== expected.sha) errors.push(`The ZIP was built from ${info.sha}, but this release is ${expected.sha}`);

  const want = bareVersion(expected.tag);
  if (!want) errors.push('No release tag to compare against');
  else {
    if (bareVersion(info.tag) !== want) errors.push(`The ZIP was built for tag ${info.tag}, but this release is v${want}`);
    if (info.manifestVersion !== want) errors.push(`The ZIP's manifest declares ${info.manifestVersion}, but this release is ${want}`);
  }

  const built = originOf(info.backendOrigin);
  const publishing = originOf(expected.backendUrl);
  if (!publishing) errors.push('VITE_BACKEND_URL is missing or not an HTTPS URL');
  else if (built !== publishing) {
    errors.push(`The ZIP talks to ${info.backendOrigin}, but VITE_BACKEND_URL is ${publishing}. Rebuild against the published backend.`);
  }
  return errors;
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [zip, infoPath] = process.argv.slice(2);
  let info = null;
  try {
    info = JSON.parse(readFileSync(infoPath, 'utf8'));
  } catch {
    info = null;
  }
  let sum = '';
  try {
    sum = sha256File(zip);
  } catch {
    console.log(`::error::Cannot read the ZIP at ${zip}`);
    process.exit(1);
  }
  const errors = packageErrors(info, sum, {
    tag: process.env.RELEASE_TAG,
    sha: process.env.RELEASE_SHA,
    backendUrl: process.env.VITE_BACKEND_URL,
  });
  for (const error of errors) console.log(`::error::${error}`);
  if (errors.length) {
    console.log('::error::Nothing was uploaded to the Chrome Web Store.');
    process.exitCode = 1;
  } else {
    console.log(`Publishing exactly the ZIP the gate checked: ${info.tag} at ${info.sha}, sha256 ${sum}`);
  }
}
