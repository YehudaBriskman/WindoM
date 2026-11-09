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
      <h2>איך זה עובד</h2>
      <p>
        תיבת החיפוש היא שכבה ש-WindoM מוסיפה מעל הדף שבו אתם נמצאים. היא תמיד מסודרת משמאל לימין, בלי קשר לכיוון של האתר
        שמתחתיה. היא נפתחת ונסגרת ב-
        <bdi>
          <kbd>Ctrl</kbd> + <kbd>Win</kbd> + <kbd>H</kbd>
        </bdi>{' '}
        (ב-Mac:{' '}
        <bdi>
          <kbd>Ctrl</kbd> + <kbd>Cmd</kbd> + <kbd>H</kbd>
        </bdi>
        ), וגם לחיצה מחוץ לתיבה סוגרת אותה. כשהיא נפתחת, הסמן כבר בתוך השדה.
      </p>
      <p>ההצעות מופיעות רגע אחרי שמפסיקים להקליד, בסדר הבא, עם הגבלה קטנה לכל סוג:</p>
      <ol>
        <li>
          <strong>לשוניות פתוחות</strong> - עד שלוש לשוניות שהכותרת או הכתובת שלהן מכילות את מה שהקלדתם, עם התווית{' '}
          <strong>Switch</strong>. דפים של Chrome עצמו לא נכללים.
        </li>
        <li>
          <strong>היסטוריה</strong> - עד ארבעה דפים, בלי אלה שכבר מוצגים כלשונית פתוחה. זה דורש ש
          <Link to="/he/guide/history">היסטוריית הגלישה</Link> תהיה פעילה ושההרשאה שלה תאושר.
        </li>
        <li>
          <strong>הצעות מהרשת</strong> - עד חמישה ביטויי חיפוש מההשלמה האוטומטית של DuckDuckGo. אם הבקשה נמשכת יותר משתי
          שניות בערך היא נזרקת, ופשוט לא רואים הצעות מהרשת.
        </li>
      </ol>

      <h2>מקשים בתוך תיבת החיפוש</h2>
      <ul>
        <li>
          <kbd>↓</kbd> ו-<kbd>↑</kbd> מנווטים בין ההצעות. מההצעה האחרונה, חץ למטה חוזר לראשונה; מהראשונה, חץ למעלה חוזר
          לשדה.
        </li>
        <li>
          <kbd>Enter</kbd> פותח את ההצעה המסומנת, או, כשאין הצעה מסומנת, את מה שהקלדתם.
        </li>
        <li>
          <kbd>Escape</kbd> סוגר קודם את רשימת ההצעות. לחיצה נוספת סוגרת את התיבה.
        </li>
        <li>
          <kbd>Tab</kbd> משאיר את הסמן בשדה במקום לעבור לפקדים אחרים.
        </li>
      </ul>
      <p>
        כל המקשים בתוסף מופיעים ב<Link to="/he/guide/shortcuts">קיצורי מקלדת</Link>.
      </p>

      <h2>מה Enter עושה</h2>
      <ul>
        <li>
          אם מה שהקלדתם נראה ככתובת, WindoM עוברת אליה. הכוונה לכל מה שמתחיל ב-<code>http://</code> או ב-
          <code>https://</code>, ל-<code>localhost</code> (עם פורט או בלעדיו), או לשם עם נקודה וסיומת דומיין כמו{' '}
          <code>github.com</code>, שנפתח כ-<code>https://</code>.
        </li>
        <li>אחרת היא מחפשת את הטקסט במנוע שמוצג בכפתור.</li>
        <li>הצעת לשונית עוברת אל הלשונית. הצעה מההיסטוריה או מהרשת נטענת בלשונית הנוכחית, במקום הדף שהייתם בו.</li>
        <li>
          במצב פקודות <code>&gt;</code> (בהמשך), התוצאה נפתחת בלשונית חדשה.
        </li>
      </ul>

      <h2>כל ההגדרות</h2>
      <p>
        יש הגדרת חיפוש אחת, <strong>מנוע החיפוש</strong>. משנים אותה מהכפתור שליד התיבה ולא מחלונית ההגדרות, והבחירה
        נשמרת.
      </p>
      <ul>
        <li>
          <strong>Google</strong> - ברירת המחדל.
        </li>
        <li>
          <strong>Bing</strong>
        </li>
        <li>
          <strong>DDG</strong> - DuckDuckGo, בקיצור על הכפתור.
        </li>
        <li>
          <strong>Brave</strong> - Brave Search.
        </li>
      </ul>
      <p>
        המנוע קובע לאן החיפוש הולך בלחיצה על Enter. הוא לא משנה את ההצעות, שתמיד מגיעות מ-DuckDuckGo. הצעות מההיסטוריה
        תלויות גם הן בכך שהיסטוריית הגלישה פעילה.
      </p>

      <h2>מצב פקודות</h2>
      <p>
        הקלדת <code>&gt;</code> בתחילת השדה מעבירה את התיבה למצב פקודות: האייקון והטקסט המנחה משתנים ל-
        <em>Type a command…</em>, וההצעות הרגילות מוחלפות ברשימת הפקודות. מקלידים אחרי ה-<code>&gt;</code> כדי לצמצם את
        הרשימה; כל פקודה עונה לשמה ולכמה קיצורים.
      </p>
      <ul>
        <li>
          <strong>New Tab</strong> - פותחת לשונית ריקה. קיצורים: <code>n</code>, <code>new</code>, <code>tab</code>,{' '}
          <code>open</code>.
        </li>
        <li>
          <strong>Close Tab</strong> - סוגרת את הלשונית הנוכחית. קיצורים: <code>c</code>, <code>x</code>,{' '}
          <code>close</code>, <code>exit</code>, <code>quit</code>.
        </li>
        <li>
          <strong>Reload Page</strong> - טוענת את הדף מחדש. קיצורים: <code>r</code>, <code>reload</code>,{' '}
          <code>refresh</code>.
        </li>
        <li>
          <strong>Duplicate Tab</strong> - פותחת עותק של הלשונית הנוכחית. קיצורים: <code>d</code>, <code>dup</code>,{' '}
          <code>duplicate</code>, <code>clone</code>, <code>copy</code>.
        </li>
        <li>
          <strong>Pin / Unpin Tab</strong> - מצמידה או משחררת את הלשונית הנוכחית. קיצורים: <code>p</code>,{' '}
          <code>pin</code>, <code>unpin</code>.
        </li>
      </ul>
      <p>
        אם הטקסט לא תואם אף פקודה, שורה אחת מציעה לפתוח אותו בלשונית חדשה: ככתובת אם הוא נראה כמו כתובת, ואחרת כחיפוש
        במנוע שבחרתם.
      </p>

      <h2>איפה הנתונים נשמרים ומה יוצא מהמכשיר</h2>
      <ul>
        <li>
          <strong>נשאר בדפדפן</strong> - רשימת הלשוניות הפתוחות, הצעות ההיסטוריה והפקודות. WindoM קוראת כותרות וכתובות
          של לשוניות דרך ההרשאה <code>tabs</code> של Chrome, ואת ההיסטוריה רק אם הפעלתם את היסטוריית הגלישה ואישרתם את
          ההרשאה האופציונלית שלה.
        </li>
        <li>
          <strong>נשלח ל-DuckDuckGo תוך כדי הקלדה</strong> - הטקסט שבתיבה, כדי להביא הצעות מהרשת. זה לא קורה במצב
          פקודות.
        </li>
        <li>
          <strong>נשלח למנוע שבחרתם בלחיצה על Enter</strong> - טקסט החיפוש, כמו בכל חיפוש.
        </li>
        <li>
          <strong>נשמר</strong> - בחירת המנוע, יחד עם שאר ההגדרות.
        </li>
      </ul>
      <p>
        פרטים ב<Link to="/he/privacy">מדיניות הפרטיות</Link>.
      </p>

      <h2>טיפים והגדרות מומלצות</h2>
      <ul>
        <li>
          השתמשו בתיבה כמחליף לשוניות: מקלידים כמה אותיות מכותרת של דף ובוחרים בשורה עם התווית <strong>Switch</strong>,
          במקום לפתוח עותק כפול.
        </li>
        <li>
          פקודות <code>&gt;</code> מאפשרות לנהל לשוניות בלי להרים את הידיים מהמקלדת, למשל <code>&gt;p</code> ואז{' '}
          <kbd>Enter</kbd> כדי להצמיד את הלשונית הנוכחית.
        </li>
        <li>
          השאירו את <Link to="/he/guide/tab-sidebar">סרגל הלשוניות</Link> לעיון בלשוניות עם העכבר, ואת תיבת החיפוש
          למציאת לשונית לפי שם.
        </li>
      </ul>

      <h2>שאלות נפוצות</h2>
      <p>
        <strong>אפשר לשנות את הקיצור?</strong> לא בתוך התוסף; ראו <Link to="/he/guide/shortcuts">קיצורי מקלדת</Link>.
      </p>
      <p>
        <strong>אפשר להוסיף מנוע חיפוש נוסף?</strong> לא. ארבעת המנועים שלמעלה הם היחידים.
      </p>
      <p>
        <strong>למה אין הצעות מהרשת?</strong> הן מגיעות מ-DuckDuckGo, ולכן דורשות חיבור, והן מדולגות במצב פקודות.
      </p>

      <h2>פתרון בעיות</h2>
      <ul>
        <li>
          <strong>לחיצה על הקיצור לא עושה כלום</strong> - ייתכן שאתם בדף של Chrome עצמו, שבו תוספים לא יכולים לפעול.
          בדקו שאתם לוחצים על שלושת המקשים יחד, כש-<kbd>Win</kbd> (או <kbd>Cmd</kbd> ב-Mac) הוא האמצעי.
        </li>
        <li>
          <strong>אין הצעות מההיסטוריה</strong> - מפעילים את <Link to="/he/guide/history">היסטוריית הגלישה</Link>{' '}
          ומאשרים את בקשת ההרשאה.
        </li>
        <li>
          <strong>פקודה לא עשתה כלום</strong> - הפקודות פועלות מהדף שבו פתחתם את התיבה, ולכן Close, Duplicate ו-Pin
          פועלות על הלשונית של אותו דף.
        </li>
      </ul>

      <h2>עמודים קשורים</h2>
      <ul>
        <li>
          <Link to="/he/guide/history">היסטוריית גלישה</Link> - מפעילה הצעות מההיסטוריה
        </li>
        <li>
          <Link to="/he/guide/tab-sidebar">סרגל הלשוניות</Link> - רשימת הלשוניות הפתוחות
        </li>
        <li>
          <Link to="/he/guide/shortcuts">קיצורי מקלדת</Link>
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
