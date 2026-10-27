/**
 * Builds the documentation search index from the HTML the prerender just made.
 *
 * The index is extracted from rendered output rather than from the page
 * components, which means it indexes what a reader actually sees: anything a
 * component computes, translates or conditionally omits is already resolved by
 * the time this reads it. The alternative - parsing the sources - would index
 * text that may never render and miss text that does.
 *
 * Only the content column is indexed. The sidebar, the breadcrumbs and the
 * footer appear on every page, so indexing them would make every query match
 * every page on the word "Support".
 */

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
};

function decode(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&(\w+);/g, (match, name) => ENTITIES[name] ?? match);
}

/** Visible text of an HTML fragment, with the self-link glyphs dropped. */
function textOf(html) {
  return decode(
    html
      .replace(/<a\b[^>]*class="heading-anchor"[\s\S]*?<\/a>/g, ' ')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

/** The `<main class="docs-main">` subtree, or null for a page without one. */
function contentOf(html) {
  const open = html.search(/<main\b[^>]*class="docs-main"/);
  if (open === -1) return null;
  const close = html.indexOf('</main>', open);
  return close === -1 ? null : html.slice(open, close);
}

// Enough to recognise the section in a result row without shipping the whole
// page twice - the index is downloaded by anyone who searches.
const SNIPPET = 320;

/**
 * One entry per heading, plus one for the text before the first heading.
 *
 * Sections rather than pages because a documentation page is long: "Spotify"
 * matching the guide is barely an answer, while matching the guide's Spotify
 * heading is one.
 */
function sectionsOf(content) {
  const headings = [...content.matchAll(/<h([23])\b[^>]*\bid="([^"]*)"[^>]*>([\s\S]*?)<\/h\1>/g)];
  const sections = [];

  const intro = textOf(content.slice(0, headings.length ? headings[0].index : content.length));
  if (intro) sections.push({ id: '', h: '', x: intro.slice(0, SNIPPET) });

  headings.forEach((match, i) => {
    const bodyStart = match.index + match[0].length;
    const bodyEnd = i + 1 < headings.length ? headings[i + 1].index : content.length;
    const heading = textOf(match[3]);
    if (!heading) return;
    sections.push({
      id: match[2],
      h: heading,
      x: textOf(content.slice(bodyStart, bodyEnd)).slice(0, SNIPPET),
      // h3s are subsections; the UI shows them indented under their parent.
      ...(match[1] === '3' ? { sub: 1 } : {}),
    });
  });

  return sections;
}

/**
 * The index for every rendered page that has a content column.
 *
 * Short keys because this is downloaded, not read: `p`/`t`/`l`/`g`/`s` cost a
 * comment here and save a fifth of the transfer.
 */
export function buildSearchIndex(rendered) {
  const pages = [];

  for (const page of rendered) {
    if (page.path === '/not-found') continue;
    const content = contentOf(page.html);
    if (!content) continue;

    const sections = sectionsOf(content);
    if (!sections.length) continue;

    pages.push({
      p: page.path,
      t: page.title,
      l: page.locale,
      ...(page.group ? { g: page.group } : {}),
      s: sections,
    });
  }

  return { v: 1, pages };
}

/** Where the dialog fetches the index from, in every environment. */
const INDEX_URL = '/search-index.json';

/**
 * Serves the index under `vite dev`.
 *
 * Only the prerender wrote `search-index.json`, and the prerender only runs in
 * a production build - so `vite dev` served a 404 and the dialog said "Search
 * is unavailable" on every local run. That is the same message a real outage
 * produces, which made a broken search indistinguishable from a search nobody
 * had built the index for, and left the whole feature unexercisable in the one
 * environment where it is being worked on.
 *
 * It renders the routes on demand through the dev server's own module graph
 * rather than reading a file, so the index describes the pages as they are
 * right now, including the edit you made a second ago. The cost is a render of
 * every route per request, which is why `apply: 'serve'` keeps this out of the
 * build and why nothing is cached: the one request happens when a developer
 * opens the dialog.
 */
export function searchIndexDevPlugin() {
  return {
    name: 'windom:search-index-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(INDEX_URL, async (_req, res, next) => {
        try {
          // The same entry the prerender builds from, loaded through Vite so
          // the TSX and its imports resolve the way they do for the browser.
          const { renderAll } = await server.ssrLoadModule('/src/prerender.tsx');
          const body = JSON.stringify(buildSearchIndex(renderAll()));
          res.setHeader('Content-Type', 'application/json');
          // Development only, and the pages change under it constantly.
          res.setHeader('Cache-Control', 'no-store');
          res.end(body);
        } catch (error) {
          // Handed to Vite's error overlay rather than swallowed into a 404,
          // which is what sent us looking for a bug in the dialog last time.
          next(error);
        }
      });
    },
  };
}
