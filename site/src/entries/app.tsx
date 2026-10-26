import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { ROUTES, legacyPathOf } from '../routes';
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
 * the Chrome Web Store has registered - so a visitor arriving on either lands
 * on the same page rather than on a redirect.
 *
 * `hydrateRoot` rather than `createRoot`: each route is prerendered to real
 * HTML, and rendering into a populated container would throw that away and
 * draw it again.
 */
const router = createBrowserRouter([
  ...ROUTES.flatMap((route) => {
    const entries = [{ path: route.path, element: route.element }];
    if (route.legacyHtml) entries.push({ path: legacyPathOf(route.path), element: route.element });
    return entries;
  }),
  { path: '*', element: <NotFound /> },
]);

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing');

hydrateRoot(
  root,
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
