import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretItem, interpretPublish, publishItem } from './report-store-status.mjs';

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

test('NOT_FOUND describes an absent operation, not an absent item', () => {
  const { errors, notes } = interpretItem({ uploadState: 'NOT_FOUND', crxVersion: '1.5.0' });
  assert.deepEqual(errors, []);
  assert.match(notes.join(' '), /No upload operation in flight/);
  assert.doesNotMatch(notes.join(' '), /Unrecognised/);
});

test('NOT_FOUND still catches a draft stuck on the wrong version', () => {
  const { errors } = interpretItem(
    { uploadState: 'NOT_FOUND', crxVersion: '1.4.1' },
    { expectedVersion: '1.5.0' },
  );
  assert.equal(errors.length, 1);
});

test('publishItem reports OK as queued for review', async () => {
  const fake = async () => ({ ok: true, json: async () => ({ status: ['OK'] }) });
  const { errors, notes } = await publishItem('abc', 't', fake);
  assert.deepEqual(errors, []);
  assert.match(notes.join(' '), /queued for review/);
});

test('publishItem surfaces a status array returned on a 200', async () => {
  const fake = async () => ({
    ok: true,
    json: async () => ({ status: ['ITEM_NOT_UPDATABLE'], statusDetail: ['Item is in review'] }),
  });
  const { errors } = await publishItem('abc', 't', fake);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /ITEM_NOT_UPDATABLE: Item is in review/);
});

test('publishItem reports an HTTP failure that carries no status', async () => {
  const fake = async () => ({ ok: false, status: 403, json: async () => ({}) });
  const { errors } = await publishItem('abc', 't', fake);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /HTTP 403/);
});

test('publishItem prefers the status array over the HTTP code', async () => {
  // A 400 that still explains itself should report the explanation, not the code.
  const fake = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ status: ['NOT_AUTHORIZED'], statusDetail: ['Account cannot publish'] }),
  });
  const { errors } = await publishItem('abc', 't', fake);
  assert.match(errors[0], /NOT_AUTHORIZED: Account cannot publish/);
});
