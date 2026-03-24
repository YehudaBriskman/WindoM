// WindoM Content Script
// Injects a transparent full-screen iframe on every page.
// Ctrl+Win+H (Ctrl+Meta+H) opens the WindoM search overlay inside it.

const SEARCH_URL = chrome.runtime.getURL('search.html');
const MSG_OPEN = 'WINDOM_SEARCH_OPEN';
const MSG_CLOSED = 'WINDOM_SEARCH_CLOSED';

let iframe: HTMLIFrameElement | null = null;

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

  document.documentElement.appendChild(iframe);

  // Hide iframe when the overlay signals it closed
  window.addEventListener('message', (e: MessageEvent) => {
    if (e.source !== iframe?.contentWindow) return;
    if ((e.data as { type?: string })?.type === MSG_CLOSED) {
      iframe!.style.display = 'none';
      iframe!.style.pointerEvents = 'none';
    }
  });

  return iframe;
}

// Listen in capture phase so we intercept before the page can cancel the event
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.ctrlKey && e.metaKey && e.key.toLowerCase() === 'h') {
    e.preventDefault();
    e.stopImmediatePropagation();

    const el = ensureIframe();
    el.style.display = 'block';
    el.style.pointerEvents = 'all';
    // Tell the overlay React app to open
    el.contentWindow?.postMessage({ type: MSG_OPEN }, SEARCH_URL);
  }
}, true);
