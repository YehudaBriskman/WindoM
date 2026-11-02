import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/**
 * After `drizzle-kit generate`, anything changed OR NEW under the migrations
 * directory means schema.ts moved without a committed migration.
 *
 * This used to be `git diff --exit-code -- drizzle`, which compares tracked
 * files only. The common case of drift is exactly the one it cannot see:
 * `generate` writes a brand-new, untracked NNNN_name.sql (and edits the
 * journal, which it would have caught - unless the journal change was
 * committed and the .sql was not). `git status --porcelain` lists both.
 *
 * @param {string} porcelain  output of `git status --porcelain=v1 -- <dir>`
 * @returns {string[]} the paths that are not committed
 */
export function uncommittedPaths(porcelain) {
  return (porcelain ?? '')
    .split('\n')
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.trim())
    // "XY path" or "XY old -> new"; the path is what follows the two status columns.
    .map((line) => line.slice(3));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = process.argv[2] ?? 'drizzle';
  // --untracked-files=all so a new file inside a new directory is listed by name.
  const out = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all', '--', dir], { encoding: 'utf8' });
  const paths = uncommittedPaths(out);
  if (paths.length) {
    for (const p of paths) console.log(`::error::not committed: ${p}`);
    console.log('::error::schema.ts has changes with no committed migration.');
    console.log("::error::Run 'npx drizzle-kit generate' in backend/ and commit the result.");
    process.exitCode = 1;
  } else {
    console.log(`No uncommitted or new files under ${dir}/ after generate.`);
  }
}
