import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deployedImageErrors } from './check-deployed-image.mjs';

const D = `sha256:${'a'.repeat(64)}`;
const OTHER = `sha256:${'b'.repeat(64)}`;
const machine = (id, digest, extra = {}) => ({
  id, region: 'fra', state: 'started', image_ref: { registry: 'registry.fly.io', repository: 'windom-api', digest }, config: { metadata: { fly_process_group: 'app' } }, ...extra,
});

test('every started app machine runs the pushed digest', () => {
  assert.deepEqual(deployedImageErrors([machine('m1', D), machine('m2', D)], D), []);
});

test('a machine still on the old image is named', () => {
  assert.deepEqual(deployedImageErrors([machine('m1', D), machine('m2', OTHER)], D), [`Machine m2 (fra) runs ${OTHER}, not ${D}`]);
});

test('stopped machines and the release_command machine are not serving, so they are ignored', () => {
  const machines = [
    machine('m1', D),
    machine('old', OTHER, { state: 'stopped' }),
    machine('rel', OTHER, { config: { metadata: { fly_process_group: 'fly_app_release_command' } } }),
  ];
  assert.deepEqual(deployedImageErrors(machines, D), []);
});

test('no started machine at all fails closed', () => {
  assert.equal(deployedImageErrors([machine('m1', D, { state: 'stopped' })], D).length, 1);
  assert.equal(deployedImageErrors([], D).length, 1);
});

test('a machine whose image cannot be read fails closed', () => {
  assert.match(deployedImageErrors([machine('m1', undefined)], D)[0], /unknown image/);
});

test('no digest or no list fails closed', () => {
  assert.match(deployedImageErrors([machine('m1', D)], '')[0], /No pushed digest/);
  assert.match(deployedImageErrors([machine('m1', D)], 'latest')[0], /No pushed digest/);
  assert.match(deployedImageErrors(null, D)[0], /no machine list/);
});

// v1.6.0 (2026-11-04): docker pushed an OCI index; Fly ran its linux/amd64 manifest.
const INDEX = 'sha256:1f1ebf4d9282ddd928e0c684b1466f108b84cf52d4da6f49927d281eb2172940';
const PLATFORM = 'sha256:38d7ee506ba881a08dbb9b0029a7c8aff729aced56bdb3dc0b89c1c106707bd9';

test('the v1.6.0 deploy passes: the machine runs the platform manifest of the pushed index', () => {
  assert.deepEqual(deployedImageErrors([machine('m1', PLATFORM)], PLATFORM, [INDEX]), []);
});

test('a machine reporting the index digest also passes - it names the same pushed image', () => {
  assert.deepEqual(deployedImageErrors([machine('m1', INDEX)], PLATFORM, [INDEX]), []);
});

test('accepting the index does not accept anything else', () => {
  assert.equal(deployedImageErrors([machine('m1', OTHER)], PLATFORM, [INDEX]).length, 1);
});

test('a malformed extra digest is ignored rather than widening the check', () => {
  assert.equal(deployedImageErrors([machine('m1', '')], PLATFORM, ['', 'sha256:short']).length, 1);
});
