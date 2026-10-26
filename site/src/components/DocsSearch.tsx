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

  const hide = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
    trigger.current?.focus();
  }, []);

  /**
   * The shortcuts, on the window so they work wherever you are on the page.
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

  // Focus follows the dialog opening, otherwise `/` opens a box you then have
  // to click into before you can type the thing you pressed `/` to type.
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const results: Result[] = index && query.trim() ? search(index, query, locale) : [];
  const tokens = tokenize(query);

  const go = (result: Result) => {
    hide();
    navigate(result.to, { viewTransition: true });
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      hide();
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
        <div className="docs-search" role="presentation" onClick={hide}>
          <div
            className="docs-search-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t.open}
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
                onKeyDown={onInputKeyDown}
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
                aria-label={t.results}
              >
                {results.map((result, i) => {
                  const [before, match, after] = highlight(result.excerpt, tokens);
                  return (
                    <li key={result.to + i} role="none">
                      <button
                        type="button"
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
                      </button>
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
