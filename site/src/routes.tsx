import type { ReactElement } from 'react';
import { Home } from './pages/Home';
import { Install } from './pages/Install';
import { Guide } from './pages/Guide';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Support } from './pages/Support';
import { Contact } from './pages/Contact';
import { LocalSetup } from './pages/LocalSetup';
import { Install as InstallHe } from './pages/he/Install';
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
  /** Sidebar grouping. Absent for pages that are not documentation. */
  group?: string;
  /**
   * Short line under the title in the sidebar. Every documentation page has
   * one: a column where some entries carry a second line and their neighbours
   * do not reads as ragged, and as though the bare ones were unfinished.
   */
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
    path: '/install',
    group: 'Get started',
    blurb: 'Add it to Chrome, find your way round',
    element: <Install />,
    locale: 'en',
    title: 'Install',
    description:
      'Install WindoM from the Chrome Web Store, what works straight away with no account, and where everything is.',
    twinOf: '/install',
  },
  {
    path: '/guide',
    group: 'Get started',
    blurb: 'Every panel, and what it does',
    element: <Guide />,
    locale: 'en',
    title: 'User Guide',
    description: 'Every panel in WindoM and what it does, with setup for Calendar and Spotify.',
    twinOf: '/guide',
  },
  {
    path: '/support',
    group: 'Help',
    blurb: 'Fixes for the common problems',
    element: <Support />,
    locale: 'en',
    title: 'Support',
    description:
      'How to report a problem with WindoM, fixes for the common ones, and what to include so it can be reproduced.',
    twinOf: '/support',
  },
  {
    path: '/contact',
    group: 'Help',
    blurb: 'Reach the developer, and when to expect a reply',
    element: <Contact />,
    locale: 'en',
    title: 'Contact',
    description: 'How to reach the developer of WindoM, and what to expect.',
    twinOf: '/contact',
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
  },
  {
    path: '/privacy',
    group: 'Legal',
    blurb: 'What is stored, and where',
    element: <Privacy />,
    locale: 'en',
    title: 'Privacy Policy',
    description:
      'What WindoM stores, what stays on your device, and what the optional account syncs. No analytics, no telemetry, no ads.',
    twinOf: '/privacy',
  },
  {
    path: '/terms',
    group: 'Legal',
    blurb: 'The rules for using the service',
    element: <Terms />,
    locale: 'en',
    title: 'Terms of Use',
    description:
      'The terms governing use of the WindoM hosted service and the published Chrome extension.',
    twinOf: '/terms',
  },

  // ── Hebrew ──────────────────────────────────────────────────────────────
  {
    path: '/he/install',
    group: 'תחילת עבודה',
    blurb: 'הוספה ל-Chrome, והתמצאות ראשונה',
    element: <InstallHe />,
    locale: 'he',
    title: 'התקנה',
    description:
      'התקנת WindoM מחנות האינטרנט של Chrome, מה עובד מיד בלי חשבון, ואיפה נמצא כל דבר.',
    twinOf: '/install',
  },
  {
    path: '/he/guide',
    group: 'תחילת עבודה',
    blurb: 'כל פאנל, ומה הוא עושה',
    element: <GuideHe />,
    locale: 'he',
    title: 'מדריך למשתמש',
    description: 'כל פאנל ב-WindoM ומה הוא עושה, כולל הגדרת יומן ו-Spotify.',
    twinOf: '/guide',
  },
  {
    path: '/he/support',
    group: 'עזרה',
    blurb: 'פתרונות לתקלות הנפוצות',
    element: <SupportHe />,
    locale: 'he',
    title: 'תמיכה',
    description: 'איך לדווח על תקלה ב-WindoM, פתרונות לתקלות הנפוצות, ומה לכלול בדיווח.',
    twinOf: '/support',
  },
  {
    path: '/he/contact',
    group: 'עזרה',
    blurb: 'פנייה למפתח, ומתי לצפות לתשובה',
    element: <ContactHe />,
    locale: 'he',
    title: 'יצירת קשר',
    description: 'איך ליצור קשר עם המפתח של WindoM, ולמה לצפות.',
    twinOf: '/contact',
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
  },
  {
    path: '/he/privacy',
    group: 'משפטי',
    blurb: 'מה נשמר, ואיפה',
    element: <PrivacyHe />,
    locale: 'he',
    title: 'מדיניות פרטיות',
    description: 'מה WindoM שומר, מה נשאר על המכשיר שלך, ומה החשבון האופציונלי מסנכרן.',
    twinOf: '/privacy',
  },
  {
    path: '/he/terms',
    group: 'משפטי',
    blurb: 'הכללים לשימוש בשירות',
    element: <TermsHe />,
    locale: 'he',
    title: 'תנאי שימוש',
    description: 'התנאים החלים על השימוש בשירות WindoM ובתוסף המפורסם ל-Chrome.',
    twinOf: '/terms',
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

/**
 * Every path the build must emit a file for, clean and legacy together.
 *
 * Unconditional on purpose. This used to be an opt-in `legacyHtml` flag, read as
 * "the .html URL is registered somewhere we do not control". But on GitHub Pages
 * the flat file is also what makes the *clean* URL work: `/guide` is served from
 * `guide.html` with a 200, while a route that only has `install/index.html`
 * answers `/install` with a 301 to `/install/`. #435 added /install without the
 * flag and every deploy after it failed its live check. Every route gets both.
 */
export function emittedPaths(route: SiteRoute): string[] {
  return route.path === '/' ? ['/', legacyPathOf('/')] : [route.path, legacyPathOf(route.path)];
}

/**
 * The route for a path, accepting every URL shape that reaches us.
 *
 * Four addresses lead to the guide and all four have to resolve here, because
 * the caller that matters is `RouteChrome`: a path it cannot place is treated as
 * a 404 and titles the document "Page not found" over a correctly rendered page,
 * leaving `lang`, `dir`, the description and the canonical at the previous
 * page's values - which on `/he/privacy/` means Hebrew laid out left to right.
 *
 *   /guide              the clean URL
 *   /guide.html         the shape the Chrome Web Store has registered
 *   /guide/             what React Router matches (it compiles an optional
 *                       trailing slash into every path), and the shape of
 *                       `guide/index.html` on disk
 *   /guide/index.html   that file named outright
 *
 * The trailing slash is stripped first, so the extension is still at the end of
 * the string when `.html` comes off.
 */
export function routeFor(path: string): SiteRoute | undefined {
  const clean =
    path
      .replace(/\/+$/, '')
      .replace(/\.html$/, '')
      .replace(/\/index$/, '') || '/';
  return ROUTES.find((r) => r.path === clean);
}
