import type { ReactElement } from 'react';
import { Home } from './pages/Home';
import { Guide } from './pages/Guide';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Support } from './pages/Support';
import { Contact } from './pages/Contact';
import { LocalSetup } from './pages/LocalSetup';
import { Guide as GuideHe } from './pages/he/Guide';
import { Privacy as PrivacyHe } from './pages/he/Privacy';
import { Terms as TermsHe } from './pages/he/Terms';
import { Support as SupportHe } from './pages/he/Support';
import { Contact as ContactHe } from './pages/he/Contact';
import { LocalSetup as LocalSetupHe } from './pages/he/LocalSetup';


/**
 * The site, described once.
 *
 * Six lists used to say this: the Vite input map, the docs page list, the
 * prerender map, the deploy's URL check, thirteen HTML shells and thirteen
 * entry files. All six had to agree and nothing enforced that they did -
 * adding a page meant six edits, and adding a language meant six more.
 *
 * Everything now reads this: the router, the sidebar, the breadcrumbs, the
 * language switcher, the sitemap, the prerender and the deploy check.
 */

export type Locale = 'en' | 'he';

export const LOCALES: { code: Locale; label: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'he', label: 'עברית', dir: 'rtl' },
];

export interface SiteRoute {
  /** The clean path. `/` for the home page, no file extension anywhere. */
  path: string;
  element: ReactElement;
  locale: Locale;
  /** `<title>`, without the site suffix. */
  title: string;
  description: string;
  /**
   * The English path this is a translation of, or undefined for pages that
   * exist in one language. Drives the switcher and the hreflang pairs.
   */
  twinOf?: string;
  /**
   * Emitted as `<path>.html` as well as at the clean path. Set on the pages
   * whose `.html` URL is registered somewhere we do not control - the Chrome
   * Web Store listing, and the guide link compiled into the extension.
   */
  legacyHtml?: boolean;
  /** Sidebar grouping. Absent for pages that are not documentation. */
  group?: string;
  /** Short line under the title in the sidebar, where it earns its space. */
  blurb?: string;
}

export const ROUTES: SiteRoute[] = [
  {
    path: '/',
    element: <Home />,
    locale: 'en',
    title: 'WindoM - a new tab worth opening',
    description:
      'WindoM replaces the Chrome new tab with your calendar, the weather, todos and markets, on a wallpaper that moves with the hour.',
  },
  {
    path: '/guide',
    group: 'Using WindoM',
    blurb: 'Every panel, and what it does',
    element: <Guide />,
    locale: 'en',
    title: 'User Guide',
    description: 'Every panel in WindoM and what it does, with setup for Calendar and Spotify.',
    twinOf: '/guide',
    legacyHtml: true,
  },
  {
    path: '/support',
    group: 'Using WindoM',
    blurb: 'Fixes for the common problems',
    element: <Support />,
    locale: 'en',
    title: 'Support',
    description:
      'How to report a problem with WindoM, fixes for the common ones, and what to include so it can be reproduced.',
    twinOf: '/support',
    legacyHtml: true,
  },
  {
    path: '/contact',
    group: 'Using WindoM',
    element: <Contact />,
    locale: 'en',
    title: 'Contact',
    description: 'How to reach the developer of WindoM, and what to expect.',
    twinOf: '/contact',
    legacyHtml: true,
  },
  {
    path: '/local-setup',
    group: 'Developers',
    blurb: 'Run the whole stack yourself',
    element: <LocalSetup />,
    locale: 'en',
    title: 'Local Setup',
    description: "Run WindoM's extension, backend and database on your own machine.",
    twinOf: '/local-setup',
    legacyHtml: true,
  },
  {
    path: '/privacy',
    group: 'Legal',
    element: <Privacy />,
    locale: 'en',
    title: 'Privacy Policy',
    description:
      'What WindoM stores, what stays on your device, and what the optional account syncs. No analytics, no telemetry, no ads.',
    twinOf: '/privacy',
    legacyHtml: true,
  },
  {
    path: '/terms',
    group: 'Legal',
    element: <Terms />,
    locale: 'en',
    title: 'Terms of Use',
    description:
      'The terms governing use of the WindoM hosted service and the published Chrome extension.',
    twinOf: '/terms',
    legacyHtml: true,
  },

  // ── Hebrew ──────────────────────────────────────────────────────────────
  {
    path: '/he/guide',
    group: 'שימוש ב-WindoM',
    blurb: 'כל פאנל, ומה הוא עושה',
    element: <GuideHe />,
    locale: 'he',
    title: 'מדריך למשתמש',
    description: 'כל פאנל ב-WindoM ומה הוא עושה, כולל הגדרת יומן ו-Spotify.',
    twinOf: '/guide',
    legacyHtml: true,
  },
  {
    path: '/he/support',
    group: 'שימוש ב-WindoM',
    blurb: 'פתרונות לתקלות הנפוצות',
    element: <SupportHe />,
    locale: 'he',
    title: 'תמיכה',
    description: 'איך לדווח על תקלה ב-WindoM, פתרונות לתקלות הנפוצות, ומה לכלול בדיווח.',
    twinOf: '/support',
    legacyHtml: true,
  },
  {
    path: '/he/contact',
    group: 'שימוש ב-WindoM',
    element: <ContactHe />,
    locale: 'he',
    title: 'יצירת קשר',
    description: 'איך ליצור קשר עם המפתח של WindoM, ולמה לצפות.',
    twinOf: '/contact',
    legacyHtml: true,
  },
  {
    path: '/he/local-setup',
    group: 'למפתחים',
    blurb: 'הרצת כל המערכת אצלך',
    element: <LocalSetupHe />,
    locale: 'he',
    title: 'הרצה מקומית',
    description: 'הרצת התוסף, השרת ובסיס הנתונים של WindoM על המחשב שלך.',
    twinOf: '/local-setup',
    legacyHtml: true,
  },
  {
    path: '/he/privacy',
    group: 'משפטי',
    element: <PrivacyHe />,
    locale: 'he',
    title: 'מדיניות פרטיות',
    description: 'מה WindoM שומר, מה נשאר על המכשיר שלך, ומה החשבון האופציונלי מסנכרן.',
    twinOf: '/privacy',
    legacyHtml: true,
  },
  {
    path: '/he/terms',
    group: 'משפטי',
    element: <TermsHe />,
    locale: 'he',
    title: 'תנאי שימוש',
    description: 'התנאים החלים על השימוש בשירות WindoM ובתוסף המפורסם ל-Chrome.',
    twinOf: '/terms',
    legacyHtml: true,
  },
];

/** Whether two paths are the same page in different languages. */
export function areTwins(a: string, b: string): boolean {
  const left = routeFor(a)?.twinOf;
  return left !== undefined && left === routeFor(b)?.twinOf;
}

/** `<title>` for a route: the home page carries the suffix already. */
export function titleFor(route: SiteRoute): string {
  return route.path === '/' ? route.title : `${route.title} - WindoM`;
}

/** `/privacy` -> `/privacy.html`, `/` -> `/index.html`. */
export function legacyPathOf(path: string): string {
  return path === '/' ? '/index.html' : `${path}.html`;
}

/** Every path the build must emit a file for, clean and legacy together. */
export function emittedPaths(route: SiteRoute): string[] {
  const paths = [route.path];
  if (route.legacyHtml) paths.push(legacyPathOf(route.path));
  return paths;
}

/** The route for a path, accepting either URL shape. */
export function routeFor(path: string): SiteRoute | undefined {
  const clean = path.replace(/\.html$/, '').replace(/\/index$/, '/') || '/';
  return ROUTES.find((r) => r.path === clean);
}
