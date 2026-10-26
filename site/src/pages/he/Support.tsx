import { DocsLayout } from '../../components/DocsLayout';
import { GITHUB_URL, CONTACT_EMAIL, STORE_URL } from '../../lib/site';

/**
 * Hebrew support page.
 *
 * Translated from `pages/Support.tsx`. Product names, file paths and anything a
 * reader has to type stay in English - `chrome://extensions` translated is a
 * string that does not work, and "Settings → Apps → Calendar" has to match the
 * English interface the extension actually shows.
 */
export function Support() {
  return (
    <DocsLayout
      href="/he/support.html"
      eyebrow="עזרה"
      title="תמיכה"
      subtitle="פתרונות לתקלות שבאמת קורות"
      dir="rtl"
    >
      <p>
        רוב התקלות ב-WindoM נופלות לאחת מכמה קטגוריות. כדאי לנסות קודם את הפתרון המתאים
        למטה - ואם שום דבר לא עוזר,{' '}
        <a href={`${GITHUB_URL}/issues/new`}>אפשר לפתוח issue ב-GitHub</a> או לשלוח מייל
        לכתובת <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>Google Calendar מתנתק שוב ושוב</h2>
      <p>
        אם חיברת את היומן לפני 26 באוקטובר 2026 וגילית שהחיבור התנתק אחרי שבוע בערך - זו
        הייתה תקלת הגדרה אצלנו, לא משהו שעשית. Google מבטלת את ההרשאה לאפליקציות שמסך
        ההסכמה שלהן עדיין במצב בדיקה אחרי שבעה ימים, וזה היה המצב של WindoM. המסך פורסם
        מאז, כך שחיבור שנוצר היום יישאר פעיל.
      </p>
      <p>
        צריך לחבר מחדש פעם אחת דרך <strong>Settings → Apps → Calendar → Connect</strong>,
        ואז זה אמור להחזיק.
      </p>

      <h2>ההתחברות נראית מוצלחת ואז מנתקת אותי</h2>
      <p>
        תוקן בגרסה <strong>1.5.1</strong>. תקלה בשירות מחובר אחד - יומן, Spotify - נקראה
        כאילו כל ההתחברות פגה, מה שניתק אותך רגעים אחרי שהתחברת. ככל שהיו יותר שירותים
        מחוברים, זה קרה מהר יותר.
      </p>
      <p>
        כדאי לבדוק שאתה על 1.5.1 ומעלה בכתובת <code>chrome://extensions</code>. Chrome
        בדרך כלל מעדכן תוספים תוך כמה שעות, והכפתור <strong>Update</strong> באותו עמוד
        מאלץ עדכון מיידי.
      </p>

      <h2>Spotify מתעלם מהלחיצה הראשונה</h2>
      <p>
        גם זה תוקן ב-<strong>1.5.1</strong>. הפקודות play, pause, next ו-previous הגיעו
        ל-Spotify כמו שצריך, אבל הדשבורד המשיך להציג את המצב שמלפני הפקודה למשך עד חמש
        עשרה שניות - כך שזה נראה כאילו כלום לא קרה, ולחיצה נוספת נראתה כאילו היא מתקנת
        את זה.
      </p>

      <h2>מסך "האפליקציה לא אומתה" בחיבור ל-Google</h2>
      <p>
        זה צפוי, וזה בטוח. האימות של WindoM מול Google נמצא בבדיקה. עד שהיא תסתיים,
        Google מציגה את האזהרה הזו לאפליקציות שהבדיקה שלהן טרם הושלמה. אפשר להמשיך
        מעבר לה, והתוסף מבקש אך ורק <em>לקרוא</em> את היומן שלך - ההרשאות המדויקות
        מפורטות ב<a href="/he/privacy.html">מדיניות הפרטיות</a>.
      </p>

      <h2>הווידג'ט של Gmail נעלם</h2>
      <p>
        הוסר במכוון בגרסה <strong>1.5.0</strong>. קריאת דואר דרשה הרשאת Google מסוג
        שמחייב הערכת אבטחה שנתית של צד שלישי, בעלות של מאות עד אלפי דולרים בשנה. זה לא
        בר-קיימא עבור תוסף חינמי, ולכן הווידג'ט הוסר במקום לממן אותו על ידי שינוי מה
        ש-WindoM עושה עם הנתונים שלך.
      </p>

      <h2>מזג האוויר מציג מקום שגוי</h2>
      <p>
        WindoM מבקש מהדפדפן את המיקום שלך ונופל בחזרה לזיהוי גס לפי כתובת ה-IP, שיכול
        להיות רחוק למדי ב-VPN או ברשת סלולרית. אפשר להגדיר עיר ידנית תחת{' '}
        <strong>Settings → Weather</strong>.
      </p>

      <h2>ההגדרות לא עברו איתי למחשב אחר</h2>
      <p>
        ההגדרות מסתנכרנות דרך פרופיל ה-Chrome שלך, ולכן שני המחשבים צריכים להיות מחוברים
        לאותו חשבון Chrome עם סנכרון פעיל. תמונות רקע, מזג אוויר שנשמר במטמון והיסטוריית
        הלשוניות לא נכללים בכוונה - הם גדולים, והם נשארים על המכשיר שיצר אותם.
      </p>

      <h2>דיווח על משהו אחר</h2>
      <p>כדי שתקלה תטופל מהר, כדאי לכלול:</p>
      <ul>
        <li>
          את גרסת WindoM מתוך <code>chrome://extensions</code>
        </li>
        <li>את גרסת Chrome ומערכת ההפעלה</li>
        <li>מה עשית, מה קרה, ומה ציפית שיקרה במקום</li>
        <li>
          כל מה שמופיע בקונסול - לחיצה ימנית על הלשונית החדשה,{' '}
          <strong>Inspect</strong>, ואז הלשונית <strong>Console</strong>. שגיאות שם הן
          בדרך כלל כל התשובה.
        </li>
      </ul>
      <p>
        WindoM הוא קוד פתוח, כך שאפשר גם לקרוא את הקוד עבור כל התנהגות שמתוארת כאן:{' '}
        <a href={GITHUB_URL}>github.com/YehudaBriskman/WindoM</a>. גם ביקורות ודיווחי
        תקלות ב<a href={STORE_URL}>Chrome Web Store</a> נקראים, אם כי GitHub הוא הדרך
        המהירה יותר - בחנות אין אפשרות להשיב בשאלת המשך.
      </p>
    </DocsLayout>
  );
}
