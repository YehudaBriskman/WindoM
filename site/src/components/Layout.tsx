import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { STORE_URL, GITHUB_URL, CONTACT_EMAIL, AUTHOR } from '../lib/site';
import { SiteNav } from './SiteNav';

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
export function Layout({ children, eyebrow, title, subtitle, variant = 'page', dir = 'ltr' }: LayoutProps) {
  return (
    <div dir={dir}>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div className="ambient" aria-hidden="true" />

      <SiteNav />

      {variant === 'page' && (
        <header className="page-header">
          <div className="wrap wrap-prose">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h1>{title}</h1>}
            {subtitle && <p className="updated">{subtitle}</p>}
          </div>
        </header>
      )}

      {/* `tabIndex={-1}` is what makes the skip link above actually skip.
          Chrome and Firefox move the sequential-focus starting point to a
          fragment target either way, but Safari and some assistive technology
          only do it for a focusable element: without this, focus stays on the
          skip link and the next Tab goes to the nav's brand link - straight
          back into the chrome the user just asked to skip past. Negative, so it
          takes focus from the fragment without joining the tab order itself. */}
      <main id="content" tabIndex={-1}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="wrap">
          {/* Router links at the clean paths. The `.html` addresses still exist,
              but only for the URLs registered outside this repo (the store
              listing, the extension's guide link) - linking to them from inside
              the site reloaded the whole document and flipped the address bar
              to the legacy shape mid-session. */}
          <nav aria-label="Footer">
            <Link to="/">Home</Link>
            <Link to="/guide">User Guide</Link>
            <Link to="/local-setup">Local Setup</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <a href={STORE_URL}>Chrome Web Store</a>
            <a href={GITHUB_URL}>GitHub</a>
          </nav>
          <p>
            MIT License © {new Date().getFullYear()}{' '}
            <a href={AUTHOR.url} rel="author">
              {AUTHOR.name}
            </a>{' '}
            &nbsp;·&nbsp; <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
