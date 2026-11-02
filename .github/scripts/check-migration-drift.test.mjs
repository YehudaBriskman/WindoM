import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { uncommittedPaths } from './check-migration-drift.mjs';

test('a clean tree has nothing uncommitted', () => {
  assert.deepEqual(uncommittedPaths(''), []);
  assert.deepEqual(uncommittedPaths('\n'), []);
});

test('lists modified, new and renamed paths', () => {
  assert.deepEqual(
    uncommittedPaths(' M drizzle/meta/_journal.json\n?? drizzle/0008_new.sql\nR  drizzle/a.sql -> drizzle/b.sql\n'),
    ['drizzle/meta/_journal.json', 'drizzle/0008_new.sql', 'drizzle/a.sql -> drizzle/b.sql'],
  );
});

// The defect, against real git: `git diff` is blind to a new untracked
// migration, `git status --porcelain` is not.
test('a newly generated, untracked migration is caught where git diff saw nothing', () => {
  const repo = mkdtempSync(join(tmpdir(), 'drift-'));
  const g = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' });
  try {
    g('init', '-q');
    g('config', 'user.email', 'ci@example.invalid');
    g('config', 'user.name', 'ci');
    mkdirSync(join(repo, 'drizzle', 'meta'), { recursive: true });
    writeFileSync(join(repo, 'drizzle', 'meta', '_journal.json'), '{}\n');
    g('add', '.');
    g('commit', '-qm', 'init');

    writeFileSync(join(repo, 'drizzle', '0008_new_column.sql'), 'ALTER TABLE x ADD y int;\n');

    // What the old check ran: exit 0, i.e. "no drift".
    execFileSync('git', ['-C', repo, 'diff', '--exit-code', '--', 'drizzle']);

    const out = g('status', '--porcelain=v1', '--untracked-files=all', '--', 'drizzle');
    assert.deepEqual(uncommittedPaths(out), ['drizzle/0008_new_column.sql']);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
