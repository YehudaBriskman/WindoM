import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LocalSetup } from '../pages/LocalSetup';
import '../styles/base.css';
import '../styles/pages.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from local-setup.html');

createRoot(root).render(
  <StrictMode>
    <LocalSetup />
  </StrictMode>,
);
