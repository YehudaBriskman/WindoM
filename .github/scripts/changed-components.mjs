import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * Which CI components a change touches, so CI checks those and skips the rest.
 *
 * Measured on main's last 120 commits (2026-11-03): 68 touched exactly one of
 * backend / web / site, yet every one ran all three suites, including a
 * Postgres-backed backend run for a CSS change to the marketing site.
 *
 * The rules lean towards running. Anything under .github/ (the workflows, and
 * the release scripts whose tests run in the backend job) runs everything. So
 * does a change no rule recognises inside a component's tree. Only files no
 * build reads (README, CHANGELOG, docs/, LICENSE...) select nothing; nothing
 * in backend/, web/ or site/ reads a file outside its own directory.
 *
 * A skipped job counts as passing for a required status check, so the
 * required "Backend" and "Web" checks still gate every PR.
 */

export const COMPONENTS = ['backend', 'web', 'site'];

const ALL = Object.freeze(Object.fromEntries(COMPONENTS.map((c) => [c, true])));

/** @param {string} file a repo-relative path */
export function componentsOf(file) {
  // README images: no build reads them (measured: #420 was ten of these and the
  // README, and ran all three suites).
  if (file.startsWith('.github/assets/')) return [];
  if (file.startsWith('.github/') || file === '.gitattributes') return COMPONENTS;
  if (file.startsWith('backend/') || file === 'docker-compose.yml' || file === '.env.example') return ['backend'];
  if (file.startsWith('web/')) return ['web'];
  if (file.startsWith('site/')) return ['site'];
  return [];
}

/** @param {string[]} files @returns {{backend: boolean, web: boolean, site: boolean}} */
export function changedComponents(files) {
  const out = Object.fromEntries(COMPONENTS.map((c) => [c, false]));
  for (const f of files) for (const c of componentsOf(f)) out[c] = true;
  return out;
}

const SHA = /^[0-9a-f]{40}$/;

/**
 * The range to diff. A pull request compares against the merge base, as
 * GitHub's own "Files changed" does. A push compares against the previous
 * tip. Anything that cannot be pinned down returns null, which runs everything.
 */
export function diffRange({ event, base, head, before }) {
  if (!SHA.test(head ?? '')) return null;
  if (event === 'pull_request') return SHA.test(base ?? '') ? { base, head, mergeBase: true } : null;
  if (event === 'push') {
    // A new branch or a force push has no usable "before".
    if (!SHA.test(before ?? '') || /^0+$/.test(before)) return null;
    return { base: before, head, mergeBase: false };
  }
  return null;
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const range = diffRange({
    event: process.env.EVENT,
    base: process.env.BASE_SHA,
    head: process.env.HEAD_SHA,
    before: process.env.BEFORE_SHA,
  });

  let result = ALL;
  let why = 'no usable diff range';
  if (range) {
    try {
      const from = range.mergeBase ? git('merge-base', range.base, range.head) : range.base;
      const files = git('diff', '--name-only', '--no-renames', from, range.head).split('\n').filter(Boolean);
      result = changedComponents(files);
      why = `${files.length} file(s) changed between ${from.slice(0, 7)} and ${range.head.slice(0, 7)}`;
    } catch (error) {
      result = ALL;
      why = `git could not compute the diff (${String(error.message).split('\n')[0]})`;
    }
  }
  if (result === ALL) console.log(`::notice::Running every component: ${why}.`);
  else console.log(why);

  for (const c of COMPONENTS) console.log(`  ${c.padEnd(8)} ${result[c] ? 'run' : 'skip'}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, COMPONENTS.map((c) => `${c}=${result[c]}\n`).join(''));
  }
}
