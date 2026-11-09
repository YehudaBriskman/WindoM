import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: הציגו את היום ומה שמגיע מ-Google Calendar בסרגל הצד של WindoM, לקריאה בלבד..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Calendar() {
  return (
    <DocsLayout path="/he/guide/calendar" eyebrow="מדריך למשתמש" title="חיבור Google Calendar" dir="rtl">
      <h2>סקירה</h2>

      <p>
        WindoM מציג את אירועי Google Calendar הקרובים שלך בסרגל הצד כך שהיום שלך תמיד גלוי. זה דורש חשבון WindoM ואישור
        Google חד-פעמי.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>מוודאים שיש חשבון WindoM ושההתחברות אליו פעילה (Settings → Account).</p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            פותחים את Settings → <strong>Apps</strong> → לוחצים על הכרטיס <strong>Calendar</strong> → לוחצים על{' '}
            <strong>Connect</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            נפתח חלון אישור של Google. בוחרים את חשבון Google ולוחצים על <strong>Allow</strong>.
          </p>
          <p>
            WindoM מבקש גישת קריאה בלבד לאירועי היומן - הוא לא יכול ליצור, לערוך או למחוק דבר. ההרשאות המדויקות מפורטות
            ב<Link to="/he/privacy">מדיניות הפרטיות</Link>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          <p>סיימת. האירועים הקרובים מופיעים בסרגל הצד, מקובצים לפי יום.</p>
        </div>
      </div>
      <div className="callout tip">
        <strong>טווח הימים קדימה</strong> - כברירת מחדל מוצגים אירועים ל-7 הימים הבאים. אפשר לשנות ל-14 או 30 יום באותו
        כרטיס <strong>Calendar</strong> תחת Settings → Apps.
      </div>
      <h2>מה הווידג'ט עושה ומה הוא לא עושה</h2>
      <p>
        הווידג'ט מציג את האירועים הקרובים שלך בסרגל הצד, מקובצים לפי יום. WindoM קורא אירועים מהיומנים בחשבון Google שלך
        (לא רק מהיומן הראשי) בטווח הימים שבחרת, ומציג לכל אירוע את הכותרת, השעה ושם היומן. הגישה היא לקריאה בלבד: אי
        אפשר ליצור, לערוך, לאשר או למחוק אירועים מתוך WindoM.
      </p>
      <h2>מה בדיוק מבקשים מ-Google</h2>
      <p>
        מסך ההסכמה מבקש ארבע הרשאות (scopes) באישור OAuth אחד, ו<Link to="/he/privacy">מדיניות הפרטיות</Link> קובעת שזו
        הרשימה המלאה:
      </p>
      <ul>
        <li>
          <code>calendar.readonly</code> - גישת קריאה ליומנים ולאירועים. זה מה שהווידג'ט צריך.
        </li>
        <li>
          <code>openid</code>, <code>email</code> ו-<code>profile</code> - מזהות איזה חשבון Google מתחבר.
        </li>
      </ul>
      <p>לא מתבקשת הרשאת Gmail. ווידג'ט Gmail כבוי בשירות המתארח, ולכן הרשאת דואר אינה מופיעה במסך ההסכמה.</p>
      <h2>מה נשמר, ולכמה זמן</h2>
      <ul>
        <li>
          אסימון הגישה שלך ל-Google נשמר מוצפן בשרת של WindoM באמצעות AES-256-GCM ומשמש רק לבקשת האירועים שלך מטעמך. הוא
          לא משותף עם צדדים שלישיים.
        </li>
        <li>
          פרטי האירועים נשלפים לפי הצורך ומוצגים בדשבורד. לפי מדיניות הפרטיות, WindoM לא קורא תיאורי אירועים או משתתפים.
        </li>
        <li>הבחירה שלך בטווח הימים היא חלק מההגדרות המסונכרנות.</li>
      </ul>
      <p>
        מידע משתמש מ-Google לעולם לא נמכר, לא משמש לפרסום ולא משמש לאימון מודלים. השימוש של WindoM במידע מממשקי Google
        API עומד ב-Google API Services User Data Policy, כולל דרישות ה-Limited Use שלה.
      </p>
      <h2>ההגדרות בקצרה</h2>
      <p>
        לכרטיס <strong>Calendar</strong> תחת Settings → <strong>Apps</strong> יש ערך אחד שאפשר לשנות, טווח הימים קדימה:
        7 ימים כברירת מחדל, או 14 או 30 יום. השרת מקבל לכל היותר 30 יום. בנוסף נשלפים לכל היותר 50 אירועים מכל יומן,
        ולכן ביומן עמוס מאוד טווח ארוך עלול לא להציג הכול.
      </p>
      <h2>ניתוק</h2>
      <ol>
        <li>
          פותחים Settings → <strong>Apps</strong> ואת הכרטיס <strong>Calendar</strong>.
        </li>
        <li>
          לוחצים על <strong>Disconnect</strong>. WindoM מבטל מיד את האסימון השמור ומוחק את הנתונים השמורים.
        </li>
      </ol>
      <p>
        מחיקת חשבון ה-WindoM מסירה גם את החיבור. כדי לבדוק או להסיר את הגישה של WindoM מצד Google, משתמשים ברשימת הגישות
        של צד שלישי בהגדרות חשבון Google.
      </p>
      <h2>שאלות נפוצות</h2>
      <h3>האם WindoM יכול לשנות את היומן שלי?</h3>
      <p>
        לא. הוא מבקש רק <code>calendar.readonly</code>, שאינה מאפשרת ל-Google ליצור, לערוך או למחוק דבר.
      </p>
      <h3>האם צריך חשבון WindoM?</h3>
      <p>
        כן. אסימון Google נשמר מול החשבון שלך. ראו <Link to="/he/guide/account">יצירת חשבון WindoM</Link>.
      </p>
      <h2>פתרון בעיות</h2>
      <ul>
        <li>
          <strong>מסך "this app isn't verified"</strong> - Google מציגה אותו לכל אפליקציה שהאימות שלה לא הושלם, ואפשר
          להמשיך דרכו בבטחה. לא משנה מה כתוב בו, WindoM מבקש רק לקרוא את היומן.
        </li>
        <li>
          <strong>Calendar מתנתק שוב ושוב</strong> - אם התחברת לפני 26 באוקטובר 2026 והחיבור נותק כעבור כשבוע, זו הייתה
          תקלת הגדרות מצידנו: Google מפקיעה גישה אחרי שבעה ימים כל עוד מסך ההסכמה של האפליקציה במצב בדיקה. הוא פורסם
          ב-26 באוקטובר 2026. מתחברים מחדש פעם אחת דרך Settings → Apps → Calendar → <strong>Connect</strong> וזה אמור
          להחזיק.
        </li>
        <li>
          <strong>"Could not refresh Google token. Please reconnect."</strong> - אי אפשר עוד לחדש את הגישה השמורה
          ל-Google. מתחברים מחדש מאותו כרטיס.
        </li>
        <li>
          <strong>התנתקות מיד אחרי ההתחברות</strong> - תוקן בגרסה 1.5.1. בודקים את הגרסה ב-
          <code>chrome://extensions</code>.
        </li>
      </ul>
      <p>
        עוד פתרונות בעמוד <Link to="/he/support">התמיכה</Link>.
      </p>
      <h2>עמודים קשורים</h2>
      <ul>
        <li>
          <Link to="/he/guide/account">יצירת חשבון WindoM</Link>
        </li>
        <li>
          <Link to="/he/guide/spotify">חיבור Spotify</Link>
        </li>
        <li>
          <Link to="/he/guide/templates">תבניות פריסה</Link>
        </li>
        <li>
          <Link to="/he/privacy">מדיניות הפרטיות</Link> ו<Link to="/he/support">תמיכה</Link>
        </li>
        <li>
          <Link to="/he/local-setup">הרצת שרת משלך</Link>
        </li>
      </ul>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
