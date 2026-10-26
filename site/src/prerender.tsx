import { renderToStaticMarkup } from 'react-dom/server';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Support } from './pages/Support';
import { Contact } from './pages/Contact';

/**
 * Pages rendered to real HTML at build time.
 *
 * The site is a client-rendered multi-page app, so every URL served 2KB of
 * empty `<div id="root">` and filled itself in once the bundle ran. That is
 * fine for a dashboard preview and not fine for a legal document: OAuth
 * verification fetches the privacy policy URL and checks it states the scopes
 * and carries the Limited Use language. A page that is blank without
 * JavaScript is a plausible way to fail that review, and a rejection costs
 * weeks for what is a build step.
 *
 * Only pages that are genuinely static belong here. `Privacy` and `Terms`
 * render from props alone with no hooks and no browser APIs, so the markup
 * produced here is byte-identical to what the client would have drawn - the
 * bundle still loads and takes over, finding the DOM it expected.
 *
 * The home page is deliberately absent: it animates on scroll and reads the
 * clock, so a prerender would bake one moment of a moving page into the
 * document.
 */
export const prerendered: Record<string, () => string> = {
  'privacy.html': () => renderToStaticMarkup(<Privacy />),
  'terms.html': () => renderToStaticMarkup(<Terms />),
  'support.html': () => renderToStaticMarkup(<Support />),
  'contact.html': () => renderToStaticMarkup(<Contact />),
};
