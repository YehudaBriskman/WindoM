import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

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
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
