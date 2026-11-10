import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';
import { GuideShot } from '../../../components/GuideShot';

/**
 * The Hebrew guide page for one feature: ראו ועברו ללשוניות הפתוחות מסרגל הצד של WindoM, מכל עמוד..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function TabSidebar() {
  return (
    <DocsLayout path="/he/guide/tab-sidebar" eyebrow="מדריך למשתמש" title="סרגל הלשוניות" dir="rtl">
      <h2>סקירה</h2>

      <p>
        כשמקרבים את הסמן לקצה הימני של הלשונית החדשה, נפתח פאנל עם כל הלשוניות הפתוחות, בכל החלונות. לחיצה על לשונית
        עוברת אליה, ו-<strong>New Tab</strong> בראש הפאנל פותח לשונית חדשה. הדפים של Chrome עצמו לא מופיעים ברשימה.
      </p>
      <p>
        כדי להשתמש בקצה השמאלי במקום, פותחים את Settings → <strong>General</strong> → <strong>Tab Sidebar</strong>{' '}
        ובוחרים <strong>Left</strong>.
      </p>
      <GuideShot
        shot="sidebar"
        alt="לשונית חדשה והסרגל הצדדי פתוח מימין: משימות להיום, לוח שנה ואירועים קרובים על רקע זריחה"
        caption="הסרגל הצדדי פתוח בקצה הימני של לשונית חדשה."
      />

      <h2>איך זה עובד</h2>
      <p>
        פס ברוחב של כ-15 פיקסלים עובר לאורך הקצה שבחרתם בלשונית החדשה. כשהסמן נכנס אליו, הפאנל נפתח; כשהסמן יוצא, הפאנל
        ממתין כשלישית השנייה ונסגר. כל עוד הפאנל מוסתר, סימן דק בקצה מראה לאן להצביע.
      </p>
      <ul>
        <li>
          <strong>כל החלונות</strong> - הרשימה כוללת את הלשוניות של כל חלונות Chrome הפתוחים, לא רק של החלון שבו אתם
          נמצאים.
        </li>
        <li>
          <strong>הלשונית הנוכחית מודגשת</strong>, ובכל שורה מופיעים הסמל של הדף (או תחליף פשוט אם אין לו) והכותרת שלו.
          מעבירים עכבר על שורה כדי לראות את הכותרת המלאה.
        </li>
        <li>
          <strong>מעבר ללשונית</strong> - לחיצה על שורה, ו-Chrome מפעיל את הלשונית ומקדים את החלון שלה. אחר כך הפאנל
          נסגר.
        </li>
        <li>
          <strong>New Tab</strong> - פותח לשונית ריקה וסוגר את הפאנל.
        </li>
        <li>
          <strong>תמיד מעודכן</strong> - הרשימה מתעדכנת כשלשוניות נפתחות, נסגרות, מוחלפות או משנות כותרת, ולכן אין צורך
          לרענן אותה.
        </li>
        <li>
          <strong>מה לא מופיע</strong> - דפים של Chrome עצמו (<code>chrome://</code>) ודפי תוספים (
          <code>chrome-extension://</code>) לא ברשימה.
        </li>
      </ul>

      <h2>כל ההגדרות</h2>
      <p>
        יש הגדרה אחת: <strong>Tab Sidebar</strong> תחת Settings → General, עם שתי אפשרויות.
      </p>
      <ul>
        <li>
          <strong>Right</strong> - ברירת המחדל. הפאנל נפתח מהקצה הימני.
        </li>
        <li>
          <strong>Left</strong> - הפאנל נפתח מהקצה השמאלי במקום.
        </li>
      </ul>
      <p>
        חלונית ההגדרות מנסחת את אותו רמז בקצרה: מצביעים עד 15px מהקצה שנבחר כדי לחשוף את הלשוניות. הבחירה נשמרת יחד עם
        שאר ההגדרות.
      </p>

      <h2>איפה הנתונים נשמרים ומה יוצא מהמכשיר</h2>
      <p>
        רשימת הלשוניות נקראת מ-Chrome דרך ההרשאה <code>tabs</code> של התוסף ומוצגת בדף; היא לא נשלחת לשום מקום. הדבר
        היחיד שנשמר הוא הצד שבחרתם. כותרות וכתובות של הלשוניות שלכם אינן חלק מהגדרות WindoM.
      </p>
      <p>
        מה התוסף שומר ולאילו שירותים הוא פונה, ראו <Link to="/he/privacy">מדיניות הפרטיות</Link>.
      </p>

      <h2>טיפים והגדרות מומלצות</h2>
      <ul>
        <li>בחרו את הקצה הרחוק מפס הגלילה או מפקדי החלון, כדי שהסמן לא יפעיל את הפאנל בטעות.</li>
        <li>
          סרגל הלשוניות מיועד לעיון בלשוניות בעין. כדי למצוא אחת לפי שם, השתמשו ב
          <Link to="/he/guide/search">חיפוש</Link>, שמציג קודם לשוניות פתוחות תואמות.
        </li>
        <li>
          אל תתבלבלו בינו לבין הפאנל האחר בלשונית החדשה, זה שנפתח בכפתור האייקון, ושמכיל את{' '}
          <Link to="/he/guide/todos">המשימות</Link>, את היומן ואת <Link to="/he/guide/history">היסטוריית הגלישה</Link>.
          הפאנל ההוא נסגר ב-<kbd>Escape</kbd> או בלחיצה מחוצה לו; סרגל הלשוניות נסגר כשהסמן יוצא ממנו.
        </li>
      </ul>

      <h2>שאלות נפוצות</h2>
      <p>
        <strong>זה עובד באתרים אחרים?</strong> לא. זה חלק מדף הלשונית החדשה. החיפוש הוא התכונה שנפתחת גם מעל אתרים
        רגילים.
      </p>
      <p>
        <strong>אפשר לכבות את זה?</strong> אין מתג הפעלה וכיבוי. בוחרים את הצד, וזה מופיע רק כשמצביעים על הקצה הזה.
      </p>
      <p>
        <strong>אפשר לסגור לשוניות מהסרגל?</strong> לא מהסרגל. הוא עובר ללשוניות ופותח חדשה.
      </p>
      <p>
        <strong>אפשר לסדר מחדש או לקבץ לשוניות?</strong> לא. הסרגל מציג לשוניות ועובר אליהן.
      </p>

      <h2>פתרון בעיות</h2>
      <ul>
        <li>
          <strong>הפאנל לא נפתח</strong> - מקרבים את הסמן עד הסוף לקצה המסך שבחרתם ב-Settings → General → Tab Sidebar;
          פס ההפעלה צר, 15 פיקסלים בלבד.
        </li>
        <li>
          <strong>לשונית חסרה</strong> - דפים של Chrome עצמו ודפי תוספים מושמטים במכוון.
        </li>
        <li>
          <strong>הפאנל בצד הלא נכון</strong> - בוחרים <strong>Left</strong> או <strong>Right</strong> ב-Settings →
          General → Tab Sidebar.
        </li>
      </ul>

      <h2>עמודים קשורים</h2>
      <ul>
        <li>
          <Link to="/he/guide/search">חיפוש</Link> - למצוא לשונית לפי שם ולעבור אליה
        </li>
        <li>
          <Link to="/he/guide/history">היסטוריית גלישה</Link> - דפים שביקרתם בהם לאחרונה
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
