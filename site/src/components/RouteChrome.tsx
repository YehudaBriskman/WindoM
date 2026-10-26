import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { LOCALES, routeFor, titleFor } from '../routes';

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
  const { pathname } = useLocation();

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

  return <Outlet />;
}
