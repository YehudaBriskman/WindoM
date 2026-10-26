import { DocsLayout } from '../../components/DocsLayout';

/**
 * The Hebrew user guide, on its own URL so search engines can index it.
 *
 * The previous guide shipped both languages in every response and swapped them
 * with CSS display rules, so Hebrew was never indexable and every reader
 * downloaded a language they could not read. Each language now has its own URL
 * and carries only its own copy, with hreflang alternates in the HTML entry.
 */
export function Guide() {
  return (
    <DocsLayout path="/he/guide" eyebrow="מדריך למשתמש" title="שימוש ב-WindoM" dir="rtl">
        <div className="callout tip">
            <strong>רוב הפונקציות לא דורשות חשבון.</strong> שעון, מזג אוויר, משימות, רקעים, ציטוטים, קישורים מהירים וטיימר הפוקוס עובדים מיד ללא התחברות. חשבון נדרש רק לסנכרון Google Calendar ו-Spotify. תמיד אפשר להוסיף אחד מאוחר יותר.
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-card-title">שעון ותאריך</div>
              <div className="feature-card-desc">12/24 שעות, צבע מותאם, גודל גופן, פורמט תאריך. תמיד פעיל, ללא חשבון.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">מזג אוויר</div>
              <div className="feature-card-desc">טמפרטורה ומצב מזג אוויר בזמן אמת. ללא מפתח API, ללא חשבון.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">רקע</div>
              <div className="feature-card-desc">תמונות מתחלפות מ-Unsplash או העלה תמונה משלך. מאוחסן מקומית.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">טיימר פוקוס</div>
              <div className="feature-card-desc">הגדר כוונה ועמעם את כל השאר. ללא חשבון.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">קישורים מהירים</div>
              <div className="feature-card-desc">נעץ את האתרים הנפוצים ביותר לסרגל הדוק בחלק העליון.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">משימות</div>
              <div className="feature-card-desc">רשימת משימות מקומית בסרגל הצד הימני. נשמר במכשיר שלך.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">ספוטיפיי</div>
              <div className="feature-card-desc">השיר הנוכחי בדוק העליון. דורש חשבון + אפליקציית Spotify Developer חינמית.</div>
            </div>
            <div className="feature-card">
              <div className="feature-card-title">Google Calendar</div>
              <div className="feature-card-desc">אירועים קרובים בסרגל הצד הימני. דורש חשבון + אישור Google.</div>
            </div>
          </div>
          <h2 id="account">
            יצירת חשבון WindoM
            <span className="badge optional">Optional</span>
          </h2>
          <p>חשבון WindoM מסנכרן את ההגדרות שלך בין מכשירים ונדרש לחיבור Google Calendar או Spotify. ההרשמה חינמית ולוקחת פחות מדקה.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>פתח את אייקון הגלגל שיניים (<strong>הגדרות</strong>) בפינה השמאלית התחתונה של לשונית החדשה, ועבור ללשונית <strong>חשבון</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
                <p>הכנס את כתובת האימייל שלך וסיסמה (לפחות 8 תווים) ולחץ על <strong>צור חשבון</strong>.</p>
                <p>לחלופין, לחץ על <strong>המשך עם Google</strong> אם אינך רוצה לנהל סיסמה.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>בדוק את תיבת הדואר שלך לאימות האימייל ולחץ על הקישור בתוכו. אתה מחובר.</p>
            </div>
          </div>
          <div className="callout tip">
            <strong>סנכרון הגדרות</strong> -
            לאחר התחברות, פורמט השעון, הרקע המועדף, הווידג'טים והקישורים המהירים שלך מסתנכרנים לענן ומופיעים בכל מכשיר שבו אתה מחובר ל-WindoM.
          </div>
          <h2 id="spotify">
            חיבור ספוטיפיי
            <span className="badge byoa">BYOA</span>
          </h2>
          <p>WindoM מציג את כרטיס השיר הנוכחי של ספוטיפיי ישירות בדוק לשונית החדשה. בגלל אופן פעולת ה-API של ספוטיפיי, כל משתמש מחבר את אפליקציית Spotify Developer החינמית שלו - זה שומר על פרטיות החשבון שלך ומונע הגבלות קצב משותפות. ההגדרה הכוללת לוקחת כ-2 דקות.
          </p>
          <div className="callout spotify">
            <strong>למה אני צריך אפליקציה משלי?</strong><br />ה-Web API של ספוטיפיי דורש אפליקציית OAuth רשומה בפורטל המפתחים שלהם. במקום לנתב את כולם דרך אפליקציית WindoM משותפת (שיש לה מגבלות מכסה והשלכות פרטיות), כל משתמש יוצר אפליקציה חינמית משלו - קיבלת שליטה מלאה ואין מגבלות לדאוג להן.
          </div>
          <h3>לפני שמתחילים</h3>
          <ul>
            <li>אתה צריך חשבון WindoM (ראה למעלה - חינמי, לוקח דקה)</li>
            <li>אתה צריך חשבון Spotify (חינמי או פרימיום - שניהם עובדים)</li>
          </ul>
          <h3>שלב 1 - יצירת אפליקציית Spotify Developer</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>עבור אל <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">developer.spotify.com/dashboard</a> והתחבר עם חשבון ספוטיפיי שלך.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
                <p>לחץ על <strong>Create app</strong>.</p>
                <ul>
                  <li><strong>App name</strong> - כל שם שתרצה, למשל <em>My WindoM</em></li>
                  <li><strong>App description</strong> - כל דבר, למשל <em>Personal WindoM integration</em></li>
                  <li><strong>Redirect URI</strong> - השאר ריק לעת עתה, תוסיף אותו בשלב 2</li>
                  <li><strong>Which API/SDKs are you planning to use?</strong> - בחר <strong>Web API</strong></li>
                </ul>
                <p>הסכם לתנאים ולחץ על <strong>Save</strong>.</p>
            </div>
          </div>
          <h3>שלב 2 - העתק את ה-Redirect URI מ-WindoM</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
                <p>פתח את לשונית WindoM החדשה, לחץ על <strong>הגדרות</strong> (אייקון גלגל שיניים, שמאל תחתון), ועבור ללשונית <strong>ספוטיפיי</strong>.
                </p>
                <p>תראה תיבה עם התווית <strong>Redirect URI</strong> עם ערך שנראה כך:
                </p>
                <div className="redirect-uri-box">
                  <span className="redirect-uri-label">Redirect URI</span>
                  <span className="redirect-uri-value">https://&lt;your-extension-id&gt;.chromiumapp.org/</span>
                </div>
                <p>לחץ על כפתור <strong>העתק</strong> לידו. URI זה ייחודי להתקנת Chrome שלך - אל תקליד אותו ידנית.</p>
            </div>
          </div>
          <h3>שלב 3 - הוסף את ה-Redirect URI לאפליקציית ספוטיפיי שלך</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>חזור אל <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">Spotify Developer Dashboard</a>, לחץ על האפליקציה שלך, ואז לחץ על <strong>Settings</strong> (למעלה ימין בדף האפליקציה שלך).</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>גלול לשדה <strong>Redirect URIs</strong>. הדבק את ה-URI שהעתקת מ-WindoM, לחץ על <strong>Add</strong>, ואז על <strong>Save</strong> בתחתית.</p>
            </div>
          </div>
          <div className="callout warning">
            <strong>שלב זה קל לפספס.</strong> אם תדלג על הוספת ה-Redirect URI תקבל שגיאת <em>Invalid Client</em> בעת ניסיון החיבור. ה-URI חייב להתאים בדיוק - העתק אותו בעזרת הכפתור ב-WindoM, אל תקליד אותו ידנית.
          </div>
          <h3>שלב 4 - העתק את ה-Client ID והתחבר</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>עדיין בדף ה-Settings של אפליקציית ספוטיפיי שלך, העתק את ה-<strong>Client ID</strong> בחלק העליון. הוא נראה כמחרוזת hex בת 32 תווים, למשל <code>b3d9a1f0c84e...</code></p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>חזור ל-WindoM → הגדרות → לשונית <strong>ספוטיפיי</strong>. הדבק את ה-Client ID בשדה הקלט ולחץ על <strong>שמור והתחבר</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
                <p>יופיע חלון קופץ לאישור ספוטיפיי. לחץ על <strong>Agree</strong>.</p>
                <p>אתה מחובר. כרטיס השיר הנוכחי יופיע בדוק העליון בפעם הבאה שתנגן שיר.</p>
            </div>
          </div>
          <h3>פתרון בעיות</h3>
          <div className="callout">
            <strong>שגיאה: Invalid Client</strong> -
            ה-Client ID שגוי או ה-Redirect URI לא נשמר כהלכה ב-Spotify dashboard. בדוק את שניהם שוב. יש להעתיק את ה-Redirect URI מלשונית ספוטיפיי של WindoM, לא להקליד ידנית.
          </div>
          <div className="callout">
            <strong>שגיאה: חיבור בוטל</strong> -
            סגרת את חלון ספוטיפיי לפני השלמת האישור. לחץ שוב על שמור והתחבר והשלם את תהליך האישור.
          </div>
          <div className="callout tip">
            <strong>שינית פרופיל Chrome או התקנת מחדש?</strong> ה-Redirect URI שלך יהיה שונה. עבור להגדרות → לשונית ספוטיפיי כדי לראות את ה-URI החדש, הוסף אותו להגדרות אפליקציית ספוטיפיי שלך (ניתן להוסיף מספר Redirect URIs), ואז התחבר מחדש.
          </div>
          <h2 id="calendar">
            חיבור Google Calendar
          </h2>
          <p>WindoM מציג את אירועי Google Calendar הקרובים שלך בסרגל הצד הימני כך שהיום שלך תמיד גלוי. זה דורש חשבון WindoM ואישור Google חד-פעמי.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>ודא שיש לך חשבון WindoM ואתה מחובר (הגדרות → לשונית חשבון).</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>פתח הגדרות → <strong>מרכז אפליקציות</strong> → לחץ על כרטיס <strong>לוח שנה</strong> → לחץ על <strong>חבר</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
                <p>יפתח חלון אישור של Google. בחר את חשבון Google שלך ולחץ על <strong>Allow</strong>.</p>
                <p>WindoM מבקש גישת קריאה בלבד לאירועי הלוח שנה שלך - הוא לא יכול ליצור, לערוך או למחוק דבר.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <div className="step-body">
              <p>סיימת. האירועים הקרובים שלך מופיעים בסרגל הצד הימני, מקובצים לפי יום.</p>
            </div>
          </div>
          <div className="callout tip">
            <strong>חלון מראש</strong> -
            כברירת מחדל מוצגים אירועים ל-7 הימים הבאים. ניתן לשנות זאת ל-14 או 30 יום בהגדרות → <strong>לוח שנה</strong>.
          </div>
          <h2 id="finance">
            לוח מחוונים פיננסי
          </h2>
          <p>עקוב אחר מחירי מניות וקריפטו בזמן אמת ישירות בלשונית החדשה שלך. המחירים מתעדכנים מ-Yahoo Finance ו-CoinGecko - אין צורך במפתח API או חשבון. שני כרטיסים גלילים מופיעים בלוח המחוונים שלך: אחד למניות ואחד לקריפטו.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>פתח הגדרות → <strong>מרכז אפליקציות</strong> → לחץ על כרטיס <strong>פיננסים</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>תחת <strong>מניות</strong>, הקלד שם חברה או טיקר בשורת החיפוש (למשל "Apple" או "AAPL"). בחר מתוצאות ההשלמה האוטומטית. חזור על כך לכל טיקר שרוצה.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>תחת <strong>קריפטו</strong>, הפעל את המטבעות שברצונך לעקוב (Bitcoin, Ethereum, Solana ועוד).</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <div className="step-body">
              <p>לוחות המחוונים הפיננסיים מופיעים במרכז לשונית החדשה שלך. כל כרטיס גלילי באופן עצמאי ויש לו לחצן הצג/הסתר בחלק העליון.</p>
            </div>
          </div>
          <div className="callout tip">
            <strong>מחירים שמורים ב-cache למשך 5 דקות</strong> -
            הוספת טיקר חדש עוקפת את ה-cache מיד כך שתראה את המחיר מיידית.
          </div>
          <h2 id="focus">
            טיימר פוקוס
          </h2>
          <p>טיימר הפוקוס מאפשר לך להגדיר כוונה לסשן שלך. כשהוא פעיל, הרקע מתעמעם וכל ממשק אחר נעלם כדי שלא יהיו הסחות דעת.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>לחץ על שדה הפוקוס במרכז לשונית החדשה שלך - הוא אומר משהו כמו <em>"על מה אתה עובד?"</em></p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>הקלד על מה אתה עובד ולחץ על <strong>Enter</strong>. הטיימר מתחיל והלשונית מתעמעמת.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>כשתסיים, לחץ בכל מקום על המסך או לחץ על <strong>Escape</strong> כדי לצאת ממצב פוקוס.</p>
            </div>
          </div>
          <div className="callout tip">
            <strong>הגדרות מוקדמות לפוקוס</strong> -
            עבור להגדרות → <strong>פוקוס</strong> כדי לשמור את משימות הפוקוס הנפוצות ביותר שלך כבחירה מהירה, כך שלא תצטרך להקליד כל יום מחדש.
          </div>
          <h2 id="background">
            שינוי הרקע
          </h2>
          <p>WindoM תומך בשני מקורות רקע: תמונות נבחרות מ-Unsplash, או תמונה שאתה מעלה מהמכשיר שלך.
          </p>
          <h3>אפשרות א - תמונות Unsplash</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>פתח הגדרות → לשונית <strong>רקע</strong>. בחר <strong>Unsplash</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
                <p>אפשרי: הדבק <strong>Collection ID</strong> מ-Unsplash כדי לאצור את סגנון התמונה.
                  לאיתור מזהה אוסף: עבור אל <a href="https://unsplash.com/collections" target="_blank" rel="noreferrer">unsplash.com/collections</a>,
                  פתח כל אוסף, והעתק את המספר מה-URL -
                  למשל <code>unsplash.com/collections/<strong>4324303</strong>/...</code>
                </p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>תמונה חדשה נטענת בכל פעם שאתה פותח לשונית חדשה.</p>
            </div>
          </div>
          <h3>אפשרות ב - תמונה משלך</h3>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>פתח הגדרות → לשונית <strong>רקע</strong>. בחר <strong>מקומי</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>לחץ על <strong>בחר תמונה</strong> ובחר כל תמונה מהמכשיר שלך. היא מאוחסנת מקומית - לא מועלית לשום מקום.</p>
            </div>
          </div>
          <h2 id="weather">
            ווידג'ט מזג אוויר
          </h2>
          <p>ווידג'ט מזג האוויר מציג טמפרטורה ותנאים בזמן אמת בסרגל העליון. הוא קורא נתונים מ-Open-Meteo, שאינו דורש מפתח API ואינו דורש חשבון - אין להירשם לשום שירות ואין מה להדביק.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>פתח הגדרות WindoM → לשונית <strong>מזג אוויר</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>בשדה <strong>Temperature Unit</strong> בחר צלזיוס (°C) או פרנהייט (°F).</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
                <p>התחל להקליד שם עיר בשדה <strong>Location</strong> (למשל <code>Tel Aviv</code> או <code>New York</code>). ערים מתאימות מופיעות מתחת לשדה עם האזור והמדינה שלהן - לחץ על זו שהתכוונת אליה.</p>
                <p>אם תשאיר את השדה ריק, WindoM יבקש את המיקום שלך מהדפדפן.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <div className="step-body">
              <p>ווידג'ט מזג האוויר מופיע בפינה השמאלית העליונה של לשונית החדשה שלך. אין כפתור שמירה - השינוי חל ברגע הבחירה.</p>
            </div>
          </div>
          <div className="callout">
            <strong>מוצג מקום שגוי?</strong> כששדה המיקום ריק והדפדפן אינו מספק נקודות ציון, WindoM נופל בחזרה לזיהוי גס לפי כתובת ה-IP, שיכול להיות רחוק למדי ב-VPN או ברשת סלולרית. הקלדת עיר ידנית מקבעת את המיקום.
          </div>
          <div className="callout tip">
            <strong>מתרענן כל 30 דקות</strong> -
            הקריאה האחרונה נשמרת במטמון, כך שהווידג'ט מוצג מלא כבר ברגע שלשונית חדשה נפתחת, ומתעדכן כשהקריאה הטרייה מגיעה.
          </div>
          <h2 id="links">
            קישורים מהירים וסרגל הדוק
          </h2>
          <p>נעץ את האתרים הנפוצים ביותר לסרגל הדוק שרץ לאורך חלק העליון של כל לשונית חדשה. כל קישור מוצג כסמל favicon - רחף מעליו לראות את התווית.
          </p>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <p>פתח הגדרות → לשונית <strong>קישורים</strong>.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <p>לחץ על <strong>הוסף קישור</strong>. הכנס את ה-URL המלא (למשל <code>https://github.com</code>) ושם תצוגה.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <p>גרור לסידור מחדש. לחץ על <strong>×</strong> בכל קישור כדי להסירו.</p>
            </div>
          </div>
          <h2 id="clock">
            שעון ותאריך
          </h2>
          <p>השעון הוא מרכז לשונית החדשה שלך. הכל בו ניתן להתאמה אישית.
          </p>
          <ul>
            <li><strong>פורמט</strong> - 12 שעות (עם AM/PM) או 24 שעות</li>
            <li><strong>גודל</strong> - גופן קטן, בינוני או גדול</li>
            <li><strong>צבע</strong> - בחר כל צבע עם בוחר הצבעים</li>
            <li><strong>תאריך</strong> - הצג או הסתר את התאריך מתחת לשעה; בחר פורמט תאריך מועדף</li>
            <li><strong>סגנון</strong> - ספרות רגילות או גרסה בסגנון</li>
          </ul>
          <p>כל האפשרויות נמצאות בהגדרות → לשונית <strong>שעון</strong>.</p>
    </DocsLayout>
  );
}
