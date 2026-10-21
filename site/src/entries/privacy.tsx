import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Privacy } from '../pages/Privacy';
import '../styles/base.css';
import '../styles/pages.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from privacy.html');

createRoot(root).render(
  <StrictMode>
    <Privacy />
  </StrictMode>,
);
