import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { SITE, GITHUB_URL } from '../lib/site';
import { NAV_LINKS, LOCALES, translatedPath, type Locale } from '../lib/docs';

interface SiteNavProps {
  /** Marks the matching link as current. Pass the page's own path. */
  current?: string;
  /** Which language this page is in. Drives the switcher and the link targets. */
  locale?: Locale;
}

/**
 * The bar across the top of every page.
 *
 * Rendered by both shells rather than by each page, so there is one definition
 * and the links cannot drift apart between the marketing and documentation
 * sides of the site.
 */
export function SiteNav({ current, locale = 'en' }: SiteNavProps) {
  const [open, setOpen] = useState(false);

  /**
   * A menu left open across a navigation is a menu covering the page you asked
   * for. Escape closes it, because a disclosure that traps a keyboard user is
   * worse than no disclosure.
   */
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link className="site-nav-brand" to="/">
          <span className="site-nav-mark" aria-hidden="true" />
          {SITE.name}
        </Link>

        {/* Hidden from the accessibility tree when collapsed rather than merely
            off screen, so a screen reader is not offered links it cannot reach. */}
        <nav
          className={`site-nav-links${open ? ' is-open' : ''}`}
          aria-label="Main"
          id="site-nav-links"
        >
          {NAV_LINKS.map((link) => {
            // A hash link stays on the home page; the rest follow the language.
            const to = link.path.startsWith('/#')
              ? link.path
              : (locale === 'he' ? translatedPath(link.path, 'he') : undefined) ?? link.path;
            return (
              <Link
                key={link.path}
                className={`nav-link${link.path === current ? ' is-current' : ''}`}
                to={to}
                aria-current={link.path === current ? 'page' : undefined}
                onClick={() => setOpen(false)}
                viewTransition
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="site-nav-end">
          {current && <LocaleSwitch path={current} locale={locale} />}

          <a
            className="site-nav-icon"
            href={GITHUB_URL}
            aria-label={`${SITE.name} on GitHub`}
            rel="noreferrer"
          >
            <GitHubMark />
          </a>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="site-nav-links"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={`nav-toggle-bars${open ? ' is-open' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * The language control.
 *
 * Points at this page's twin rather than at the other language's home, and as a
 * route change rather than a page load - so switching keeps your scroll
 * position and the open sidebar group, which is the only version of this
 * control that is useful in the middle of a long document.
 *
 * Absent where there is no translation to offer: a control that advertises a
 * language the page does not have is worse than no control.
 */
function LocaleSwitch({ path, locale }: { path: string; locale: Locale }) {
  const other = LOCALES.find((l) => l.code !== locale);
  const to = other ? translatedPath(path, other.code) : undefined;
  if (!other || !to) return null;

  return (
    <Link className="locale-switch" to={to} lang={other.code} hrefLang={other.code} viewTransition>
      <GlobeGlyph />
      <span>{other.label}</span>
    </Link>
  );
}

function GlobeGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="8" cy="8" rx="2.7" ry="6.3" stroke="currentColor" strokeWidth="1.2" />
      <line x1="1.8" y1="8" x2="14.2" y2="8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
