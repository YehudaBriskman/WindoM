import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

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
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
