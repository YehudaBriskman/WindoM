import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: סידורים מוכנים ללשונית החדשה של WindoM, כמו מינימלי, פוקוס עמוק ולוח מחוונים, ואיך עוברים ביניהם..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Templates() {
  return (
    <DocsLayout path="/he/guide/templates" eyebrow="מדריך למשתמש" title="תבניות פריסה" dir="rtl">
      <h2>סקירה</h2>

      <p>
        ב-Settings → <strong>Templates</strong> יש שש פריסות מוכנות שמשנות כמה הגדרות בבת אחת: <strong>Minimal</strong>{' '}
        (רק השעון), <strong>Productivity</strong>, <strong>Inspiration</strong>, <strong>Dashboard</strong> (הכל פעיל),{' '}
        <strong>Night Owl</strong> ו-<strong>Deep Focus</strong>.
      </p>
      <p>
        לוחצים על <strong>Apply</strong> באחת מהן ומאשרים. תבנית דורסת רק את החלקים שהיא מכסה, וחלון האישור מפרט אותם;
        הקישורים, המפתחות והחיבורים שלך נשארים כמו שהם.
      </p>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
