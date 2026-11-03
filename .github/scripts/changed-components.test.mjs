import assert from 'node:assert/strict';
import { test } from 'node:test';
import { changedComponents, componentsOf, diffRange } from './changed-components.mjs';

const none = { backend: false, web: false, site: false };
const all = { backend: true, web: true, site: true };
const A = 'a'.repeat(40);
const B = 'b'.repeat(40);

test('each tree selects only itself', () => {
  assert.deepEqual(changedComponents(['backend/src/app.ts']), { ...none, backend: true });
  assert.deepEqual(changedComponents(['web/src/main.tsx']), { ...none, web: true });
  assert.deepEqual(changedComponents(['site/src/pages/guide.tsx']), { ...none, site: true });
});

test('a change across trees selects each of them', () => {
  assert.deepEqual(changedComponents(['backend/a.ts', 'site/b.tsx']), { backend: true, web: false, site: true });
});

// The release scripts' tests run inside the backend job, and a workflow can
// change what any job does, so .github/ must never narrow the run.
for (const f of ['.github/workflows/ci.yml', '.github/scripts/release-package.mjs', '.github/dependabot.yml', '.gitattributes']) {
  test(`${f} runs everything`, () => {
    assert.deepEqual(changedComponents([f]), all);
  });
}

test('the local Postgres setup belongs to the backend', () => {
  assert.deepEqual(changedComponents(['docker-compose.yml']), { ...none, backend: true });
  assert.deepEqual(changedComponents(['.env.example']), { ...none, backend: true });
});

test('files no build reads select nothing', () => {
  assert.deepEqual(changedComponents(['README.md', 'docs/ci-optimization-plan.md', 'LICENSE']), none);
  assert.deepEqual(changedComponents(['README.md', '.github/assets/preview.webp']), none);
  assert.deepEqual(changedComponents([]), none);
});

// The site's release feed is parsed from it at build time (#374), so a
// changelog edit can break the site build.
test('the changelog belongs to the site', () => {
  assert.deepEqual(changedComponents(['CHANGELOG.md']), { ...none, site: true });
});

// A prefix match on "web" would also catch "website/"; it must be the directory.
test('a lookalike directory name does not match', () => {
  assert.deepEqual(componentsOf('website/x'), []);
  assert.deepEqual(componentsOf('backend-notes.md'), []);
});

test('a pull request diffs from the merge base', () => {
  assert.deepEqual(diffRange({ event: 'pull_request', base: A, head: B }), { base: A, head: B, mergeBase: true });
});

test('a push diffs from the previous tip', () => {
  assert.deepEqual(diffRange({ event: 'push', before: A, head: B }), { base: A, head: B, mergeBase: false });
});

// null means "run everything", never "run nothing".
test('anything that cannot be pinned down runs everything', () => {
  assert.equal(diffRange({ event: 'push', before: '0'.repeat(40), head: B }), null);
  assert.equal(diffRange({ event: 'push', before: '', head: B }), null);
  assert.equal(diffRange({ event: 'pull_request', base: '', head: B }), null);
  assert.equal(diffRange({ event: 'pull_request', base: A, head: 'main' }), null);
  assert.equal(diffRange({ event: 'workflow_dispatch', base: A, head: B }), null);
});
