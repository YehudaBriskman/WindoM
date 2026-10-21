import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Terms } from '../pages/Terms';
import '../styles/base.css';
import '../styles/pages.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from terms.html');

createRoot(root).render(
  <StrictMode>
    <Terms />
  </StrictMode>,
);
