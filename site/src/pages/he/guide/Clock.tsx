import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';
import { GuideShot } from '../../../components/GuideShot';

/**
 * The Hebrew guide page for one feature: הגדרת פורמט השעון, הסגנון, הצבע והגודל, הצגת התאריך ובחירת הברכה בלשונית החדשה של WindoM..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Clock() {
  return (
    <DocsLayout path="/he/guide/clock" eyebrow="מדריך למשתמש" title="שעון, תאריך וברכה" dir="rtl">
      <h2>סקירה</h2>

      <p>
        השעון הוא מרכז הלשונית החדשה. כל האפשרויות שלו נמצאות ב-Settings → <strong>Clock</strong>:
      </p>
      <ul>
        <li>
          <strong>Time Format</strong> - 12 או 24 שעות, עם אפשרות להצגת שניות ואפס מוביל
        </li>
        <li>
          <strong>Style</strong> - ספרות רגילות (default), זכוכית (glass) או קו מתאר (outline)
        </li>
        <li>
          <strong>Color</strong> - כל צבע, בבוחר הצבעים
        </li>
        <li>
          <strong>Size</strong> - מחוון בין 60 ל-180 פיקסלים
        </li>
        <li>
          <strong>Font Weight</strong> - Thin, Light, Regular או Bold
        </li>
        <li>
          <strong>Show Date</strong> - התאריך מתחת לשעה, בפורמט ארוך, קצר או מספרי
        </li>
      </ul>
      <p>
        מתחת לשעון מופיעה ברכה שמשתנה לפי שעות היום - בוקר, צהריים, ערב או לילה - ואחריה השם שלך. לוחצים על השם כדי
        לשנות אותו, <strong>Enter</strong> שומר את השינוי ו-<strong>Escape</strong> מבטל אותו. בהתחלה כתוב שם{' '}
        <em>Friend</em>; אם מתחברים לחשבון שיש בו שם בזמן שעדיין כתוב Friend, השם הפרטי מחליף אותו. כדי להסתיר את הברכה,
        מכבים את <strong>Greeting</strong> תחת Settings → General → <strong>Widget Visibility</strong>.
      </p>
      <GuideShot
        shot="settings"
        alt="חלונית ההגדרות של WindoM פתוחה בלשונית השעון, לצד שעון גדול בפורמט 24 שעות עם התאריך והברכה"
        caption="הגדרות ← שעון, לצד השעון שהן שולטות בו."
      />

      <h2>איך זה עובד</h2>
      <p>
        השעון קורא את השעה של המכשיר שלך ומתרענן בטיימר, כך שהוא לא צריך רשת ולא חשבון. הברכה נבחרת לפי השעה במכשיר:{' '}
        <strong>Good morning</strong> בין 5:00 ל-11:59, <strong>Good afternoon</strong> בין 12:00 ל-16:59,{' '}
        <strong>Good evening</strong> בין 17:00 ל-20:59, ו-<strong>Good night</strong> מ-21:00 ועד 4:59. התאריך נכתב לפי
        השפה והפורמט האזורי של הדפדפן, ולכן סדר היום והחודש תלוי בהגדרות שלך.
      </p>

      <h2>כל ההגדרות בפירוט</h2>
      <p>
        הלשונית Clock מחולקת לשלוש קבוצות: Format, Appearance ו-Date. ברירות המחדל הן מה שמקבלים בהתקנה חדשה או אחרי
        איפוס ההגדרות.
      </p>
      <h3>Format</h3>
      <ul>
        <li>
          <strong>Time Format</strong> - 12 שעות (ברירת מחדל) או 24 שעות. במצב 12 שעות מופיע ליד השעה הסימון AM או PM.
          במצב 24 שעות השעה תמיד מוצגת בשתי ספרות, למשל <code>07:30</code>.
        </li>
        <li>
          <strong>Show Seconds</strong> - כבוי כברירת מחדל. מוסיף <code>:SS</code> לשעה.
        </li>
        <li>
          <strong>Leading Zero (09:05)</strong> - כבוי כברירת מחדל. מציג <code>09:05</code> במקום <code>9:05</code>.
          האפשרות מופיעה רק במצב 12 שעות, כי בפורמט 24 שעות השעה כבר מרופדת באפס.
        </li>
      </ul>
      <h3>Appearance</h3>
      <ul>
        <li>
          <strong>Style</strong> - <em>default</em> מציג ספרות מלאות עם צל עדין, <em>glass</em> מציג אפקט זכוכית שקופה
          בגוון הצבע שבחרת, ו-<em>outline</em> מציג רק את קו המתאר של הספרות בצבע שבחרת.
        </li>
        <li>
          <strong>Color</strong> - לבן (<code>#ffffff</code>) כברירת מחדל. הוא קובע את צבע הספרות, את גוון הזכוכית או את
          צבע קו המתאר, לפי הסגנון.
        </li>
        <li>
          <strong>Size</strong> - 120 פיקסלים כברירת מחדל, בטווח של 60 עד 180 בקפיצות של 4.
        </li>
        <li>
          <strong>Font Weight</strong> - Thin, Light (ברירת מחדל), Regular או Bold.
        </li>
      </ul>
      <h3>Date</h3>
      <ul>
        <li>
          <strong>Show Date</strong> - כבוי כברירת מחדל. כשהוא פעיל, התאריך מופיע מתחת לשעה.
        </li>
        <li>
          <strong>Date Format</strong> - Long (למשל <em>Monday, March 17</em>, ברירת המחדל), Short (<em>Mon, Mar 17</em>
          ) או Numeric (<em>03/17/2026</em>). הניסוח המדויק נקבע לפי השפה והאזור של הדפדפן.
        </li>
      </ul>
      <p>
        השם שמופיע בברכה נשמר תחת Settings → General → <strong>Your Name</strong>, ואפשר גם לערוך אותו ישירות בלשונית
        החדשה, כפי שתואר למעלה.
      </p>

      <h2>איפה הנתונים נשמרים</h2>
      <p>
        הגדרות השעון נשמרות באחסון התוספים של Chrome בדפדפן שלך. שום דבר מהשעון לא נשלח החוצה, אלא אם יש לך חשבון WindoM
        עם סנכרון הגדרות - ואז ההגדרות, כולל מקטע השעון, עוברות לדפדפנים אחרים שאתה מתחבר אליהם. בלי חשבון הן נשארות
        בדפדפן. ברשימה המלאה של השירותים שהתוסף פונה אליהם אפשר לעיין ב<Link to="/he/privacy">מדיניות הפרטיות</Link>.
      </p>

      <h2>טיפים והגדרות מומלצות</h2>
      <ul>
        <li>
          על תמונה בהירה כדאי לנסות <strong>Color</strong> כהה יותר או <strong>Font Weight</strong> עבה יותר, כדי
          שהספרות יישארו קריאות. על תמונה כהה, הלבן של ברירת המחדל עובד היטב.
        </li>
        <li>
          כדאי לנסות את הסגנון <strong>outline</strong> במשקל דק ובצבע הדגשה אחד; התבנית Night Owl עושה בדיוק את זה,
          והתבנית Inspiration משלבת את הסגנון <strong>glass</strong> עם משקל דק.
        </li>
        <li>
          לתצוגה השקטה ביותר: פורמט 24 שעות עם <strong>Show Seconds</strong> כבוי.
        </li>
        <li>
          אם רוצים רק את השעון על המסך, מסתירים את שאר הווידג'טים תחת Settings → General → Widget Visibility, או מחילים
          סידור מוכן מתוך <Link to="/he/guide/templates">תבניות פריסה</Link>. תבניות יכולות לקבוע את הסגנון, המשקל
          והגודל של השעון ואת אפשרויות התאריך.
        </li>
      </ul>

      <h2>שאלות נפוצות</h2>
      <h3>למה הברכה אומרת Friend?</h3>
      <p>
        <em>Friend</em> הוא שם ברירת המחדל. לוחצים עליו ומקלידים שם משלך, או מתחברים לחשבון שיש בו שם בזמן שעדיין כתוב
        Friend, והשם הפרטי מחליף אותו.
      </p>
      <h3>האם השעון משתמש באזור הזמן של המחשב?</h3>
      <p>כן. הוא מציג את השעה המקומית של המכשיר, ולכן הוא עוקב אחרי כל שינוי שעושים במערכת ההפעלה.</p>

      <h2>פתרון בעיות</h2>
      <ul>
        <li>
          <strong>קשה לראות את הספרות.</strong> משנים את <strong>Color</strong>, מעבים את <strong>Font Weight</strong>,
          או מחזירים את <strong>Style</strong> ל-default, שמוסיף צל מאחורי הספרות.
        </li>
        <li>
          <strong>האפשרות Leading Zero חסרה.</strong> היא מוצגת רק כש-Time Format הוא 12 שעות.
        </li>
        <li>
          <strong>הברכה נעלמה.</strong> בודקים ש-<strong>Greeting</strong> פעיל תחת Settings → General → Widget
          Visibility.
        </li>
        <li>
          <strong>שום דבר לא עוזר.</strong> אפשר לפנות ל<Link to="/he/support">תמיכה</Link>.
        </li>
      </ul>

      <h2>עמודים קשורים</h2>
      <ul>
        <li>
          <Link to="/he/guide/templates">תבניות פריסה</Link> - סידורים מוכנים הכוללים סגנונות שעון
        </li>
        <li>
          <Link to="/he/guide/background">שינוי הרקע</Link> - בחירת התמונה שמאחורי השעון
        </li>
        <li>
          <Link to="/he/guide/focus">טיימר מיקוד</Link> - קביעת כוונה והעמעום של הלשונית
        </li>
      </ul>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
