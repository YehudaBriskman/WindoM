/**
 * What the docs sidebar remembers, so it stops resetting on every page.
 *
 * Each docs page mounts its own layout, so anything held in component state
 * was lost on every navigation: every folded group reopened and the sidebar
 * scrolled back to the top, which read as the whole menu jumping. Three things
 * are kept here:
 *
 *   closed    the groups the reader folded (by name: group names are already
 *             per language, so English and Hebrew do not share an entry)
 *   sections  whether the current page's own section list is open
 *   scroll    the sidebar's scroll position
 *
 * `closed` and `sections` are written to localStorage so they survive a visit
 * and a reload. `scroll` is not: it only matters between two pages of one
 * visit, and the sidebar scrolls the current page into view on arrival
 * anyway, so a position from last week would only be wrong.
 *
 * `snapshot()` never touches storage. It is what the first render reads, and
 * the first render of a hard load is hydrating prerendered HTML in which every
 * group is open; a value read from storage there would disagree with it. It
 * returns the empty memory until `load()` has run, which the layout does once,
 * after hydration. Within a visit the cache is filled by then, so moving
 * between pages renders the remembered state on the very first frame.
 *
 * Storage that throws (private mode, disabled, full) is never an error here:
 * the sidebar simply starts open.
 */

export interface NavMemory {
  closed: string[];
  /** Nothing has been saved: the reader has never opened or closed a group, so the default applies
   *  (only the group holding the current page open). Never stored; read from the absence of `closed`. */
  fresh: boolean;
  sections: boolean;
  scroll: number;
}

export const NAV_KEY = 'windom-docs-nav';

/** More groups than the docs will ever have; a bound on what a bad value can cost. */
const MAX_CLOSED = 40;

export const emptyNav = (): NavMemory => ({ closed: [], fresh: true, sections: true, scroll: 0 });

/** Tolerant of anything: a value from an older build, or one edited by hand. */
export function parseNav(raw: string | null | undefined): NavMemory {
  const empty = emptyNav();
  if (!raw) return empty;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return empty;
  }
  if (typeof value !== 'object' || value === null) return empty;
  const v = value as Record<string, unknown>;
  const fresh = !Array.isArray(v.closed);
  const closed = Array.isArray(v.closed)
    ? [...new Set(v.closed.filter((g): g is string => typeof g === 'string' && g.length > 0 && g.length < 200))].slice(
        0,
        MAX_CLOSED,
      )
    : [];
  return { closed, fresh, sections: typeof v.sections === 'boolean' ? v.sections : true, scroll: 0 };
}

export function serializeNav(memory: NavMemory): string {
  return JSON.stringify({ closed: memory.closed, sections: memory.sections });
}

/** The two methods used, so a test can hand in a plain object. */
export interface NavStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface NavMemoryStore {
  /** True once `load` has read storage; before that `snapshot` is only the empty default. */
  loaded(): boolean;
  snapshot(): NavMemory;
  load(): NavMemory;
  save(patch: Partial<Omit<NavMemory, 'scroll'>>): void;
  setScroll(top: number): void;
}

export function createNavMemory(storage: () => NavStorage | null): NavMemoryStore {
  let memory: NavMemory | null = null;

  const read = (): string | null => {
    try {
      return storage()?.getItem(NAV_KEY) ?? null;
    } catch {
      return null;
    }
  };

  return {
    loaded: () => memory !== null,
    snapshot: () => memory ?? emptyNav(),

    /** Reads storage once; every later call returns the cache. */
    load() {
      if (!memory) memory = parseNav(read());
      return memory;
    },

    save(patch) {
      memory = { ...(memory ?? emptyNav()), ...patch, fresh: false };
      try {
        storage()?.setItem(NAV_KEY, serializeNav(memory));
      } catch {
        /* not worth failing a click over */
      }
    },

    setScroll(top) {
      memory = { ...(memory ?? emptyNav()), scroll: Number.isFinite(top) && top > 0 ? top : 0 };
    },
  };
}

/** The real one. `localStorage` is read lazily because the prerender has none. */
export const navMemory = createNavMemory(() => (typeof localStorage === 'undefined' ? null : localStorage));

/**
 * Which groups are folded, given what is remembered.
 *
 * A reader who has never touched the tree gets every group folded except the one
 * holding the page they are on: the sidebar then shows all the section headings
 * at a glance, instead of the first two groups and a scroll to find the rest.
 * Once they have opened or closed anything, their own list wins. Either way the
 * current page's group is open - arriving on a page inside a folded group would
 * hide "where am I".
 */
export function resolveClosed(
  saved: Pick<NavMemory, 'closed' | 'fresh'>,
  groups: readonly string[],
  current?: string,
): Set<string> {
  const closed = saved.fresh ? groups : saved.closed;
  return new Set(closed.filter((g) => g !== current));
}
