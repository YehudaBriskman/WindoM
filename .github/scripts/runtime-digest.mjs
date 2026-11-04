import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * The digest Fly records for a running machine, given what `docker push` pushed.
 *
 * `docker push` reports the digest of the top-level object it uploaded. With
 * Docker's containerd image store (the default on GitHub's runners since the
 * v1.5.1 release) that object is an OCI image INDEX: one linux/amd64 image
 * manifest plus a build-attestation manifest. Fly resolves the index and
 * records the platform manifest's digest in `image_ref.digest`, so comparing
 * that against the pushed digest can never match. The v1.6.0 deploy (run
 * 41770502146) ran the scanned image and was still rolled back for it:
 * index sha256:1f1ebf4d..., machine sha256:38d7ee50..., the index's
 * linux/amd64 entry.
 *
 * So the deploy resolves the pushed object here: a single image manifest is
 * its own runtime digest; an index yields its one linux/amd64 image manifest.
 * The raw bytes must hash to the pushed digest, so this can only ever pick a
 * manifest out of the object that was actually pushed.
 *
 * @param {Buffer|string} raw  `docker buildx imagetools inspect --raw <ref>` output
 * @param {string} pushed      sha256:... reported by `docker push`
 * @param {{os: string, architecture: string}} [platform]
 * @returns {{digest: string} | {error: string}}
 */
export function runtimeDigest(raw, pushed, platform = { os: 'linux', architecture: 'amd64' }) {
  if (!/^sha256:[0-9a-f]{64}$/.test(pushed ?? '')) return { error: `No pushed digest to resolve (got "${pushed}")` };

  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw ?? '', 'utf8');
  // `imagetools inspect --raw` may end the document with a newline the registry
  // object does not have, so the exact bytes and the bytes without it are tried.
  const candidates = [bytes];
  if (bytes.length && bytes[bytes.length - 1] === 0x0a) candidates.push(bytes.subarray(0, bytes.length - 1));
  const sha = (b) => `sha256:${createHash('sha256').update(b).digest('hex')}`;
  if (!candidates.some((b) => sha(b) === pushed)) {
    return { error: `The manifest read back from the registry does not hash to the pushed digest ${pushed}` };
  }

  let doc;
  try {
    doc = JSON.parse(bytes.toString('utf8'));
  } catch {
    return { error: 'The manifest read back from the registry is not JSON' };
  }

  const isIndex =
    doc?.mediaType === 'application/vnd.oci.image.index.v1+json' ||
    doc?.mediaType === 'application/vnd.docker.distribution.manifest.list.v2+json' ||
    (doc?.mediaType === undefined && Array.isArray(doc?.manifests));
  if (!isIndex) {
    if (Array.isArray(doc?.layers) || doc?.config) return { digest: pushed };
    return { error: `Unrecognised manifest type "${doc?.mediaType}"` };
  }

  const matches = (doc.manifests ?? []).filter(
    (m) =>
      m?.platform?.os === platform.os &&
      m?.platform?.architecture === platform.architecture &&
      m?.annotations?.['vnd.docker.reference.type'] !== 'attestation-manifest',
  );
  if (matches.length !== 1) {
    return {
      error: `The pushed index has ${matches.length} ${platform.os}/${platform.architecture} image manifests; exactly one is required`,
    };
  }
  const digest = matches[0].digest;
  if (!/^sha256:[0-9a-f]{64}$/.test(digest ?? '')) return { error: `The platform manifest has no valid digest (got "${digest}")` };
  return { digest };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let raw = '';
  try {
    raw = readFileSync(process.argv[2]);
  } catch {
    raw = '';
  }
  const result = runtimeDigest(raw, process.env.PUSHED_DIGEST);
  if ('error' in result) {
    console.log(`::error::${result.error}`);
    process.exit(1);
  }
  console.log(result.digest);
}
