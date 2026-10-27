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
