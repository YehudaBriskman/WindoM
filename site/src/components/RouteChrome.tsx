import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router';
import { areTwins, LOCALES, routeFor, titleFor } from '../routes';

/**
 * Keeps the document itself in step with the active route.
 *
 * The prerendered file for each route carries the right `lang`, `dir`, title
 * and description, but a client-side navigation only swaps the React tree -
 * everything outside `#root` keeps whatever the first-loaded page set. Without
 * this, switching from the guide to its Hebrew twin renders Hebrew text in a
 * document still declaring `lang="en" dir="ltr"`, so it lays out left to right,
 * and the browser tab keeps naming the page you came from.
 *
 * A layout route rather than a hook in each page, so a new page cannot forget
 * it. It renders no markup of its own, so the prerendered output is unchanged.
 */
export function RouteChrome() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const route = routeFor(pathname);
    if (!route) {
      document.title = 'Page not found - WindoM';
      return;
    }

    const html = document.documentElement;
    html.lang = route.locale;
    html.dir = LOCALES.find((l) => l.code === route.locale)?.dir ?? 'ltr';
    document.title = titleFor(route);

    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', route.description);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', `https://windom.app${route.path}`);
  }, [pathname]);

  /**
   * Where a navigation leaves you vertically.
   *
   * A page load always started at the top; a route change does not, so without
   * this you click a sidebar link from halfway down the privacy policy and land
   * halfway down the terms. Three cases, in order:
   *
   * - A hash goes to its heading, which is how a search result or a shared link
   *   to one clause arrives at the clause rather than at the page - including a
   *   heading whose section has not rendered yet, see below.
   * - Back and forward are left alone, because the browser already restores the
   *   position it remembers and overriding it loses your place.
   * - Switching language on the same page keeps your place too. That is the
   *   whole reason the control is a route change rather than a link.
   *
   * Explicitly instant: the document sets `scroll-behavior: smooth` for
   * in-page anchors, and inheriting it here animates a 2000px scroll on every
   * page change.
   */
  useEffect(() => {
    const from = previousPath.current;
    previousPath.current = pathname;

    // The first pass is hydration - the browser is already where it should be.
    if (from === null) return;
    if (navigationType === 'POP') return;

    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const reachTarget = (): boolean => {
        const target = document.getElementById(id);
        if (!target) return false;
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
        return true;
      };

      if (reachTarget()) return;

      /**
       * A hash target can mount after this effect runs, and one on the home
       * page does: `Updates` - the section the nav's own "Changelog" item links
       * to - renders null until its feed request resolves, so arriving at
       * /#updates from a docs page finds nothing to scroll to. Falling through
       * to scroll-to-top was the whole of the bug: from halfway down the home
       * page, clicking "Changelog" scrolled you away from the changelog.
       *
       * So watch for the element instead of giving up. Only the cross-page case
       * takes the top first, because a new document has to start somewhere and
       * keeping the previous page's offset is the thing the scroll below
       * prevents; a hash change on the page you are already reading leaves your
       * place alone until there is somewhere better to be.
       *
       * Bounded, because a hash naming something that will never exist - a
       * stale deep link to a renamed heading - must not leave an observer
       * watching every mutation for the rest of the session.
       */
      if (from !== pathname) window.scrollTo({ top: 0, behavior: 'instant' });

      const observer = new MutationObserver(() => {
        if (reachTarget()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      const stopWaiting = window.setTimeout(() => observer.disconnect(), 4000);

      return () => {
        observer.disconnect();
        window.clearTimeout(stopWaiting);
      };
    }

    if (from !== pathname && areTwins(from, pathname)) return;

    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash, navigationType]);

  return <Outlet />;
}
