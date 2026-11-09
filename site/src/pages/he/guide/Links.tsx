import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: נעצו את האתרים שאתם פותחים הכי הרבה לסרגל הדוק בלשונית החדשה של WindoM, והוסיפו, ערכו או סדרו אותם מחדש..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Links() {
  return (
    <DocsLayout path="/he/guide/links" eyebrow="מדריך למשתמש" title="קישורים מהירים וסרגל הדוק" dir="rtl">
      <h2>סקירה</h2>

      <p>
        אפשר לנעוץ את האתרים שהכי בשימוש בסרגל הדוק שלאורך החלק העליון של כל לשונית חדשה. כל קישור מוצג כסמל של האתר,
        והשם שלו מופיע במעבר עכבר. הדוק מכיל עד 27 קישורים בשורות של תשעה, ונגלל שורה אחת בכל פעם.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            לוחצים על ה-<strong>+</strong> בסוף הדוק, או פותחים את Settings → <strong>Links</strong> ולוחצים על{' '}
            <strong>+ Add Link</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            מזינים שם ואת ה-URL המלא (למשל <code>https://github.com</code>).
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            כדי להסיר קישור, לוחצים על ה-<strong>×</strong> שעליו בדוק או לידו ב-Settings → Links.
          </p>
        </div>
      </div>
      <p>
        כדי להסתיר את הדוק לגמרי, מכבים את <strong>Quick Links</strong> תחת Settings → General → Widget Visibility.
      </p>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
