import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Writes dist/sitemap.xml from the route table.
 *
 * Clean URLs only. The `.html` twins exist so the Chrome Web Store's registered
 * links keep resolving, and each of them declares the clean URL as canonical -
 * listing both here would ask a search engine to index two addresses for one
 * page, which is the thing canonical exists to prevent.
 */

const ORIGIN = 'https://windom.app';
const here = dirname(fileURLToPath(import.meta.url));
const { ROUTES } = await import(resolve(here, '../dist-prerender/prerender.js'));

const urls = ROUTES.map((route) => {
  const loc = `${ORIGIN}${route.path}`;

  const twins = route.twinOf ? ROUTES.filter((r) => r.twinOf === route.twinOf) : [];
  const alternates = twins.length
    ? [
        ...twins.map(
          (r) => `    <xhtml:link rel="alternate" hreflang="${r.locale}" href="${ORIGIN}${r.path}" />`,
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${
          twins.find((r) => r.locale === 'en')?.path ?? route.path
        }" />`,
      ].join('\n')
    : '';

  // The home page is the entry point; the guide is where people are sent.
  const priority = route.path === '/' ? '1.0' : route.path.endsWith('/guide') ? '0.9' : '0.7';

  return ['  <url>', `    <loc>${loc}</loc>`, alternates, `    <priority>${priority}</priority>`, '  </url>']
    .filter(Boolean)
    .join('\n');
});

writeFileSync(
  out(),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`,
);

function out() {
  return resolve(here, '../dist/sitemap.xml');
}

console.log(`sitemap: ${ROUTES.length} urls`);
