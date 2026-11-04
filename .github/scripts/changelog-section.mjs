import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * The CHANGELOG.md section for one version, used as the GitHub Release notes.
 *
 * Returns the text between `## [<version>]` and the next `## [` heading (or the
 * end), trimmed, without the heading itself (the release title carries it), or
 * null when the version has no section. A release whose notes are missing should
 * fail loudly rather than publish an empty page.
 */
export function changelogSection(text, version) {
  const v = String(version).replace(/^v/, '');
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(`## [${v}]`));
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith('## ['));
  const body = (end === -1 ? rest : rest.slice(0, end)).join('\n').replace(/\n-{3,}\s*$/, '').trim();
  return body || null;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [version, file = 'CHANGELOG.md'] = process.argv.slice(2);
  const section = version ? changelogSection(readFileSync(file, 'utf8'), version) : null;
  if (!section) {
    console.error(`::error::${file} has no section for ${version || '(no version given)'}`);
    process.exit(1);
  }
  process.stdout.write(`${section}\n`);
}
