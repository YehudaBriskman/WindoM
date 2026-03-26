// Standalone entry point for the search overlay page.
// This page is loaded inside an iframe injected by the content script,
// giving the SearchOverlay access to all extension APIs and styles.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { SearchOverlay } from './components/search/SearchOverlay';
import './styles/glass.css';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <SearchOverlay />
      </SettingsProvider>
    </AuthProvider>
  </React.StrictMode>,
);
