import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
// Order matters and was reversed. glass.css and globals.css both style the
// same elements at the same specificity - .glass-dock vs .text-shadow-sm on the
// weather widget, .settings-close and .settings-reset-btn against the control
// recess - so source order decides every tie. glass.css is the material layer
// and has to land last, which is what its own header has always said.
import './styles/globals.css';
import './styles/glass.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
