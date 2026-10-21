import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GuideHe } from '../../pages/GuideHe';
import '../../styles/base.css';
import '../../styles/pages.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from he/guide.html');

createRoot(root).render(
  <StrictMode>
    <GuideHe />
  </StrictMode>,
);
