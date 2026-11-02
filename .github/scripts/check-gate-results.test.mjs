import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gateErrors } from './check-gate-results.mjs';

const REQUIRED = ['resolve', 'metadata', 'backend', 'web', 'container', 'preflight'];
const allGreen = Object.fromEntries(REQUIRED.map((id) => [id, { result: 'success' }]));

test('every job succeeded', () => {
  assert.deepEqual(gateErrors(allGreen, REQUIRED), []);
});

// The defect: only failure and cancelled used to fail the gate.
for (const result of ['skipped', 'failure', 'cancelled', 'neutral', 'something_new']) {
  test(`a ${result} job fails the gate`, () => {
    assert.deepEqual(gateErrors({ ...allGreen, web: { result } }, REQUIRED), [`web: ${result}`]);
  });
}

test('a job with no result fails the gate', () => {
  assert.deepEqual(gateErrors({ ...allGreen, web: {} }, REQUIRED), ['web: missing']);
});

// A job added to the gate but not to `needs` would never be looked at.
test('a required job absent from the results fails the gate', () => {
  const { container, ...rest } = allGreen;
  assert.deepEqual(gateErrors(rest, REQUIRED), ['container: no result - the summary is not wired to this job']);
});

test('no results at all fails the gate', () => {
  assert.equal(gateErrors(null, REQUIRED).length, 1);
  assert.equal(gateErrors(undefined, REQUIRED).length, 1);
});
