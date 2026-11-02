import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * Resolves the release tag to ONE commit, once, before anything is checked.
 *
 * Every job in release-gate.yml used to check out the triggering ref. On a tag
 * push that is the tag, but on a manual publish (`workflow_dispatch` with
 * `inputs.tag`) it is the branch the dispatch ran from - while the publish job
 * checked out `inputs.tag` and uploaded THAT. The gate could pass on main's
 * code and the store receive a different commit. The version check did not
 * catch it: main and the tag usually declare the same version, and a version
 * string says nothing about which source produced it.
 *
 * So the gate's first job turns the tag into a SHA, proves the SHA is on main,
 * and every later checkout - gate, deploy and publish - uses that SHA.
 *
 * Two modes:
 *   requireTag  (every real release - both tag-triggered workflows and a manual
 *               publish): the tag must exist, must be on main, and on a tag
 *               push must be the commit that triggered the run.
 *   dry run     (release-gate.yml dispatched by hand to rehearse a version
 *               before tagging): a tag that does not exist yet is allowed, and
 *               the dispatch ref's commit is checked instead - from any branch,
 *               which is what a rehearsal is for. A dry run never releases;
 *               only the two release workflows act on the gate's result.
 */

const TAG_SHAPE = /^v?\d+(\.\d+){0,3}$/;
const SHA_SHAPE = /^[0-9a-f]{40}$/;

/**
 * Pure decision. Inputs are facts already read from git; returns the SHA to
 * release (or rehearse) and every reason it may not.
 *
 * @param {object} p
 * @param {string} p.tag          the tag being released, e.g. v1.5.1
 * @param {string|null} p.tagSha  the commit the tag points at, or null if no such tag
 * @param {boolean} p.tagOnMain   is tagSha an ancestor of origin/main
 * @param {string} p.refType      github.ref_type of the run ('tag' | 'branch')
 * @param {string} p.eventSha     github.sha of the run
 * @param {boolean} p.requireTag  a real release (true) or a dry run (false)
 */
export function decideReleaseRef({ tag, tagSha, tagOnMain, refType, eventSha, requireTag }) {
  const errors = [];
  const name = typeof tag === 'string' ? tag.trim().replace(/^refs\/tags\//, '') : '';

  if (!name) {
    return { sha: null, dryRun: false, errors: ['Missing release tag: expected something like v1.5.0'] };
  }
  // Checked before git sees it: the value reaches a shell and a git revision
  // parser, and only a version-shaped tag is a release anyway.
  if (!TAG_SHAPE.test(name)) {
    return { sha: null, dryRun: false, errors: [`"${name}" is not a release tag (expected v1.2.3)`] };
  }
  if (tagSha !== null && tagSha !== undefined && !SHA_SHAPE.test(tagSha)) {
    return { sha: null, dryRun: false, errors: [`git resolved ${name} to "${tagSha}", which is not a commit id`] };
  }

  if (!tagSha) {
    if (requireTag) {
      return { sha: null, dryRun: false, errors: [`Tag ${name} does not exist. A release publishes an existing tag.`] };
    }
    if (!SHA_SHAPE.test(eventSha ?? '')) {
      return { sha: null, dryRun: true, errors: [`No commit to rehearse: event sha is "${eventSha}"`] };
    }
    // Rehearsing a version that is not tagged yet: check the dispatch ref.
    return { sha: eventSha, dryRun: true, errors: [] };
  }

  // A tag push must release the commit that was pushed. A tag moved between
  // the push and this job would otherwise swap the code under a running gate.
  if (refType === 'tag' && tagSha !== eventSha) {
    errors.push(`Tag ${name} points at ${tagSha} but this run was triggered for ${eventSha}. Was the tag moved?`);
  }

  // Releases come from reviewed history. This used to be skipped for every
  // manual run, which is exactly the path that publishes an arbitrary tag.
  if (requireTag && !tagOnMain) {
    errors.push(
      `Tag ${name} (${tagSha}) is not on main. Release tags must point at reviewed history that ` +
      'has been merged to main. Merge the work first, then tag the resulting commit.',
    );
  }

  return { sha: tagSha, dryRun: !requireTag, errors };
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function tryGit(...args) {
  try {
    return { ok: true, out: git(...args) };
  } catch {
    return { ok: false, out: '' };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const tag = (process.env.RELEASE_TAG ?? '').trim().replace(/^refs\/tags\//, '');
  const requireTag = process.env.REQUIRE_TAG === 'true';
  // Only ask git about something tag-shaped; the pure check reports the rest.
  const resolved = TAG_SHAPE.test(tag) ? tryGit('rev-parse', '--verify', '--quiet', `refs/tags/${tag}^{commit}`) : { ok: false };
  const tagSha = resolved.ok ? resolved.out : null;
  const tagOnMain = tagSha ? tryGit('merge-base', '--is-ancestor', tagSha, 'origin/main').ok : false;

  const { sha, dryRun, errors } = decideReleaseRef({
    tag,
    tagSha,
    tagOnMain,
    refType: process.env.GITHUB_REF_TYPE ?? '',
    eventSha: process.env.GITHUB_SHA ?? '',
    requireTag,
  });

  for (const error of errors) console.log(`::error::${error}`);
  if (errors.length) {
    process.exitCode = 1;
  } else {
    console.log(`${dryRun ? 'Rehearsing' : 'Releasing'} ${tag} at ${sha}${dryRun && !tagSha ? ' (tag not created yet - dispatch ref)' : ''}`);
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `sha=${sha}\ntag=${tag}\ndry_run=${dryRun}\n`);
    }
  }
}
