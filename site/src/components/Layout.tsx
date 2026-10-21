import type { ReactNode } from 'react';
import { SITE, STORE_URL, GITHUB_URL, CONTACT_EMAIL } from '../lib/site';

interface LayoutProps {
  children: ReactNode;
  /** Shown as a small label above the page title on sub-pages. */
  eyebrow?: string;
  /** Page heading. Omitted on the landing page, which renders its own hero. */
  title?: string;
  /** Sits under the heading - a "last updated" line on the legal pages. */
  subtitle?: ReactNode;
  /** Landing page suppresses the back link and the header padding. */
  variant?: 'home' | 'page';
  /** Hebrew pages set this so the shell mirrors with the content. */
  dir?: 'ltr' | 'rtl';
}

/**
 * The single shell every page renders inside.
 *
 * The previous site copy-pasted its <head>, footer and ambient background into
 * all five pages, so a change to any of them meant five edits and usually got
 * four. The legal pages alone shared about 91% of their CSS.
 */
export function Layout({
  children,
  eyebrow,
  title,
  subtitle,
  variant = 'page',
  dir = 'ltr',
}: LayoutProps) {
  return (
    <div dir={dir}>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div className="ambient" aria-hidden="true" />

      {variant === 'page' && (
        <header className="page-header">
          <div className="wrap wrap-prose">
            <a className="back-link" href="/">
              <span aria-hidden="true">←</span> {SITE.name}
            </a>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h1>{title}</h1>}
            {subtitle && <p className="updated">{subtitle}</p>}
          </div>
        </header>
      )}

      <main id="content">{children}</main>

      <footer className="site-footer">
        <div className="wrap">
          <nav aria-label="Footer">
            <a href="/">Home</a>
            <a href="/guide.html">User Guide</a>
            <a href="/local-setup.html">Local Setup</a>
            <a href="/privacy.html">Privacy</a>
            <a href="/terms.html">Terms</a>
            <a href={STORE_URL}>Chrome Web Store</a>
            <a href={GITHUB_URL}>GitHub</a>
          </nav>
          <p>
            MIT License © {new Date().getFullYear()} Yehuda Briskman &nbsp;·&nbsp;{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
