/**
 * The documentation pages, in reading order.
 *
 * One list, read by the sidebar, the previous/next links and the footer, so
 * adding a page is a single entry rather than four edits in four files - which
 * is the mistake the old site made with its copy-pasted shells.
 *
 * `href` is the built filename, not a route. These URLs are contractual:
 * `privacy.html` and `terms.html` are registered against the Chrome Web Store
 * listing and `guide.html` is compiled into the extension, so renaming one
 * needs a store release to repair. See the note in vite.config.ts.
 */

export interface DocsPage {
  href: string;
  title: string;
  /** Sidebar grouping. Pages are listed under their group in array order. */
  group: string;
  /** Short line under the title in the sidebar, where it earns its space. */
  blurb?: string;
}

export const DOCS_PAGES: DocsPage[] = [
  { href: '/guide.html', title: 'User Guide', group: 'Using WindoM', blurb: 'Every panel, and what it does' },
  { href: '/support.html', title: 'Support', group: 'Using WindoM', blurb: 'Fixes for the common problems' },
  { href: '/contact.html', title: 'Contact', group: 'Using WindoM' },
  { href: '/local-setup.html', title: 'Local Setup', group: 'Developers', blurb: 'Run the whole stack yourself' },
  { href: '/privacy.html', title: 'Privacy Policy', group: 'Legal' },
  { href: '/terms.html', title: 'Terms of Use', group: 'Legal' },
];

/** The groups in sidebar order, derived so the two cannot disagree. */
export function docsGroups(): { group: string; pages: DocsPage[] }[] {
  const order: string[] = [];
  const byGroup = new Map<string, DocsPage[]>();

  for (const page of DOCS_PAGES) {
    if (!byGroup.has(page.group)) {
      byGroup.set(page.group, []);
      order.push(page.group);
    }
    byGroup.get(page.group)!.push(page);
  }

  return order.map((group) => ({ group, pages: byGroup.get(group)! }));
}

/** The pages either side of `href`, for the footer links. */
export function docsNeighbours(href: string): { prev?: DocsPage; next?: DocsPage } {
  const index = DOCS_PAGES.findIndex((p) => p.href === href);
  if (index === -1) return {};
  return { prev: DOCS_PAGES[index - 1], next: DOCS_PAGES[index + 1] };
}

/**
 * A stable anchor id from heading text.
 *
 * Derived rather than hand-authored so an id cannot drift from the heading it
 * points at - the failure mode being a table of contents whose links quietly
 * stop resolving after someone rewords a heading.
 */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
