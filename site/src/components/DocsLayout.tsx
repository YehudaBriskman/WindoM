import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactNode,
  type ReactElement,
} from 'react';
import { STORE_URL, GITHUB_URL, CONTACT_EMAIL } from '../lib/site';
import {
  DOCS_PAGES,
  docsGroups,
  docsNeighbours,
  headingId,
  labelFor,
  localeOf,
  translatedHref,
  type DocsPage,
  type Locale,
} from '../lib/docs';
import { SiteNav } from './SiteNav';

interface DocsLayoutProps {
  children: ReactNode;
  /** This page's entry in DOCS_PAGES, used to mark the sidebar and find neighbours. */
  href: string;
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  dir?: 'ltr' | 'rtl';
}

const SIDEBAR_KEY = 'windom-docs-sidebar';

/** The handful of strings the shell itself contributes, in both languages. */
const UI = {
  en: { home: 'Home', onPage: 'On this page', more: 'More documentation', prev: 'Previous', next: 'Next', toggle: 'Toggle navigation' },
  he: { home: 'דף הבית', onPage: 'בעמוד הזה', more: 'תיעוד נוסף', prev: 'הקודם', next: 'הבא', toggle: 'הצגה או הסתרה של הניווט' },
} as const;

/**
 * The shell for documentation, as opposed to the marketing pages.
 *
 * Shaped after the public documentation sites people already know: a breadcrumb
 * trail with the sidebar control at its head, a sidebar that collapses and
 * scrolls on its own, headings that can be linked to, and a language control.
 *
 * Everything navigational is derived rather than authored. The sidebar, the
 * breadcrumbs and the neighbour links all come from DOCS_PAGES, and the
 * contents rail is built from the headings in `children` - so there is nothing
 * to keep in sync by hand, which is the only way a table of contents stays
 * correct across edits.
 */
export function DocsLayout({ children, href, eyebrow, title, subtitle, dir = 'ltr' }: DocsLayoutProps) {
  const locale = localeOf(href);
  // Hebrew pages live under /he/, but DOCS_PAGES is keyed by the English path.
  const bare = href.replace(/^\/he\//, '/');
  const t = UI[locale];

  const { headings, content } = anchorHeadings(children);
  const { prev, next } = docsNeighbours(bare);
  const current = DOCS_PAGES.find((p) => p.href === bare);
  /* The trail uses the sidebar title, not the page's h1: the guide's heading is
     "Using WindoM" and its group is "Using WindoM", which produced a crumb that
     said the same thing twice. */
  const crumbLabel = current ? labelFor(current, locale) : undefined;

  /**
   * Collapsed by choice, remembered.
   *
   * Starts expanded rather than reading storage during render: the first paint
   * is prerendered HTML, and a value read from localStorage would disagree with
   * it on any load where the sidebar had been closed.
   */
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_KEY) === 'collapsed') setCollapsed(true);
    } catch {
      // Private mode, or storage disabled. The sidebar simply stays open.
    }
  }, []);

  const toggleSidebar = () => {
    setCollapsed((was) => {
      const next = !was;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? 'collapsed' : 'open');
      } catch { /* not worth failing the click over */ }
      return next;
    });
  };

  return (
    <div dir={dir} className={`docs${collapsed ? ' is-collapsed' : ''}`}>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div className="ambient" aria-hidden="true" />

      <SiteNav current={bare} locale={locale} docsHref={href} />

      {/* The sidebar control sits at the head of the breadcrumb row, where the
          documentation sites this follows put it. */}
      <div className="docs-bar">
        <button
          type="button"
          className="docs-bar-toggle"
          onClick={toggleSidebar}
          aria-expanded={!collapsed}
          aria-controls="docs-nav"
          aria-label={t.toggle}
        >
          <SidebarGlyph />
        </button>

        <nav className="docs-crumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <a href="/">{t.home}</a>
            </li>
            {crumbLabel && (
              <li>
                <span>{crumbLabel.group}</span>
              </li>
            )}
            <li aria-current="page">{crumbLabel?.title ?? title}</li>
          </ol>
        </nav>
      </div>

      <div className="docs-shell">
        <nav className="docs-nav" id="docs-nav" aria-label="Documentation">
          {docsGroups(locale).map(({ group: groupName, pages }) => (
            /* `details` rather than a button and state: it collapses before
               JavaScript runs and survives the static prerender, and the group
               containing the current page is the one worth opening. */
            <details
              className="docs-nav-group"
              key={groupName}
              open={pages.some((p) => p.href === bare)}
            >
              <summary className="docs-nav-heading">{groupName}</summary>
              <ul>
                {pages.map((page) => {
                  const label = labelFor(page, locale);
                  const to = locale === 'he' ? translatedHref(page.href, 'he') : page.href;
                  return (
                    <li key={page.href}>
                      <a
                        href={to}
                        className={page.href === bare ? 'is-current' : undefined}
                        aria-current={page.href === bare ? 'page' : undefined}
                      >
                        {label.title}
                        {label.blurb && <span className="docs-nav-blurb">{label.blurb}</span>}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </nav>

        <main id="content" className="docs-main">
          <div className="docs-head">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1>{title}</h1>
            {subtitle && <p className="updated">{subtitle}</p>}
          </div>

          <div className="prose">{content}</div>

          {(prev || next) && (
            <nav className="docs-neighbours" aria-label={t.more}>
              {prev ? <NeighbourLink page={prev} rel="prev" locale={locale} label={t.prev} /> : <span />}
              {next ? <NeighbourLink page={next} rel="next" locale={locale} label={t.next} /> : <span />}
            </nav>
          )}
        </main>

        {/* Only worth the column when there is something to list. */}
        {headings.length > 1 && (
          <aside className="docs-rail" aria-label={t.onPage}>
            <h2 className="docs-rail-heading">{t.onPage}</h2>
            <ul>
              {headings.map((h) => (
                <li key={h.id} className={h.level === 3 ? 'is-sub' : undefined}>
                  <a href={`#${h.id}`}>{h.text}</a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      <footer className="site-footer">
        <div className="wrap">
          <nav aria-label="Footer">
            <a href="/">Home</a>
            <a href="/guide.html">User Guide</a>
            <a href="/support.html">Support</a>
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

function SidebarGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="2.5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <line x1="6" y1="2.5" x2="6" y2="13.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function NeighbourLink({
  page,
  rel,
  locale,
  label,
}: {
  page: DocsPage;
  rel: 'prev' | 'next';
  locale: Locale;
  label: string;
}) {
  const to = locale === 'he' ? translatedHref(page.href, 'he') : page.href;
  return (
    <a className={`docs-neighbour is-${rel}`} href={to} rel={rel}>
      <span className="docs-neighbour-label">{label}</span>
      <span className="docs-neighbour-title">{labelFor(page, locale).title}</span>
    </a>
  );
}

interface Heading {
  id: string;
  text: string;
  /** 2 or 3. Subheadings are indented under the section they belong to. */
  level: 2 | 3;
}

/**
 * Gives every `h2` and `h3` an id derived from its own text, and collects them.
 *
 * Walking the element tree rather than the rendered DOM means this runs during
 * the static prerender too, so the anchors exist in the HTML a reader gets with
 * no JavaScript - which is the whole point of prerendering these pages.
 *
 * Each heading also gains a link to itself, which is how someone cites one
 * clause of the privacy policy without describing where to scroll.
 */
function anchorHeadings(children: ReactNode): { headings: Heading[]; content: ReactNode } {
  const headings: Heading[] = [];
  const seen = new Set<string>();

  const walk = (node: ReactNode): ReactNode => {
    if (Array.isArray(node)) return Children.map(node, walk);
    if (!isValidElement(node)) return node;

    const element = node as ReactElement<{ children?: ReactNode; id?: string }>;
    const walked = element.props.children !== undefined
      ? cloneElement(element, undefined, walk(element.props.children))
      : element;

    const level = element.type === 'h2' ? 2 : element.type === 'h3' ? 3 : 0;
    if (level === 0) return walked;

    const text = textOf(element.props.children);
    if (!text) return walked;

    // Suffix duplicates rather than letting two headings share an anchor, which
    // would silently send one of the links to the other's section.
    let id = element.props.id ?? headingId(text);
    if (seen.has(id)) {
      let n = 2;
      while (seen.has(`${id}-${n}`)) n += 1;
      id = `${id}-${n}`;
    }
    seen.add(id);
    headings.push({ id, text, level: level as 2 | 3 });

    const inner = (walked as ReactElement<{ children?: ReactNode }>).props.children;
    return cloneElement(
      walked as ReactElement<{ id?: string; className?: string; children?: ReactNode }>,
      { id, className: 'has-anchor' },
      <>
        {inner}
        <a className="heading-anchor" href={`#${id}`} aria-label={`Link to ${text}`}>
          #
        </a>
      </>,
    );
  };

  return { headings, content: walk(children) };
}

/**
 * Flattens a heading's children to plain text, for the id and the rail.
 *
 * Sibling nodes are joined with a space rather than concatenated. A heading
 * like `<h2>Connect Spotify <span class="badge">BYOA</span></h2>` is separate
 * nodes with no whitespace between them in the tree, so joining with nothing
 * produced "Connect SpotifyBYOA" in the contents rail.
 */
function textOf(node: ReactNode): string {
  return flatten(node).replace(/\s+/g, ' ').trim();
}

function flatten(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flatten).join(' ');
  if (isValidElement(node)) {
    return flatten((node as ReactElement<{ children?: ReactNode }>).props.children);
  }
  return '';
}
