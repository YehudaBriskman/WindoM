import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Guide } from '../pages/Guide';
import '../styles/base.css';
import '../styles/pages.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from guide.html');

createRoot(root).render(
  <StrictMode>
    <Guide />
  </StrictMode>,
);
