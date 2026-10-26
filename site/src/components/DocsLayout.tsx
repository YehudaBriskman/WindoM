import { Children, cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react';
import { STORE_URL, GITHUB_URL, CONTACT_EMAIL } from '../lib/site';
import { docsGroups, docsNeighbours, headingId, type DocsPage } from '../lib/docs';
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

/**
 * The shell for documentation, as opposed to the marketing pages.
 *
 * The legal pages, the guide and the setup notes were four single columns of
 * prose with no way to get from any one of them to another. They are
 * documentation and were not laid out like it.
 *
 * Everything navigational is derived rather than authored: the sidebar and the
 * previous/next links come from DOCS_PAGES, and the contents rail is built from
 * the headings in `children`. There is nothing to keep in sync by hand, which
 * is the only way a table of contents stays correct across edits.
 */
export function DocsLayout({ children, href, eyebrow, title, subtitle, dir = 'ltr' }: DocsLayoutProps) {
  const { headings, content } = anchorHeadings(children);
  const { prev, next } = docsNeighbours(href);

  return (
    <div dir={dir} className="docs">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div className="ambient" aria-hidden="true" />

      <SiteNav current={href} />

      <div className="docs-shell">
        <nav className="docs-nav" aria-label="Documentation">
          {docsGroups().map(({ group, pages }) => (
            <div className="docs-nav-group" key={group}>
              <h2 className="docs-nav-heading">{group}</h2>
              <ul>
                {pages.map((page) => (
                  <li key={page.href}>
                    <a
                      href={page.href}
                      className={page.href === href ? 'is-current' : undefined}
                      aria-current={page.href === href ? 'page' : undefined}
                    >
                      {page.title}
                      {page.blurb && <span className="docs-nav-blurb">{page.blurb}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
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
            <nav className="docs-neighbours" aria-label="More documentation">
              {prev ? <NeighbourLink page={prev} rel="prev" /> : <span />}
              {next ? <NeighbourLink page={next} rel="next" /> : <span />}
            </nav>
          )}
        </main>

        {/* Only worth the column when there is something to list. */}
        {headings.length > 1 && (
          <aside className="docs-rail" aria-label="On this page">
            <h2 className="docs-rail-heading">On this page</h2>
            <ul>
              {headings.map((h) => (
                <li key={h.id}>
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

function NeighbourLink({ page, rel }: { page: DocsPage; rel: 'prev' | 'next' }) {
  return (
    <a className={`docs-neighbour is-${rel}`} href={page.href} rel={rel}>
      <span className="docs-neighbour-label">{rel === 'prev' ? 'Previous' : 'Next'}</span>
      <span className="docs-neighbour-title">{page.title}</span>
    </a>
  );
}

interface Heading {
  id: string;
  text: string;
}

/**
 * Gives every `h2` an id derived from its own text, and collects them.
 *
 * Walking the element tree rather than the rendered DOM means this runs during
 * the static prerender too, so the anchors exist in the HTML a reader gets with
 * no JavaScript - which is the whole point of prerendering these pages.
 *
 * A heading that already carries an id keeps it, so a page can pin an anchor
 * that is linked from elsewhere and must not move.
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

    if (element.type !== 'h2') return walked;

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
    headings.push({ id, text });

    return cloneElement(walked as ReactElement<{ id?: string }>, { id });
  };

  return { headings, content: walk(children) };
}

/** Flattens a heading's children to plain text, for the id and the rail. */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) {
    return textOf((node as ReactElement<{ children?: ReactNode }>).props.children);
  }
  return '';
}
