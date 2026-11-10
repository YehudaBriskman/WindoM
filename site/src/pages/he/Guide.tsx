import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The Hebrew user guide, on its own URL so search engines can index it.
 *
 * The previous guide shipped both languages in every response and swapped them
 * with CSS display rules, so Hebrew was never indexable and every reader
 * downloaded a language they could not read. Each language now has its own URL
 * and carries only its own copy, with hreflang alternates in the HTML entry.
 *
 * Mirrors `pages/Guide.tsx` section for section, in the same order and with the
 * same anchor ids, so a link into one language works in the other. Interface
 * labels stay in English, as on the Hebrew support page: the extension's own
 * interface is English, and a translated label is one a reader cannot find on
 * screen.
 */

/** Every id the guide used to have as a section, so an old `/guide/spotify` still lands. */
const MOVED = new Set([
  'clock',
  'background',
  'links',
  'todos',
  'focus',
  'quotes',
  'search',
  'tab-sidebar',
  'history',
  'weather',
  'finance',
  'templates',
  'account',
  'calendar',
  'github',
  'spotify',
]);

export function Guide() {
  const navigate = useNavigate();
  const { hash } = useLocation();

  useEffect(() => {
    const id = hash.replace(/^#/, '');
    if (MOVED.has(id)) navigate(`/he/guide/${id}`, { replace: true });
  }, [hash, navigate]);

  return (
    <DocsLayout path="/he/guide" eyebrow="מדריך למשתמש" title="שימוש ב-WindoM" dir="rtl">
      <h2 id="overview">במבט אחד</h2>
      <div className="callout tip">
        <strong>רוב הפונקציות לא דורשות חשבון.</strong> השעון, מזג האוויר, הרקעים, הקישורים המהירים, המשימות, מצב
        הפוקוס, הציטוטים, החיפוש, סרגל הלשוניות ומחירי המניות עובדים מיד ללא התחברות. חשבון נדרש רק לסנכרון הגדרות,
        ל-Google Calendar, ל-GitHub ול-Spotify. תמיד אפשר להוסיף חשבון מאוחר יותר. חדשים כאן? כדאי להתחיל ב
        <Link to="/he/install">התקנה</Link>.
      </div>
      <div className="feature-grid">
        <Link className="feature-card" to="/he/guide/clock" viewTransition>
          <div className="feature-card-title">שעון וברכה</div>
          <div className="feature-card-desc">12/24 שעות, סגנון, צבע, גודל ותאריך. תמיד פעיל, ללא חשבון.</div>
        </Link>
        <Link className="feature-card" to="/he/guide/background" viewTransition>
          <div className="feature-card-title">רקע</div>
          <div className="feature-card-desc">תמונות מובנות, תמונות משלך, או Unsplash. נשמר מקומית.</div>
        </Link>
        <Link className="feature-card" to="/he/guide/links" viewTransition>
          <div className="feature-card-title">קישורים מהירים</div>
          <div className="feature-card-desc">האתרים שהכי בשימוש, נעוצים בסרגל הדוק בחלק העליון.</div>
        </Link>
        <Link className="feature-card" to="/he/guide/todos" viewTransition>
          <div className="feature-card-title">משימות</div>
          <div className="feature-card-desc">רשימת משימות בסרגל הצד. ללא חשבון.</div>
        </Link>
        <Link className="feature-card" to="/he/guide/focus" viewTransition>
          <div className="feature-card-title">מצב פוקוס</div>
          <div className="feature-card-desc">מגדירים את המיקוד העיקרי, ואז ספירה לאחור שמסתירה את כל השאר.</div>
        </Link>
        <Link className="feature-card" to="/he/guide/search" viewTransition>
          <div className="feature-card-title">חיפוש</div>
          <div className="feature-card-desc">קיצור מקלדת אחד בכל דף: לשוניות, היסטוריה והאינטרנט.</div>
        </Link>
        <Link className="feature-card" to="/he/guide/weather" viewTransition>
          <div className="feature-card-title">מזג אוויר</div>
          <div className="feature-card-desc">טמפרטורה ומצב מזג אוויר בזמן אמת. ללא מפתח API, ללא חשבון.</div>
        </Link>
        <Link className="feature-card" to="/he/guide/calendar" viewTransition>
          <div className="feature-card-title">Google Calendar</div>
          <div className="feature-card-desc">אירועים קרובים בסרגל הצד. דורש חשבון + אישור Google.</div>
        </Link>
        <Link className="feature-card" to="/he/guide/spotify" viewTransition>
          <div className="feature-card-title">Spotify</div>
          <div className="feature-card-desc">
            מה מתנגן עכשיו, כפתורי נגינה ושירים מובילים. דורש חשבון + אפליקציית Spotify Developer חינמית.
          </div>
        </Link>
      </div>
      <p>
        משהו לא מתנהג כמו שמתואר כאן? ב<Link to="/he/support">דף התמיכה</Link> יש פתרונות לתקלות הנפוצות. מי שרוצה להריץ
        או לשנות את WindoM בעצמו ימצא את ההסבר ב<Link to="/he/local-setup">הרצה מקומית</Link>.
      </p>
      <h2 id="everyday">פאנלים יומיומיים</h2>
      <p>עובדים מיד אחרי ההתקנה, בלי חשבון.</p>
      <ul>
        <li>
          <Link to="/he/guide/clock">שעון, תאריך וברכה</Link> - 12/24 שעות, סגנון, תאריך, ברכה
        </li>
        <li>
          <Link to="/he/guide/background">רקעים</Link> - מובנים, שלכם, או Unsplash
        </li>
        <li>
          <Link to="/he/guide/links">קישורים מהירים</Link> - נעצו את האתרים שלכם
        </li>
        <li>
          <Link to="/he/guide/todos">משימות</Link> - רשימת משימות בסרגל הצד
        </li>
        <li>
          <Link to="/he/guide/focus">מצב פוקוס</Link> - מיקוד ראשי, ואז טיימר
        </li>
        <li>
          <Link to="/he/guide/quotes">ציטוט יומי</Link> - אחד ביום, לחיצה לאחר
        </li>
        <li>
          <Link to="/he/guide/search">חיפוש</Link> - לשוניות, היסטוריה ורשת
        </li>
        <li>
          <Link to="/he/guide/tab-sidebar">סרגל לשוניות</Link> - הלשוניות הפתוחות, מכל עמוד
        </li>
        <li>
          <Link to="/he/guide/history">היסטוריית גלישה</Link> - מקומות שביקרתם בהם
        </li>
        <li>
          <Link to="/he/guide/weather">מזג אוויר</Link> - תנאים בזמן אמת, בלי מפתח
        </li>
        <li>
          <Link to="/he/guide/finance">פיננסים</Link> - מניות וקריפטו בזמן אמת
        </li>
        <li>
          <Link to="/he/guide/templates">תבניות פריסה</Link> - מינימלי, פוקוס עמוק, לוח מחוונים
        </li>
      </ul>
      <h2 id="integrations">חשבון ואינטגרציות</h2>
      <p>אופציונלי. צריך חשבון WindoM, ולחלקם גם אישור משלכם.</p>
      <ul>
        <li>
          <Link to="/he/guide/account">חשבון WindoM</Link> - אופציונלי. סנכרון ואינטגרציות
        </li>
        <li>
          <Link to="/he/guide/calendar">Google Calendar</Link> - היום ומה שמגיע
        </li>
        <li>
          <Link to="/he/guide/github">GitHub</Link> - התראות, סקירות, issues
        </li>
        <li>
          <Link to="/he/guide/spotify">Spotify</Link> - מה מתנגן והשירים המובילים
        </li>
      </ul>
    </DocsLayout>
  );
}
