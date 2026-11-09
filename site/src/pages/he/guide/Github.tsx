import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: ראו התראות GitHub, בקשות סקירה ו-issues שהוקצו לכם בלשונית החדשה של WindoM..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Github() {
  return (
    <DocsLayout path="/he/guide/github" eyebrow="מדריך למשתמש" title="חיבור GitHub" dir="rtl">
      <h2>סקירה</h2>

      <p>
        ווידג'ט GitHub מציב שלושה מספרים בסרגל הצד: התראות שלא נקראו, בקשות משיכה שממתינות לסקירה שלך, ו-issues פתוחים
        שהוקצו לך. כל שורה מקשרת ישירות לעמוד המתאים ב-GitHub. נדרשים חשבון WindoM ואסימון גישה אישי שיוצרים בעצמך.
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
            נכנסים אל{' '}
            <a
              href="https://github.com/settings/tokens/new?scopes=notifications,repo&description=WindoM"
              target="_blank"
              rel="noreferrer"
            >
              github.com/settings/tokens/new
            </a>
            . הקישור מסמן מראש את שתי ההרשאות ש-WindoM צריך - <code>notifications</code> ו-<code>repo</code> - אז
            מוודאים שהן מסומנות, בוחרים תוקף נוח, ולוחצים על <strong>Generate token</strong>.
          </p>
          <p>
            מעתיקים את האסימון מיד. הוא מתחיל ב-<code>ghp_</code> ו-GitHub מציג אותו פעם אחת בלבד.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            פותחים את Settings → <strong>Apps</strong> → לוחצים על הכרטיס <strong>GitHub</strong>. מדביקים את האסימון
            בשדה <strong>Personal Access Token</strong> ולוחצים על <strong>Connect</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          <p>
            המספרים מופיעים בסרגל הצד ומתרעננים מעצמם. המתג <strong>Show GitHub in sidebar</strong> באותו כרטיס מסתיר את
            הווידג'ט בלי לנתק את החיבור.
          </p>
        </div>
      </div>
      <div className="callout warning">
        <strong>למה צריך את ההרשאה repo?</strong> ספירת בקשות הסקירה וה-issues שהוקצו לך מגיעה מממשק החיפוש של GitHub,
        שכולל מאגרים פרטיים רק עבור אסימון שנושא <code>repo</code>. ב-classic token ההרשאה הזו מעניקה גם גישת כתיבה,
        ש-WindoM לעולם אינו עושה בה שימוש - לכן כדאי להתייחס לאסימון כמו לסיסמה, ולבטל אותו דרך{' '}
        <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">
          הגדרות האסימונים שלך
        </a>{' '}
        אם מפסיקים להשתמש בווידג'ט.
      </div>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
