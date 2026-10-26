import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Injects build-time HTML into the pages that need to be readable without
 * JavaScript. See src/prerender.tsx for why.
 *
 * Runs after both builds: the client build produces dist/*.html with an empty
 * root, and the SSR build produces the module that renders each page's markup.
 */

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..');
const dist = resolve(siteRoot, 'dist');
const ssrEntry = resolve(siteRoot, 'dist-prerender/prerender.js');

/** The empty mount point the client build leaves behind. */
const EMPTY_ROOT = '<div id="root"></div>';

if (!existsSync(ssrEntry)) {
  console.error(`prerender: missing ${ssrEntry} - run the --ssr build first`);
  process.exit(1);
}

const { prerendered } = await import(ssrEntry);
const failures = [];

for (const [page, render] of Object.entries(prerendered)) {
  const target = resolve(dist, page);
  if (!existsSync(target)) {
    failures.push(`${page}: not found in dist - did the page name change?`);
    continue;
  }

  const shell = readFileSync(target, 'utf8');
  if (!shell.includes(EMPTY_ROOT)) {
    // Either already injected, or the markup changed shape. Either way, silently
    // leaving the page client-only is how this regresses unnoticed.
    failures.push(`${page}: no empty ${EMPTY_ROOT} to replace`);
    continue;
  }

  const markup = render();
  if (!markup || markup.length < 500) {
    failures.push(`${page}: rendered only ${markup?.length ?? 0} characters`);
    continue;
  }

  writeFileSync(target, shell.replace(EMPTY_ROOT, `<div id="root">${markup}</div>`));
  console.log(`prerender: ${page} (+${markup.length} characters)`);
}

if (failures.length) {
  for (const failure of failures) console.error(`prerender: ${failure}`);
  process.exit(1);
}
