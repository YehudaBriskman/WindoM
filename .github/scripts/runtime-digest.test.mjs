import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { runtimeDigest } from './runtime-digest.mjs';

const sha = (s) => `sha256:${createHash('sha256').update(s).digest('hex')}`;

// The exact index v1.6.0 pushed (run 41770502146), byte for byte. Fly ran its
// linux/amd64 entry, 38d7ee50..., and the old check compared 1f1ebf4d... to it.
const V160_INDEX = Buffer.from('ewogICJzY2hlbWFWZXJzaW9uIjogMiwKICAibWVkaWFUeXBlIjogImFwcGxpY2F0aW9uL3ZuZC5vY2kuaW1hZ2UuaW5kZXgudjEranNvbiIsCiAgIm1hbmlmZXN0cyI6IFsKICAgIHsKICAgICAgIm1lZGlhVHlwZSI6ICJhcHBsaWNhdGlvbi92bmQub2NpLmltYWdlLm1hbmlmZXN0LnYxK2pzb24iLAogICAgICAiZGlnZXN0IjogInNoYTI1NjozOGQ3ZWU1MDZiYTg4MWEwOGRiYjliMDAyOWE3YzhhZmY3MjlhY2VkNTZiZGIzZGMwYjg5YzFjMTA2NzA3YmQ5IiwKICAgICAgInNpemUiOiAyMzg1LAogICAgICAicGxhdGZvcm0iOiB7CiAgICAgICAgImFyY2hpdGVjdHVyZSI6ICJhbWQ2NCIsCiAgICAgICAgIm9zIjogImxpbnV4IgogICAgICB9CiAgICB9LAogICAgewogICAgICAibWVkaWFUeXBlIjogImFwcGxpY2F0aW9uL3ZuZC5vY2kuaW1hZ2UubWFuaWZlc3QudjEranNvbiIsCiAgICAgICJkaWdlc3QiOiAic2hhMjU2OjgzNjY2YzM0NGEwZDE2ZjUyYmNmMjNlYmQ0M2RmYjZjNzUwZjI5NDgwZjQ2ZWU3NzYzOWJmNDZiMjBiOWMzNTAiLAogICAgICAic2l6ZSI6IDU2NCwKICAgICAgImFubm90YXRpb25zIjogewogICAgICAgICJ2bmQuZG9ja2VyLnJlZmVyZW5jZS5kaWdlc3QiOiAic2hhMjU2OjM4ZDdlZTUwNmJhODgxYTA4ZGJiOWIwMDI5YTdjOGFmZjcyOWFjZWQ1NmJkYjNkYzBiODljMWMxMDY3MDdiZDkiLAogICAgICAgICJ2bmQuZG9ja2VyLnJlZmVyZW5jZS50eXBlIjogImF0dGVzdGF0aW9uLW1hbmlmZXN0IgogICAgICB9LAogICAgICAicGxhdGZvcm0iOiB7CiAgICAgICAgImFyY2hpdGVjdHVyZSI6ICJ1bmtub3duIiwKICAgICAgICAib3MiOiAidW5rbm93biIKICAgICAgfQogICAgfQogIF0KfQ==', 'base64');
const V160_PUSHED = 'sha256:1f1ebf4d9282ddd928e0c684b1466f108b84cf52d4da6f49927d281eb2172940';
const V160_RUNNING = 'sha256:38d7ee506ba881a08dbb9b0029a7c8aff729aced56bdb3dc0b89c1c106707bd9';

const d = (c) => `sha256:${c.repeat(64)}`;
const index = (manifests, mediaType = 'application/vnd.oci.image.index.v1+json') =>
  JSON.stringify({ schemaVersion: 2, mediaType, manifests });
const amd64 = (digest) => ({ mediaType: 'application/vnd.oci.image.manifest.v1+json', digest, size: 1, platform: { os: 'linux', architecture: 'amd64' } });
const attestation = (digest) => ({
  mediaType: 'application/vnd.oci.image.manifest.v1+json',
  digest,
  size: 1,
  platform: { os: 'unknown', architecture: 'unknown' },
  annotations: { 'vnd.docker.reference.type': 'attestation-manifest' },
});

test('the real v1.6.0 index resolves to the digest production actually ran', () => {
  assert.equal(sha(V160_INDEX), V160_PUSHED);
  assert.deepEqual(runtimeDigest(V160_INDEX, V160_PUSHED), { digest: V160_RUNNING });
});

test('a trailing newline from imagetools --raw is tolerated', () => {
  assert.deepEqual(runtimeDigest(Buffer.concat([V160_INDEX, Buffer.from('\n')]), V160_PUSHED), { digest: V160_RUNNING });
});

test('a single image manifest is its own runtime digest', () => {
  const m = JSON.stringify({ schemaVersion: 2, mediaType: 'application/vnd.oci.image.manifest.v1+json', config: {}, layers: [] });
  assert.deepEqual(runtimeDigest(m, sha(m)), { digest: sha(m) });
});

test('a Docker manifest list is treated as an index', () => {
  const raw = index([amd64(d('a'))], 'application/vnd.docker.distribution.manifest.list.v2+json');
  assert.deepEqual(runtimeDigest(raw, sha(raw)), { digest: d('a') });
});

test('bytes that do not hash to the pushed digest are refused', () => {
  const raw = index([amd64(d('a'))]);
  assert.match(runtimeDigest(raw, d('f')).error, /does not hash/);
});

test('an index without a linux/amd64 image is refused', () => {
  const raw = index([attestation(d('b')), { ...amd64(d('c')), platform: { os: 'linux', architecture: 'arm64' } }]);
  assert.match(runtimeDigest(raw, sha(raw)).error, /0 linux\/amd64/);
});

test('an index with two linux/amd64 images is refused, not guessed', () => {
  const raw = index([amd64(d('a')), amd64(d('c'))]);
  assert.match(runtimeDigest(raw, sha(raw)).error, /2 linux\/amd64/);
});

test('an attestation entry is never chosen, even when it claims linux/amd64', () => {
  const raw = index([amd64(d('a')), { ...attestation(d('b')), platform: { os: 'linux', architecture: 'amd64' } }]);
  assert.deepEqual(runtimeDigest(raw, sha(raw)), { digest: d('a') });
});

test('a missing or malformed pushed digest is refused', () => {
  assert.match(runtimeDigest('{}', undefined).error, /No pushed digest/);
  assert.match(runtimeDigest('{}', 'sha256:abc').error, /No pushed digest/);
});

test('non-JSON and unknown documents are refused', () => {
  assert.match(runtimeDigest('not json', sha('not json')).error, /not JSON/);
  const odd = JSON.stringify({ mediaType: 'application/x-something' });
  assert.match(runtimeDigest(odd, sha(odd)).error, /Unrecognised/);
});
