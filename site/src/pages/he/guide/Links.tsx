import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: נעצו את האתרים שאתם פותחים הכי הרבה לסרגל הדוק בלשונית החדשה של WindoM, והוסיפו, ערכו או סדרו אותם מחדש..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Links() {
  return (
    <DocsLayout path="/he/guide/links" eyebrow="מדריך למשתמש" title="קישורים מהירים וסרגל הדוק" dir="rtl">
      <h2>סקירה</h2>

      <p>
        אפשר לנעוץ את האתרים שהכי בשימוש בסרגל הדוק שלאורך החלק העליון של כל לשונית חדשה. כל קישור מוצג כסמל של האתר,
        והשם שלו מופיע במעבר עכבר. הדוק מכיל עד 27 קישורים בשורות של תשעה, ונגלל שורה אחת בכל פעם.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            לוחצים על ה-<strong>+</strong> בסוף הדוק, או פותחים את Settings → <strong>Links</strong> ולוחצים על{' '}
            <strong>+ Add Link</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            מזינים שם ואת ה-URL המלא (למשל <code>https://github.com</code>).
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            כדי להסיר קישור, לוחצים על ה-<strong>×</strong> שעליו בדוק או לידו ב-Settings → Links.
          </p>
        </div>
      </div>
      <p>
        כדי להסתיר את הדוק לגמרי, מכבים את <strong>Quick Links</strong> תחת Settings → General → Widget Visibility.
      </p>
      <h2>איך זה עובד</h2>
      <p>
        כל קישור הוא שם וכתובת. הדוק מציג את הסמל של האתר, ולחיצה עליו פותחת את האתר באותה לשונית. הדוק מופיע בראש
        הלשונית החדשה, ואפשר לכבות אותו בכל רגע בלי לאבד את הקישורים.
      </p>
      <ul>
        <li>
          <strong>הוספה מהדוק.</strong> ה-<strong>+</strong> פותח טופס קטן עם השדות <strong>Name</strong> ו-
          <strong>https://...</strong>. אם משאירים את השם ריק, משתמשים בשם המארח של האתר (בלי <code>www.</code> בהתחלה).
          אם מקלידים כתובת בלי פרוטוקול, למשל <code>github.com</code>, מתווסף <code>https://</code> אוטומטית. לוחצים{' '}
          <strong>Add</strong> כדי לשמור.
        </li>
        <li>
          <strong>הוספה מההגדרות.</strong> <strong>+ Add Link</strong> ב-Settings → Links מוסיף שורה שממלאים. אפשר לערוך
          שם וכתובת במקום בכל זמן.
        </li>
        <li>
          <strong>שורות.</strong> הקישורים ממלאים שורות של תשעה, עד שלוש שורות. כשיש יותר משורה אחת, גלגלת העכבר מעל
          הדוק מזיזה שורה אחת בכל פעם, ואפשר גם ללחוץ על הנקודות שמתחתיו. ב-27 קישורים ה-<strong>+</strong> נעלם; מסירים
          קישור כדי לפנות מקום.
        </li>
      </ul>

      <h2>כל ההגדרות בפירוט</h2>
      <ul>
        <li>
          <strong>Icon</strong> - לא ניתן לעריכה. הוא נטען אוטומטית לפי כתובת האתר. אם לא נמצא סמל, מוצג במקומו סמל
          קישור כללי.
        </li>
        <li>
          <strong>Name</strong> - התווית שמוצגת במעבר עכבר ונקראת בקוראי מסך.
        </li>
        <li>
          <strong>URL</strong> - חייב להתחיל ב-<code>http://</code> או ב-<code>https://</code> ולא להיות ארוך מ-2048
          תווים. פרוטוקולים אחרים לא מתקבלים. שורה עם כתובת לא תקינה מודגשת בהגדרות, והסמל המתאים בדוק לא פותח דבר עד
          שמתקנים.
        </li>
        <li>
          המתג <strong>Quick Links</strong> - תחת Settings → General → Widget Visibility. כיבוי שלו מסתיר את הדוק;
          הקישורים נשארים שמורים.
        </li>
      </ul>
      <p>בהתקנה חדשה יש שלושה קישורים: Gmail, YouTube ו-GitHub. אפשר להסיר או להחליף אותם.</p>

      <h2>איפה הנתונים נשמרים ומה יוצא מהמכשיר</h2>
      <p>
        הקישורים הם חלק מההגדרות של WindoM ונשמרים באחסון התוספים של Chrome בדפדפן שלך. אם יש לך חשבון WindoM עם סנכרון
        הגדרות, הם עוברים יחד עם שאר ההגדרות לדפדפנים שאתה מתחבר אליהם.
      </p>
      <p>
        כדי לצייר כל סמל, הדפדפן פונה לשירות הסמלים של Google (<code>google.com/s2/favicons</code>) ומבקש את הסמל של
        הדומיין של האתר. הבקשה כוללת את הדומיין של כל קישור שמוצג בדוק. כתובות שבשם המארח שלהן אין נקודה, כמו{' '}
        <code>localhost</code>, לא נשלחות לחיפוש ומציגות את הסמל הכללי. ברשימה המלאה של השירותים שהתוסף פונה אליהם אפשר
        לעיין ב<Link to="/he/privacy">מדיניות הפרטיות</Link>.
      </p>

      <h2>טיפים והגדרות מומלצות</h2>
      <ul>
        <li>את האתרים שפותחים מדי יום כדאי לשים בשורה הראשונה, כי היא השורה הנראית בלי גלילה.</li>
        <li>כדאי לקשר לעמוד המדויק שרוצים, כמו לוח פרויקט או דשבורד, ולא רק לדף הבית של האתר.</li>
        <li>כדאי לתת שמות קצרים; הם מוצגים במעבר עכבר, ולכן מילה או שתיים מספיקות.</li>
        <li>
          אפשר לשלב דוק קצר עם פריסה מינימלית: ראו <Link to="/he/guide/templates">תבניות פריסה</Link>, שבהן חלק
          מהסידורים מסתירים את הדוק וחלק משאירים אותו.
        </li>
        <li>
          לאתרים שמבקרים בהם לעיתים רחוקות אפשר להשתמש ב<Link to="/he/guide/search">חיפוש</Link>, ולהשאיר את הדוק לאתרים
          הקבועים.
        </li>
      </ul>

      <h2>שאלות נפוצות</h2>
      <h3>האם אפשר לפתוח קישור בלשונית חדשה?</h3>
      <p>
        קישורים נפתחים בלשונית הנוכחית. אם רוצים לשונית חדשה, אפשר להשתמש באפשרויות הרגילות של הדפדפן על קישור, כמו
        תפריט ההקשר.
      </p>
      <h3>למה קישור מציג סמל כללי?</h3>
      <p>
        הסמל מגיע משירות סמלים מקוון. אם אין לו סמל לאתר, אם בשם המארח אין נקודה או אם הבקשה נכשלה, מוצג סמל הקישור
        הכללי. הקישור עצמו ממשיך לעבוד.
      </p>
      <h3>האם אפשר לקשר לקובץ או לעמוד chrome://?</h3>
      <p>
        לא. מתקבלות רק כתובות <code>http://</code> ו-<code>https://</code>.
      </p>

      <h2>פתרון בעיות</h2>
      <ul>
        <li>
          <strong>Enter a valid HTTP or HTTPS URL.</strong> אי אפשר היה לקרוא את הכתובת בטופס הדוק ככתובת אינטרנט.
          בודקים שגיאות הקלדה ורווחים.
        </li>
        <li>
          <strong>לחיצה על סמל בדוק לא עושה כלום.</strong> פותחים Settings → Links ובודקים שה-URL שלו מתחיל ב-
          <code>https://</code> או ב-<code>http://</code>.
        </li>
        <li>
          <strong>הדוק חסר.</strong> מדליקים שוב את <strong>Quick Links</strong> תחת Settings → General → Widget
          Visibility.
        </li>
        <li>
          <strong>אין כפתור +.</strong> הדוק מלא ב-27 קישורים. מסירים אחד.
        </li>
        <li>
          עדיין תקוע? אפשר לפנות ל<Link to="/he/support">תמיכה</Link>.
        </li>
      </ul>

      <h2>עמודים קשורים</h2>
      <ul>
        <li>
          <Link to="/he/guide/search">חיפוש</Link> - מעבר ישיר למנוע חיפוש מהלשונית החדשה
        </li>
        <li>
          <Link to="/he/guide/templates">תבניות פריסה</Link> - סידורים מוכנים שמציגים או מסתירים את הדוק
        </li>
        <li>
          <Link to="/he/guide/tab-sidebar">סרגל הלשוניות</Link> - מעבר בין לשוניות שכבר פתוחות
        </li>
      </ul>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
