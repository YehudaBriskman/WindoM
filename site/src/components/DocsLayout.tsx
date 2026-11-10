import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type ReactElement,
} from 'react';
import { Link } from 'react-router';
import { STORE_URL, GITHUB_URL, CONTACT_EMAIL, AUTHOR } from '../lib/site';
import { docsGroups, docsNeighbours, headingId, localeOf, translatedPath, type SiteRoute } from '../lib/docs';
import { SiteNav } from './SiteNav';
import { DocsSearch } from './DocsSearch';
import { useActiveHeading, useKeepActiveInView } from '../hooks/useActiveHeading';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { navMemory } from '../lib/navMemory';
import { writeProse } from './Written';

/** `useLayoutEffect` warns nowhere in React 19, but it does nothing in the prerender either. */
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const sameMembers = (a: ReadonlySet<string>, b: ReadonlySet<string>) =>
  a.size === b.size && [...a].every((x) => b.has(x));

interface DocsLayoutProps {
  children: ReactNode;
  /** This page's own path, used to mark the sidebar and find neighbours. */
  path: string;
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  dir?: 'ltr' | 'rtl';
}

const SIDEBAR_KEY = 'windom-docs-sidebar';

/** Where the sidebar stops being a column and becomes a list above the page. */
const NARROW = '(max-width: 760px)';

/** Whether the viewport is phone-narrow. False on the server and the first render. */
function useNarrow(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(NARROW);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

/**
 * The stored sidebar choice, once it has been read.
 *
 * Every docs page renders its own `DocsLayout`, so the shell remounts on each
 * route change. Reading storage in an effect each time meant a closed sidebar
 * rendered open for one frame on every navigation and then snapped shut - the
 * panel visibly moving, inside the view transition that is meant to hold it
 * still. Remembered here after the first read, so only the hydration render
 * (which must match the prerendered HTML) starts from the default.
 */
let rememberedCollapsed: boolean | undefined;

/**
 * The handful of strings the shell itself contributes, in both languages.
 *
 * The footer labels live here with the rest rather than inline, because they
 * were the one set that did not: six English words inside an RTL document.
 * `home` is shared with the breadcrumb, which says the same word for the same
 * destination. "Chrome Web Store" and "GitHub" are names and stay as they are.
 */
const UI = {
  en: {
    home: 'Home',
    onPage: 'On this page',
    sections: 'Sections of this page',
    more: 'More documentation',
    prev: 'Previous',
    next: 'Next',
    toggle: 'Toggle navigation',
    guide: 'User Guide',
    support: 'Support',
    localSetup: 'Local Setup',
    privacy: 'Privacy',
    terms: 'Terms',
    about: 'About',
    accessibility: 'Accessibility',
  },
  he: {
    home: 'דף הבית',
    onPage: 'בעמוד הזה',
    sections: 'הסעיפים בעמוד הזה',
    more: 'תיעוד נוסף',
    prev: 'הקודם',
    next: 'הבא',
    toggle: 'הצגה או הסתרה של הניווט',
    guide: 'מדריך למשתמש',
    support: 'תמיכה',
    localSetup: 'הרצה מקומית',
    privacy: 'פרטיות',
    terms: 'תנאים',
    about: 'אודות',
    accessibility: 'נגישות',
  },
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
export function DocsLayout({ children, path, eyebrow, title, subtitle, dir = 'ltr' }: DocsLayoutProps) {
  const locale = localeOf(path);
  const t = UI[locale];

  /**
   * This page's language, kept across a footer link.
   *
   * The footer used to hold the English paths outright, so clicking "Terms" on
   * /he/privacy landed on /terms, and `RouteChrome` then flipped the document to
   * lang="en" dir="ltr" - the footer silently removing a reader from the Hebrew
   * site, and undoing the care `LocaleSwitch` takes to keep your page when you
   * change language on purpose. Falls back to the path itself for the home page,
   * which has no Hebrew twin to send anyone to.
   */
  const inThisLanguage = (to: string): string => translatedPath(to, locale) ?? to;

  const { headings, content: anchored } = anchorHeadings(children);
  const content = writeProse(anchored);

  /* The trail uses the sidebar title, not the page's h1: the guide's heading is
     "Using WindoM" and its group is "Using WindoM", which produced a crumb that
     said the same thing twice. */
  const current = docsGroups(locale)
    .flatMap((g) => g.pages)
    .find((pg) => pg.path === path);
  const currentGroup = current?.group;

  /* Sidebar groups the reader has folded, and whether the current page's own
     section list is open. Remembered (lib/navMemory): each docs page mounts its
     own layout, so state held here alone reset on every navigation and the whole
     menu jumped open. The first render reads only the in-visit cache, never
     storage, because on a hard load it is hydrating prerendered HTML with every
     group open; `load` below applies what was saved once that is done. The group
     holding the current page is always open on arrival: landing on a page inside
     a folded group would otherwise hide "where am I". */
  const [closedGroups, setClosedGroups] = useState<ReadonlySet<string>>(
    () => new Set(navMemory.snapshot().closed.filter((g) => g !== currentGroup)),
  );
  const [sectionsOpen, setSectionsOpen] = useState(() => navMemory.snapshot().sections);

  const toggleGroup = (name: string) => {
    const next = new Set(closedGroups);
    if (!next.delete(name)) next.add(name);
    setClosedGroups(next);
    navMemory.save({ closed: [...next] });
  };
  const toggleSections = () => {
    setSectionsOpen(!sectionsOpen);
    navMemory.save({ sections: !sectionsOpen });
  };
  const { active, select } = useActiveHeading(headings.map((h) => h.id));
  const railList = useRef<HTMLUListElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const proseRef = useRef<HTMLDivElement>(null);
  const railBar = useRef<HTMLDivElement>(null);
  useReadingProgress(railBar, headRef, proseRef, path);
  useKeepActiveInView(railList, 'a[aria-current="location"]', active);
  useKeepActiveInView(navRef, '.docs-nav-sections a[aria-current="location"]', active);

  /* The current page's own sections, for the sidebar. Only the h2s: the
     sidebar is a map of the site, and a page's outline one level deep is as
     far into a page as a map should go. Each h3 is folded into the section it
     sits under, so the mark follows the reader through subsections too. */
  const sections = headings.filter((h) => h.level === 2);
  const activeIndex = headings.findIndex((h) => h.id === active);
  const activeSection = headings
    .slice(0, activeIndex + 1)
    .filter((h) => h.level === 2)
    .pop()?.id;
  const { prev, next } = docsNeighbours(path);

  /* A hard load: apply what was saved, before the first paint of this commit.
     Runs on every mount but only reads storage the first time; within a visit
     it finds the cache the state above was already built from and changes
     nothing. */
  useIsoLayoutEffect(() => {
    const saved = navMemory.load();
    const closed = new Set(saved.closed.filter((g) => g !== currentGroup));
    setClosedGroups((now) => (sameMembers(now, closed) ? now : closed));
    setSectionsOpen(saved.sections);
    if (closed.size !== saved.closed.length) navMemory.save({ closed: [...closed] });
    // Once, on mount: the page-change case is the effect below.
  }, []);

  /* A layout that stays mounted while the page changes still reopens the
     group the new page is in. It reads the memory, not the closure: this
     effect also runs in the commit that mounts the layout, before the saved
     state has landed in this component's own state. */
  useEffect(() => {
    if (!currentGroup) return;
    const saved = navMemory.snapshot();
    if (saved.closed.includes(currentGroup)) navMemory.save({ closed: saved.closed.filter((g) => g !== currentGroup) });
    setClosedGroups((prev) => {
      if (!prev.has(currentGroup)) return prev;
      const next = new Set(prev);
      next.delete(currentGroup);
      return next;
    });
  }, [currentGroup, path]);

  /* The sidebar scrolls on its own. Put it back where it was before this page
     paints, then `useKeepActiveInView` moves it only if the current page is
     out of view. Without this the sidebar returned to the top on every
     navigation. */
  useIsoLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    nav.scrollTop = navMemory.snapshot().scroll;
    const remember = () => navMemory.setScroll(nav.scrollTop);
    nav.addEventListener('scroll', remember, { passive: true });
    return () => nav.removeEventListener('scroll', remember);
  }, []);

  /**
   * Collapsed by choice, remembered.
   *
   * Starts expanded rather than reading storage during render: the first paint
   * is prerendered HTML, and a value read from localStorage would disagree with
   * it on any load where the sidebar had been closed.
   */
  const [collapsed, setCollapsed] = useState(() => rememberedCollapsed ?? false);

  useEffect(() => {
    if (rememberedCollapsed !== undefined) return;
    try {
      rememberedCollapsed = localStorage.getItem(SIDEBAR_KEY) === 'collapsed';
    } catch {
      // Private mode, or storage disabled. The sidebar simply stays open.
      rememberedCollapsed = false;
    }
    if (rememberedCollapsed) setCollapsed(true);
  }, []);

  /* On a phone the sidebar is closed until asked for, whatever the remembered
     choice: a first-time reader arriving from search should land on the page,
     not on a 1,400px link list. It is a separate flag so the desktop choice is
     neither read nor overwritten by it, and every navigation remounts the shell,
     so the list closes itself once a link has been followed. */
  const narrow = useNarrow();
  const [navOpen, setNavOpen] = useState(false);

  const toggleSidebar = () => {
    if (narrow) {
      setNavOpen((o) => !o);
      return;
    }
    setCollapsed((was) => {
      const next = !was;
      rememberedCollapsed = next;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? 'collapsed' : 'open');
      } catch {
        /* not worth failing the click over */
      }
      return next;
    });
  };

  return (
    <div dir={dir} className={`docs${collapsed ? ' is-collapsed' : ''}${navOpen ? ' is-nav-open' : ''}`}>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      {/* How far through this page's text you are. Decorative: the page's own
          scroll is the accessible readout, so it is hidden from assistive
          technology rather than announced sixty times a second. */}
      <div ref={railBar} className="reading-rail" aria-hidden="true" />
      <div className="ambient" aria-hidden="true" />

      <SiteNav current={path} locale={locale} />

      {/* The sidebar control sits at the head of the breadcrumb row, where the
          documentation sites this follows put it. */}
      <div className="docs-bar">
        <button
          type="button"
          className="docs-bar-toggle"
          onClick={toggleSidebar}
          aria-expanded={narrow ? navOpen : !collapsed}
          aria-controls="docs-nav"
          aria-label={t.toggle}
        >
          <SidebarGlyph />
        </button>

        <nav className="docs-crumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link to="/">{t.home}</Link>
            </li>
            {current?.group && (
              <li>
                <span>{current.group}</span>
              </li>
            )}
            <li aria-current="page">{current?.title ?? title}</li>
          </ol>
        </nav>

        <DocsSearch locale={locale} />
      </div>

      <div className="docs-shell">
        {/* A tree. Each group label is a button (`aria-expanded`) that folds its
            pages; the pages hang off a guide line, the current page carries the
            accent bar on that line, and the current page's own sections have a
            second chevron. Groups start open so the prerendered HTML lists every
            page, and the group holding the current page reopens on navigation. */}
        <nav className="docs-nav" id="docs-nav" aria-label="Documentation" ref={navRef}>
          {docsGroups(locale).map(({ group: groupName, pages }, gi) => (
            <div className="docs-nav-group" key={groupName}>
              <p className="docs-nav-label" id={`docs-nav-label-${gi}`}>
                <button
                  type="button"
                  className="docs-nav-group-toggle"
                  aria-expanded={!closedGroups.has(groupName)}
                  aria-controls={`docs-nav-tree-${gi}`}
                  onClick={() => toggleGroup(groupName)}
                >
                  <ChevronGlyph />
                  <span>{groupName}</span>
                </button>
              </p>
              <ul
                className="docs-nav-tree"
                id={`docs-nav-tree-${gi}`}
                aria-labelledby={`docs-nav-label-${gi}`}
                hidden={closedGroups.has(groupName)}
              >
                {pages.map((page) => {
                  const isCurrent = page.path === path;
                  const nested = isCurrent && sections.length > 1;
                  return (
                    <li key={page.path} className={nested ? 'has-sections' : undefined}>
                      <div className="docs-nav-row">
                        <Link
                          to={page.path}
                          className={`docs-nav-link${isCurrent ? ' is-current' : ''}`}
                          aria-current={isCurrent ? 'page' : undefined}
                          viewTransition
                        >
                          {page.title}
                        </Link>
                        {nested && (
                          <button
                            type="button"
                            className="docs-nav-expander"
                            aria-expanded={sectionsOpen}
                            aria-controls="docs-nav-sections"
                            aria-label={t.sections}
                            onClick={toggleSections}
                          >
                            <ChevronGlyph />
                          </button>
                        )}
                      </div>
                      {nested && (
                        <ul
                          className="docs-nav-tree docs-nav-sections"
                          id="docs-nav-sections"
                          aria-label={t.sections}
                          hidden={!sectionsOpen}
                        >
                          {sections.map((h) => (
                            <li key={h.id}>
                              <a
                                href={`#${h.id}`}
                                className={`docs-nav-link${h.id === activeSection ? ' is-active' : ''}`}
                                aria-current={h.id === activeSection ? 'location' : undefined}
                                onClick={() => select(h.id)}
                              >
                                {h.text}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* `tabIndex={-1}` for the same reason as in `Layout`: Safari and some
            assistive technology move focus to a fragment target only when it
            can hold focus, so without it the skip link moves the viewport and
            the next Tab lands back in the nav it was meant to skip. */}
        <main id="content" className="docs-main" tabIndex={-1}>
          <div className="docs-head" ref={headRef}>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1>{title}</h1>
            {subtitle && <p className="updated">{subtitle}</p>}
          </div>

          <div className="prose" ref={proseRef}>
            {content}
          </div>

          {(prev || next) && (
            <nav className="docs-neighbours" aria-label={t.more}>
              {prev && <NeighbourLink page={prev} rel="prev" label={t.prev} here={currentGroup} />}
              {next && <NeighbourLink page={next} rel="next" label={t.next} here={currentGroup} />}
            </nav>
          )}
        </main>

        {/* Only worth the column when there is something to list. */}
        {headings.length > 1 && (
          <aside className="docs-rail" aria-label={t.onPage}>
            <h2 className="docs-rail-heading">{t.onPage}</h2>
            <ul ref={railList}>
              {headings.map((h) => (
                <li key={h.id} className={h.level === 3 ? 'is-sub' : undefined}>
                  <a
                    href={`#${h.id}`}
                    className={h.id === active ? 'is-active' : undefined}
                    /* Announced, not merely coloured: the mark is the only
                       thing saying where you are, and a colour alone says it
                       to no one using a screen reader. */
                    aria-current={h.id === active ? 'location' : undefined}
                    onClick={() => select(h.id)}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      <footer className="site-footer">
        <div className="wrap">
          <nav aria-label="Footer">
            <Link to={inThisLanguage('/')}>{t.home}</Link>
            <Link to={inThisLanguage('/guide')}>{t.guide}</Link>
            <Link to={inThisLanguage('/support')}>{t.support}</Link>
            <Link to={inThisLanguage('/about')}>{t.about}</Link>
            <Link to={inThisLanguage('/local-setup')}>{t.localSetup}</Link>
            <Link to={inThisLanguage('/privacy')}>{t.privacy}</Link>
            <Link to={inThisLanguage('/terms')}>{t.terms}</Link>
            <Link to={inThisLanguage('/accessibility')}>{t.accessibility}</Link>
            <a href={STORE_URL}>Chrome Web Store</a>
            <a href={GITHUB_URL}>GitHub</a>
          </nav>
          <p>
            MIT License © {new Date().getFullYear()}{' '}
            <a href={AUTHOR.url} rel="author">
              {locale === 'he' ? AUTHOR.nameHe : AUTHOR.name}
            </a>{' '}
            &nbsp;·&nbsp; <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
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

/** Points to the inline end; turned to point down when its list is open. */
function ChevronGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M4.5 2.5 8 6l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Points to the inline end; the stylesheet turns it for "previous" and for Hebrew. */
function ArrowGlyph() {
  return (
    <svg className="docs-neighbour-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 7h10M8 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * One end of the previous/next pair.
 *
 * Says where the link goes, not just what it is called: the page's group when
 * it is not the one the reader is in (so crossing from "Get started" into
 * "Settings" is visible before the click), and the blurb the route table
 * already holds. The accessible name is "Next: Clock", which contains both
 * visible words as WCAG 2.5.3 asks, and leaves the blurb as supplementary text
 * rather than reading it into every link name.
 */
function NeighbourLink({
  page,
  rel,
  label,
  here,
}: {
  page: SiteRoute;
  rel: 'prev' | 'next';
  label: string;
  /** The group of the page being read. */
  here?: string;
}) {
  const crossing = page.group && page.group !== here ? page.group : undefined;
  return (
    <Link
      className={`docs-neighbour is-${rel}`}
      to={page.path}
      rel={rel}
      viewTransition
      aria-label={`${label}: ${page.title}`}
    >
      <span className="docs-neighbour-label">
        {rel === 'prev' && <ArrowGlyph />}
        <span>{label}</span>
        {crossing && <span className="docs-neighbour-group">{crossing}</span>}
        {rel === 'next' && <ArrowGlyph />}
      </span>
      <span className="docs-neighbour-title">{page.title}</span>
      {page.description && <span className="docs-neighbour-blurb">{page.description}</span>}
    </Link>
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
    const walked =
      element.props.children !== undefined ? cloneElement(element, undefined, walk(element.props.children)) : element;

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
 *
 * Badges are skipped outright. They are decoration on the heading, not part of
 * its name: with them the rail read "Create a WindoM Account Optional" and the
 * self-link was announced as "Link to Connect Spotify BYOA".
 */
function textOf(node: ReactNode): string {
  return flatten(node).replace(/\s+/g, ' ').trim();
}

function flatten(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flatten).join(' ');
  if (isValidElement(node)) {
    const { className, children } = (node as ReactElement<{ className?: string; children?: ReactNode }>).props;
    if (typeof className === 'string' && className.split(/\s+/).includes('badge')) return '';
    return flatten(children);
  }
  return '';
}
