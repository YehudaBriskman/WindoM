import { renderToString } from 'react-dom/server';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { ROUTES, legacyPathOf, titleFor, type SiteRoute } from './routes';
import { RouteChrome } from './components/RouteChrome';
import { NotFound } from './pages/NotFound';
import { AUTHOR, FEATURES, GITHUB_URL, PROJECT_PAGE, STORE_URL } from './lib/site';
// The extension's own version, so the structured data cannot lag a release.
// It was a hardcoded string that every release had to remember to bump.
import manifest from '../../web/manifest.json' with { type: 'json' };

/**
 * Renders every route to static HTML at build time.
 *
 * The site is client-routed now, but each route still ships as a real file:
 * first load is complete HTML with no JavaScript required, and the router takes
 * over only for subsequent navigation. That is strictly more than the
 * multi-page build offered, not a trade - the OAuth reviewer reading the
 * privacy policy and the crawler indexing it both still get the full text.
 *
 * `createMemoryRouter` rather than a static-router helper: react-router 8
 * exports only `.` and `./dom`, with no server entry, and a memory router
 * pinned to one location renders identically for a static dump.
 *
 * `renderToString` rather than `renderToStaticMarkup`, which is for output
 * nothing will ever hydrate: it omits the comment nodes that separate adjacent
 * text children, so the client finds one text node where it rendered two and
 * discards the whole tree as a mismatch. The markup is a few bytes larger and
 * it hydrates instead of re-rendering from scratch.
 */

// Re-exported so scripts/sitemap.mjs reads the same table this renders.
export { ROUTES };

const ORIGIN = 'https://windom.app';

export interface Rendered {
  /** Every file this route is written to, relative to dist. */
  files: string[];
  html: string;
  head: string;
  lang: string;
  dir: 'ltr' | 'rtl';
  /** Route metadata, carried so the search index can be built from this pass. */
  path: string;
  title: string;
  locale: string;
  group?: string;
}

/** `/privacy` -> `privacy/index.html`, `/` -> `index.html`. */
function cleanFile(path: string): string {
  return path === '/' ? 'index.html' : `${path.slice(1)}/index.html`;
}

/** `/privacy` -> `privacy.html`. */
function legacyFile(path: string): string {
  return legacyPathOf(path).slice(1);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * The head for one route.
 *
 * Canonical points at the clean URL even in the `.html` twin, so a search
 * engine consolidates on the address we intend to keep while the store's
 * registered link goes on working.
 */
function headFor(route: SiteRoute): string {
  const canonical = `${ORIGIN}${route.path}`;
  const title = titleFor(route);
  const image = `${ORIGIN}/images/banner.png`;

  const twins = route.twinOf ? ROUTES.filter((r) => r.twinOf === route.twinOf) : [];
  const alternates = twins.length
    ? [
        ...twins.map((r) => `    <link rel="alternate" hreflang="${r.locale}" href="${ORIGIN}${r.path}" />`),
        `    <link rel="alternate" hreflang="x-default" href="${ORIGIN}${
          twins.find((r) => r.locale === 'en')?.path ?? route.path
        }" />`,
      ].join('\n')
    : '';

  const app = {
    '@type': 'SoftwareApplication',
    '@id': `${ORIGIN}/#app`,
    name: 'WindoM',
    alternateName: ['Windom', 'WindoM new tab'],
    applicationCategory: 'BrowserApplication',
    applicationSubCategory: 'New tab page',
    operatingSystem: 'Chrome',
    url: ORIGIN,
    image: image,
    description: route.description,
    featureList: FEATURES,
    inLanguage: ['en', 'he'],
    softwareVersion: manifest.version,
    license: 'https://opensource.org/licenses/MIT',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: {
      '@type': 'Person',
      '@id': AUTHOR.id,
      name: AUTHOR.name,
      alternateName: AUTHOR.alternateName,
      url: AUTHOR.url,
      sameAs: AUTHOR.sameAs,
    },
    downloadUrl: STORE_URL,
    installUrl: STORE_URL,
    softwareHelp: { '@type': 'CreativeWork', url: `${ORIGIN}/guide` },
    sameAs: [STORE_URL, GITHUB_URL, PROJECT_PAGE],
    privacyPolicy: `${ORIGIN}/privacy`,
  };
  const website = {
    '@type': 'WebSite',
    '@id': `${ORIGIN}/#website`,
    url: ORIGIN,
    name: 'WindoM',
    alternateName: ['Windom', 'windom.app'],
    inLanguage: ['en', 'he'],
    publisher: { '@id': AUTHOR.id },
  };
  // Every other page says where it sits. Breadcrumbs are true of the route
  // table and nothing else, so they are derived from it rather than authored.
  const breadcrumbs = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'WindoM', item: ORIGIN },
      { '@type': 'ListItem', position: 2, name: route.title, item: canonical },
    ],
  };
  const graph = route.path === '/' ? [app, website] : [breadcrumbs];
  const structured = `    <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  })}</script>`;

  return [
    `    <title>${escapeHtml(title)}</title>`,
    `    <meta name="description" content="${escapeHtml(route.description)}" />`,
    `    <link rel="canonical" href="${canonical}" />`,
    alternates,
    `    <meta name="author" content="${AUTHOR.name}" />`,
    '    <meta name="robots" content="index, follow, max-image-preview:large" />',
    '    <meta property="og:type" content="website" />',
    `    <meta property="og:locale" content="${route.locale === 'he' ? 'he_IL' : 'en_US'}" />`,
    '    <meta property="og:site_name" content="WindoM" />',
    `    <meta property="og:title" content="${escapeHtml(title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(route.description)}" />`,
    `    <meta property="og:url" content="${canonical}" />`,
    `    <meta property="og:image" content="${image}" />`,
    '    <meta property="og:image:alt" content="The WindoM new tab: clock, greeting and quick links over a full-bleed wallpaper" />',
    '    <meta name="twitter:card" content="summary_large_image" />',
    `    <meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
    `    <meta name="twitter:image" content="${image}" />`,
    '    <meta name="twitter:image:alt" content="The WindoM new tab: clock, greeting and quick links over a full-bleed wallpaper" />',
    structured,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * The not-found page, written to dist/404.html.
 *
 * GitHub Pages serves that file for any path it has no file for, so this is
 * what a mistyped URL lands on. Generated from the same shell as every route
 * rather than kept as a static file in public/, because a static copy cannot
 * reference the hashed bundle and would be a dead page with no styling.
 */
function renderNotFound(): Rendered {
  const router = createMemoryRouter([{ element: <RouteChrome />, children: [{ path: '*', element: <NotFound /> }] }], {
    initialEntries: ['/not-found'],
  });

  return {
    files: ['404.html'],
    html: renderToString(<RouterProvider router={router} />),
    path: '/not-found',
    title: 'Page not found',
    locale: 'en',
    head: [
      '    <title>Page not found - WindoM</title>',
      '    <meta name="robots" content="noindex" />',
      '    <meta name="description" content="That address does not exist on windom.app." />',
    ].join('\n'),
    lang: 'en',
    dir: 'ltr',
  };
}

/** Renders every route, plus the not-found page. */
export function renderAll(): Rendered[] {
  const pages: Rendered[] = ROUTES.map((route) => {
    // The same layout the browser router mounts, so the tree being hydrated
    // matches the tree that was rendered. It emits no markup of its own.
    const router = createMemoryRouter(
      [{ element: <RouteChrome />, children: [{ path: route.path, element: route.element }] }],
      { initialEntries: [route.path] },
    );

    // Both shapes for every route - see emittedPaths() in routes.tsx for why the
    // flat file is not optional on Pages. The root's flat shape is index.html itself.
    const files = route.path === '/' ? [cleanFile(route.path)] : [cleanFile(route.path), legacyFile(route.path)];

    return {
      files,
      html: renderToString(<RouterProvider router={router} />),
      head: headFor(route),
      lang: route.locale,
      dir: route.locale === 'he' ? 'rtl' : 'ltr',
      path: route.path,
      title: route.title,
      locale: route.locale,
      group: route.group,
    };
  });

  return [...pages, renderNotFound()];
}
