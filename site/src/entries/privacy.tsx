import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { Privacy } from '../pages/Privacy';
import '../styles/base.css';
import '../styles/pages.css';
import '../styles/docs.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from privacy.html');

/**
 * Hydrated, not rendered: this page ships prerendered markup.
 *
 * `createRoot().render()` into a populated container throws the existing
 * markup away and draws it again, which wastes the prerender and can flash.
 * The page is static - no hooks, no browser APIs - so the client output matches
 * the build output exactly and hydration has nothing to reconcile.
 *
 * If the prerender is ever removed, this has to go back to createRoot.
 */
hydrateRoot(
  root,
  <StrictMode>
    <Privacy />
  </StrictMode>,
);
