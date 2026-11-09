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
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
