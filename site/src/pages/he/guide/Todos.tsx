import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: רשימת משימות שחיה בסרגל הצד של WindoM. לא צריך חשבון..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Todos() {
  return (
    <DocsLayout path="/he/guide/todos" eyebrow="מדריך למשתמש" title="משימות" dir="rtl">
      <h2>סקירה</h2>

      <p>
        רשימת משימות פשוטה, <strong>Today's Tasks</strong>, בראש סרגל הצד. היא פעילה מההתחלה ולא דורשת חשבון.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>לוחצים על סמל הרשימה בפינה הימנית התחתונה של הלשונית החדשה כדי לפתוח את סרגל הצד.</p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            מקלידים בשדה <strong>Add a new task...</strong> ולוחצים <strong>Enter</strong> או <strong>+</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            מסמנים משימה כדי לציין שהיא בוצעה, או לוחצים על ה-<strong>×</strong> שלה כדי להסיר אותה.
          </p>
        </div>
      </div>
      <div className="callout tip">
        <strong>איפה המשימות נשמרות</strong> - המשימות נשמרות באחסון של Chrome בפרופיל שלך, לא בשרת של WindoM, וכל
        לשונית חדשה פתוחה מציגה את אותה רשימה. כדי להסתיר את הרשימה, פותחים את Settings → <strong>Apps</strong> →{' '}
        <strong>Tasks</strong> ומכבים את <strong>Show in sidebar</strong>.
      </div>
      <h2>איך זה עובד</h2>
      <p>
        משימות נשמרות ברגע שמוסיפים, מסמנים או מסירים אותן, וכל לשונית חדשה פתוחה מתעדכנת בהתאם. הרשימה מוצגת לפי סדר
        ההוספה, הוותיקה ראשונה. משימה שסימנת נשארת ברשימה כשהיא מסומנת כבוצעה, עד שמסירים אותה עם ה-<strong>×</strong>{' '}
        שלה. בזמן ששינוי נשמר, תיבת הסימון וה-<strong>×</strong> של אותה משימה מושבתות לרגע, כדי שלחיצה כפולה לא תפעל
        עליה פעמיים.
      </p>
      <ul>
        <li>שורות ריקות מתעלמים מהן, ורווחים בתחילת הטקסט ובסופו נחתכים.</li>
        <li>
          כשאין משימות, הרשימה מציגה <em>No tasks yet. Add one below.</em>
        </li>
        <li>
          סרגל הצד נסגר בלחיצה מחוץ לו או ב-<kbd>Escape</kbd>, כך שאפשר לסגור אותו גם מהמקלדת ולא רק בעכבר.
        </li>
      </ul>

      <h2>כל ההגדרות בפירוט</h2>
      <p>לרשימת המשימות יש הגדרה אחת, תחת Settings → Apps → Tasks:</p>
      <ul>
        <li>
          <strong>Show in sidebar</strong> - פעיל כברירת מחדל. כשהוא כבוי, <strong>Today's Tasks</strong> מוסרת מסרגל
          הצד. המשימות השמורות נשארות, וחוזרות להופיע כשמדליקים אותו שוב.
        </li>
      </ul>
      <p>
        את סרגל הצד עצמו אפשר למקם בקצה השמאלי או הימני תחת Settings → General → Tab Sidebar. ראו את הדף{' '}
        <Link to="/he/guide/tab-sidebar">סרגל הלשוניות</Link>. שאר המקטעים בסרגל, כמו Calendar ו-Recent, נשלטים בנפרד.
      </p>

      <h2>איפה הנתונים נשמרים ומה יוצא מהמכשיר</h2>
      <p>
        המשימות נשמרות באחסון התוספים של Chrome תחת המפתח <code>todos</code>, באותו אזור שבו נשמרות ההגדרות שלך. WindoM
        לא שולח אותן לשרת שלו, ואין צורך בחשבון כדי להשתמש בהן. אם Chrome עצמו מעתיק את האחסון הזה למחשבים אחרים שלך
        תלוי בהגדרות הסנכרון של Chrome, שמנוהלות על ידי Chrome ולא על ידי WindoM. ב
        <Link to="/he/privacy">מדיניות הפרטיות</Link> מפורט עם מה התוסף כן מתקשר.
      </p>
      <div className="callout warn">
        <strong>Reset to Defaults מוחק את המשימות.</strong> הכפתור <strong>Reset to Defaults</strong> ב-Settings →
        General מנקה את האחסון המסונכרן של התוסף ב-Chrome לפני שהוא משחזר את הגדרות ברירת המחדל, ושם נשמרות המשימות.
        כדאי להסיר מהרשימה מה שרוצים לשמור, או להעתיק אותו למקום אחר.
      </div>

      <h2>טיפים והגדרות מומלצות</h2>
      <ul>
        <li>
          כדאי לשמור על רשימה קצרה. היא נקראת <em>Today's Tasks</em> מסיבה: היא עובדת הכי טוב כקומץ הדברים שרוצים לסיים
          היום, לא כרשימת צבירה.
        </li>
        <li>
          כדאי לנסח כל משימה כפעולה קטנה וברורה, למשל <em>Send invoice to Dana</em>, כך שסימון שלה הוא חד-משמעי.
        </li>
        <li>
          בסוף היום אפשר לנקות משימות מסומנות בלחיצה על ה-<strong>×</strong> שלהן, כדי להתחיל את היום הבא נקי.
        </li>
        <li>
          אפשר לשלב את הרשימה עם <Link to="/he/guide/focus">מצב פוקוס</Link>: כותבים את הדבר האחד שמתכוונים לעשות,
          מפעילים את הטיימר, ובודקים את הרשימה כשהוא מסתיים.
        </li>
        <li>
          אפשר לחבר את <Link to="/he/guide/calendar">Google Calendar</Link> (זה דורש חשבון WindoM) כדי לראות את אירועי
          היום ישירות מתחת למשימות, באותו סרגל.
        </li>
      </ul>

      <h2>שאלות נפוצות</h2>
      <h3>האם צריך חשבון בשביל משימות?</h3>
      <p>לא. המשימות עובדות מההתקנה הראשונה ולא קשורות לחשבון WindoM.</p>
      <h3>האם אפשר לערוך משימה אחרי שהוספתי אותה?</h3>
      <p>אפשר להוסיף משימות, לסמן אותן ולהסיר אותן. כדי לשנות את הניסוח, מסירים את המשימה ומוסיפים אותה מחדש.</p>
      <h3>למה אני לא רואה את סרגל הצד?</h3>
      <p>
        הסרגל נפתח מסמל הרשימה בפינה הימנית התחתונה, או מהקצה שבחרת תחת Tab Sidebar בהגדרות General. אם סמל הרשימה קיים
        אבל המשימות לא, בודקים את <strong>Show in sidebar</strong> שלמעלה.
      </p>

      <h2>פתרון בעיות</h2>
      <ul>
        <li>
          <strong>Today's Tasks חסרה בסרגל הצד.</strong> מדליקים שוב את <strong>Show in sidebar</strong> תחת Settings →
          Apps → Tasks.
        </li>
        <li>
          <strong>המשימות שלי נעלמו.</strong> הסיבה הנפוצה היא <strong>Reset to Defaults</strong>, או ניקוי נתוני
          התוספים של הדפדפן. משימות שהוסרו כך לא ניתנות לשחזור מתוך WindoM.
        </li>
        <li>
          <strong>משימה לא נוספת.</strong> שורה ריקה או רווחים בלבד מתעלמים מהם. מקלידים טקסט ולוחצים <kbd>Enter</kbd>{' '}
          או <strong>+</strong>.
        </li>
        <li>
          עדיין תקוע? אפשר לפנות ל<Link to="/he/support">תמיכה</Link>.
        </li>
      </ul>

      <h2>עמודים קשורים</h2>
      <ul>
        <li>
          <Link to="/he/guide/focus">מצב פוקוס</Link> - קביעת כוונה והעמעום של הלשונית
        </li>
        <li>
          <Link to="/he/guide/calendar">חיבור Google Calendar</Link> - אירועי היום באותו סרגל
        </li>
        <li>
          <Link to="/he/guide/tab-sidebar">סרגל הלשוניות</Link> - צד הסרגל ורשימת הלשוניות
        </li>
      </ul>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
