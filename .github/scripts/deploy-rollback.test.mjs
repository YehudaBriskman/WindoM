import assert from 'node:assert/strict';
import { test } from 'node:test';
import { captureRunningImage, decideRollback, summaryMarkdown } from './deploy-rollback.mjs';

const OLD = `sha256:${'a'.repeat(64)}`;
const NEW = `sha256:${'b'.repeat(64)}`;
const machine = (id, digest, extra = {}) => ({
  id, region: 'fra', state: 'started', image_ref: { registry: 'registry.fly.io', repository: 'windom-api', digest }, config: { metadata: { fly_process_group: 'app' } }, ...extra,
});

// ── capture ─────────────────────────────────────────────────────────────────

test('captures the running image as registry/repository@digest', () => {
  assert.deepEqual(captureRunningImage([machine('m1', OLD), machine('m2', OLD)]), {
    ok: true, image: `registry.fly.io/windom-api@${OLD}`, digest: OLD,
  });
});

test('prefers the tag the machines started from, keeping the digest to verify', () => {
  const tagged = (id) => machine(id, OLD, { image_ref: { registry: 'registry.fly.io', repository: 'windom-api', tag: 'release-abc123', digest: OLD } });
  assert.deepEqual(captureRunningImage([tagged('m1'), tagged('m2')]), {
    ok: true, image: 'registry.fly.io/windom-api:release-abc123', digest: OLD,
  });
  // One machine without a recorded tag does not hide the other's.
  assert.equal(captureRunningImage([machine('m1', OLD), tagged('m2')]).image, 'registry.fly.io/windom-api:release-abc123');
});

test('an unusable tag falls back to the digest reference', () => {
  const m = machine('m1', OLD, { image_ref: { registry: 'registry.fly.io', repository: 'windom-api', tag: 'bad tag;rm', digest: OLD } });
  assert.equal(captureRunningImage([m]).image, `registry.fly.io/windom-api@${OLD}`);
});

test('stopped machines and the release_command machine do not count', () => {
  const machines = [
    machine('m1', OLD),
    machine('stopped', NEW, { state: 'stopped' }),
    machine('rel', NEW, { config: { metadata: { fly_process_group: 'fly_app_release_command' } } }),
  ];
  assert.equal(captureRunningImage(machines).digest, OLD);
});

test('mixed images mean no single rollback target', () => {
  const c = captureRunningImage([machine('m1', OLD), machine('m2', NEW)]);
  assert.equal(c.ok, false);
  assert.match(c.reason, /2 different images/);
});

test('nothing running, an unreadable digest or no list is unavailable, not a guess', () => {
  assert.equal(captureRunningImage([]).ok, false);
  assert.equal(captureRunningImage([machine('m1', OLD, { state: 'stopped' })]).ok, false);
  assert.match(captureRunningImage([machine('m1', 'latest')]).reason, /m1 has no readable image digest/);
  assert.match(captureRunningImage([machine('m1', OLD, { image_ref: { digest: OLD } })]).reason, /no readable/);
  assert.match(captureRunningImage(null).reason, /no machine list/);
  assert.match(captureRunningImage({}).reason, /no machine list/);
});

// ── decide ──────────────────────────────────────────────────────────────────

test('rolls back when production runs the failed release', () => {
  const d = decideRollback({ available: true, previousDigest: OLD, newDigest: NEW, machinesNow: [machine('m1', NEW)] });
  assert.equal(d.action, 'rollback');
});

test('rolls back a half-finished rolling deploy', () => {
  const d = decideRollback({ available: true, previousDigest: OLD, newDigest: NEW, machinesNow: [machine('m1', NEW), machine('m2', OLD)] });
  assert.equal(d.action, 'rollback');
});

test('rolls back when the machines after the failure cannot be read', () => {
  assert.equal(decideRollback({ available: true, previousDigest: OLD, newDigest: NEW, machinesNow: null }).action, 'rollback');
  assert.equal(decideRollback({ available: true, previousDigest: OLD, newDigest: NEW, machinesNow: [] }).action, 'rollback');
});

test('no rollback when the release never went live', () => {
  const d = decideRollback({ available: true, previousDigest: OLD, newDigest: NEW, machinesNow: [machine('m1', OLD), machine('m2', OLD)] });
  assert.equal(d.action, 'none');
  assert.match(d.reason, /never went live/);
});

test('no rollback when the release redeployed the image already running', () => {
  assert.equal(decideRollback({ available: true, previousDigest: OLD, newDigest: OLD, machinesNow: [machine('m1', OLD)] }).action, 'none');
});

test('unavailable when the capture failed or produced no digest', () => {
  assert.equal(decideRollback({ available: false, previousDigest: OLD, newDigest: NEW, machinesNow: [machine('m1', NEW)] }).action, 'unavailable');
  assert.equal(decideRollback({ available: true, previousDigest: '', newDigest: NEW, machinesNow: [machine('m1', NEW)] }).action, 'unavailable');
  assert.equal(decideRollback({ available: true, previousDigest: undefined, newDigest: NEW, machinesNow: null }).action, 'unavailable');
});

// ── summary ─────────────────────────────────────────────────────────────────

const base = { tag: 'v1.2.3', failedStep: 'Verify production readiness', newImage: `registry.fly.io/windom-api@${NEW}` };

test('every summary is a failure and says migrations were not reverted', () => {
  for (const decision of [
    { action: 'rollback', reason: 'x' },
    { action: 'none', reason: 'x' },
    { action: 'unavailable', reason: 'x' },
  ]) {
    const md = summaryMarkdown({ ...base, decision, previousImage: `registry.fly.io/windom-api@${OLD}`, rollbackResult: 'success' });
    assert.match(md, /deploy FAILED/);
    assert.match(md, /Database migrations were NOT reverted/);
    assert.match(md, /Verify production readiness/);
  }
});

test('a successful rollback names what it rolled back to', () => {
  const md = summaryMarkdown({ ...base, decision: { action: 'rollback', reason: '' }, previousImage: `registry.fly.io/windom-api@${OLD}`, rollbackResult: 'success' });
  assert.match(md, new RegExp(`Rolled back to:\\*\\* \`registry.fly.io/windom-api@${OLD}\``));
  assert.match(md, /Rollback:\*\* succeeded/);
});

test('a tag reference is shown with the digest it was verified against', () => {
  const md = summaryMarkdown({ ...base, decision: { action: 'rollback', reason: '' }, previousImage: 'registry.fly.io/windom-api:release-abc', previousDigest: OLD, rollbackResult: 'success' });
  assert.match(md, new RegExp(`release-abc\` \\(${OLD}\\)`));
});

test('a failed rollback is loud', () => {
  const md = summaryMarkdown({ ...base, decision: { action: 'rollback', reason: '' }, previousImage: 'x', rollbackResult: 'failure' });
  assert.match(md, /Rollback: FAILED/);
  assert.doesNotMatch(md, /succeeded/);
});

test('an unavailable rollback gives the capture reason and the manual path', () => {
  const md = summaryMarkdown({ ...base, decision: { action: 'unavailable', reason: 'not captured' }, captureReason: 'machines run 2 different images' });
  assert.match(md, /Rollback: unavailable\*\* - machines run 2 different images/);
  assert.match(md, /deployment-runbook\.md/);
});
