import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: ציטוט אחד ביום בלשונית החדשה של WindoM, ואיך מקבלים אחר..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Quotes() {
  return (
    <DocsLayout path="/he/guide/quotes" eyebrow="מדריך למשתמש" title="ציטוט יומי" dir="rtl">
      <h2>סקירה</h2>

      <p>בתחתית הלשונית החדשה מופיע ציטוט שמתחלף פעם ביום. לחיצה עליו מציגה ציטוט אחר.</p>
      <p>
        ב-Settings → <strong>Quotes</strong>, האפשרות <strong>Show daily quotes</strong> מפעילה או מכבה אותו, ו-
        <strong>Quote Source</strong> בוחר בין <strong>Local Quotes</strong>, אוסף שמגיע עם התוסף, לבין{' '}
        <strong>API Quotes</strong>, שנשלפים מהשירות Quotable.
      </p>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
