import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretItem, interpretPublish } from './report-store-status.mjs';

test('a rejected upload is an error, and says why', () => {
  const { errors } = interpretItem({
    uploadState: 'FAILURE',
    itemError: [{ error_detail: 'Manifest is missing a required field' }],
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /missing a required field/);
});

test('an accepted upload is not an error, because review is still pending', () => {
  const { errors, notes } = interpretItem({ uploadState: 'SUCCESS' });
  assert.deepEqual(errors, []);
  assert.match(notes.join(' '), /review clears/);
});

test('an upload still processing is reported but does not fail the release', () => {
  const { errors, notes } = interpretItem({ uploadState: 'IN_PROGRESS' });
  assert.deepEqual(errors, []);
  assert.match(notes.join(' '), /still processing/);
});

test('a draft holding the wrong version is an error - the upload did not land', () => {
  const { errors } = interpretItem(
    { uploadState: 'SUCCESS', crxVersion: '1.4.1' },
    { expectedVersion: '1.5.0' },
  );
  assert.equal(errors.length, 1);
  assert.match(errors[0], /holds version 1\.4\.1 but this release is 1\.5\.0/);
});

test('a draft holding the expected version passes', () => {
  const { errors } = interpretItem(
    { uploadState: 'SUCCESS', crxVersion: '1.5.0' },
    { expectedVersion: '1.5.0' },
  );
  assert.deepEqual(errors, []);
});

test('a missing item resource is an error rather than a crash', () => {
  assert.equal(interpretItem(null).errors.length, 1);
  assert.equal(interpretItem({}).errors.length, 1);
});

test('publish OK is success', () => {
  const { errors, notes } = interpretPublish({ status: ['OK'] });
  assert.deepEqual(errors, []);
  assert.match(notes.join(' '), /queued for review/);
});

test('publish failure surfaces the status and its detail', () => {
  const { errors } = interpretPublish({
    status: ['ITEM_NOT_UPDATABLE'],
    statusDetail: ['Item is currently in review'],
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /ITEM_NOT_UPDATABLE: Item is currently in review/);
});
