import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: מה חשבון WindoM חינמי מוסיף, איך יוצרים אותו ואיך מנהלים אותו. נדרש רק לסנכרון, ל-Calendar, ל-GitHub ול-Spotify..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Account() {
  return (
    <DocsLayout path="/he/guide/account" eyebrow="מדריך למשתמש" title="יצירת חשבון WindoM" dir="rtl">
      <p>
        חשבון WindoM מסנכרן את ההגדרות שלך בין מכשירים ונדרש לחיבור Google Calendar, Spotify או GitHub. ההרשמה חינמית
        ולוקחת פחות מדקה.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            פותחים את סמל גלגל השיניים (<strong>Settings</strong>) בפינה השמאלית התחתונה של הלשונית החדשה, ועוברים
            ללשונית <strong>Account</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            מזינים כתובת אימייל וסיסמה (לפחות 8 תווים) ולוחצים על <strong>Create account</strong>.
          </p>
          <p>
            לחלופין, לוחצים על <strong>Continue with Google</strong> כדי לא לנהל סיסמה.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>בודקים את תיבת הדואר, מחפשים את מייל האימות ולוחצים על הקישור שבו. זהו, ההתחברות הושלמה.</p>
        </div>
      </div>
      <div className="callout tip">
        <strong>סנכרון הגדרות</strong> - לאחר ההתחברות, פורמט השעון, הרקע המועדף, הווידג'טים והקישורים המהירים מסתנכרנים
        לענן ומופיעים בכל מכשיר שבו מחוברים ל-WindoM.
      </div>
      <h2>ניהול החשבון</h2>
      <p>
        כל מה שברשימה נמצא ב-Settings → <strong>Account</strong> אחרי ההתחברות.
      </p>
      <ul>
        <li>
          <strong>שם</strong> - משנים אותו תחת <strong>Profile</strong> ולוחצים על <strong>Save</strong>.
        </li>
        <li>
          <strong>סיסמה</strong> - בחשבון עם סיסמה אפשר להגדיר סיסמה חדשה תחת <strong>Change password</strong>. אם שכחת
          אותה, לוחצים על <strong>Forgot password?</strong> בטופס ההתחברות ו-WindoM שולח קישור לאיפוס במייל.
        </li>
        <li>
          <strong>Active sessions</strong> - כל דפדפן שמחובר לחשבון מופיע ברשימה. <strong>Revoke session</strong> מונע
          ממנו לחדש את ההתחברות; הוא עלול להמשיך לעבוד עד 15 דקות אחר כך.
        </li>
        <li>
          <strong>Sign out</strong> - מנתק את הדפדפן הזה מהחשבון.
        </li>
        <li>
          <strong>Delete account</strong> - תחת <strong>Danger Zone</strong>. מוחק לצמיתות את החשבון ואת כל מה שנשמר בו,
          כולל החיבורים ל-Calendar ול-Spotify. בחשבון עם סיסמה מתבקשים להזין אותה לאישור.
        </li>
      </ul>
      <p>
        מה החשבון שומר, ומה לעולם לא יוצא מהמכשיר שלך, מפורט ב<Link to="/he/privacy">מדיניות הפרטיות</Link>.
      </p>
      <h2>מה החשבון עושה ומה הוא לא עושה</h2>
      <p>
        החשבון הוא אופציונלי. הדשבורד עובד גם בלעדיו, ורשימת המשימות, הקישורים המהירים, תמונות הרקע שהעלית ורשימת המעקב
        הפיננסית נשארים במכשיר שלך בכל מקרה. החשבון מוסיף שלושה דברים: ההגדרות שלך עוברות איתך לדפדפנים אחרים, אפשר לחבר
        Google Calendar ו-GitHub, והחיבור ל-Spotify נשמר יחד עם החשבון. הוא לא משנה מה נשמר רק במכשיר.
      </p>
      <h2>מה נשמר בשרת</h2>
      <p>
        המקור המחייב הוא <Link to="/he/privacy">מדיניות הפרטיות</Link>. עבור חשבון היא מפרטת:
      </p>
      <ul>
        <li>כתובת האימייל וסיסמה מגובבת ב-bcrypt (לעולם לא הסיסמה עצמה).</li>
        <li>שם התצוגה.</li>
        <li>הגדרות הדשבורד, כדי שיישארו עקביות בין המכשירים.</li>
        <li>
          רשומות של סשנים פעילים. לכל אחד נשמרים שם הדפדפן ושם מערכת ההפעלה, לדוגמה "Chrome · Windows" בלי גרסאות, כדי
          שתוכל לזהות אותו תחת <strong>Active sessions</strong>. הרשומה נמחקת עם הסשן או עם החשבון.
        </li>
        <li>
          יומן אבטחה של פעולות רגישות, כמו התחברויות, ניסיונות התחברות כושלים, החלפת סיסמה וחיבור או ניתוק של שירות. כל
          רשומה כוללת את הפעולה, זמנה, הסשן ואותו שם דפדפן ומערכת הפעלה - לעולם לא כתובת IP, אימייל או אסימון. הרשומות
          נמחקות אחרי 180 יום, או מיד עם מחיקת החשבון.
        </li>
      </ul>
      <p>
        פרטי הגישה לשירותים - האסימונים של Google ו-Spotify והאסימון של GitHub - מוצפנים באחסון באמצעות AES-256-GCM.
        ההתחברות נשענת על אסימוני גישה קצרי חיים (15 דקות) ועל עוגיית רענון שמתחלפת; אם אסימון רענון נעשה בו שימוש חוזר,
        הסשן מבוטל אוטומטית.
      </p>
      <h2>דרכי התחברות</h2>
      <ul>
        <li>
          <strong>אימייל וסיסמה</strong> - הסיסמה חייבת להכיל לפחות 8 תווים. את הכתובת מאמתים דרך המייל ש-WindoM שולח.
        </li>
        <li>
          <strong>Continue with Google</strong> - בלי סיסמת WindoM לנהל. אם נרשמת כך וצריך להתחבר שוב, משתמשים באותו
          כפתור.
        </li>
      </ul>
      <h2>מחיקת החשבון והנתונים</h2>
      <ol>
        <li>
          פותחים Settings → <strong>Account</strong> → <strong>Danger Zone</strong> → <strong>Delete account</strong>.
        </li>
        <li>אם לחשבון יש סיסמה, מזינים אותה לאישור.</li>
      </ol>
      <p>
        הנתונים נמחקים ממסד הנתונים מיד, כולל החיבורים השמורים ל-Calendar, ל-Spotify ול-GitHub ויומן האבטחה. עותקים
        שעלולים להישאר בלוגים של השרת ובגיבויי מסד הנתונים אינם משמשים לשום דבר ופגים מעצמם בתוך 30 יום. מה שנשמר רק
        בדפדפן שלך לא נפגע מהמחיקה; הוא נשאר עד שתנקה אותו או תסיר את התוסף.
      </p>
      <div className="callout warn">
        <strong>אי אפשר לבטל מחיקה.</strong> אם רוצים להיפטר רק משירות אחד, מנתקים אותו מ-Settings →{' '}
        <strong>Apps</strong>: כך האסימון השמור שלו נמחק והחשבון נשאר.
      </div>
      <p>
        אפשר גם להוריד עותק JSON של הנתונים שבשרת דרך נקודת הקצה המאומתת <code>GET /me/export</code>. סיסמאות, אסימונים
        ומפתחות API לא נכללים בו.
      </p>
      <h2>שאלות נפוצות</h2>
      <h3>האם צריך חשבון כדי להשתמש ב-WindoM?</h3>
      <p>
        לא. הוא נדרש רק ל-Calendar, ל-GitHub ולסנכרון הגדרות דרך WindoM. בלי חשבון, הסנכרון של פרופיל Chrome יכול להעביר
        את ההגדרות בין מחשבים שמחוברים לאותו חשבון Chrome.
      </p>
      <h3>מה לא מסתנכרן?</h3>
      <p>תמונות רקע, מזג אוויר שמור והיסטוריית לשוניות לא נכללים במכוון. הם גדולים ונשארים במכשיר שיצר אותם.</p>
      <h3>למה לא קיבלתי את מייל האימות או האיפוס?</h3>
      <p>
        בודקים קודם את תיקיית הספאם. אם הוא לא הגיע, כותבים לנו דרך <Link to="/he/contact">יצירת קשר</Link>.
      </p>
      <h2>פתרון בעיות</h2>
      <ul>
        <li>
          <strong>"You've reached the maximum number of active sessions"</strong> - מתנתקים בדפדפן שכבר לא בשימוש, או
          פותחים <strong>Active sessions</strong> מדפדפן שעדיין מחובר ולוחצים על <strong>Revoke session</strong>. סשן
          שבוטל עלול להמשיך לעבוד עד 15 דקות.
        </li>
        <li>
          <strong>ההגדרות לא הופיעו במחשב אחר</strong> - מוודאים שמחוברים בשני המחשבים תחת Settings → Account.
        </li>
        <li>
          <strong>שכחתי סיסמה</strong> - משתמשים ב-<strong>Forgot password?</strong> ואז ב-
          <strong>Send reset link</strong>.
        </li>
      </ul>
      <p>
        עוד פתרונות בעמוד <Link to="/he/support">התמיכה</Link>.
      </p>
      <h2>עמודים קשורים</h2>
      <ul>
        <li>
          <Link to="/he/guide/calendar">חיבור Google Calendar</Link>
        </li>
        <li>
          <Link to="/he/guide/github">חיבור GitHub</Link>
        </li>
        <li>
          <Link to="/he/guide/spotify">חיבור Spotify</Link>
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
