import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: רשימת Recent, והיסטוריית הגלישה כהצעות חיפוש, ואיך מכבים אותן..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function History() {
  return (
    <DocsLayout path="/he/guide/history" eyebrow="מדריך למשתמש" title="היסטוריית גלישה" dir="rtl">
      <h2>סקירה</h2>

      <p>
        מוסיף לסרגל הצד רשימה בשם <strong>Recent</strong>: עשרת האתרים האחרונים שביקרת בהם, כל אחד עם הסמל שלו ומתי היית
        בו. הרשימה כבויה עד שמפעילים אותה.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            פותחים את Settings → <strong>Apps</strong> → <strong>History</strong> ומפעילים את{' '}
            <strong>Show in sidebar and search</strong>. Chrome שואל אם לאפשר ל-WindoM לקרוא את היסטוריית הגלישה -
            לוחצים על <strong>Allow</strong>. אם מסרבים, המתג נשאר כבוי ושום דבר אחר לא משתנה.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>פותחים את סרגל הצד מסמל הרשימה בפינה הימנית התחתונה. לחיצה על פריט פותחת אותו בלשונית חדשה.</p>
        </div>
      </div>
      <p>
        הרשימה נקראת מההיסטוריה של Chrome עצמו, על המכשיר שלך; שום דבר ממנה לא נשלח לשום מקום. אותו מתג מוסיף דפים
        שביקרת בהם להצעות ה<Link to="/he/guide/search">חיפוש</Link> בלשונית החדשה.
      </p>
      <p>
        WindoM לא מבקש גישה להיסטוריה בהתקנה - רק כשמפעילים את האפשרות הזו. כיבוי שלה מחזיר את ההרשאה ל-Chrome. אם
        מסירים את ההרשאה בעצמך ב-<code>chrome://extensions</code>, הרשימה <strong>Recent</strong> מציגה כפתור{' '}
        <strong>Allow access</strong> במקום ההיסטוריה.
      </p>
      <h2>איך זה עובד</h2>
      <p>
        כשההיסטוריה פעילה, WindoM מבקש מ-Chrome דפים מ-7 הימים האחרונים ובונה מהם את הרשימה <strong>Recent</strong>.
        רשומות בלי כותרת מדולגות, ונשמרת רשומה אחת לכל אתר: אם פתחת כמה דפים באותו אתר, הדף האחרון מייצג אותו. ברשימה עד
        עשרה אתרים. כל שורה מציגה את כותרת הדף ואת הזמן היחסי, למשל <code>just now</code>, <code>12m ago</code>,{' '}
        <code>3h ago</code>, <code>yesterday</code> או <code>2d ago</code>.
      </p>
      <p>
        התכונה פעילה רק כששני תנאים מתקיימים: המתג <strong>Show in sidebar and search</strong> דולק, ו-Chrome העניק
        ל-WindoM את ההרשאה האופציונלית <code>history</code>. אם אחד מהם חסר, התכונה מופיעה ככבויה.
      </p>

      <h2>ההגדרה בפירוט</h2>
      <ul>
        <li>
          <strong>Show in sidebar and search</strong> - ב-Settings → <strong>Apps</strong> → <strong>History</strong>{' '}
          (הכרטיס נקרא <strong>Browsing History</strong>). כבוי כברירת מחדל. מתג אחד שולט גם ברשימה{' '}
          <strong>Recent</strong> וגם בהצעות ההיסטוריה בחיפוש.
        </li>
        <li>
          הפעלה מבקשת מ-Chrome הרשאה לקרוא את היסטוריית הגלישה. כיבוי מכבה את התכונה ומחזיר את ההרשאה, כך ש-WindoM מחזיק
          בה רק כל עוד התכונה בשימוש.
        </li>
        <li>אם מסרבים לבקשה, WindoM מציג הודעה ש-Chrome לא העניק גישה, והמתג נשאר כבוי. אפשר להפעיל שוב בכל עת.</li>
      </ul>

      <h2>היסטוריה בחיפוש</h2>
      <p>
        כשההיסטוריה פעילה, הקלדה בתיבת ה<Link to="/he/guide/search">חיפוש</Link> יכולה להציע גם דפים שביקרת בהם. WindoM
        מבקש מההיסטוריה של Chrome התאמות למה שהקלדת, משמיט דפים שכבר פתוחים בלשונית, ומציג לכל היותר ארבעה. ההתאמה
        מתבצעת על ידי Chrome, על המכשיר שלך.
      </p>

      <h2>מה יוצא מהמכשיר</h2>
      <p>
        היסטוריית הגלישה נקראת דרך ה-API של Chrome עצמו ואינה נשלחת לשרתים של WindoM ולא לשום שירות אחר. יש בקשה חיצונית
        אחת הקשורה לרשימה: סמל האתר בכל שורה נטען משירות הסמלים של Google (<code>www.google.com/s2/favicons</code>),
        והבקשה כוללת את שם המארח של האתר, למשל <code>example.com</code>. אם אי אפשר לטעון סמל, הוא פשוט מוסתר והשורה
        ממשיכה לעבוד. הרשימה המלאה של השירותים ש-WindoM פונה אליהם נמצאת ב<Link to="/he/privacy">מדיניות הפרטיות</Link>.
      </p>

      <h2>טיפים</h2>
      <ul>
        <li>
          השתמשו ב-<strong>Recent</strong> כדרך חזרה למשהו שסגרתם לפני רגע. הרשימה מכסה את השבוע האחרון ושומרת רשומה אחת
          לכל אתר, ולכן היא אינה היסטוריה מלאה; בשביל זה יש את דף ההיסטוריה של Chrome.
        </li>
        <li>
          שלבו עם <Link to="/he/guide/tab-sidebar">סרגל הלשוניות</Link>: לשוניות פתוחות ואתרים אחרונים באותו סרגל צד.
        </li>
        <li>אם רוצים רק את רשימת סרגל הצד או רק את הצעות החיפוש, שימו לב ששתיהן חולקות מתג אחד.</li>
      </ul>

      <h2>שאלות נפוצות</h2>
      <p>
        <strong>האם WindoM מבקש את ההיסטוריה שלי בהתקנה?</strong>
      </p>
      <p>
        לא. ההרשאה <code>history</code> אופציונלית ומתבקשת רק כשמפעילים את התכונה.
      </p>
      <p>
        <strong>למה הרשימה ריקה?</strong>
      </p>
      <p>הרשימה מוסתרת כשאין מה להציג: למשל, לא בוקר אתר עם כותרת ב-7 הימים האחרונים, או שהתכונה כבויה.</p>
      <p>
        <strong>הפעלתי, אבל מוצג Allow access במקום האתרים שלי. למה?</strong>
      </p>
      <p>
        המתג דולק אבל ל-Chrome כבר אין את ההרשאה עבור ההתקנה הזו. זה קורה אם הסרתם אותה ב-
        <code>chrome://extensions</code>, או אם ההגדרה הגיעה לדפדפן הזה דרך סנכרון הגדרות ממכשיר אחר שבו היא אושרה.
        לוחצים על <strong>Allow access</strong> בחלק Recent, או מכבים ומדליקים שוב את המתג ב-Settings.
      </p>
      <p>
        <strong>איך מפסיקים לגמרי?</strong>
      </p>
      <p>
        מכבים את <strong>Show in sidebar and search</strong>. ההרשאה חוזרת ל-Chrome באותו רגע.
      </p>

      <h2>דפים קשורים</h2>
      <ul>
        <li>
          <Link to="/he/guide/search">חיפוש</Link> - המקום שבו מופיעות הצעות ההיסטוריה
        </li>
        <li>
          <Link to="/he/guide/tab-sidebar">סרגל הלשוניות</Link> - הלשוניות הפתוחות שלך
        </li>
        <li>
          <Link to="/he/privacy">מדיניות פרטיות</Link> ו<Link to="/he/support">תמיכה</Link>
        </li>
      </ul>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
