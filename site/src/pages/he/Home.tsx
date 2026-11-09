import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';
import { AUTHOR, GITHUB_URL, STORE_URL } from '../../lib/site';

/**
 * The Hebrew front door, at /he.
 *
 * Before this page existed /he redirected to /he/ and then answered 404, so
 * anyone arriving from a Hebrew link or a trimmed URL got nothing. The full
 * marketing home stays English-only; this is a short landing that says what the
 * product is, in the README's own terms, and routes to the Hebrew pages that do
 * exist. Product names and interface labels stay in English, as elsewhere.
 */
export function Home() {
  return (
    <DocsLayout
      path="/he"
      eyebrow="WindoM"
      title="WindoM - לשונית חדשה ששווה לפתוח"
      subtitle="תוסף ל-Chrome, בקוד פתוח, בחינם"
      dir="rtl"
    >
      <p>
        WindoM מחליף את עמוד הלשונית החדשה ב-Chrome בשעון וברכה, מזג אוויר, רשימת משימות, קישורים מהירים, טיימר פוקוס,
        ציטוט יומי, חיפוש בלשוניות ובהיסטוריה ומחירי מניות וקריפטו. אפשר לחבר גם את Google Calendar, את GitHub ואת
        Spotify עם חשבון WindoM חינמי. רוב הדברים עובדים מיד אחרי ההתקנה, בלי חשבון.
      </p>
      <p>
        <a href={STORE_URL}>התקנה מחנות האינטרנט של Chrome</a>
      </p>

      <h2>להתחיל</h2>
      <ul>
        <li>
          <Link to="/he/install">התקנה וצעדים ראשונים</Link>
        </li>
        <li>
          <Link to="/he/guide">המדריך למשתמש</Link> - כל פאנל בעמוד משלו
        </li>
        <li>
          <Link to="/he/guide/shortcuts">קיצורי מקלדת</Link>
        </li>
        <li>
          <Link to="/he/support">תמיכה ופתרון תקלות</Link>
        </li>
      </ul>

      <h2>מי מפתח את WindoM</h2>
      <p>
        את WindoM מפתח{' '}
        <a href={AUTHOR.url} rel="author">
          {AUTHOR.nameHe}
        </a>{' '}
        ({AUTHOR.name}), מהנדס פול־סטאק בתל אביב. הקוד פתוח ברישיון MIT ב-<a href={GITHUB_URL}>GitHub</a>. עוד על
        הפרויקט ועל המפתח בעמוד <Link to="/he/about">אודות</Link>.
      </p>

      <h2>פרטיות</h2>
      <p>
        אין אנליטיקה, אין טלמטריה ואין פרסומות. הפרטים ב<Link to="/he/privacy">מדיניות הפרטיות</Link>.
      </p>
    </DocsLayout>
  );
}
