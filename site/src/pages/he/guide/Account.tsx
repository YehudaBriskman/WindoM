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
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
