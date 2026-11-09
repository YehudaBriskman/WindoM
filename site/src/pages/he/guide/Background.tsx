import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: רקעים מובנים, תמונות משלכם או צילומי Unsplash כרקע הלשונית החדשה ב-WindoM..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Background() {
  return (
    <DocsLayout path="/he/guide/background" eyebrow="מדריך למשתמש" title="שינוי הרקע" dir="rtl">
      <p>
        WindoM מגיע עם סט תמונות מובנות ולא צריך ממך כלום. אפשר לעבור לתמונות משלך, או לתמונות מ-Unsplash. הבחירה נמצאת
        ב-Settings → <strong>Background</strong> → <strong>Background Source</strong>.
      </p>
      <h2>אפשרות א - תמונות מובנות ותמונות משלך</h2>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            פותחים את Settings → הלשונית <strong>Background</strong> ובוחרים במקור <strong>Local Image</strong>. זו
            ברירת המחדל.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            בוחרים אחת מהתמונות תחת <strong>Built-in</strong>, או לוחצים על כפתור ההעלאה ובוחרים תמונה מהמכשיר. תמונות
            שמעלים נשמרות מקומית - הן לא נשלחות לשום מקום - והאחרונות שבהן נשארות ברשימה תחת{' '}
            <strong>Local Photos</strong> כדי שאפשר יהיה לחזור אליהן.
          </p>
        </div>
      </div>
      <h2>אפשרות ב - תמונות Unsplash</h2>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            פותחים את Settings → הלשונית <strong>Background</strong> ובוחרים במקור <strong>Unsplash</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Unsplash דורש מפתח גישה משלך, והוא חינמי. נכנסים אל{' '}
            <a href="https://unsplash.com/developers" target="_blank" rel="noreferrer">
              unsplash.com/developers
            </a>
            , יוצרים אפליקציה, מעתיקים את ה-<strong>Access Key</strong> שלה ומדביקים אותו בשדה{' '}
            <strong>Unsplash Access Key</strong>. בלי מפתח מוצג מעבר צבעים במקום תמונה.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            אפשר גם להדביק <strong>Collection ID</strong> מ-Unsplash כדי לבחור את סגנון התמונות. אם משאירים אותו ריק,
            מקבלים תמונות טבע אקראיות. לאיתור מזהה אוסף: נכנסים אל{' '}
            <a href="https://unsplash.com/collections" target="_blank" rel="noreferrer">
              unsplash.com/collections
            </a>
            , פותחים אוסף כלשהו, ומעתיקים את המספר מה-URL - למשל{' '}
            <code>
              unsplash.com/collections/<strong>4324303</strong>/...
            </code>
          </p>
        </div>
      </div>
      <h2>איך זה עובד</h2>
      <p>
        התמונה נמצאת מאחורי כל מה שבלשונית החדשה, מתחת לשכבת האפלה קלה שעוזרת לשעון ולווידג'טים להישאר קריאים. איזו
        תמונה תופיע תלוי ב-<strong>Background Source</strong>:
      </p>
      <ul>
        <li>
          <strong>Local Image</strong> מציג את התמונה שבחרת או העלית לאחרונה. אם עוד לא בחרת, מוצגת התמונה המובנית
          הראשונה.
        </li>
        <li>
          <strong>Unsplash</strong> מבקש מ-Unsplash תמונת נוף אקראית אחת באמצעות מפתח הגישה שלך, ושומר אותה ל-24 שעות.
          הלשונית החדשה הראשונה אחרי שהזמן עבר מביאה תמונה חדשה. אם הגדרת אוסף, התמונות מגיעות ממנו; אחרת החיפוש הוא על
          טבע.
        </li>
      </ul>
      <p>אם אי אפשר לטעון תמונה, WindoM חוזר למעבר צבעים מובנה, כך שהדף אף פעם לא נשאר ריק.</p>

      <h2>כל ההגדרות בפירוט</h2>
      <ul>
        <li>
          <strong>Background Source</strong> - <strong>Local Image</strong> (ברירת מחדל) או <strong>Unsplash</strong>.
        </li>
        <li>
          <strong>Unsplash Access Key</strong> - ריק כברירת מחדל. נדרש למקור Unsplash. בלי מפתח מוצג מעבר צבעים,
          ובהגדרות מופיעה הודעה.
        </li>
        <li>
          <strong>Unsplash Collection ID (optional)</strong> - ריק כברירת מחדל. מגביל את התמונות מ-Unsplash לאוסף אחד.
        </li>
        <li>
          <strong>Upload local background</strong> - כפתור ההעלאה במקור Local Image. מקבל קובצי תמונה של עד 5MB.
        </li>
        <li>
          <strong>Built-in</strong> - התמונות שמגיעות עם התוסף.
        </li>
        <li>
          <strong>Local Photos</strong> - ההעלאות האחרונות שלך. הרשימה מכילה עד 5; העלאה שישית מסירה את הוותיקה ביותר.
          לכל העלאה יש לב לסימון ככזו שאהבת וכפתור מחיקה.
        </li>
        <li>
          <strong>Unsplash Photos</strong> - במקור Unsplash, הרשימה <strong>Recent</strong> מציגה תמונות ש-WindoM הביא
          עבורך (עד 50, החדשות קודם) ו-<strong>Liked</strong> מציגה את אלה שסימנת בלב. לוחצים על תמונה כדי להפוך אותה
          לרקע הנוכחי.
        </li>
      </ul>

      <h2>קרדיט לצלם וסימון תמונות</h2>
      <p>
        כשתמונה מ-Unsplash מוצגת, מופיעה שורת קרדיט עם שם הצלם וקישור לפרופיל שלו ב-Unsplash ול-Unsplash עצמו. הלב לידה
        מסמן את התמונה כך שתישמר תחת <strong>Liked</strong> בהגדרות. תמונות מובנות ותמונות שהעלית לא מציגות שורת קרדיט.
      </p>

      <h2>איפה הנתונים נשמרים ומה יוצא מהמכשיר</h2>
      <ul>
        <li>
          <strong>תמונות שהעלית</strong> נשמרות באחסון המקומי של התוסף ב-Chrome במכשיר הזה. הן לא מועלות ל-WindoM ולא
          לשום מקום אחר. לכל תמונה נשמרת תמונה ממוזערת קטנה עבור הרשימה.
        </li>
        <li>
          <strong>תמונות Unsplash</strong> הן הדבר היחיד שיוצא מהמכשיר. WindoM שולח בקשה אל{' '}
          <code>api.unsplash.com</code> עם מפתח הגישה שלך, ואז הדפדפן טוען את התמונה בעצמו. זה קורה רק כשמקור Unsplash
          נבחר.
        </li>
        <li>
          <strong>לפי חשבון.</strong> כשאתה מחובר, תמונת הרקע שהעלית נשמרת תחת החשבון שלך במכשיר הזה, ולכן חשבונות שונים
          באותו דפדפן לא רואים את הרקע זה של זה. רקע שהגדרת לפני ההתחברות מועתק לחשבון שלך בהתחברות הראשונה.
        </li>
      </ul>
      <p>
        ב<Link to="/he/privacy">מדיניות הפרטיות</Link> מפורטים כל השירותים שהתוסף פונה אליהם.
      </p>

      <h2>טיפים והגדרות מומלצות</h2>
      <ul>
        <li>
          אם נשארים עם השעון הלבן של ברירת המחדל, כדאי תמונה כהה או בעלת ניגודיות נמוכה; תמונות בהירות מקשות על קריאת
          טקסט בהיר.
        </li>
        <li>
          כדי לשמור על מראה קבוע, נשארים ב-<strong>Local Image</strong> ומעלים תמונה שאוהבים. היא נשארת עד שבוחרים אחרת.
        </li>
        <li>
          כדי לקבל סגנון עקבי מ-Unsplash, מגדירים <strong>Collection ID</strong>. כדאי לסמן בלב תמונות שרוצים למצוא שוב,
          כי הרשימה <strong>Recent</strong> מוגבלת ל-50.
        </li>
        <li>קל יותר לעבוד עם תמונות גדולות אחרי הקטנה לגודל המסך בערך, כי העלאות מעל 5MB נדחות.</li>
      </ul>

      <h2>שאלות נפוצות</h2>
      <h3>האם צריך חשבון Unsplash?</h3>
      <p>
        צריך אפליקציית מפתחים ב-Unsplash כדי לקבל Access Key, כמתואר למעלה. התמונות המובנות והתמונות שלך לא דורשות כלום.
      </p>
      <h3>האם תמונת Unsplash מתחלפת בכל לשונית חדשה?</h3>
      <p>
        לא. התמונה הנוכחית נשמרת ל-24 שעות. בחירה בתמונה מתוך <strong>Recent</strong> או <strong>Liked</strong> הופכת
        אותה לנוכחית.
      </p>
      <h3>אילו סוגי תמונות אפשר להעלות?</h3>
      <p>
        כל קובץ שהדפדפן מזהה כתמונה, עד 5MB. כל דבר אחר יציג את ההודעה <em>Please select a valid image file</em>.
      </p>

      <h2>פתרון בעיות</h2>
      <ul>
        <li>
          <strong>מעבר צבעים במקום תמונה.</strong> במקור Unsplash זה אומר שאין מפתח או שהבקשה נכשלה. פותחים Settings →
          Background וקוראים את ההודעה שמעל שדה המפתח.
        </li>
        <li>
          <strong>Invalid API key - check your Unsplash Access Key.</strong> Unsplash דחה את המפתח. בודקים שהעתקת את ה-
          <strong>Access Key</strong> מהאפליקציה שלך בצורה מלאה.
        </li>
        <li>
          <strong>Unsplash rate limit reached. Try again later.</strong> Unsplash מגביל את מספר הבקשות של מפתח. ממתינים,
          או עוברים בינתיים ל-<strong>Local Image</strong>.
        </li>
        <li>
          <strong>Image too large. Maximum size is 5MB.</strong> מקטינים או דוחסים את התמונה ומעלים שוב.
        </li>
        <li>
          עדיין תקוע? אפשר לפנות ל<Link to="/he/support">תמיכה</Link>.
        </li>
      </ul>

      <h2>עמודים קשורים</h2>
      <ul>
        <li>
          <Link to="/he/guide/clock">שעון, תאריך וברכה</Link> - התאמת צבע השעון לתמונה
        </li>
        <li>
          <Link to="/he/guide/templates">תבניות פריסה</Link> - סידורים מוכנים של הווידג'טים מעל הרקע
        </li>
        <li>
          <Link to="/he/guide/account">יצירת חשבון WindoM</Link> - מה מוסיפה ההתחברות
        </li>
      </ul>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
