import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { ROUTES, legacyPathOf } from '../routes';
import { RouteChrome } from '../components/RouteChrome';
import { NotFound } from '../pages/NotFound';
import '../styles/base.css';
import '../styles/pages.css';
import '../styles/hero.css';
import '../styles/docs.css';
import '../styles/stage.css';
import '../styles/motion.css';

/**
 * One entry for the whole site, replacing thirteen.
 *
 * Every route is registered twice - at its clean path and at the `.html` path
 * someone else holds: the Chrome Web Store listing, the guide link compiled into
 * the extension, and `/index.html` from the multi-page site this replaced. A
 * visitor arriving on either lands on the same page rather than on a redirect.
 * The rule is "every file the build emits has a route", and the way it breaks is
 * one shape being derivable from the route table while another is not.
 *
 * `hydrateRoot` rather than `createRoot`: each route is prerendered to real
 * HTML, and rendering into a populated container would throw that away and
 * draw it again.
 */
const router = createBrowserRouter([
  {
    element: <RouteChrome />,
    children: [
      ...ROUTES.flatMap((route) => {
        const entries = [{ path: route.path, element: route.element }];
        /* The home page is registered at `/index.html` too, even though it does
           not carry `legacyHtml`. That flag means "write a second file", and the
           root needs no second file: the shell the prerender fills *is*
           `dist/index.html`. So the file shipped, the server served the whole
           home page from it, and the router - having no match - fell through to
           `*` and replaced it with "Page not found" a moment after hydration,
           under the home page's own title. `/index.html` was a real URL on the
           previous multi-page site, so inbound links to it exist. */
        if (route.legacyHtml || route.path === '/') {
          entries.push({ path: legacyPathOf(route.path), element: route.element });
        }
        return entries;
      }),
      { path: '*', element: <NotFound /> },
    ],
  },
]);

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing');

hydrateRoot(
  root,
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
