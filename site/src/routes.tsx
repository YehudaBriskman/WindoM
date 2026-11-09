import type { ReactElement } from 'react';
import { Home } from './pages/Home';
import { Install } from './pages/Install';
import { Guide } from './pages/Guide';
import { About } from './pages/About';
import { About as AboutHe } from './pages/he/About';
import { Clock as ClockGuide } from './pages/guide/Clock';
import { Clock as ClockGuideHe } from './pages/he/guide/Clock';
import { Background as BackgroundGuide } from './pages/guide/Background';
import { Background as BackgroundGuideHe } from './pages/he/guide/Background';
import { Links as LinksGuide } from './pages/guide/Links';
import { Links as LinksGuideHe } from './pages/he/guide/Links';
import { Todos as TodosGuide } from './pages/guide/Todos';
import { Todos as TodosGuideHe } from './pages/he/guide/Todos';
import { Focus as FocusGuide } from './pages/guide/Focus';
import { Focus as FocusGuideHe } from './pages/he/guide/Focus';
import { Quotes as QuotesGuide } from './pages/guide/Quotes';
import { Shortcuts as ShortcutsGuide } from './pages/guide/Shortcuts';
import { Shortcuts as ShortcutsGuideHe } from './pages/he/guide/Shortcuts';
import { Quotes as QuotesGuideHe } from './pages/he/guide/Quotes';
import { Search as SearchGuide } from './pages/guide/Search';
import { Search as SearchGuideHe } from './pages/he/guide/Search';
import { TabSidebar as TabSidebarGuide } from './pages/guide/TabSidebar';
import { TabSidebar as TabSidebarGuideHe } from './pages/he/guide/TabSidebar';
import { History as HistoryGuide } from './pages/guide/History';
import { History as HistoryGuideHe } from './pages/he/guide/History';
import { Weather as WeatherGuide } from './pages/guide/Weather';
import { Weather as WeatherGuideHe } from './pages/he/guide/Weather';
import { Finance as FinanceGuide } from './pages/guide/Finance';
import { Finance as FinanceGuideHe } from './pages/he/guide/Finance';
import { Templates as TemplatesGuide } from './pages/guide/Templates';
import { Templates as TemplatesGuideHe } from './pages/he/guide/Templates';
import { Account as AccountGuide } from './pages/guide/Account';
import { Account as AccountGuideHe } from './pages/he/guide/Account';
import { Calendar as CalendarGuide } from './pages/guide/Calendar';
import { Calendar as CalendarGuideHe } from './pages/he/guide/Calendar';
import { Github as GithubGuide } from './pages/guide/Github';
import { Github as GithubGuideHe } from './pages/he/guide/Github';
import { Spotify as SpotifyGuide } from './pages/guide/Spotify';
import { Spotify as SpotifyGuideHe } from './pages/he/guide/Spotify';
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
  /** `<title>` when it should say more than the sidebar label does. */
  headTitle?: string;
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
    path: '/guide/clock',
    group: 'Everyday panels',
    blurb: '12h or 24h, style, date, greeting',
    element: <ClockGuide />,
    locale: 'en',
    title: 'Clock, Date & Greeting',
    headTitle: 'Clock, Date and Greeting on Your New Tab',
    description:
      'Set the clock format, style, colour and size, show the date, and choose the greeting on your WindoM new tab.',
    twinOf: '/guide/clock',
  },
  {
    path: '/guide/background',
    group: 'Everyday panels',
    blurb: 'Built-in, your own, or Unsplash',
    element: <BackgroundGuide />,
    locale: 'en',
    title: 'Backgrounds',
    headTitle: 'Change Your New Tab Background',
    description:
      'Use built-in photos, your own images or Unsplash photography as your Chrome new tab background in WindoM.',
    twinOf: '/guide/background',
  },
  {
    path: '/guide/links',
    group: 'Everyday panels',
    blurb: 'Pin your most-used sites',
    element: <LinksGuide />,
    locale: 'en',
    title: 'Quick Links & Dock',
    headTitle: 'Quick Links and Dock Bar',
    description: 'Pin the sites you open most to the dock bar on your WindoM new tab, and add, edit or remove them.',
    twinOf: '/guide/links',
  },
  {
    path: '/guide/todos',
    group: 'Everyday panels',
    blurb: 'A task list in the sidebar',
    element: <TodosGuide />,
    locale: 'en',
    title: 'Todos',
    headTitle: 'Todo List in Your New Tab Sidebar',
    description: 'A task list that lives in the WindoM sidebar. No account needed.',
    twinOf: '/guide/todos',
  },
  {
    path: '/guide/focus',
    group: 'Everyday panels',
    blurb: 'Set an intention, then a timer',
    element: <FocusGuide />,
    locale: 'en',
    title: 'Focus Mode',
    headTitle: 'Focus Mode and Focus Timer',
    description:
      'Set your main focus and a countdown timer from 25 minutes to 4 hours, and WindoM dims everything else until it ends.',
    twinOf: '/guide/focus',
  },
  {
    path: '/guide/quotes',
    group: 'Everyday panels',
    blurb: 'One a day, local or from the API',
    element: <QuotesGuide />,
    locale: 'en',
    title: 'Daily Quotes',
    headTitle: 'Daily Quote on Your New Tab',
    description: 'One quote a day on your WindoM new tab, local or from the API, and what clicking it does.',
    twinOf: '/guide/quotes',
  },
  {
    path: '/guide/shortcuts',
    group: 'Everyday panels',
    blurb:
      'Every keyboard shortcut in WindoM, from the global search key to the Escape and Enter keys inside each panel.',
    element: <ShortcutsGuide />,
    locale: 'en',
    title: 'Keyboard Shortcuts',
    headTitle: 'Keyboard Shortcuts for the WindoM New Tab - WindoM',
    description:
      'Every keyboard shortcut in WindoM, from the global search key to the Escape and Enter keys inside each panel.',
    twinOf: '/guide/shortcuts',
  },
  {
    path: '/guide/search',
    group: 'Everyday panels',
    blurb: 'Tabs, history and the web',
    element: <SearchGuide />,
    locale: 'en',
    title: 'Search',
    headTitle: 'Search Tabs, History and the Web',
    description:
      'One shortcut on any page to search your open tabs, your history and the web with Google, Bing, DuckDuckGo or Brave.',
    twinOf: '/guide/search',
  },
  {
    path: '/guide/tab-sidebar',
    group: 'Everyday panels',
    blurb: 'Your open tabs, from any page',
    element: <TabSidebarGuide />,
    locale: 'en',
    title: 'Tab Sidebar',
    headTitle: 'Tab Sidebar: Your Open Tabs',
    description: 'See and jump to your open tabs from the WindoM sidebar, from any page.',
    twinOf: '/guide/tab-sidebar',
  },
  {
    path: '/guide/history',
    group: 'Everyday panels',
    blurb: 'Where you have just been',
    element: <HistoryGuide />,
    locale: 'en',
    title: 'Tab History',
    headTitle: 'Tab History and Recent Pages',
    description: 'The Recent list, and browsing history as search suggestions, and how to turn them off.',
    twinOf: '/guide/history',
  },
  {
    path: '/guide/weather',
    group: 'Everyday panels',
    blurb: 'Live conditions, no key',
    element: <WeatherGuide />,
    locale: 'en',
    title: 'Weather',
    headTitle: 'Weather Widget',
    description: 'Live temperature and conditions on your WindoM new tab from Open-Meteo. No API key, no account.',
    twinOf: '/guide/weather',
  },
  {
    path: '/guide/finance',
    group: 'Everyday panels',
    blurb: 'Live stocks and crypto',
    element: <FinanceGuide />,
    locale: 'en',
    title: 'Finance',
    headTitle: 'Stocks and Crypto Prices on Your New Tab',
    description: 'Live stock and crypto prices on your WindoM new tab, from Yahoo Finance and CoinGecko.',
    twinOf: '/guide/finance',
  },
  {
    path: '/guide/templates',
    group: 'Everyday panels',
    blurb: 'Minimal, Deep Focus, Dashboard',
    element: <TemplatesGuide />,
    locale: 'en',
    title: 'Layout Templates',
    headTitle: 'Layout Templates: Minimal, Deep Focus, Dashboard',
    description:
      'Preset arrangements for your WindoM new tab, such as Minimal, Deep Focus and Dashboard, and how to switch between them.',
    twinOf: '/guide/templates',
  },
  {
    path: '/guide/account',
    group: 'Account and integrations',
    blurb: 'Optional. Sync and integrations',
    element: <AccountGuide />,
    locale: 'en',
    title: 'WindoM Account',
    headTitle: 'Create a WindoM Account (Optional)',
    description:
      'What a free WindoM account adds, how to create one, and how to manage it. Needed only for sync, Calendar, GitHub and Spotify.',
    twinOf: '/guide/account',
  },
  {
    path: '/guide/calendar',
    group: 'Account and integrations',
    blurb: 'Today and what is coming',
    element: <CalendarGuide />,
    locale: 'en',
    title: 'Google Calendar',
    headTitle: 'Connect Google Calendar to Your New Tab',
    description: 'Show today and what is coming from Google Calendar in your WindoM sidebar, read-only.',
    twinOf: '/guide/calendar',
  },
  {
    path: '/guide/github',
    group: 'Account and integrations',
    blurb: 'Notifications, reviews, issues',
    element: <GithubGuide />,
    locale: 'en',
    title: 'GitHub',
    headTitle: 'Connect GitHub: Notifications and Review Requests',
    description: 'See GitHub notifications, review requests and assigned issues on your WindoM new tab.',
    twinOf: '/guide/github',
  },
  {
    path: '/guide/spotify',
    group: 'Account and integrations',
    blurb: 'Now playing and top tracks',
    element: <SpotifyGuide />,
    locale: 'en',
    title: 'Spotify',
    headTitle: 'Connect Spotify: Now Playing and Top Tracks',
    description:
      'Connect Spotify to WindoM with your own free Spotify Developer app: now playing, playback controls and top tracks.',
    twinOf: '/guide/spotify',
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
    path: '/about',
    group: 'Help',
    blurb: 'Who makes WindoM, and why you can read the source',
    element: <About />,
    locale: 'en',
    title: 'About',
    headTitle: 'About WindoM and Its Author, Yehuda Briskman',
    description:
      'WindoM is a free, open-source Chrome new tab extension made by Yehuda Briskman, a full-stack engineer in Tel Aviv. What it is, who makes it, and where to read more.',
    twinOf: '/about',
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
    description: 'The terms governing use of the WindoM hosted service and the published Chrome extension.',
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
    description: 'התקנת WindoM מחנות האינטרנט של Chrome, מה עובד מיד בלי חשבון, ואיפה נמצא כל דבר.',
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
    path: '/he/guide/clock',
    group: 'פאנלים יומיומיים',
    blurb: '12/24 שעות, סגנון, תאריך, ברכה',
    element: <ClockGuideHe />,
    locale: 'he',
    title: 'שעון, תאריך וברכה',
    headTitle: 'שעון, תאריך וברכה בלשונית החדשה',
    description: 'הגדרת פורמט השעון, הסגנון, הצבע והגודל, הצגת התאריך ובחירת הברכה בלשונית החדשה של WindoM.',
    twinOf: '/guide/clock',
  },
  {
    path: '/he/guide/background',
    group: 'פאנלים יומיומיים',
    blurb: 'מובנים, שלכם, או Unsplash',
    element: <BackgroundGuideHe />,
    locale: 'he',
    title: 'רקעים',
    headTitle: 'שינוי הרקע של הלשונית החדשה',
    description: 'רקעים מובנים, תמונות משלכם או צילומי Unsplash כרקע הלשונית החדשה ב-WindoM.',
    twinOf: '/guide/background',
  },
  {
    path: '/he/guide/links',
    group: 'פאנלים יומיומיים',
    blurb: 'נעצו את האתרים שלכם',
    element: <LinksGuideHe />,
    locale: 'he',
    title: 'קישורים מהירים',
    headTitle: 'קישורים מהירים וסרגל הדוק',
    description: 'נעצו את האתרים שאתם פותחים הכי הרבה לסרגל הדוק בלשונית החדשה של WindoM, והוסיפו, ערכו או הסירו אותם.',
    twinOf: '/guide/links',
  },
  {
    path: '/he/guide/todos',
    group: 'פאנלים יומיומיים',
    blurb: 'רשימת משימות בסרגל הצד',
    element: <TodosGuideHe />,
    locale: 'he',
    title: 'משימות',
    headTitle: 'רשימת משימות בסרגל הצד של הלשונית החדשה',
    description: 'רשימת משימות שחיה בסרגל הצד של WindoM. לא צריך חשבון.',
    twinOf: '/guide/todos',
  },
  {
    path: '/he/guide/focus',
    group: 'פאנלים יומיומיים',
    blurb: 'מיקוד ראשי, ואז טיימר',
    element: <FocusGuideHe />,
    locale: 'he',
    title: 'מצב פוקוס',
    headTitle: 'מצב פוקוס וטיימר ריכוז',
    description: 'הגדירו מיקוד ראשי וטיימר ספירה לאחור, מ-25 דקות עד 4 שעות, ו-WindoM מעמעם את כל השאר עד הסיום.',
    twinOf: '/guide/focus',
  },
  {
    path: '/he/guide/quotes',
    group: 'פאנלים יומיומיים',
    blurb: 'אחד ביום, מקומי או מה-API',
    element: <QuotesGuideHe />,
    locale: 'he',
    title: 'ציטוט יומי',
    headTitle: 'ציטוט יומי בלשונית החדשה',
    description: 'ציטוט אחד ביום בלשונית החדשה של WindoM, ואיך מקבלים אחר.',
    twinOf: '/guide/quotes',
  },
  {
    path: '/he/guide/shortcuts',
    group: 'פאנלים יומיומיים',
    blurb: 'כל קיצורי המקלדת ב-WindoM, ממקש החיפוש הכללי ועד Escape ו-Enter בתוך כל פאנל.',
    element: <ShortcutsGuideHe />,
    locale: 'he',
    title: 'קיצורי מקלדת',
    headTitle: 'קיצורי מקלדת בלשונית החדשה של WindoM - WindoM',
    description: 'כל קיצורי המקלדת ב-WindoM, ממקש החיפוש הכללי ועד Escape ו-Enter בתוך כל פאנל.',
    twinOf: '/guide/shortcuts',
  },
  {
    path: '/he/guide/search',
    group: 'פאנלים יומיומיים',
    blurb: 'לשוניות, היסטוריה ורשת',
    element: <SearchGuideHe />,
    locale: 'he',
    title: 'חיפוש',
    headTitle: 'חיפוש בלשוניות, בהיסטוריה וברשת',
    description: 'קיצור אחד בכל עמוד לחיפוש בלשוניות הפתוחות, בהיסטוריה וברשת עם Google, ‏Bing, ‏DuckDuckGo או Brave.',
    twinOf: '/guide/search',
  },
  {
    path: '/he/guide/tab-sidebar',
    group: 'פאנלים יומיומיים',
    blurb: 'הלשוניות הפתוחות, מכל עמוד',
    element: <TabSidebarGuideHe />,
    locale: 'he',
    title: 'סרגל לשוניות',
    headTitle: 'סרגל הלשוניות: הלשוניות הפתוחות שלכם',
    description: 'ראו ועברו ללשוניות הפתוחות מסרגל הצד של WindoM, מכל עמוד.',
    twinOf: '/guide/tab-sidebar',
  },
  {
    path: '/he/guide/history',
    group: 'פאנלים יומיומיים',
    blurb: 'מקומות שביקרתם בהם',
    element: <HistoryGuideHe />,
    locale: 'he',
    title: 'היסטוריית גלישה',
    headTitle: 'היסטוריית לשוניות ועמודים אחרונים',
    description: 'רשימת Recent, והיסטוריית הגלישה כהצעות חיפוש, ואיך מכבים אותן.',
    twinOf: '/guide/history',
  },
  {
    path: '/he/guide/weather',
    group: 'פאנלים יומיומיים',
    blurb: 'תנאים בזמן אמת, בלי מפתח',
    element: <WeatherGuideHe />,
    locale: 'he',
    title: 'מזג אוויר',
    headTitle: "ווידג'ט מזג אוויר",
    description: 'טמפרטורה ותנאים בזמן אמת בלשונית החדשה של WindoM מ-Open-Meteo. בלי מפתח API ובלי חשבון.',
    twinOf: '/guide/weather',
  },
  {
    path: '/he/guide/finance',
    group: 'פאנלים יומיומיים',
    blurb: 'מניות וקריפטו בזמן אמת',
    element: <FinanceGuideHe />,
    locale: 'he',
    title: 'פיננסים',
    headTitle: 'מחירי מניות וקריפטו בלשונית החדשה',
    description: 'מחירי מניות וקריפטו בזמן אמת בלשונית החדשה של WindoM, מ-Yahoo Finance ומ-CoinGecko.',
    twinOf: '/guide/finance',
  },
  {
    path: '/he/guide/templates',
    group: 'פאנלים יומיומיים',
    blurb: 'מינימלי, פוקוס עמוק, לוח מחוונים',
    element: <TemplatesGuideHe />,
    locale: 'he',
    title: 'תבניות פריסה',
    headTitle: 'תבניות פריסה: מינימלי, פוקוס עמוק, לוח מחוונים',
    description: 'סידורים מוכנים ללשונית החדשה של WindoM, כמו מינימלי, פוקוס עמוק ולוח מחוונים, ואיך עוברים ביניהם.',
    twinOf: '/guide/templates',
  },
  {
    path: '/he/guide/account',
    group: 'חשבון ואינטגרציות',
    blurb: 'אופציונלי. סנכרון ואינטגרציות',
    element: <AccountGuideHe />,
    locale: 'he',
    title: 'חשבון WindoM',
    headTitle: 'יצירת חשבון WindoM (אופציונלי)',
    description:
      'מה חשבון WindoM חינמי מוסיף, איך יוצרים אותו ואיך מנהלים אותו. נדרש רק לסנכרון, ל-Calendar, ל-GitHub ול-Spotify.',
    twinOf: '/guide/account',
  },
  {
    path: '/he/guide/calendar',
    group: 'חשבון ואינטגרציות',
    blurb: 'היום ומה שמגיע',
    element: <CalendarGuideHe />,
    locale: 'he',
    title: 'Google Calendar',
    headTitle: 'חיבור Google Calendar ללשונית החדשה',
    description: 'הציגו את היום ומה שמגיע מ-Google Calendar בסרגל הצד של WindoM, לקריאה בלבד.',
    twinOf: '/guide/calendar',
  },
  {
    path: '/he/guide/github',
    group: 'חשבון ואינטגרציות',
    blurb: 'התראות, סקירות, issues',
    element: <GithubGuideHe />,
    locale: 'he',
    title: 'GitHub',
    headTitle: 'חיבור GitHub: התראות ובקשות סקירה',
    description: 'ראו התראות GitHub, בקשות סקירה ו-issues שהוקצו לכם בלשונית החדשה של WindoM.',
    twinOf: '/guide/github',
  },
  {
    path: '/he/guide/spotify',
    group: 'חשבון ואינטגרציות',
    blurb: 'מה מתנגן והשירים המובילים',
    element: <SpotifyGuideHe />,
    locale: 'he',
    title: 'Spotify',
    headTitle: 'חיבור Spotify: מה מתנגן ומובילי ההשמעה',
    description: 'חברו את Spotify ל-WindoM עם אפליקציית מפתחים חינמית משלכם: מה מתנגן, בקרי השמעה והשירים המובילים.',
    twinOf: '/guide/spotify',
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
    path: '/he/about',
    group: 'עזרה',
    blurb: 'מי מפתח את WindoM, ולמה אפשר לקרוא את הקוד',
    element: <AboutHe />,
    locale: 'he',
    title: 'אודות',
    headTitle: 'אודות WindoM ומפתחו, יהודה בריסקמן',
    description:
      'WindoM הוא תוסף חינמי בקוד פתוח ללשונית החדשה ב-Chrome, שנבנה על ידי יהודה בריסקמן, מהנדס פול־סטאק בתל אביב. מה זה, מי מפתח אותו, ואיפה לקרוא עוד.',
    twinOf: '/about',
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
  if (route.path === '/') return route.title;
  return `${route.headTitle ?? route.title} - WindoM`;
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
