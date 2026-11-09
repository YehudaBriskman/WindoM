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
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
