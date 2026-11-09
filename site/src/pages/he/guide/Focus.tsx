import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: הגדירו מיקוד ראשי וטיימר ספירה לאחור, מ-25 דקות עד 4 שעות, ו-WindoM מעמעם את כל השאר עד הסיום..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Focus() {
  return (
    <DocsLayout path="/he/guide/focus" eyebrow="מדריך למשתמש" title="מצב פוקוס" dir="rtl">
      <h2>סקירה</h2>

      <p>
        במרכז הלשונית החדשה מופיעה השאלה <em>What is your main focus for today?</em> - מה המיקוד העיקרי שלך היום. כותבים
        אותו, וכשמגיע הזמן לעבוד עליו, מפעילים ספירה לאחור שמסתירה את כל השאר.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            מקלידים את המיקוד בשדה שבמרכז ולוחצים <strong>Enter</strong>. לחיצה עליו בהמשך מסמנת אותו כבוצע; לחיצה כפולה
            פותחת אותו לעריכה.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            לוחצים על אחד מפרקי הזמן שמתחתיו - <strong>25m</strong>, <strong>1h</strong>, <strong>2h</strong> או{' '}
            <strong>4h</strong>. שאר הדף נעלם, ונשארים השעון והזמן שנותר.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            כדי לעצור מוקדם, לוחצים על <strong>Stop Focus</strong>, לוחצים בכל מקום על המסך, או לוחצים{' '}
            <strong>Escape</strong>.
          </p>
        </div>
      </div>
      <div className="callout tip">
        <strong>לא משתמשים בזה?</strong> - מכבים את <strong>Center Bar</strong> תחת Settings → General → Widget
        Visibility כדי להסתיר את שדה הפוקוס ואת פרקי הזמן.
      </div>
      <h2>איך זה עובד</h2>
      <p>
        מצב פוקוס מורכב משני חלקים שעובדים בנפרד: <strong>שדה המיקוד</strong>, שבו כותבים מה רוצים להספיק, ו
        <strong>הספירה לאחור</strong>, שמנקה את הדף לפרק זמן קבוע. אפשר להשתמש בשדה בלי להפעיל טיימר, ואפשר להפעיל טיימר
        בלי לכתוב כלום.
      </p>
      <p>בלחיצה על פרק זמן, הדף משתנה בשלבים ולא בבת אחת:</p>
      <ol>
        <li>הווידג'טים נעלמים בהדרגה, והתמונה ברקע מתקרבת לאט.</li>
        <li>
          שכבה במסך מלא מופיעה בהדרגה. היא מציגה את השעון, את הזמן שנותר בפורמט <code>HH:MM:SS</code> ואת הכפתור{' '}
          <strong>Stop Focus</strong>.
        </li>
        <li>הספירה יורדת פעם בשנייה. כשהיא מגיעה לאפס, מצב פוקוס מסתיים מעצמו והדף חוזר.</li>
      </ol>
      <p>
        עצירה מוקדמת, באחת משלוש הדרכים שלמעלה, מפעילה את אותו רצף בכיוון ההפוך. כל מעבר נמשך כשלוש שניות, וכפתורי פרקי
        הזמן מוסתרים בזמן שמצב פוקוס פועל.
      </p>

      <h2>כתיבה ועריכה של המיקוד</h2>
      <ul>
        <li>
          <strong>שמירה</strong> - לוחצים <kbd>Enter</kbd> או לוחצים מחוץ לשדה. הטקסט נחתך מרווחים בתחילתו ובסופו.
        </li>
        <li>
          <strong>סימון כבוצע</strong> - לחיצה אחת על הטקסט. הוא מקבל קו חוצה ונעשה חלש יותר; לחיצה נוספת מבטלת.
        </li>
        <li>
          <strong>עריכה</strong> - לחיצה כפולה על הטקסט, שינוי, ואז <kbd>Enter</kbd> או לחיצה מחוץ לשדה.
        </li>
        <li>
          <strong>התחלה נקייה</strong> - כששומרים טקסט שונה מהמיקוד הקודם, סימון הביצוע מתאפס, כך שמיקוד חדש אף פעם לא
          מתחיל כשהוא חצוי.
        </li>
        <li>
          <strong>ניקוי</strong> - מוחקים את כל הטקסט ושומרים. השדה חוזר לשאול{' '}
          <em>What is your main focus for today?</em>
        </li>
      </ul>
      <p>חיווי שמירה קטן ליד השדה מראה את תוצאת כל שמירה.</p>

      <h2>פרקי הזמן וההגדרה שמשפיעה עליהם</h2>
      <p>
        ארבעת פרקי הזמן קבועים: <strong>25m</strong> (25 דקות), <strong>1h</strong> (60 דקות), <strong>2h</strong> (120
        דקות) ו-<strong>4h</strong> (240 דקות). אי אפשר לבחור משך מותאם אישית.
      </p>
      <p>
        ההגדרה היחידה היא <strong>Center Bar</strong> תחת Settings → General → Widget Visibility. היא פעילה כברירת מחדל.
        כיבוי שלה מסתיר יחד את שדה המיקוד ואת כפתורי הזמן; מה שכתבתם לא נמחק, והוא עדיין שם כשמדליקים אותה מחדש.
      </p>

      <h2>איפה הנתונים נשמרים</h2>
      <ul>
        <li>
          טקסט המיקוד וסימון הביצוע נשמרים במכשיר הזה בלבד, באחסון המקומי של התוסף בדפדפן. הם הוחרגו במכוון מסנכרון
          ההגדרות, ולכן הם לא עוברים למחשב אחר ולא נשלחים לשרת של WindoM.
        </li>
        <li>
          הספירה לאחור לא נשמרת בשום מקום. היא קיימת רק בלשונית החדשה הפתוחה, ולכן סגירה או רענון של הלשונית מסיימים
          אותה.
        </li>
        <li>מצב פוקוס לא שולח בקשות רשת בעצמו.</li>
      </ul>
      <p>
        התמונה המלאה של מה שהתוסף שומר ושולח מופיעה ב<Link to="/he/privacy">מדיניות הפרטיות</Link>.
      </p>

      <h2>טיפים והגדרות מומלצות</h2>
      <ul>
        <li>כתבו את המיקוד כתוצאה אחת ממשית, ובחרו פרק זמן שמתאים לה. השדה הוא שורה אחת, ולכן הוא מתאים למשפט קצר.</li>
        <li>
          <strong>25m</strong> מתאים לישיבת עבודה אחת, ו-<strong>4h</strong> לגוש ארוך. אם סיימתם מוקדם,{' '}
          <kbd>Escape</kbd> מסיים את הספירה.
        </li>
        <li>
          שלבו עם פריסה שקטה. <Link to="/he/guide/templates">תבנית</Link> יכולה להסתיר את הווידג'טים שאינכם צריכים, וב
          <Link to="/he/guide/background">רקע</Link> שולטים בתמונה שמתקרבת מאחורי השעון.
        </li>
        <li>
          את רשימת המשימות הקטנות עדיף לנהל ב<Link to="/he/guide/todos">משימות</Link>, ושדה המיקוד נשאר לדבר האחד שחשוב
          היום.
        </li>
      </ul>

      <h2>שאלות נפוצות</h2>
      <p>
        <strong>האם מצב פוקוס חוסם אתרים אחרים?</strong> לא. הוא מנקה את דף הלשונית החדשה שמולכם; הוא לא חוסם אתרים, לא
        סוגר לשוניות ולא משתיק התראות.
      </p>
      <p>
        <strong>האם יש צליל או התראה כשהזמן נגמר?</strong> לא. כשהספירה מסתיימת, השכבה נעלמת בהדרגה והדף חוזר.
      </p>
      <p>
        <strong>אפשר להשהות את הספירה?</strong> לא. אפשר לעצור אותה ולהתחיל חדשה.
      </p>
      <p>
        <strong>אפשר לקבוע משך משלי?</strong> לא. מוצעים רק ארבעת פרקי הזמן שלמעלה.
      </p>

      <h2>פתרון בעיות</h2>
      <ul>
        <li>
          <strong>שדה המיקוד והכפתורים חסרים</strong> - Center Bar כבוי. מדליקים אותו ב-Settings → General → Widget
          Visibility.
        </li>
        <li>
          <strong>Escape לא עושה כלום</strong> - הוא פועל בזמן שמצב פוקוס מתחיל או רץ, אבל לא במהלך ההיעלמות שאחרי
          העצירה. מחכים רגע עד שהדף חוזר.
        </li>
        <li>
          <strong>הטקסט שלי לא נשמר</strong> - שימו לב לחיווי השמירה ליד השדה. אם הוא מדווח על בעיה, עורכים את הטקסט שוב
          ולוחצים <kbd>Enter</kbd>.
        </li>
        <li>
          <strong>המיקוד שלי חצוי בקו</strong> - לחצתם עליו, וזה מסמן אותו כבוצע. לחיצה נוספת מבטלת.
        </li>
      </ul>

      <h2>עמודים קשורים</h2>
      <ul>
        <li>
          <Link to="/he/guide/todos">משימות</Link> - רשימה לכל מה שאינו הדבר האחד של היום
        </li>
        <li>
          <Link to="/he/guide/templates">תבניות</Link> - פריסות בלחיצה אחת שמציגות או מסתירות ווידג'טים
        </li>
        <li>
          <Link to="/he/guide/shortcuts">קיצורי מקלדת</Link> - כל מקש שהתוסף מגיב אליו
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
