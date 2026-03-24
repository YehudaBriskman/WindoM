// WindoM Content Script
// Injects a transparent full-screen iframe on every page.
// Ctrl+Win+H or Ctrl+Win+' opens the WindoM search overlay inside it.

const SEARCH_URL = chrome.runtime.getURL('search.html');
const EXTENSION_ORIGIN = new URL(SEARCH_URL).origin; // chrome-extension://[id]
const MSG_OPEN = 'WINDOM_SEARCH_OPEN';
const MSG_CLOSED = 'WINDOM_SEARCH_CLOSED';

let iframe: HTMLIFrameElement | null = null;
let iframeLoaded = false;

function ensureIframe(): HTMLIFrameElement {
  if (iframe) return iframe;

  iframe = document.createElement('iframe');
  iframe.src = SEARCH_URL;
  iframe.id = 'windom-search-iframe';
  iframe.style.cssText = [
    'position:fixed',
    'inset:0',
    'width:100%',
    'height:100%',
    'border:none',
    'background:transparent',
    'z-index:2147483647',
    'display:none',
    'pointer-events:none',
    'color-scheme:normal',
  ].join(';');
  iframe.setAttribute('allowtransparency', 'true');

  // Track when the page inside the iframe has fully loaded
  iframe.addEventListener('load', () => { iframeLoaded = true; });

  document.documentElement.appendChild(iframe);

  // Hide iframe when the overlay signals it closed
  window.addEventListener('message', (e: MessageEvent) => {
    if (e.origin !== EXTENSION_ORIGIN) return;
    if ((e.data as { type?: string })?.type === MSG_CLOSED) {
      iframe!.style.display = 'none';
      iframe!.style.pointerEvents = 'none';
    }
  });

  return iframe;
}

function sendOpen(el: HTMLIFrameElement) {
  el.contentWindow?.postMessage({ type: MSG_OPEN }, EXTENSION_ORIGIN);
}

function openSearch() {
  const el = ensureIframe();
  el.style.display = 'block';
  el.style.pointerEvents = 'all';

  if (iframeLoaded) {
    // React app already mounted — send message directly
    sendOpen(el);
  } else {
    // First open: wait for the page to load before sending
    el.addEventListener('load', () => sendOpen(el), { once: true });
  }
}

const TRIGGER_KEYS = new Set(["h", "'"]);

// Capture phase so we intercept before the page can cancel the event
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.ctrlKey && e.metaKey && TRIGGER_KEYS.has(e.key.toLowerCase())) {
    e.preventDefault();
    e.stopImmediatePropagation();
    openSearch();
  }
}, true);
