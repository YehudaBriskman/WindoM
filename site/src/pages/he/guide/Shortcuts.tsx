import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for the keyboard: every key the extension responds to.
 *
 * Mirrors the English page of the same name. The manifest declares no Chrome
 * `commands`, so there is one global shortcut and the rest are keys that work
 * inside a particular panel.
 */
export function Shortcuts() {
  return (
    <DocsLayout path="/he/guide/shortcuts" eyebrow="מדריך למשתמש" title="קיצורי מקלדת" dir="rtl">
      <h2>סקירה</h2>

      <p>ב-WindoM יש קיצור אחד שעובד בכל מקום, וקבוצה קטנה של מקשים שעובדים בתוך פאנל מסוים. העמוד הזה מונה את כולם.</p>

      <h2>הקיצור הכללי</h2>
      <table>
        <thead>
          <tr>
            <th>מקשים</th>
            <th>מה זה עושה</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <bdi>
                <kbd>Ctrl</kbd> + <kbd>Win</kbd> + <kbd>H</kbd>
              </bdi>
              <br />
              ב-Mac:{' '}
              <bdi>
                <kbd>Ctrl</kbd> + <kbd>Cmd</kbd> + <kbd>H</kbd>
              </bdi>
            </td>
            <td>
              פותח את תיבת ה<Link to="/he/guide/search">חיפוש</Link> מעל הדף הנוכחי. לחיצה נוספת סוגרת אותה. הקיצור עובד
              בלשונית החדשה ובאתרים רגילים, אבל לא בדפים של Chrome עצמו, שבהם תוספים לא יכולים לפעול.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>מקשים בתוך פאנל</h2>
      <table>
        <thead>
          <tr>
            <th>איפה</th>
            <th>מקש</th>
            <th>מה זה עושה</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              תיבת ה<Link to="/he/guide/search">חיפוש</Link>
            </td>
            <td>
              <bdi>
                <kbd>↓</kbd> / <kbd>↑</kbd>
              </bdi>
            </td>
            <td>מעבר בין ההצעות או הפקודות.</td>
          </tr>
          <tr>
            <td>תיבת החיפוש</td>
            <td>
              <kbd>Enter</kbd>
            </td>
            <td>פותח את ההצעה המסומנת, או מריץ את מה שהקלדתם.</td>
          </tr>
          <tr>
            <td>תיבת החיפוש</td>
            <td>
              <kbd>Escape</kbd>
            </td>
            <td>סוגר את רשימת ההצעות; לחיצה נוספת סוגרת את התיבה.</td>
          </tr>
          <tr>
            <td>תיבת החיפוש</td>
            <td>
              <kbd>Tab</kbd>
            </td>
            <td>משאיר את הסמן בשדה.</td>
          </tr>
          <tr>
            <td>
              שדה <Link to="/he/guide/focus">מצב פוקוס</Link>
            </td>
            <td>
              <kbd>Enter</kbd>
            </td>
            <td>שומר את המיקוד הראשי.</td>
          </tr>
          <tr>
            <td>הספירה לאחור של מצב פוקוס</td>
            <td>
              <kbd>Escape</kbd>
            </td>
            <td>עוצר את הספירה ומחזיר את הדף.</td>
          </tr>
          <tr>
            <td>
              השם ב<Link to="/he/guide/clock">ברכה</Link>
            </td>
            <td>
              <kbd>Enter</kbd>
            </td>
            <td>שומר את השם שערכתם.</td>
          </tr>
          <tr>
            <td>השם בברכה</td>
            <td>
              <kbd>Escape</kbd>
            </td>
            <td>מבטל את העריכה ומחזיר את השם השמור.</td>
          </tr>
          <tr>
            <td>
              הפאנל הצדדי (<Link to="/he/guide/todos">משימות</Link>, יומן, היסטוריה)
            </td>
            <td>
              <kbd>Escape</kbd>
            </td>
            <td>סוגר את הפאנל.</td>
          </tr>
          <tr>
            <td>שדה המשימות בפאנל הצדדי</td>
            <td>
              <kbd>Enter</kbd>
            </td>
            <td>מוסיף את המשימה.</td>
          </tr>
          <tr>
            <td>חלונית ההגדרות</td>
            <td>
              <kbd>Escape</kbd>
            </td>
            <td>סוגר את החלונית. אם תצוגת פרטים של אפליקציה פתוחה מעליה, הלחיצה הראשונה סוגרת אותה במקום.</td>
          </tr>
        </tbody>
      </table>
      <p>
        לפרטים על כל תכונה, ראו <Link to="/he/guide/search">חיפוש</Link> ו<Link to="/he/guide/focus">מצב פוקוס</Link>.
      </p>

      <h2>אפשר לשנות את הקיצורים?</h2>
      <p>
        לא. WindoM לא רושמת שום פקודה ב-Chrome, ולכן היא לא מופיעה בעמוד <code>chrome://extensions/shortcuts</code> ואין
        שם מה לשייך מחדש. קיצור החיפוש מובנה בתוסף, ואין הגדרה לשנות אותו.
      </p>
      <div className="callout tip">
        <strong>מעדיפים עכבר?</strong> תיבת החיפוש נסגרת גם בלחיצה מחוצה לה, למצב פוקוס יש כפתור{' '}
        <strong>Stop Focus</strong>, והפאנל הצדדי נסגר בלחיצה מחוצה לו.
      </div>

      <h2>פתרון בעיות</h2>
      <ul>
        <li>
          <strong>קיצור החיפוש לא עושה כלום</strong> - ייתכן שאתם בדף של Chrome, כמו דף ההגדרות או דף התוספים, שבו
          תוספים לא יכולים לפעול. נסו באתר רגיל או בלשונית החדשה.
        </li>
        <li>
          <strong>Escape סגר יותר ממה שציפיתי</strong> - כל פאנל מאזין ל-Escape בעצמו. לחצו שוב אם עדיין פתוח פאנל נוסף.
        </li>
      </ul>

      <h2>עמודים קשורים</h2>
      <ul>
        <li>
          <Link to="/he/guide/search">חיפוש</Link> - הצעות, מנועים ופקודות <code>&gt;</code>
        </li>
        <li>
          <Link to="/he/guide/focus">מצב פוקוס</Link> - הספירה לאחור ושדה המיקוד
        </li>
        <li>
          <Link to="/he/guide/tab-sidebar">סרגל הלשוניות</Link> - פאנל הלשוניות הפתוחות, שמופעל בעכבר
        </li>
        <li>
          <Link to="/he/support">תמיכה</Link>
        </li>
      </ul>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
