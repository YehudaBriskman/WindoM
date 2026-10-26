import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import type { Locale } from '../routes';
import { highlight, search, tokenize, type Result, type SearchIndex } from '../lib/search';

/** The strings the dialog contributes, in both languages. */
const UI = {
  en: {
    open: 'Search the documentation',
    short: 'Search',
    placeholder: 'Search the documentation',
    empty: 'No matches.',
    loading: 'Loading…',
    failed: 'Search is unavailable. The documentation sidebar still lists every page.',
    hint: 'to search',
    results: 'Search results',
  },
  he: {
    open: 'חיפוש בתיעוד',
    short: 'חיפוש',
    placeholder: 'חיפוש בתיעוד',
    empty: 'אין תוצאות.',
    loading: 'טוען…',
    failed: 'החיפוש אינו זמין. סרגל הצד עדיין מציג את כל העמודים.',
    hint: 'לחיפוש',
    results: 'תוצאות חיפוש',
  },
} as const;

type Status = 'idle' | 'loading' | 'ready' | 'failed';

/**
 * Everything inside the panel that a Tab can land on.
 *
 * The results are deliberately absent from this list - they are `role="option"`
 * rows, selected by the arrow keys through `aria-activedescendant`, not focus
 * stops. See the keyboard notes on the dialog below.
 */
const FOCUS_STOPS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** While the dialog is open, on the root element. See docs.css for why. */
const SCROLL_LOCK = 'docs-search-open';

/**
 * Search across the documentation.
 *
 * Routing is what makes it affordable: the index is fetched once and survives
 * every navigation, where the multi-page build would have re-downloaded it on
 * each page.
 *
 * It is fetched on the first attempt to search rather than on page load. Most
 * readers never search, and an index that downloads with every page is a cost
 * all of them pay for the few who do.
 *
 * Degrades to nothing: if the index will not load the dialog says so and points
 * at the sidebar, which lists every page and needs no JavaScript at all.
 */
export function DocsSearch({ locale }: { locale: Locale }) {
  const t = UI[locale];
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [active, setActive] = useState(0);

  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  /** Whether this dialog is the reason focus left the trigger. See below. */
  const opened = useRef(false);

  const load = useCallback(() => {
    if (status !== 'idle') return;
    setStatus('loading');
    fetch('/search-index.json')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: SearchIndex) => {
        setIndex(data);
        setStatus('ready');
      })
      .catch(() => setStatus('failed'));
  }, [status]);

  const show = useCallback(() => {
    load();
    setOpen(true);
  }, [load]);

  // Focus is not restored here. The page behind is `inert` while the dialog is
  // open, an inert element cannot take focus, and the attributes come off in an
  // effect cleanup - which runs after this handler. Focusing the trigger from
  // here was therefore a no-op; the effect below does it once the page is live
  // again.
  const hide = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
  }, []);

  /**
   * The shortcuts that open it, on the window so they work wherever you are on
   * the page.
   *
   * `/` is the convention on documentation sites and costs nothing to discover;
   * Ctrl-K and Command-K are the convention everywhere else. Neither fires
   * while you are typing in a field, because a reader filling in a form has not
   * asked to search.
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable === true;

      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        show();
        return;
      }
      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        show();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [show]);

  /**
   * Escape, on the window and gated on `open`.
   *
   * It used to live on the input's `onKeyDown`, which meant the only way out of
   * a dialog you had tabbed out of was to tab back in. On the window it closes
   * the dialog from wherever the keystroke was aimed.
   */
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      hide();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, hide]);

  /**
   * The rest of the document, switched off for as long as the dialog is up.
   *
   * `aria-modal="true"` promises a screen reader that nothing outside this
   * dialog is reachable, and `inert` is what makes that true for everyone else:
   * the nav, the sidebar and the prose under the scrim stop taking focus,
   * clicks and hit-testing. Without it Tab walked straight out of the panel
   * into controls hidden behind an opaque overlay, where the focus ring is
   * invisible and Enter activates something you cannot see.
   *
   * Applied to the body's children rather than to one wrapper because the panel
   * is portalled to the body - so it is a sibling of the app root, and inerting
   * the root is enough to cover the page without touching the dialog.
   */
  useEffect(() => {
    if (!open) return;
    const silenced = [...document.body.children].filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && node !== overlay.current && !node.inert,
    );
    for (const node of silenced) node.inert = true;
    document.documentElement.classList.add(SCROLL_LOCK);

    return () => {
      // Only what this turned on, so a second dialog's inert state survives.
      for (const node of silenced) node.inert = false;
      document.documentElement.classList.remove(SCROLL_LOCK);
    };
  }, [open]);

  /**
   * Focus into the dialog, and back to the trigger when it closes.
   *
   * Opening without moving focus would mean `/` opened a box you then had to
   * click into before typing the thing you pressed `/` to type. Closing without
   * moving it back would leave focus on an element that is no longer there.
   *
   * `opened` keeps the restore honest: this effect also runs on the first
   * render, when nothing has been opened yet and the reader may well be typing
   * somewhere else on the page.
   */
  useEffect(() => {
    if (open) {
      opened.current = true;
      input.current?.focus();
      return;
    }
    if (!opened.current) return;
    opened.current = false;
    trigger.current?.focus();
  }, [open]);

  /**
   * Focus pulled back if anything manages to move it outside the panel.
   *
   * The Tab handler covers the keyboard, but focus also moves on its own: a
   * click on the scrim, a browser's find-in-page, an extension. Rather than
   * enumerate those, this watches where focus lands and corrects it.
   */
  useEffect(() => {
    if (!open) return;
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof Node && overlay.current?.contains(target)) return;
      input.current?.focus();
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [open]);

  const results: Result[] = index && query.trim() ? search(index, query, locale) : [];
  const tokens = tokenize(query);

  // The selected row scrolled into view, because selection moves with the arrow
  // keys while the list only shows a few rows at a time - and a highlight you
  // cannot see is indistinguishable from arrow keys that stopped working.
  useEffect(() => {
    list.current?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
  }, [active, query]);

  const go = (result: Result) => {
    hide();
    navigate(result.to, { viewTransition: true });
  };

  /**
   * Tab kept inside the panel, in both directions.
   *
   * Wrapping rather than letting the browser continue: the next tab stop in
   * document order is behind the scrim, and `inert` would hand focus to the
   * address bar instead - out of a dialog the reader has not closed.
   */
  const trapTab = (event: React.KeyboardEvent) => {
    const panelNode = panel.current;
    if (!panelNode) return;

    event.preventDefault();
    const stops = [...panelNode.querySelectorAll<HTMLElement>(FOCUS_STOPS)].filter(
      // Rendered only: a hidden control is not somewhere focus can usefully go.
      (node) => node.getClientRects().length > 0,
    );
    if (!stops.length) {
      // Nothing to tab to, so focus parks on the panel, which keeps Escape and
      // the arrow keys working rather than dropping focus to the body.
      panelNode.focus();
      return;
    }

    const at = stops.findIndex((node) => node === document.activeElement);
    const step = event.shiftKey ? -1 : 1;
    const next = at === -1 ? 0 : (at + step + stops.length) % stops.length;
    // The modulo keeps the index in range; the optional call is for the
    // compiler, which cannot see that from here.
    stops[next]?.focus();
  };

  /**
   * The keys that drive the dialog, on the panel rather than on the input.
   *
   * Everything inside the panel bubbles through here, so the arrow keys keep
   * moving the selection no matter which control focus is on - the old
   * input-only handler left the `is-active` row and the real focus position
   * free to drift apart.
   */
  const onPanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      trapTab(event);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!results.length) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((was) => (was + step + results.length) % results.length);
      return;
    }
    if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      go(results[active]);
    }
  };

  return (
    <>
      <button
        type="button"
        ref={trigger}
        className="docs-search-trigger"
        onClick={show}
        aria-label={t.open}
      >
        <SearchGlyph />
        <span className="docs-search-trigger-label">{t.short}</span>
        {/* Decorative: the shortcut is announced by the button's label already,
            and a screen reader has no use for a picture of a key. */}
        <kbd aria-hidden="true">/</kbd>
      </button>

      {/*
        Portalled to the body rather than rendered where it sits.
        The trigger belongs in the breadcrumb bar, and that bar carries a
        `backdrop-filter` - which makes it the containing block for any
        `position: fixed` descendant. Left in place the overlay was laid out
        against the bar instead of the viewport: 124px tall, with the panel
        collapsed to two pixels and the results it had found nowhere to go.
      */}
      {open &&
        createPortal(
        <div className="docs-search" role="presentation" ref={overlay} onClick={hide}>
          <div
            className="docs-search-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t.open}
            ref={panel}
            // Focusable only programmatically: somewhere for focus to rest if
            // the panel ever has no control of its own to hold it.
            tabIndex={-1}
            onKeyDown={onPanelKeyDown}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="docs-search-field">
              <SearchGlyph />
              <input
                ref={input}
                type="search"
                className="docs-search-input"
                placeholder={t.placeholder}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="docs-search-results"
                aria-activedescendant={results[active] ? `docs-search-${active}` : undefined}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {status === 'failed' ? (
              <p className="docs-search-note">{t.failed}</p>
            ) : status === 'loading' ? (
              <p className="docs-search-note">{t.loading}</p>
            ) : query.trim() && !results.length ? (
              <p className="docs-search-note">{t.empty}</p>
            ) : (
              <ul
                className="docs-search-results"
                id="docs-search-results"
                role="listbox"
                ref={list}
                aria-label={t.results}
              >
                {results.map((result, i) => {
                  const [before, match, after] = highlight(result.excerpt, tokens);
                  return (
                    /*
                      An option, not a button. A listbox row is selected by
                      `aria-activedescendant` from the input that owns the
                      listbox, so making each row a tab stop would put focus
                      somewhere the arrow keys no longer reach - the drift this
                      pattern exists to avoid. The click handler is for the
                      mouse; the keyboard gets here through Enter on the panel.
                    */
                    <li
                      key={result.to + i}
                      id={`docs-search-${i}`}
                      role="option"
                      aria-selected={i === active}
                      className={`docs-search-result${i === active ? ' is-active' : ''}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(result)}
                    >
                      <span className="docs-search-crumb">
                        {result.page.g ? `${result.page.g} · ` : ''}
                        {result.page.t}
                      </span>
                      <span className="docs-search-heading">{result.heading}</span>
                      <span className="docs-search-excerpt">
                        {before}
                        {match && <mark>{match}</mark>}
                        {after}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function SearchGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.3" />
      <line x1="10.4" y1="10.4" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
