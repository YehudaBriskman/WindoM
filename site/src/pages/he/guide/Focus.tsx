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
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
