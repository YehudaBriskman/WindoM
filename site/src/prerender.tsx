import { renderToString } from 'react-dom/server';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { ROUTES, legacyPathOf, titleFor, type SiteRoute } from './routes';
import { RouteChrome } from './components/RouteChrome';
import { NotFound } from './pages/NotFound';

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
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
        ...twins.map(
          (r) => `    <link rel="alternate" hreflang="${r.locale}" href="${ORIGIN}${r.path}" />`,
        ),
        `    <link rel="alternate" hreflang="x-default" href="${ORIGIN}${
          twins.find((r) => r.locale === 'en')?.path ?? route.path
        }" />`,
      ].join('\n')
    : '';

  const structured =
    route.path === '/'
      ? `    <script type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'WindoM',
          applicationCategory: 'BrowserApplication',
          operatingSystem: 'Chrome',
          url: ORIGIN,
          description: route.description,
          softwareVersion: '1.5.1',
          license: 'https://opensource.org/licenses/MIT',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          author: {
            '@type': 'Person',
            name: 'Yehuda Briskman',
            url: 'https://yehudabriskman.com',
          },
          downloadUrl:
            'https://chromewebstore.google.com/detail/windom/comcnbccalbfcegbmaemancbhgpijkpb',
          privacyPolicy: `${ORIGIN}/privacy`,
        })}</script>`
      : '';

  return [
    `    <title>${escapeHtml(title)}</title>`,
    `    <meta name="description" content="${escapeHtml(route.description)}" />`,
    `    <link rel="canonical" href="${canonical}" />`,
    alternates,
    '    <meta property="og:type" content="website" />',
    '    <meta property="og:site_name" content="WindoM" />',
    `    <meta property="og:title" content="${escapeHtml(title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(route.description)}" />`,
    `    <meta property="og:url" content="${canonical}" />`,
    `    <meta property="og:image" content="${image}" />`,
    '    <meta name="twitter:card" content="summary_large_image" />',
    `    <meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
    `    <meta name="twitter:image" content="${image}" />`,
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
  const router = createMemoryRouter(
    [{ element: <RouteChrome />, children: [{ path: '*', element: <NotFound /> }] }],
    { initialEntries: ['/not-found'] },
  );

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

    const files = [cleanFile(route.path)];
    if (route.legacyHtml) files.push(legacyFile(route.path));

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
