import { DocsLayout } from '../../components/DocsLayout';
import { EnvTable } from '../../components/EnvTable';
import { EXAMPLE_ENV } from '../../lib/env-reference';

/**
 * Hebrew developer setup. Translated from `pages/LocalSetup.tsx`.
 *
 * Commands, paths, variable names and anything else a reader has to type stay
 * in English - a translated command is a command that does not run. The
 * environment table comes from the same shared list the English page renders,
 * so the two cannot drift.
 */
export function LocalSetup() {
  return (
    <DocsLayout
      href="/he/local-setup.html"
      eyebrow="מדריך למפתחים"
      title="הרצת WindoM מקומית"
      dir="rtl"
    >
      <h2 id="extension-only">
        אפשרות א׳ - התוסף בלבד <span className="badge">מומלץ להתחלה</span>
      </h2>
      <p>
        כך מריצים את התוסף ב-Chrome בלי שום שרת. שעון, מזג אוויר, משימות, רקעים, ציטוטים,
        קישורים מהירים וטיימר המיקוד עובדים מיד. יומן Google ו-Spotify דורשים את ההתקנה
        המלאה שלמטה.
      </p>

      <h3>דרישות מוקדמות</h3>
      <ul>
        <li>
          <a href="https://nodejs.org">Node.js 18 ומעלה</a>
        </li>
        <li>Google Chrome</li>
        <li>Git</li>
      </ul>

      <h3>שלבים</h3>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>שכפול המאגר.</p>
          <pre><code>git clone https://github.com/YehudaBriskman/WindoM.git
cd WindoM</code></pre>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>התקנת התלויות של התוסף.</p>
          <pre><code>cd web
npm install</code></pre>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>בניית התוסף.</p>
          <pre><code>npm run build</code></pre>
          <p>
            הפעולה יוצרת תיקיית <code>web/dist/</code> - זהו התוסף הבנוי.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          <p>טעינת התוסף ב-Chrome.</p>
          <ol>
            <li>
              פתיחת Chrome ומעבר לכתובת <code>chrome://extensions</code>
            </li>
            <li>
              הפעלת <strong>Developer mode</strong> (המתג בפינה הימנית העליונה)
            </li>
            <li>
              לחיצה על <strong>Load unpacked</strong>
            </li>
            <li>
              בחירת התיקייה <code>web/dist</code>
            </li>
          </ol>
        </div>
      </div>
      <div className="step">
        <div className="step-num">5</div>
        <div className="step-body">
          <p>פתיחת לשונית חדשה. WindoM אמור להופיע.</p>
        </div>
      </div>

      <div className="callout tip">
        <strong>מצב פיתוח עם טעינה חוזרת</strong> - אפשר להריץ <code>npm run dev</code>{' '}
        במקום build, ואז לטעון את תיקיית השורש <code>web/</code> (ולא <code>dist/</code>)
        כתוסף לא ארוז בכתובת <code>chrome://extensions</code>. שינויים נטענים מחדש
        אוטומטית דרך HMR.
      </div>

      <h2 id="full-stack">
        אפשרות ב׳ - מערכת מלאה <span className="badge optional">אופציונלי</span>
      </h2>
      <p>
        נדרשת אם רוצים סנכרון יומן Google או חיבור ל-Spotify. ההתקנה מריצה שרת מקומי עם
        בסיס נתונים Postgres באמצעות Docker.
      </p>

      <h3>דרישות מוקדמות</h3>
      <ul>
        <li>כל מה שבאפשרות א׳</li>
        <li>
          <a href="https://www.docker.com/products/docker-desktop">Docker Desktop</a>
        </li>
        <li>פרויקט Google Cloud עם הרשאות OAuth (עבור היומן)</li>
        <li>אפליקציית Spotify Developer (עבור Spotify)</li>
      </ul>

      <h3>שלבים</h3>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>העתקת קובץ הסביבה לדוגמה.</p>
          <pre><code>cp backend/.env.example backend/.env</code></pre>
          <p>
            לאחר מכן יש לפתוח את <code>backend/.env</code> ולמלא את הערכים. ב
            <a href="#env-reference">טבלת משתני הסביבה</a> שלמטה מוסבר מה כל אחד מהם.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>יצירת סודות מאובטחים ל-JWT ולהצפנת אסימונים.</p>
          <pre><code>node -e "const c=require('crypto'); console.log('JWT_ACCESS_SECRET='+c.randomBytes(32).toString('base64')); console.log('REFRESH_TOKEN_SECRET='+c.randomBytes(32).toString('base64')); console.log('TOKEN_ENC_KEY_BASE64='+c.randomBytes(32).toString('base64'));"</code></pre>
          <p>
            יש להעתיק את הפלט לתוך קובץ ה-<code>.env</code>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>הפעלת השרת ובסיס הנתונים עם Docker.</p>
          <pre><code>docker-compose up --build</code></pre>
          <p>
            ה-API ירוץ בכתובת <code>http://localhost:8080</code>, ובסיס הנתונים בפורט{' '}
            <code>5433</code>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          <p>בניית התוסף כך שיפנה לשרת המקומי.</p>
          <pre><code>cd web
npm install
npm run build</code></pre>
          <p>
            כתובת השרת כברירת מחדל היא כבר <code>http://localhost:8080</code>, כך שאין
            צורך בשינויים.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">5</div>
        <div className="step-body">
          <p>
            טעינת <code>web/dist</code> כתוסף לא ארוז ב-Chrome (זהה לאפשרות א׳, שלב 4).
          </p>
        </div>
      </div>

      <div className="callout warning">
        <strong>כתובות חזרה של OAuth</strong> - יש להוסיף אותן בקונסולות של אפליקציות
        ה-OAuth לפני הבדיקה:
        <ul>
          <li>
            <strong>Google Cloud Console</strong> ← Authorized redirect URIs:
            <br />
            <code>http://localhost:8080/auth/google/callback</code>
            <br />
            <code>http://localhost:8080/oauth/google/callback</code>
          </li>
          <li>
            <strong>Spotify Developer Dashboard</strong> ← Redirect URIs:
            <br />
            <code>http://localhost:8080/oauth/spotify/callback</code>
          </li>
        </ul>
      </div>

      <h2 id="env-reference">טבלת משתני הסביבה</h2>
      <p>
        כל המשתנים נכנסים לקובץ <code>backend/.env</code>. אלה המסומנים כלא נדרשים דרושים
        רק לתכונות מסוימות.
      </p>

      <EnvTable locale="he" />

      <div className="callout">
        <strong>איתור מזהה התוסף</strong> - יש לטעון את התוסף כלא ארוז ב-Chrome ואז לעבור
        לכתובת <code>chrome://extensions</code>. המזהה מוצג מתחת לשם התוסף. יש להשתמש בו
        ב-<code>CORS_ALLOWED_ORIGINS</code> בצורה <code>chrome-extension://YOUR_ID</code>{' '}
        וב-<code>EXTENSION_REDIRECT_BASE</code> בצורה{' '}
        <code>https://YOUR_ID.chromiumapp.org</code>.
      </div>

      <h3>דוגמה ל-.env לפיתוח מקומי</h3>
      <div className="callout">
        <strong>הערה על DATABASE_URL</strong> - בהרצה עם <code>docker-compose up</code>,
        הערך של <code>DATABASE_URL</code> נדרס אוטומטית ומצביע על מכולת ה-<code>db</code>{' '}
        (פורט 5432 פנימית). צריך להגדיר אותו ידנית רק אם מריצים את השרת ישירות על המחשב,
        ואז יש להשתמש בפורט <code>5433</code> - הפורט שממופה למארח על ידי Docker Compose.
      </div>

      <pre><code>{EXAMPLE_ENV('he')}</code></pre>
    </DocsLayout>
  );
}
