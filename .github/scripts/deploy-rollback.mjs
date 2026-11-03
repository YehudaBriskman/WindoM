import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * Automatic rollback of a failed backend deploy (#228), as pure decisions.
 *
 * The release workflow records which image production runs BEFORE it deploys
 * (`capture`), and if the deploy, the readiness check or the image check then
 * fails, it decides (`decide`) whether to redeploy that image by digest. The
 * workflow does the flyctl calls; everything that chooses lives here.
 *
 * Only the app image is rolled back. Migrations ran in the release_command
 * before the health check and are NOT reverted, which is safe only because
 * migrations must stay backward-compatible with the previous release - see
 * "Database migrations" in CONTRIBUTING.md. Re-running the old image's
 * release_command is a no-op: drizzle's migrator applies only migrations newer
 * than the newest one recorded in the database, and the old image has none.
 *
 * A failed capture does not stop the deploy. It is a read of the Fly API, and
 * without this feature every deploy shipped with no automatic rollback anyway;
 * blocking a release on it would make a Fly API hiccup worse than a bad deploy.
 * Instead it warns, and the summary of any failure says rollback was unavailable.
 */

const DIGEST = /^sha256:[0-9a-f]{64}$/;

/** Started machines of the app's own process groups; not the release_command machine. */
function serving(machines) {
  return machines.filter(
    (m) => m?.state === 'started' && m?.config?.metadata?.fly_process_group !== 'fly_app_release_command',
  );
}

/**
 * What production runs right now: the digest, and a reference to deploy it by.
 *
 * The digest is what matters; the rollback verifies it on the machines
 * afterwards. The reference to deploy prefers the registry TAG the machines
 * were started from (`release-<sha>`, or Fly's `deployment-<id>` for releases
 * built before #427), because `fly deploy --image` is documented for tags and
 * not for `@sha256:` references (docs/ci-optimization-plan.md, W2) - the same
 * reason the forward deploy uses a tag and then checks the digest. Only when
 * no tag is recorded does it fall back to `registry/repo@sha256:...`.
 *
 * @param {unknown} machines  parsed `fly machine list --json`
 * @returns {{ok: true, image: string, digest: string} | {ok: false, reason: string}}
 */
export function captureRunningImage(machines) {
  if (!Array.isArray(machines)) return { ok: false, reason: 'fly machine list returned no machine list' };
  const live = serving(machines);
  if (!live.length) return { ok: false, reason: 'no started app machine, so there is nothing to roll back to' };

  const refs = new Map();
  for (const m of live) {
    const ref = m?.image_ref;
    if (!DIGEST.test(ref?.digest ?? '') || !ref?.registry || !ref?.repository) {
      return { ok: false, reason: `machine ${m?.id} has no readable image digest` };
    }
    const base = `${ref.registry}/${ref.repository}`;
    const tagged = typeof ref.tag === 'string' && /^[\w][\w.-]{0,127}$/.test(ref.tag);
    if (!refs.has(ref.digest) || tagged) refs.set(ref.digest, tagged ? `${base}:${ref.tag}` : `${base}@${ref.digest}`);
  }
  // Mixed digests means a previous deploy never finished; there is no single
  // "last good" image to return to, and guessing one could make things worse.
  if (refs.size > 1) return { ok: false, reason: `machines run ${refs.size} different images: ${[...refs.keys()].join(', ')}` };

  const [[digest, image]] = refs;
  return { ok: true, image, digest };
}

/**
 * After a failure: roll back, or not, and why.
 *
 * @param {object} input
 * @param {boolean} input.available     the capture before the deploy succeeded
 * @param {string}  input.previousDigest digest production ran before the deploy
 * @param {string}  input.newDigest      digest this release pushed
 * @param {unknown} input.machinesNow    parsed `fly machine list --json`, after the failure
 * @returns {{action: 'rollback' | 'none' | 'unavailable', reason: string}}
 */
export function decideRollback({ available, previousDigest, newDigest, machinesNow }) {
  if (!available || !DIGEST.test(previousDigest ?? '')) {
    return { action: 'unavailable', reason: 'the image production ran before this deploy was not captured' };
  }
  if (previousDigest === newDigest) {
    return { action: 'none', reason: 'this release deployed the image that was already running, so there is nothing older to return to' };
  }
  // Fly's rolling strategy stops at the first machine that fails its checks,
  // and a failed release_command replaces nothing. If every serving machine is
  // still on the previous image, the release never went live: redeploying it
  // would only re-run a deploy for no change.
  if (Array.isArray(machinesNow)) {
    const live = serving(machinesNow);
    if (live.length && live.every((m) => m?.image_ref?.digest === previousDigest)) {
      return { action: 'none', reason: 'every serving machine still runs the previous image; the new release never went live' };
    }
  }
  return { action: 'rollback', reason: 'production runs (at least partly) the failed release' };
}

/**
 * Markdown for $GITHUB_STEP_SUMMARY. A rolled-back release is still a failed
 * release, so this always reads as a failure.
 *
 * @param {object} r
 * @param {string} r.tag
 * @param {string} r.failedStep     which check failed
 * @param {string} r.newImage       the failed release's image@digest
 * @param {{action: string, reason: string}} r.decision
 * @param {string} [r.previousImage] what it rolled back to
 * @param {string} [r.previousDigest] its digest, verified on the machines
 * @param {string} [r.captureReason] why the previous image is unknown
 * @param {'success' | 'failure' | ''} [r.rollbackResult] outcome of the redeploy + readiness
 */
export function summaryMarkdown({ tag, failedStep, newImage, decision, previousImage, previousDigest, captureReason, rollbackResult }) {
  const lines = [`## Release ${tag}: backend deploy FAILED`, '', `- **Failed:** ${failedStep}`, `- **Release image:** \`${newImage}\``];

  if (decision.action === 'rollback') {
    const pinned = previousDigest && !previousImage?.includes(previousDigest) ? ` (${previousDigest})` : '';
    lines.push(`- **Rolled back to:** \`${previousImage}\`${pinned}`);
    lines.push(
      rollbackResult === 'success'
        ? '- **Rollback:** succeeded - production passed readiness on the previous image.'
        : '- **Rollback: FAILED** - production may be down or running the failed release. Act now: `flyctl releases -a windom-api`, `flyctl machine list -a windom-api`.',
    );
  } else if (decision.action === 'none') {
    lines.push(`- **Rollback:** not needed - ${decision.reason}.`);
  } else {
    lines.push(`- **Rollback: unavailable** - ${captureReason || decision.reason}. Roll back by hand: see docs/deployment-runbook.md.`);
  }

  lines.push(
    '',
    '**Database migrations were NOT reverted.** Any migration in this release ran before the health check and is still applied. ' +
      'That is safe only for backward-compatible (expand-only) migrations - see CONTRIBUTING.md. ' +
      'The pre-deploy backup and the restore procedure are in docs/deployment-runbook.md.',
  );
  return `${lines.join('\n')}\n`;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function append(file, text) {
  if (!file) return;
  try {
    appendFileSync(file, text);
  } catch (error) {
    console.log(`::warning::Could not write ${file}: ${error.message}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, path] = process.argv.slice(2);
  const env = process.env;

  if (command === 'capture') {
    // Never fails the step: see the note at the top on why the deploy goes ahead.
    const c = captureRunningImage(readJson(path));
    if (c.ok) {
      console.log(`Rollback target: ${c.image}`);
      append(env.GITHUB_OUTPUT, `available=true\nimage=${c.image}\ndigest=${c.digest}\n`);
    } else {
      console.log(`::warning::Automatic rollback is unavailable for this deploy: ${c.reason}.`);
      append(env.GITHUB_OUTPUT, `available=false\nreason=${c.reason}\n`);
    }
  } else if (command === 'decide') {
    const d = decideRollback({
      available: env.PREVIOUS_AVAILABLE === 'true',
      previousDigest: env.PREVIOUS_DIGEST,
      newDigest: env.NEW_DIGEST,
      machinesNow: readJson(path),
    });
    console.log(`Rollback decision: ${d.action} - ${d.reason}`);
    append(env.GITHUB_OUTPUT, `action=${d.action}\nreason=${d.reason}\n`);
  } else if (command === 'summary') {
    const text = summaryMarkdown({
      tag: env.RELEASE_TAG,
      failedStep: env.FAILED_STEP,
      newImage: env.NEW_IMAGE,
      decision: { action: env.ACTION || 'unavailable', reason: env.DECISION_REASON || 'no rollback decision was made' },
      previousImage: env.PREVIOUS_IMAGE,
      previousDigest: env.PREVIOUS_DIGEST,
      captureReason: env.CAPTURE_REASON,
      rollbackResult: env.ROLLBACK_RESULT,
    });
    console.log(text);
    append(env.GITHUB_STEP_SUMMARY, text);
  } else {
    console.log('usage: deploy-rollback.mjs capture|decide <machines.json> | summary');
    process.exitCode = 2;
  }
}
