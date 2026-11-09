import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: קיצור אחד בכל עמוד לחיפוש בלשוניות הפתוחות, בהיסטוריה וברשת עם Google, ‏Bing, ‏DuckDuckGo או Brave..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Search() {
  return (
    <DocsLayout path="/he/guide/search" eyebrow="מדריך למשתמש" title="חיפוש" dir="rtl">
      <h2>סקירה</h2>

      <p>
        לחיצה על{' '}
        <bdi>
          <kbd>Ctrl</kbd> + <kbd>Win</kbd> + <kbd>H</kbd>
        </bdi>{' '}
        - או{' '}
        <bdi>
          <kbd>Ctrl</kbd> + <kbd>Cmd</kbd> + <kbd>H</kbd>
        </bdi>{' '}
        ב-Mac - פותחת תיבת חיפוש מעל הדף שבו נמצאים. היא עובדת בלשונית החדשה ובאתרים רגילים; תוספים לא יכולים לפעול
        בדפים של Chrome עצמו, ולכן שם היא לא נפתחת. אותם מקשים סוגרים אותה, וגם <strong>Escape</strong>.
      </p>
      <ul>
        <li>
          <strong>מקלידים כל דבר</strong> - ההצעות מגיעות מהלשוניות הפתוחות, אחר כך מההיסטוריה (בלשונית החדשה, אחרי
          שמפעילים את <Link to="/he/guide/history">היסטוריית הגלישה</Link>), ואחר כך מהאינטרנט. בחירה בלשונית עוברת אליה
          במקום לפתוח אותה שוב.
        </li>
        <li>
          <strong>מקלידים כתובת</strong> - כמו <code>github.com</code>, ו-<strong>Enter</strong> עובר אליה ישירות.
        </li>
        <li>
          <strong>בוחרים מנוע חיפוש</strong> - הכפתור שליד התיבה עובר בין Google, Bing, DuckDuckGo ו-Brave. ברירת המחדל
          היא Google.
        </li>
        <li>
          <strong>
            מתחילים ב-<code>&gt;</code>
          </strong>{' '}
          - לפקודות: New Tab, Close Tab, Reload Page, Duplicate Tab ו-Pin / Unpin Tab. כל טקסט אחר אחרי{' '}
          <code>&gt;</code> נפתח בלשונית חדשה.
        </li>
      </ul>
      <div className="callout">
        <strong>מאיפה מגיעות הצעות האינטרנט</strong> - בלי קשר למנוע החיפוש שנבחר, ההצעות שמתחת לתיבה מגיעות מההשלמה
        האוטומטית של DuckDuckGo, כך שמה שמקלידים נשלח ל-DuckDuckGo תוך כדי הקלדה. הצעות מהלשוניות ומההיסטוריה לא יוצאות
        מהדפדפן.
      </div>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
