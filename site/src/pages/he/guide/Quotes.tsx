import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: ציטוט אחד ביום בלשונית החדשה של WindoM, ואיך מקבלים אחר..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Quotes() {
  return (
    <DocsLayout path="/he/guide/quotes" eyebrow="מדריך למשתמש" title="ציטוט יומי" dir="rtl">
      <h2>סקירה</h2>

      <p>בתחתית הלשונית החדשה מופיע ציטוט שמתחלף פעם ביום. ב-API Quotes, לחיצה עליו מציגה ציטוט אחר.</p>
      <p>
        ב-Settings → <strong>Quotes</strong>, האפשרות <strong>Show daily quotes</strong> מפעילה או מכבה אותו, ו-
        <strong>Quote Source</strong> בוחר בין <strong>Local Quotes</strong>, אוסף שמגיע עם התוסף, לבין{' '}
        <strong>API Quotes</strong>, שנשלפים מהשירות Quotable.
      </p>
      <h2>איך זה עובד</h2>
      <p>
        הציטוט מוצג כטקסט במירכאות, ומתחתיו שם המחבר אחרי מקף. מקור הציטוט נקבע לפי <strong>Quote Source</strong>.
      </p>
      <ul>
        <li>
          <strong>Local Quotes</strong> - התוסף קורא אוסף שמגיע בתוכו, ולכן לא נשלחת בקשת רשת. ציטוט היום נבחר לפי
          התאריך: כל לשונית חדשה שנפתחת באותו יום מציגה את אותו ציטוט, והבחירה משתנה כשהתאריך משתנה. אם אי אפשר לקרוא את
          האוסף, נעשה שימוש ברשימה מובנית קצרה של חמישה ציטוטים.
        </li>
        <li>
          <strong>API Quotes</strong> - בכל טעינה של הלשונית החדשה, התוסף מבקש מהשירות Quotable ציטוט אקראי. אם הבקשה
          נכשלת, הוא חוזר לציטוט אקראי מהאוסף המקומי, כך שהמקום לא נשאר ריק.
        </li>
      </ul>
      <p>
        בכל מקור, הציטוט דוהה ונכנס מחדש כשהוא מתחלף, והוא מתרענן מעצמו בחצות לפי השעה המקומית כל עוד הלשונית החדשה
        פתוחה.
      </p>

      <h2>כל ההגדרות</h2>
      <ul>
        <li>
          <strong>Show daily quotes</strong> (Settings → Quotes) - פעיל כברירת מחדל. כשהוא כבוי, הציטוט מוסר מהדף ושום
          דבר לא נטען בשבילו.
        </li>
        <li>
          <strong>Quote Source</strong> (Settings → Quotes) - <strong>Local Quotes</strong> הוא ברירת המחדל;{' '}
          <strong>API Quotes</strong> עובר לשירות Quotable.
        </li>
        <li>
          <strong>Quotes</strong> תחת Settings → General → Widget Visibility - אותו מתג הפעלה וכיבוי כמו{' '}
          <strong>Show daily quotes</strong>, שמופיע גם לצד שאר הווידג'טים לנוחות.
        </li>
      </ul>

      <h2>לחיצה על הציטוט</h2>
      <p>
        הציטוט הוא כפתור: לחיצה עליו מבקשת ציטוט חדש. ב-<strong>API Quotes</strong>, כל לחיצה מביאה ציטוט אקראי חדש. ב-
        <strong>Local Quotes</strong> הציטוט נבחר לפי התאריך, ולכן לחיצה מציגה שוב את ציטוט היום ולא ציטוט אחר. אם רוצים
        מגוון באותו יום, משתמשים ב-API Quotes.
      </p>

      <h2>איפה הנתונים נשמרים ומה יוצא מהמכשיר</h2>
      <ul>
        <li>
          ההגדרות שלמעלה נשמרות יחד עם שאר הגדרות WindoM. אם נכנסים לחשבון WindoM, הן מסתנכרנות עם החשבון כמו שאר
          ההגדרות.
        </li>
        <li>ציטוט היום המקומי נשמר יחד עם התאריך שלו, כך שאותו ציטוט מוצג עד סוף היום.</li>
        <li>
          ב-<strong>Local Quotes</strong> שום דבר שקשור לציטוטים לא יוצא מהמכשיר. ב-<strong>API Quotes</strong> התוסף
          פונה אל <code>api.quotable.io</code> כדי להביא ציטוט, ובכך, כמו בכל בקשת אינטרנט, כתובת ה-IP שלכם נחשפת
          לשירות. שום טקסט שהקלדתם ב-WindoM אינו חלק מהבקשה.
        </li>
      </ul>
      <p>
        <Link to="/he/privacy">מדיניות הפרטיות</Link> מפרטת את כל השירותים שהתוסף פונה אליהם.
      </p>

      <h2>טיפים והגדרות מומלצות</h2>
      <ul>
        <li>
          מעדיפים <strong>Local Quotes</strong> אם רוצים דף שנטען באותה צורה בלי חיבור ובלי בקשה לצד שלישי.
        </li>
        <li>
          בוחרים <strong>API Quotes</strong> אם אוהבים ציטוט שונה בכל פתיחה של לשונית; לחיצה על הציטוט מביאה עוד אחד.
        </li>
        <li>
          לדף נקי, מכבים את הציטוט. כמה <Link to="/he/guide/templates">תבניות</Link> מציגות או מסתירות אותו כחלק
          מהפריסה, ואפשר לשנות את הבחירה אחר כך.
        </li>
      </ul>

      <h2>שאלות נפוצות</h2>
      <p>
        <strong>אפשר להוסיף ציטוטים משלי?</strong> אין הגדרה לכך. האוסף המקומי מגיע עם התוסף, ומקור ה-API נשלט על ידי
        השירות.
      </p>
      <p>
        <strong>למה הציטוט זהה בכל פעם שאני פותח לשונית?</strong> אתם ב-<strong>Local Quotes</strong>, שמציג ציטוט אחד
        ביום. עוברים ל-API Quotes כדי לקבל חדש בכל לשונית.
      </p>
      <p>
        <strong>אפשר לבחור קטגוריה או נושא?</strong> לא. אין סינון לפי קטגוריה.
      </p>

      <h2>פתרון בעיות</h2>
      <ul>
        <li>
          <strong>לא מוצג ציטוט</strong> - בודקים ש-<strong>Show daily quotes</strong> פעיל ב-Settings → Quotes.
        </li>
        <li>
          <strong>ב-API Quotes אני רואה ציטוטים מקבוצה קטנה</strong> - כשאי אפשר להגיע לשירות Quotable, התוסף משתמש בשקט
          באוסף המקומי. בודקים את החיבור ומרעננים את הלשונית.
        </li>
        <li>
          <strong>לחיצה על הציטוט מציגה את אותו אחד</strong> - זה צפוי ב-<strong>Local Quotes</strong>; ראו "לחיצה על
          הציטוט" למעלה.
        </li>
      </ul>

      <h2>עמודים קשורים</h2>
      <ul>
        <li>
          <Link to="/he/guide/templates">תבניות</Link> - פריסות שכוללות או מסתירות את הציטוט
        </li>
        <li>
          <Link to="/he/guide/clock">שעון, תאריך וברכה</Link> - שאר הטקסט בדף
        </li>
        <li>
          <Link to="/he/privacy">מדיניות הפרטיות</Link> ו<Link to="/he/support">תמיכה</Link>
        </li>
      </ul>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
