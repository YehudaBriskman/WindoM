import { writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Writes dist/sitemap.xml from the route table.
 *
 * Clean URLs only. The `.html` twins exist so the Chrome Web Store's registered
 * links keep resolving, and each of them declares the clean URL as canonical -
 * listing both here would ask a search engine to index two addresses for one
 * page, which is the thing canonical exists to prevent.
 *
 * Every URL carries a `<lastmod>`: the date of the last commit that touched the
 * route's page component. Google ignores `<priority>` and `<changefreq>` but
 * does read `<lastmod>` when it proves accurate, and it is the one sitemap
 * signal that moves a page out of "Discovered - currently not indexed" sooner.
 * It is therefore the date the page's own copy changed, not the build date: a
 * lastmod that changes on every deploy is learnt as noise and then ignored for
 * the whole site.
 */

const ORIGIN = 'https://windom.app';
const here = dirname(fileURLToPath(import.meta.url));
const { ROUTES } = await import(resolve(here, '../dist-prerender/prerender.js'));

const siteRoot = resolve(here, '..');
const lastmods = lastmodDates();

const urls = ROUTES.map((route) => {
  const loc = `${ORIGIN}${route.path}`;
  const lastmod = lastmods?.get(route.path);

  const twins = route.twinOf ? ROUTES.filter((r) => r.twinOf === route.twinOf) : [];
  const alternates = twins.length
    ? [
        ...twins.map((r) => `    <xhtml:link rel="alternate" hreflang="${r.locale}" href="${ORIGIN}${r.path}" />`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${
          twins.find((r) => r.locale === 'en')?.path ?? route.path
        }" />`,
      ].join('\n')
    : '';

  // The home page is the entry point; the guide is where people are sent.
  const priority =
    route.path === '/' ? '1.0' : route.path.endsWith('/guide') ? '0.9' : route.path.includes('/guide/') ? '0.8' : '0.7';

  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    lastmod && `    <lastmod>${lastmod}</lastmod>`,
    alternates,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ]
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

/**
 * The page component a route renders, by the convention the route table
 * follows: `/` -> pages/Home.tsx, `/he` -> pages/he/Home.tsx,
 * `/he/guide/tab-sidebar` -> pages/he/guide/TabSidebar.tsx. A route that breaks
 * the convention fails the build here rather than shipping without a date.
 */
function sourceOf(path) {
  const segments = path.split('/').filter(Boolean);
  const isLocaleRoot = segments.length === 0 || (segments.length === 1 && segments[0] === 'he');
  const name = isLocaleRoot
    ? 'Home'
    : segments
        .pop()
        .split('-')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join('');
  return resolve(siteRoot, 'src/pages', ...segments, `${name}.tsx`);
}

/**
 * path -> YYYY-MM-DD, or null when git history is not available. A shallow
 * clone would date every page to the newest commit, which is exactly the
 * noise described above, so in CI that is an error and locally a warning.
 */
function lastmodDates() {
  let shallow;
  try {
    shallow = git('rev-parse', '--is-shallow-repository') === 'true';
  } catch {
    shallow = null;
  }
  if (shallow !== false) {
    const why = shallow ? 'the checkout is shallow (set fetch-depth: 0)' : 'git is not available';
    if (process.env.CI) {
      console.error(`sitemap: cannot date pages - ${why}`);
      process.exit(1);
    }
    console.warn(`sitemap: writing without <lastmod> - ${why}`);
    return null;
  }

  const dates = new Map();
  const missing = [];
  for (const route of ROUTES) {
    const file = sourceOf(route.path);
    if (!existsSync(file)) {
      missing.push(`${route.path} -> ${relative(siteRoot, file)}`);
      continue;
    }
    const date = git('log', '-1', '--format=%cs', '--', file);
    if (date) dates.set(route.path, date);
  }
  if (missing.length) {
    console.error(`sitemap: no page component where the convention expects one:\n  ${missing.join('\n  ')}`);
    process.exit(1);
  }
  return dates;
}

function git(...args) {
  return execFileSync('git', args, { cwd: siteRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function out() {
  return resolve(here, '../dist/sitemap.xml');
}

console.log(`sitemap: ${ROUTES.length} urls`);
