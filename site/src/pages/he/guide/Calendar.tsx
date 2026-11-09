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
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
