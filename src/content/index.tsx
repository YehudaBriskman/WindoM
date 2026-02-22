import React from 'react';
import ReactDOM from 'react-dom/client';
import { ContentApp } from './ContentApp';
import styles from '../styles/globals.css?inline';
import glassStyles from '../styles/glass.css?inline';

const host = document.createElement('div');
host.id = 'windom-overlay';
// Pin the shadow host as a full-screen fixed layer on top of all page content.
// pointer-events: none lets page interactions pass through when the overlay is closed;
// children with explicit pointer-events: auto (backdrop when open, sidebar trigger) still work.
host.style.cssText =
  'position:fixed!important;top:0!important;left:0!important;' +
  'width:100%!important;height:100%!important;' +
  'z-index:2147483647!important;pointer-events:none!important;' +
  'border:none!important;background:transparent!important;';
document.body.appendChild(host);

const shadow = host.attachShadow({ mode: 'open' });

const styleEl = document.createElement('style');
styleEl.textContent = styles + glassStyles;
shadow.appendChild(styleEl);

const container = document.createElement('div');
container.className = 'windom-content';

// Detect page direction from explicit dir attributes only — avoiding getComputedStyle
// which can be influenced by the browser's UI locale rather than the page's content direction.
function syncDirection() {
  const dir = document.documentElement.dir || document.body?.dir;
  container.setAttribute('dir', dir === 'rtl' ? 'rtl' : 'ltr');
}
syncDirection();

const dirObserver = new MutationObserver(syncDirection);
dirObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
if (document.body) {
  dirObserver.observe(document.body, { attributes: true, attributeFilter: ['dir'] });
}

shadow.appendChild(container);

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <ContentApp />
  </React.StrictMode>,
);
