import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSearchIndex } from './search-index.mjs';

/**
 * Writes one static file per route from the single built shell.
 *
 * The client build emits `dist/index.html` with the hashed asset links; this
 * uses it as the template and fills in the markup and head for each route. The
 * shell is therefore written once and shared, which is what the thirteen
 * hand-maintained HTML files were replaced by.
 *
 * Every route is written twice where its `.html` URL is registered elsewhere -
 * the Chrome Web Store listing, and the guide link compiled into the extension.
 * Both are real prerendered pages rather than redirect stubs, so the store's
 * link is not a second-class URL.
 */

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..');
const dist = resolve(siteRoot, 'dist');
const ssrEntry = resolve(siteRoot, 'dist-prerender/prerender.js');
const shellPath = resolve(dist, 'index.html');

if (!existsSync(ssrEntry)) {
  console.error(`prerender: missing ${ssrEntry} - run the --ssr build first`);
  process.exit(1);
}
if (!existsSync(shellPath)) {
  console.error(`prerender: missing ${shellPath} - run the client build first`);
  process.exit(1);
}

const shell = readFileSync(shellPath, 'utf8');
for (const marker of ['<!--app-->', '<!--head-->']) {
  if (!shell.includes(marker)) {
    console.error(`prerender: the shell has no ${marker} to fill`);
    process.exit(1);
  }
}

const { renderAll } = await import(ssrEntry);
const rendered = renderAll();
const failures = [];
let written = 0;

for (const page of rendered) {
  // A route that renders almost nothing is a route that failed to render. The
  // threshold catches it here rather than on the live site. The not-found page
  // is legitimately short, so it is held to a lower bar than a document.
  const floor = page.files[0] === '404.html' ? 200 : 500;
  if (!page.html || page.html.length < floor) {
    failures.push(`${page.files[0]}: rendered only ${page.html?.length ?? 0} characters, needed ${floor}`);
    continue;
  }

  const html = shell
    .replace('<!--head-->', page.head)
    .replace('<!--app-->', page.html)
    .replace('<html lang="en">', `<html lang="${page.lang}" dir="${page.dir}">`);

  for (const file of page.files) {
    const target = resolve(dist, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, html);
    written += 1;
  }

  console.log(`prerender: ${page.files.join('  +  ')}  (${page.html.length} characters)`);
}

if (failures.length) {
  for (const failure of failures) console.error(`prerender: ${failure}`);
  process.exit(1);
}

// Built from the markup above rather than in a pass of its own, so the index
// cannot describe a version of a page that is no longer what gets served.
const index = buildSearchIndex(rendered);
const sections = index.pages.reduce((n, page) => n + page.s.length, 0);
if (!index.pages.length) {
  console.error('prerender: the search index came out empty - no page had a content column');
  process.exit(1);
}
const indexJson = JSON.stringify(index);
writeFileSync(resolve(dist, 'search-index.json'), indexJson);

console.log(`prerender: ${rendered.length} routes, ${written} files`);
// Bytes, not characters: the Hebrew half of the index is two bytes per
// character, so a length in characters understates the download by a quarter.
const indexBytes = Buffer.byteLength(indexJson, 'utf8');
console.log(
  `prerender: search index ${index.pages.length} pages, ${sections} sections, ` +
    `${(indexBytes / 1024).toFixed(1)} KB`,
);
