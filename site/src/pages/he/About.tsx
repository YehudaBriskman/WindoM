import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';
import { AUTHOR, BLOG_URL, CONTACT_EMAIL, GITHUB_URL, PROJECT_PAGE, STORE_URL } from '../../lib/site';

/**
 * The Hebrew About page. Mirrors `pages/About.tsx` section for section.
 *
 * The author's name appears in both scripts, because a Hebrew query is matched
 * against Hebrew text and an English one against Latin. Product names and
 * interface labels stay in English, as on the other Hebrew pages.
 */
export function About() {
  return (
    <DocsLayout
      path="/he/about"
      eyebrow="אודות"
      title="אודות WindoM ומי שמפתח אותו"
      subtitle="נבנה על ידי אדם אחד, בקוד פתוח, ומתועד בגלוי"
      dir="rtl"
    >
      <h2>מי מפתח את WindoM</h2>
      <p>
        את WindoM מפתח{' '}
        <a href={AUTHOR.url} rel="author">
          {AUTHOR.nameHe}
        </a>{' '}
        ({AUTHOR.name}), מהנדס פול־סטאק וראש צוות טכני בתל אביב. הוא מתכנן, בונה ומתחזק בעצמו את התוסף, את השרת
        האופציונלי ואת האתר הזה. אפשר למצוא אותו ב-<a href={GITHUB_URL.replace('/WindoM', '')}>GitHub</a> בשם{' '}
        {AUTHOR.name}, והאתר האישי שלו הוא <a href={AUTHOR.url}>yehudabriskman.com</a>.
      </p>

      <h2>מה זה WindoM</h2>
      <p>
        WindoM הוא תוסף ל-Chrome שמחליף את עמוד הלשונית החדשה בשעון וברכה, מזג אוויר, רשימת משימות, קישורים מהירים,
        טיימר פוקוס, ציטוט יומי, חיפוש בלשוניות ובהיסטוריה ומחירי מניות וקריפטו בזמן אמת, על רקע שמשתנה עם השעה. אפשר
        לחבר את Google Calendar, את GitHub ואת Spotify עם חשבון WindoM חינמי. רוב הדברים עובדים מיד אחרי ההתקנה, בלי
        חשבון בכלל. <Link to="/he/guide">המדריך למשתמש</Link> מכסה כל פאנל, בעמוד נפרד לכל אחד.
      </p>

      <h2>קוד פתוח וחינמי</h2>
      <p>
        כל הפרויקט מפורסם ברישיון MIT ב-<a href={GITHUB_URL}>github.com/YehudaBriskman/WindoM</a>: התוסף, השרת והאתר
        הזה. ההתקנה חינמית מ<a href={STORE_URL}>חנות האינטרנט של Chrome</a>, ואפשר להריץ את כל המערכת בעצמכם לפי{' '}
        <Link to="/he/local-setup">הרצה מקומית</Link>.
      </p>

      <h2>פרטיות</h2>
      <p>
        אין אנליטיקה, אין טלמטריה ואין פרסומות. מה נשמר על המכשיר שלכם, ומה החשבון האופציונלי מסנכרן, מפורט בעמוד{' '}
        <Link to="/he/privacy">מדיניות הפרטיות</Link>.
      </p>

      <h2>לקריאה נוספת</h2>
      <ul>
        <li>
          <a href={PROJECT_PAGE}>WindoM באתר yehudabriskman.com</a> - עמוד הפרויקט, והתיאור של המפתח למה זה
        </li>
        <li>
          <a href={BLOG_URL}>פתקים ופוסטים על גרסאות</a> - מה כל גרסה שינתה, ולמה
        </li>
        <li>
          <Link to="/he/support">תמיכה</Link> ו<Link to="/he/contact">יצירת קשר</Link> - פתרונות לתקלות הנפוצות, ואיך
          לפנות למפתח ב-<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </li>
      </ul>
    </DocsLayout>
  );
}
