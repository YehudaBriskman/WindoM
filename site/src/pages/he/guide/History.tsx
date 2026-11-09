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
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
