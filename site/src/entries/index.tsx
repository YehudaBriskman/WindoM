import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Home } from '../pages/Home';
import '../styles/base.css';
import '../styles/pages.css';
import '../styles/stage.css';
import '../styles/motion.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

createRoot(root).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
