import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: חברו את Spotify ל-WindoM עם אפליקציית מפתחים חינמית משלכם: מה מתנגן, בקרי השמעה והשירים המובילים..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Spotify() {
  return (
    <DocsLayout path="/he/guide/spotify" eyebrow="מדריך למשתמש" title="חיבור Spotify" dir="rtl">
      <p>
        אחרי החיבור, WindoM מציג בדוק העליון מה מתנגן ב-Spotify, עם כפתורי נגינה/השהיה, הקודם והבא, ויכול להציג את
        השירים המובילים שלך בסרגל הצד. בגלל אופן הפעולה של ה-API של Spotify, כל משתמש מחבר אפליקציית Spotify Developer
        חינמית משלו - זה שומר על פרטיות החשבון ומונע מגבלות קצב משותפות. ההגדרה כולה לוקחת כ-2 דקות.
      </p>
      <div className="callout spotify">
        <strong>למה צריך אפליקציה משלי?</strong>
        <br />
        ה-Web API של Spotify דורש אפליקציית OAuth רשומה בפורטל המפתחים שלהם. במקום לנתב את כולם דרך אפליקציית WindoM
        משותפת (שיש לה מגבלות מכסה והשלכות פרטיות), כל משתמש יוצר אפליקציה חינמית משלו - השליטה מלאה ואין מגבלות לדאוג
        להן.
      </div>
      <h2>לפני שמתחילים</h2>
      <ul>
        <li>
          צריך חשבון WindoM (ראו <Link to="/he/guide/account">בעמוד החשבון</Link> - חינמי, לוקח דקה)
        </li>
        <li>
          צריך חשבון Spotify. גם חשבון חינמי וגם Premium מתחברים, אבל Spotify מאפשר לשלוט מבחוץ רק בחשבונות Premium -
          בחשבון חינמי הכפתורים לא עושים כלום ו-WindoM מציין שנדרש Premium.
        </li>
      </ul>
      <h2>שלב 1 - יצירת אפליקציית Spotify Developer</h2>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            נכנסים אל{' '}
            <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">
              developer.spotify.com/dashboard
            </a>{' '}
            ומתחברים עם חשבון Spotify.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            לוחצים על <strong>Create app</strong>.
          </p>
          <ul>
            <li>
              <strong>App name</strong> - כל שם, למשל <em>My WindoM</em>
            </li>
            <li>
              <strong>App description</strong> - כל דבר, למשל <em>Personal WindoM integration</em>
            </li>
            <li>
              <strong>Redirect URI</strong> - משאירים ריק לעת עתה, מוסיפים אותו בשלב 2
            </li>
            <li>
              <strong>Which API/SDKs are you planning to use?</strong> - בוחרים <strong>Web API</strong>
            </li>
          </ul>
          <p>
            מסכימים לתנאים ולוחצים על <strong>Save</strong>.
          </p>
        </div>
      </div>
      <h2>שלב 2 - העתקת ה-Redirect URI מ-WindoM</h2>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            פותחים לשונית WindoM חדשה, לוחצים על <strong>Settings</strong> (סמל גלגל השיניים, שמאל למטה), עוברים ל-
            <strong>Apps</strong> ולוחצים על הכרטיס <strong>Spotify</strong>.
          </p>
          <p>
            תופיע תיבה עם התווית <strong>Redirect URI</strong> וערך שנראה כך:
          </p>
          <div className="redirect-uri-box">
            <span className="redirect-uri-label">Redirect URI</span>
            <span className="redirect-uri-value">https://&lt;your-extension-id&gt;.chromiumapp.org/</span>
          </div>
          <p>
            לוחצים על הכפתור <strong>Copy</strong> שלידו. ה-URI הזה ייחודי להתקנת ה-Chrome שלך - לא מקלידים אותו ידנית.
          </p>
        </div>
      </div>
      <h2>שלב 3 - הוספת ה-Redirect URI לאפליקציית Spotify</h2>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            חוזרים אל{' '}
            <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">
              Spotify Developer Dashboard
            </a>
            , לוחצים על האפליקציה, ואז על <strong>Settings</strong> (למעלה מימין בדף האפליקציה).
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            גוללים לשדה <strong>Redirect URIs</strong>. מדביקים את ה-URI שהועתק מ-WindoM, לוחצים על <strong>Add</strong>
            , ואז על <strong>Save</strong> בתחתית.
          </p>
        </div>
      </div>
      <div className="callout warning">
        <strong>קל לפספס את השלב הזה.</strong> בלי ה-Redirect URI תתקבל שגיאת <em>Invalid Client</em> בניסיון החיבור.
        ה-URI חייב להתאים בדיוק - מעתיקים אותו בכפתור שב-WindoM, לא מקלידים ידנית.
      </div>
      <h2>שלב 4 - העתקת ה-Client ID וחיבור</h2>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            עדיין בדף ה-Settings של אפליקציית Spotify, מעתיקים את ה-<strong>Client ID</strong> שבחלק העליון. הוא נראה
            כמחרוזת hex בת 32 תווים, למשל <code>b3d9a1f0c84e...</code>
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            חוזרים ל-WindoM → Settings → Apps → <strong>Spotify</strong>. מדביקים את ה-Client ID בשדה ולוחצים על{' '}
            <strong>Save &amp; Connect</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            יופיע חלון אישור של Spotify. לוחצים על <strong>Agree</strong>.
          </p>
          <p>החיבור הושלם. כרטיס השיר הנוכחי יופיע בדוק העליון בפעם הבאה שמתנגן שיר.</p>
        </div>
      </div>
      <h2>שירים מובילים</h2>
      <p>
        באותו כרטיס Spotify, מפעילים את <strong>Show top tracks in sidebar</strong> כדי להציג בסרגל הצד את עשרת השירים
        שהכי הושמעו בשבועות האחרונים. כל אחד מקשר לשיר ב-Spotify.
      </p>
      <h2>פתרון בעיות</h2>
      <div className="callout">
        <strong>שגיאה: Invalid Client</strong> - ה-Client ID שגוי או שה-Redirect URI לא נשמר כראוי ב-Spotify Developer
        Dashboard. כדאי לבדוק את שניהם שוב. את ה-Redirect URI מעתיקים מכרטיס Spotify ב-WindoM, לא מקלידים ידנית.
      </div>
      <div className="callout">
        <strong>שגיאה: Connection cancelled</strong> - חלון Spotify נסגר לפני שהאישור הושלם. לוחצים שוב על Save &amp;
        Connect ומשלימים את תהליך האישור.
      </div>
      <div className="callout tip">
        <strong>החלפת פרופיל Chrome או התקנה מחדש?</strong> ה-Redirect URI ישתנה. ב-Settings → Apps → Spotify מופיע
        ה-URI החדש; מוסיפים אותו להגדרות אפליקציית Spotify (אפשר כמה Redirect URIs), ואז מתחברים מחדש.
      </div>
      <p>
        עדיין לא מסתדר? ראו ב<Link to="/he/support#spotify-connect">דף התמיכה</Link>.
      </p>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
