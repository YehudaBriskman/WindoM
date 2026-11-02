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
