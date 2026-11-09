import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';
import { STORE_URL } from '../../lib/site';

/**
 * Hebrew install page, translated from `pages/Install.tsx` section for section.
 *
 * The extension's interface is English only, so every label a reader has to
 * find on screen - Settings, Apps, Add to Chrome - stays in English, as on the
 * Hebrew support page. Keyboard keys are wrapped in `bdi` so a shortcut keeps
 * its left-to-right order inside a right-to-left sentence.
 */
export function Install() {
  return (
    <DocsLayout path="/he/install" eyebrow="תחילת עבודה" title="התקנת WindoM" subtitle="בערך דקה, ובלי חשבון" dir="rtl">
      <p>
        WindoM הוא תוסף ל-Chrome שמחליף את דף הלשונית החדשה. ההתקנה היא הצעד היחיד שרוב האנשים צריכים: השעון, מזג
        האוויר, הרקעים, המשימות, הקישורים המהירים, הציטוטים, החיפוש ומצב הפוקוס עובדים מהרגע שהתוסף מותקן, בלי להירשם
        לשום דבר.
      </p>

      <h2>הוספה ל-Chrome</h2>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            פותחים את <a href={STORE_URL}>WindoM בחנות האינטרנט של Chrome</a> ולוחצים על <strong>Add to Chrome</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Chrome מציג את ההרשאות ש-WindoM מבקש ומבקש אישור. לוחצים על <strong>Add extension</strong>. למה משמשת כל
            הרשאה מוסבר <Link to="/he/support#all-sites">בדף התמיכה</Link>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            פותחים לשונית חדשה. WindoM הוא עכשיו דף הלשונית החדשה, והלשונית הראשונה מציגה סיור היכרות קצר - אפשר לעבור
            עליו, או לסגור אותו עם ה-<strong>×</strong> שבפינה.
          </p>
          <p>
            אם Chrome שואל אם התכוונת לשנות את דף הלשונית החדשה, יש לבחור להשאיר את השינוי. בחירה בהחזרת הדף הקודם מכבה
            את WindoM.
          </p>
        </div>
      </div>

      <h2>מה עובד בלי חשבון</h2>
      <p>כל מה שברשימה עובד על המכשיר שלך מיד, בלי התחברות:</p>
      <ul>
        <li>
          <Link to="/he/guide/clock">שעון וברכה</Link>, <Link to="/he/guide/background">רקעים</Link> ו
          <Link to="/he/guide/weather">מזג אוויר</Link>
        </li>
        <li>
          <Link to="/he/guide/links">קישורים מהירים</Link>, <Link to="/he/guide/todos">משימות</Link> ו
          <Link to="/he/guide/quotes">ציטוט יומי</Link>
        </li>
        <li>
          <Link to="/he/guide/focus">מצב פוקוס</Link>, <Link to="/he/guide/search">חיפוש</Link>,{' '}
          <Link to="/he/guide/tab-sidebar">סרגל הלשוניות</Link> ו<Link to="/he/guide/history">היסטוריית הגלישה</Link>
        </li>
        <li>
          <Link to="/he/guide/finance">מחירי מניות וקריפטו</Link> ו<Link to="/he/guide/templates">תבניות פריסה</Link>
        </li>
      </ul>
      <p>
        <Link to="/he/guide/account">חשבון WindoM</Link> חינמי נדרש רק כדי להעביר את ההגדרות בין מחשבים ולחבר את Google
        Calendar, את GitHub או את Spotify. אפשר להוסיף חשבון בכל שלב בלי לאבד את מה שכבר הוגדר.
      </p>

      <h2>איפה נמצא מה</h2>
      <ul>
        <li>
          <strong>Settings (הגדרות)</strong> - סמל גלגל השיניים בפינה השמאלית התחתונה של הלשונית החדשה. כל אפשרות
          שמופיעה בתיעוד נמצאת באחת הלשוניות שלו: General, Clock, Background, Weather, Quotes, Links, Apps, Templates
          ו-Account.
        </li>
        <li>
          <strong>סרגל הצד</strong> - סמל הרשימה בפינה הימנית התחתונה. יש בו את המשימות, ואחרי שמפעילים אותם גם
          היסטוריית גלישה, אירועי יומן, מוני GitHub והשירים המובילים ב-Spotify.
        </li>
        <li>
          <strong>סרגל הלשוניות</strong> - מקרבים את הסמן לקצה הימני של הלשונית החדשה כדי לראות את כל הלשוניות הפתוחות.
          אפשר להעביר אותו לקצה השמאלי ב-Settings → General.
        </li>
        <li>
          <strong>חיפוש</strong> - לוחצים{' '}
          <bdi>
            <kbd>Ctrl</kbd> + <kbd>Win</kbd> + <kbd>H</kbd>
          </bdi>
          , או{' '}
          <bdi>
            <kbd>Ctrl</kbd> + <kbd>Cmd</kbd> + <kbd>H</kbd>
          </bdi>{' '}
          ב-Mac, בלשונית החדשה או בכל אתר. היוצא מן הכלל הוא הדפים של Chrome עצמו, כמו דפי ההגדרות של{' '}
          <code>chrome://</code>: תוספים לא יכולים לפעול שם.
        </li>
        <li>
          <strong>Apps</strong> - ב-Settings → <strong>Apps</strong> מפעילים ומחברים את Calendar, Finance, GitHub,
          Spotify, Tasks ו-History.
        </li>
      </ul>

      <h2>מה הלאה</h2>
      <ul>
        <li>
          <Link to="/he/guide">המדריך למשתמש</Link> עובר על כל פאנל, מהפשוט ביותר.
        </li>
        <li>
          ב<Link to="/he/support">דף התמיכה</Link> יש פתרונות לתקלות הנפוצות.
        </li>
        <li>
          <Link to="/he/privacy">מדיניות הפרטיות</Link> מפרטת מה נשאר על המכשיר שלך ומה החשבון האופציונלי שומר.
        </li>
        <li>
          כדי להסיר את WindoM, פותחים את <code>chrome://extensions</code> ולוחצים על <strong>Remove</strong> בכרטיס שלו.
          הלשונית החדשה הרגילה של Chrome חוזרת מיד.
        </li>
      </ul>
    </DocsLayout>
  );
}
