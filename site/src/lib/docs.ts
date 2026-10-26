import { ROUTES, LOCALES, type Locale, type SiteRoute } from '../routes';

/**
 * The documentation navigation, derived from the route table.
 *
 * This file used to hold its own list of pages, which meant the sidebar and the
 * build could disagree about what the site contained. It derives now: there is
 * one description of the site in `routes.tsx` and everything else reads it.
 */

export type { Locale, SiteRoute };
export { LOCALES };

/** Documentation pages in the given language, in reading order. */
export function docsPages(locale: Locale): SiteRoute[] {
  return ROUTES.filter((r) => r.group !== undefined && r.locale === locale);
}

/** Those pages grouped, with the group order taken from the table itself. */
export function docsGroups(locale: Locale = 'en'): { group: string; pages: SiteRoute[] }[] {
  const order: string[] = [];
  const byGroup = new Map<string, SiteRoute[]>();

  for (const page of docsPages(locale)) {
    const group = page.group!;
    if (!byGroup.has(group)) {
      byGroup.set(group, []);
      order.push(group);
    }
    byGroup.get(group)!.push(page);
  }

  return order.map((group) => ({ group, pages: byGroup.get(group)! }));
}

/** The pages either side of `path`, within its own language. */
export function docsNeighbours(path: string): { prev?: SiteRoute; next?: SiteRoute } {
  const route = ROUTES.find((r) => r.path === path);
  if (!route) return {};
  const siblings = docsPages(route.locale);
  const index = siblings.findIndex((p) => p.path === path);
  if (index === -1) return {};
  return { prev: siblings[index - 1], next: siblings[index + 1] };
}

/**
 * The same page in the other language.
 *
 * Matched through `twinOf` rather than by rewriting the path, so a translation
 * that does not follow the `/he/<same-slug>` convention still resolves.
 */
export function translatedPath(path: string, to: Locale): string | undefined {
  const route = ROUTES.find((r) => r.path === path);
  if (!route?.twinOf) return undefined;
  if (route.locale === to) return route.path;
  return ROUTES.find((r) => r.twinOf === route.twinOf && r.locale === to)?.path;
}

/** Which language a path is in, read from the table rather than from the string. */
export function localeOf(path: string): Locale {
  return ROUTES.find((r) => r.path === path)?.locale ?? 'en';
}

export interface NavLink {
  path: string;
  label: string;
}

/**
 * The site navigation, shown on every page.
 *
 * Deliberately the things a reader might want next rather than a map of the
 * site: what the product does, where to get help, and where the source is. The
 * install call to action lives in the hero, where it has room to be a button.
 *
 * `/#updates` is the release feed on the home page - honest but thin until the
 * feed itself is fixed, which is issue #374.
 */
export const NAV_LINKS: NavLink[] = [
  { path: '/guide', label: 'Guide' },
  { path: '/support', label: 'Support' },
  { path: '/local-setup', label: 'Docs' },
  { path: '/#updates', label: 'Changelog' },
];

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
    .replace(/[^a-z0-9֐-׿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
