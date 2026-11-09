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
      <h2>מה ווידג'ט GitHub עושה ומה הוא לא עושה</h2>
      <p>
        הווידג'ט מציג שלושה מספרים ותו לא: התראות שלא נקראו, בקשות משיכה פתוחות שממתינות לסקירה שלך, ו-issues פתוחים
        שהוקצו לך. הוא לא מציג כותרות, שמות מאגרים או תוכן, ואי אפשר להשתמש בו כדי לפתוח, להגיב או לשנות משהו מתוך
        WindoM.
      </p>
      <h2>ההרשאות, ולמה צריך את שתיהן</h2>
      <p>
        WindoM משתמש ב-<strong>classic personal access token</strong> עם שתי הרשאות:
      </p>
      <ul>
        <li>
          <code>notifications</code> - מאפשרת ל-WindoM לספור התראות שלא נקראו.
        </li>
        <li>
          <code>repo</code> - נדרשת כדי שחיפושי בקשות הסקירה וה-issues שהוקצו לך יכללו גם מאגרים פרטיים.
        </li>
      </ul>
      <p>
        ההרשאה <code>repo</code> רחבה. ב-classic token היא מכסה גישת קריאה וכתיבה למאגרים שאתה יכול להגיע אליהם. WindoM
        מבצע רק שלוש בקשות קריאה, אבל האסימון עצמו נושא את כל מה ש-GitHub העניקה לו, ולכן שומרים עליו בסוד כמו סיסמה.
      </p>
      <h2>איך זה עובד ומה נשמר</h2>
      <ul>
        <li>האסימון נשלח לשרת של WindoM ב-HTTPS ונשמר מוצפן באמצעות AES-256-GCM, יחד עם שם המשתמש שלך ב-GitHub.</li>
        <li>
          השרת של WindoM, ולא הדפדפן, פונה ל-<code>api.github.com</code> עם האסימון ומחזיר לתוסף רק את שלושת המספרים ואת
          שם המשתמש.
        </li>
        <li>דבר מההתראות, מבקשות המשיכה או מה-issues לא נשמר: לא כותרות, לא שמות מאגרים, לא תוכן.</li>
        <li>
          המספרים נשמרים בזיכרון השרת למשך דקה כדי להישאר במגבלות הקצב של GitHub, ולעולם לא נכתבים לדיסק. הווידג'ט בודק
          בערך פעם בדקה.
        </li>
      </ul>
      <h2>ההגדרות בקצרה</h2>
      <ul>
        <li>
          <strong>Personal Access Token</strong> - השדה שבו מדביקים את האסימון לפני הלחיצה על <strong>Connect</strong>.
        </li>
        <li>
          <strong>Show GitHub in sidebar</strong> - מסתיר או מציג את הווידג'ט. הסתרה לא מנתקת ולא מוחקת את האסימון
          השמור.
        </li>
        <li>
          <strong>Disconnect</strong> - מוחק את האסימון השמור ממסד הנתונים של WindoM מיד.
        </li>
      </ul>
      <h2>ניתוק וביטול האסימון</h2>
      <ol>
        <li>
          פותחים Settings → <strong>Apps</strong> → הכרטיס <strong>GitHub</strong> ולוחצים על{' '}
          <strong>Disconnect</strong>.
        </li>
        <li>
          מבטלים את האסימון גם ב-GitHub, בכתובת{' '}
          <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">
            github.com/settings/tokens
          </a>
          , כדי שיפסיק לעבוד בכל מקום.
        </li>
      </ol>
      <div className="callout tip">
        <strong>כדאי לבחור תוקף קצר.</strong> בעת יצירת האסימון בוחרים את משך חייו. אסימון שפג מעצמו מצמצם את הנזק אם
        יזלוג. כשהוא פג, יוצרים חדש ומתחברים מחדש.
      </div>
      <p>
        מחיקת חשבון ה-WindoM מוחקת גם את האסימון השמור. ראו <Link to="/he/guide/account">יצירת חשבון WindoM</Link>.
      </p>
      <h2>שאלות נפוצות</h2>
      <h3>אפשר להשתמש ב-fine-grained token?</h3>
      <p>
        ההגדרה המתועדת היא classic token עם <code>notifications</code> ו-<code>repo</code>. סוגי אסימונים אחרים אינם
        מכוסים כאן.
      </p>
      <h3>האם WindoM שומר את האסימון בדפדפן?</h3>
      <p>האסימון נשלח לשרת של WindoM ונשמר שם מוצפן. מכיוון ש-GitHub נקרא מהשרת, נדרש חשבון.</p>
      <h3>אפשר להפעיל את זה בלי לסמוך על השרת המתארח?</h3>
      <p>
        כן. WindoM הוא קוד פתוח ואפשר להריץ backend משלך; ראו <Link to="/he/local-setup">הרצת שרת משלך</Link>.
      </p>
      <h2>פתרון בעיות</h2>
      <ul>
        <li>
          <strong>האסימון נדחה</strong> - WindoM מתייחס ל-401 או ל-403 מ-GitHub כאל אסימון לא תקין. בודקים שהועתק
          במלואו, שהוא לא פג ולא בוטל, ושתי ההרשאות מסומנות. אם יש ספק, יוצרים אסימון חדש.
        </li>
        <li>
          <strong>המספרים מפגרים קצת</strong> - הספירות נשמרות בזיכרון המטמון של השרת למשך דקה.
        </li>
        <li>
          <strong>התנתקות מיד אחרי ההתחברות</strong> - תוקן בגרסה 1.5.1; בודקים את הגרסה ב-
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
          <Link to="/he/guide/calendar">חיבור Google Calendar</Link>
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
      </ul>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
