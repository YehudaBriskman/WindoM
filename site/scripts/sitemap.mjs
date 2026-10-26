import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from '../vite.config.ts';

/**
 * Writes dist/sitemap.xml from the same PAGES list the build uses.
 *
 * robots.txt has advertised `https://windom.app/sitemap.xml` all along and the
 * file did not exist - a 404 on a URL the site tells crawlers to fetch. Built
 * rather than hand-written so it cannot drift from the pages that actually
 * exist, which is how a hand-written sitemap ends up listing a page that was
 * renamed six months ago.
 */

const ORIGIN = 'https://windom.app';
const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../dist/sitemap.xml');

/** The home page is `/`, everything else keeps its `.html`. */
const pathOf = (page) => (page === 'index' ? '/' : `/${page}.html`);

/** Pages that exist in both languages, so each can point at its twin. */
const twins = new Set(
  PAGES.filter((p) => p.startsWith('he/')).map((p) => p.slice(3)),
);

const urls = PAGES.map((page) => {
  const loc = ORIGIN + pathOf(page);
  const bare = page.replace(/^he\//, '');
  const alternates = twins.has(bare)
    ? [
        `    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}${pathOf(bare)}" />`,
        `    <xhtml:link rel="alternate" hreflang="he" href="${ORIGIN}${pathOf('he/' + bare)}" />`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${pathOf(bare)}" />`,
      ].join('\n')
    : '';

  // The home page is the entry point; the guide is the page people are sent to.
  const priority = page === 'index' ? '1.0' : page === 'guide' ? '0.9' : '0.7';

  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    alternates,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
});

writeFileSync(
  out,
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`,
);

console.log(`sitemap: ${PAGES.length} urls`);
