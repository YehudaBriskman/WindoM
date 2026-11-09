/**
 * Site-wide constants.
 *
 * The Chrome Web Store URL was previously hard-coded in six separate places
 * across the old HTML, so a change to the listing meant finding all six.
 */

export const SITE = {
  name: 'WindoM',
  origin: 'https://windom.app',
  tagline: 'Your Space, Your Flow.',
  description:
    'WindoM replaces the Chrome new tab with a personal dashboard: clock, weather, ' +
    'backgrounds, todos, calendar, Spotify, GitHub, finance and focus mode.',
} as const;

export const EXTENSION_ID = 'comcnbccalbfcegbmaemancbhgpijkpb';
export const STORE_URL = `https://chromewebstore.google.com/detail/windom/${EXTENSION_ID}`;
export const GITHUB_URL = 'https://github.com/YehudaBriskman/WindoM';
export const ISSUES_URL = `${GITHUB_URL}/issues`;
export const CONTACT_EMAIL = 'yehudabriskman@windom.app';

/**
 * The author, as one entity across both sites. yehudabriskman.com is the home of
 * the Person record; windom.app points at it by the same `@id`, so search
 * engines merge the two rather than seeing two people. The alternate names are
 * the spellings people actually search for - the Hebrew name included, since a
 * Hebrew query is matched against Hebrew text, not a transliteration.
 */
export const AUTHOR = {
  id: 'https://yehudabriskman.com/#person',
  url: 'https://yehudabriskman.com',
  name: 'Yehuda Briskman',
  nameHe: 'יהודה בריסקמן',
  alternateName: ['יהודה בריסקמן', 'yehuda.br', 'YehudaBriskman', 'Yehuda B.'],
  sameAs: ['https://github.com/YehudaBriskman', 'https://yehudabriskman.com'],
} as const;

/**
 * The lowest Node the build runs on, quoted by both Local Setup pages so the
 * English and Hebrew copies cannot disagree. It tracks the `engines.node`
 * field in `web/package.json`, `backend/package.json` and `site/package.json`,
 * all three of which declare `>=22`; raise it here when they are raised.
 */
export const NODE_MIN_VERSION = 22;

/**
 * The canonical project page on the personal site. Under the hybrid topology,
 * that page is the authoritative description of what WindoM is; windom.app is
 * the product surface - install it, learn it, read the legal terms.
 */
export const PROJECT_PAGE = 'https://yehudabriskman.com/projects/windom';
export const BLOG_URL = 'https://yehudabriskman.com/blog';

/**
 * Posts carry a `collection` field, so this returns only WindoM's updates.
 * Consumed by the Updates section; see src/lib/updates.ts for the failure
 * behaviour, which matters because the origin is not yet on the API's CORS
 * allowlist.
 */
export const UPDATES_API = 'https://yehudabriskman.com/api/blog/posts?collection=windom';

/**
 * What WindoM does, as the structured data states it. Each line is in the
 * README's feature tables and on the home page; nothing here is aspirational,
 * because a feature list a crawler reads and a visitor cannot find is the
 * kind of claim a search engine penalises.
 */
export const FEATURES = [
  'Clock and greeting that follow the hour',
  'Weather from Open-Meteo, no key or sign-up',
  'Rotating Unsplash backgrounds or your own image',
  'Todo list in the sidebar',
  'Focus timer from 25 minutes to 4 hours',
  'Quick links dock',
  'Search to Google, Bing, DuckDuckGo or Brave',
  'Daily quote',
  'Open tabs sidebar and recent pages',
  'Layout templates: Minimal, Deep Focus, Dashboard',
  'Live stocks and crypto',
  'Google Calendar, Spotify and GitHub with a free account',
  'Settings sync across browsers',
] as const;
