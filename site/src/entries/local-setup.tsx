import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { LocalSetup } from '../pages/LocalSetup';
import '../styles/base.css';
import '../styles/pages.css';
import '../styles/docs.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from local-setup.html');

/** Hydrated rather than rendered, because this page is prerendered. See privacy.tsx. */
hydrateRoot(
  root,
  <StrictMode>
    <LocalSetup />
  </StrictMode>,
);
