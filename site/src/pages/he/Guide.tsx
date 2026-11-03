import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The Hebrew user guide, on its own URL so search engines can index it.
 *
 * The previous guide shipped both languages in every response and swapped them
 * with CSS display rules, so Hebrew was never indexable and every reader
 * downloaded a language they could not read. Each language now has its own URL
 * and carries only its own copy, with hreflang alternates in the HTML entry.
 *
 * Mirrors `pages/Guide.tsx` section for section, in the same order and with the
 * same anchor ids, so a link into one language works in the other. Interface
 * labels stay in English, as on the Hebrew support page: the extension's own
 * interface is English, and a translated label is one a reader cannot find on
 * screen.
 */
export function Guide() {
  return (
    <DocsLayout path="/he/guide" eyebrow="מדריך למשתמש" title="שימוש ב-WindoM" dir="rtl">
      <h2 id="overview">במבט אחד</h2>
      <div className="callout tip">
        <strong>רוב הפונקציות לא דורשות חשבון.</strong> השעון, מזג האוויר, הרקעים, הקישורים המהירים, המשימות, מצב
        הפוקוס, הציטוטים, החיפוש, סרגל הלשוניות ומחירי המניות עובדים מיד ללא התחברות. חשבון נדרש רק לסנכרון הגדרות,
        ל-Google Calendar, ל-GitHub ול-Spotify. תמיד אפשר להוסיף חשבון מאוחר יותר. חדשים כאן? כדאי להתחיל ב
        <Link to="/he/install">התקנה</Link>.
      </div>
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-card-title">שעון וברכה</div>
          <div className="feature-card-desc">12/24 שעות, סגנון, צבע, גודל ותאריך. תמיד פעיל, ללא חשבון.</div>
        </div>
        <div className="feature-card">
          <div className="feature-card-title">רקע</div>
          <div className="feature-card-desc">תמונות מובנות, תמונות משלך, או Unsplash. נשמר מקומית.</div>
        </div>
        <div className="feature-card">
          <div className="feature-card-title">קישורים מהירים</div>
          <div className="feature-card-desc">האתרים שהכי בשימוש, נעוצים בסרגל הדוק בחלק העליון.</div>
        </div>
        <div className="feature-card">
          <div className="feature-card-title">משימות</div>
          <div className="feature-card-desc">רשימת משימות בסרגל הצד. ללא חשבון.</div>
        </div>
        <div className="feature-card">
          <div className="feature-card-title">מצב פוקוס</div>
          <div className="feature-card-desc">מגדירים את המיקוד העיקרי, ואז ספירה לאחור שמסתירה את כל השאר.</div>
        </div>
        <div className="feature-card">
          <div className="feature-card-title">חיפוש</div>
          <div className="feature-card-desc">קיצור מקלדת אחד בכל דף: לשוניות, היסטוריה והאינטרנט.</div>
        </div>
        <div className="feature-card">
          <div className="feature-card-title">מזג אוויר</div>
          <div className="feature-card-desc">טמפרטורה ומצב מזג אוויר בזמן אמת. ללא מפתח API, ללא חשבון.</div>
        </div>
        <div className="feature-card">
          <div className="feature-card-title">Google Calendar</div>
          <div className="feature-card-desc">אירועים קרובים בסרגל הצד. דורש חשבון + אישור Google.</div>
        </div>
        <div className="feature-card">
          <div className="feature-card-title">Spotify</div>
          <div className="feature-card-desc">
            מה מתנגן עכשיו, כפתורי נגינה ושירים מובילים. דורש חשבון + אפליקציית Spotify Developer חינמית.
          </div>
        </div>
      </div>
      <p>
        משהו לא מתנהג כמו שמתואר כאן? ב<Link to="/he/support">דף התמיכה</Link> יש פתרונות לתקלות הנפוצות. מי שרוצה להריץ
        או לשנות את WindoM בעצמו ימצא את ההסבר ב<Link to="/he/local-setup">הרצה מקומית</Link>.
      </p>

      <h2 id="clock">שעון, תאריך וברכה</h2>
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

      <h2 id="background">שינוי הרקע</h2>
      <p>
        WindoM מגיע עם סט תמונות מובנות ולא צריך ממך כלום. אפשר לעבור לתמונות משלך, או לתמונות מ-Unsplash. הבחירה נמצאת
        ב-Settings → <strong>Background</strong> → <strong>Background Source</strong>.
      </p>
      <h3>אפשרות א - תמונות מובנות ותמונות משלך</h3>
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
      <h3>אפשרות ב - תמונות Unsplash</h3>
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

      <h2 id="links">קישורים מהירים וסרגל הדוק</h2>
      <p>
        אפשר לנעוץ את האתרים שהכי בשימוש בסרגל הדוק שלאורך החלק העליון של כל לשונית חדשה. כל קישור מוצג כסמל של האתר,
        והשם שלו מופיע במעבר עכבר. הדוק מכיל עד 27 קישורים בשורות של תשעה, ונגלל שורה אחת בכל פעם.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            לוחצים על ה-<strong>+</strong> בסוף הדוק, או פותחים את Settings → <strong>Links</strong> ולוחצים על{' '}
            <strong>+ Add Link</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            מזינים שם ואת ה-URL המלא (למשל <code>https://github.com</code>).
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            כדי להסיר קישור, לוחצים על ה-<strong>×</strong> שעליו בדוק או לידו ב-Settings → Links.
          </p>
        </div>
      </div>
      <p>
        כדי להסתיר את הדוק לגמרי, מכבים את <strong>Quick Links</strong> תחת Settings → General → Widget Visibility.
      </p>

      <h2 id="todos">משימות</h2>
      <p>
        רשימת משימות פשוטה, <strong>Today's Tasks</strong>, בראש סרגל הצד. היא פעילה מההתחלה ולא דורשת חשבון.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>לוחצים על סמל הרשימה בפינה הימנית התחתונה של הלשונית החדשה כדי לפתוח את סרגל הצד.</p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            מקלידים בשדה <strong>Add a new task...</strong> ולוחצים <strong>Enter</strong> או <strong>+</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            מסמנים משימה כדי לציין שהיא בוצעה, או לוחצים על ה-<strong>×</strong> שלה כדי להסיר אותה.
          </p>
        </div>
      </div>
      <div className="callout tip">
        <strong>איפה המשימות נשמרות</strong> - המשימות נשמרות באחסון של Chrome בפרופיל שלך, לא בשרת של WindoM, וכל
        לשונית חדשה פתוחה מציגה את אותה רשימה. כדי להסתיר את הרשימה, פותחים את Settings → <strong>Apps</strong> →{' '}
        <strong>Tasks</strong> ומכבים את <strong>Show in sidebar</strong>.
      </div>

      <h2 id="focus">מצב פוקוס</h2>
      <p>
        במרכז הלשונית החדשה מופיעה השאלה <em>What is your main focus for today?</em> - מה המיקוד העיקרי שלך היום. כותבים
        אותו, וכשמגיע הזמן לעבוד עליו, מפעילים ספירה לאחור שמסתירה את כל השאר.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            מקלידים את המיקוד בשדה שבמרכז ולוחצים <strong>Enter</strong>. לחיצה עליו בהמשך מסמנת אותו כבוצע; לחיצה כפולה
            פותחת אותו לעריכה.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            לוחצים על אחד מפרקי הזמן שמתחתיו - <strong>25m</strong>, <strong>1h</strong>, <strong>2h</strong> או{' '}
            <strong>4h</strong>. שאר הדף נעלם, ונשארים השעון והזמן שנותר.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            כדי לעצור מוקדם, לוחצים על <strong>Stop Focus</strong>, לוחצים בכל מקום על המסך, או לוחצים{' '}
            <strong>Escape</strong>.
          </p>
        </div>
      </div>
      <div className="callout tip">
        <strong>לא משתמשים בזה?</strong> - מכבים את <strong>Center Bar</strong> תחת Settings → General → Widget
        Visibility כדי להסתיר את שדה הפוקוס ואת פרקי הזמן.
      </div>

      <h2 id="quotes">ציטוט יומי</h2>
      <p>בתחתית הלשונית החדשה מופיע ציטוט שמתחלף פעם ביום. לחיצה עליו מציגה ציטוט אחר.</p>
      <p>
        ב-Settings → <strong>Quotes</strong>, האפשרות <strong>Show daily quotes</strong> מפעילה או מכבה אותו, ו-
        <strong>Quote Source</strong> בוחר בין <strong>Local Quotes</strong>, אוסף שמגיע עם התוסף, לבין{' '}
        <strong>API Quotes</strong>, שנשלפים מהשירות Quotable.
      </p>

      <h2 id="search">חיפוש</h2>
      <p>
        לחיצה על{' '}
        <bdi>
          <kbd>Ctrl</kbd> + <kbd>Win</kbd> + <kbd>H</kbd>
        </bdi>{' '}
        - או{' '}
        <bdi>
          <kbd>Ctrl</kbd> + <kbd>Cmd</kbd> + <kbd>H</kbd>
        </bdi>{' '}
        ב-Mac - פותחת תיבת חיפוש מעל הדף שבו נמצאים. היא עובדת בלשונית החדשה ובאתרים רגילים; תוספים לא יכולים לפעול
        בדפים של Chrome עצמו, ולכן שם היא לא נפתחת. אותם מקשים סוגרים אותה, וגם <strong>Escape</strong>.
      </p>
      <ul>
        <li>
          <strong>מקלידים כל דבר</strong> - ההצעות מגיעות מהלשוניות הפתוחות, אחר כך מההיסטוריה (בלשונית החדשה, אחרי
          שמפעילים את <Link to="/he/guide#history">היסטוריית הגלישה</Link>), ואחר כך מהאינטרנט. בחירה בלשונית עוברת אליה
          במקום לפתוח אותה שוב.
        </li>
        <li>
          <strong>מקלידים כתובת</strong> - כמו <code>github.com</code>, ו-<strong>Enter</strong> עובר אליה ישירות.
        </li>
        <li>
          <strong>בוחרים מנוע חיפוש</strong> - הכפתור שליד התיבה עובר בין Google, Bing, DuckDuckGo ו-Brave. ברירת המחדל
          היא Google.
        </li>
        <li>
          <strong>
            מתחילים ב-<code>&gt;</code>
          </strong>{' '}
          - לפקודות: New Tab, Close Tab, Reload Page, Duplicate Tab ו-Pin / Unpin Tab. כל טקסט אחר אחרי{' '}
          <code>&gt;</code> נפתח בלשונית חדשה.
        </li>
      </ul>
      <div className="callout">
        <strong>מאיפה מגיעות הצעות האינטרנט</strong> - בלי קשר למנוע החיפוש שנבחר, ההצעות שמתחת לתיבה מגיעות מההשלמה
        האוטומטית של DuckDuckGo, כך שמה שמקלידים נשלח ל-DuckDuckGo תוך כדי הקלדה. הצעות מהלשוניות ומההיסטוריה לא יוצאות
        מהדפדפן.
      </div>

      <h2 id="tab-sidebar">סרגל הלשוניות</h2>
      <p>
        כשמקרבים את הסמן לקצה הימני של הלשונית החדשה, נפתח פאנל עם כל הלשוניות הפתוחות, בכל החלונות. לחיצה על לשונית
        עוברת אליה, ו-<strong>New Tab</strong> בראש הפאנל פותח לשונית חדשה. הדפים של Chrome עצמו לא מופיעים ברשימה.
      </p>
      <p>
        כדי להשתמש בקצה השמאלי במקום, פותחים את Settings → <strong>General</strong> → <strong>Tab Sidebar</strong>{' '}
        ובוחרים <strong>Left</strong>.
      </p>

      <h2 id="history">היסטוריית גלישה</h2>
      <p>
        מוסיף לסרגל הצד רשימה בשם <strong>Recent</strong>: עשרת האתרים האחרונים שביקרת בהם, כל אחד עם הסמל שלו ומתי היית
        בו. הרשימה כבויה עד שמפעילים אותה.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            פותחים את Settings → <strong>Apps</strong> → <strong>History</strong> ומפעילים את{' '}
            <strong>Show in sidebar and search</strong>. Chrome שואל אם לאפשר ל-WindoM לקרוא את היסטוריית הגלישה -
            לוחצים על <strong>Allow</strong>. אם מסרבים, המתג נשאר כבוי ושום דבר אחר לא משתנה.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>פותחים את סרגל הצד מסמל הרשימה בפינה הימנית התחתונה. לחיצה על פריט פותחת אותו בלשונית חדשה.</p>
        </div>
      </div>
      <p>
        הרשימה נקראת מההיסטוריה של Chrome עצמו, על המכשיר שלך; שום דבר ממנה לא נשלח לשום מקום. אותו מתג מוסיף דפים
        שביקרת בהם להצעות ה<Link to="/he/guide#search">חיפוש</Link> בלשונית החדשה.
      </p>
      <p>
        WindoM לא מבקש גישה להיסטוריה בהתקנה - רק כשמפעילים את האפשרות הזו. כיבוי שלה מחזיר את ההרשאה ל-Chrome. אם
        מסירים את ההרשאה בעצמך ב-<code>chrome://extensions</code>, הרשימה <strong>Recent</strong> מציגה כפתור{' '}
        <strong>Allow access</strong> במקום ההיסטוריה.
      </p>

      <h2 id="weather">ווידג'ט מזג אוויר</h2>
      <p>
        ווידג'ט מזג האוויר מציג טמפרטורה ותנאים בזמן אמת בסרגל העליון. הוא קורא נתונים מ-Open-Meteo, שאינו דורש מפתח API
        ואינו דורש חשבון - אין להירשם לשום שירות ואין מה להדביק.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            פותחים את Settings → הלשונית <strong>Weather</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            בשדה <strong>Temperature Unit</strong> בוחרים צלזיוס (°C) או פרנהייט (°F).
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            מתחילים להקליד שם עיר בשדה <strong>Location</strong> (למשל <code>Tel Aviv</code> או <code>New York</code>).
            ערים מתאימות מופיעות מתחת לשדה עם האזור והמדינה שלהן - לוחצים על זו שהתכוונת אליה.
          </p>
          <p>
            או לוחצים על <strong>Use my current location</strong> - רק אז הדפדפן שואל אם לאפשר ל-WindoM לדעת את מיקומך.
            WindoM לעולם לא שואל מיוזמתו; עד שמגדירים מיקום, הווידג'ט מציג <strong>Set location</strong>, שפותח את
            הלשונית הזו. אם חוסמים את הבקשה, מקלידים עיר במקום.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          <p>
            ווידג'ט מזג האוויר מופיע בפינה השמאלית העליונה של הלשונית החדשה. אין כפתור שמירה - השינוי חל ברגע הבחירה.
          </p>
        </div>
      </div>
      <div className="callout">
        <strong>מוצג מקום שגוי?</strong> כשמשתמשים במיקום הנוכחי והדפדפן אינו מספק נקודות ציון, WindoM נופל בחזרה לזיהוי
        גס לפי כתובת ה-IP, שיכול להיות רחוק למדי ב-VPN או ברשת סלולרית. הקלדת עיר ידנית מקבעת את המיקום.
      </div>
      <div className="callout tip">
        <strong>מתרענן כל 30 דקות</strong> - הקריאה האחרונה נשמרת במטמון, כך שהווידג'ט מוצג מלא כבר ברגע שלשונית חדשה
        נפתחת, ומתעדכן כשהקריאה הטרייה מגיעה.
      </div>

      <h2 id="finance">לוח מחוונים פיננסי</h2>
      <p>
        מעקב אחר מחירי מניות וקריפטו בזמן אמת ישירות בלשונית החדשה. המחירים מתעדכנים מ-Yahoo Finance ו-CoinGecko - אין
        צורך במפתח API או בחשבון. שני כרטיסים נגללים מופיעים בלוח: אחד למניות ואחד לקריפטו.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            פותחים את Settings → <strong>Apps</strong> → לוחצים על הכרטיס <strong>Finance</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            תחת <strong>Stocks</strong>, מקלידים שם חברה או טיקר בשורת החיפוש (למשל "Apple" או "AAPL") ובוחרים מתוצאות
            ההשלמה האוטומטית. חוזרים על כך לכל טיקר.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            תחת <strong>Crypto</strong>, מפעילים את המטבעות למעקב (Bitcoin, Ethereum, Solana ועוד).
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          <p>הלוחות הפיננסיים מופיעים במרכז הלשונית החדשה. כל כרטיס נגלל בנפרד ויש לו מתג הצגה/הסתרה בחלק העליון.</p>
        </div>
      </div>
      <div className="callout tip">
        <strong>מחירים נשמרים במטמון למשך 5 דקות</strong> - הוספת טיקר חדש עוקפת את המטמון מיד, כך שהמחיר מופיע מיידית.
      </div>

      <h2 id="templates">תבניות פריסה</h2>
      <p>
        ב-Settings → <strong>Templates</strong> יש שש פריסות מוכנות שמשנות כמה הגדרות בבת אחת: <strong>Minimal</strong>{' '}
        (רק השעון), <strong>Productivity</strong>, <strong>Inspiration</strong>, <strong>Dashboard</strong> (הכל פעיל),{' '}
        <strong>Night Owl</strong> ו-<strong>Deep Focus</strong>.
      </p>
      <p>
        לוחצים על <strong>Apply</strong> באחת מהן ומאשרים. תבנית דורסת רק את החלקים שהיא מכסה, וחלון האישור מפרט אותם;
        הקישורים, המפתחות והחיבורים שלך נשארים כמו שהם.
      </p>

      <h2 id="account">
        יצירת חשבון WindoM
        <span className="badge optional">אופציונלי</span>
      </h2>
      <p>
        חשבון WindoM מסנכרן את ההגדרות שלך בין מכשירים ונדרש לחיבור Google Calendar, Spotify או GitHub. ההרשמה חינמית
        ולוקחת פחות מדקה.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            פותחים את סמל גלגל השיניים (<strong>Settings</strong>) בפינה השמאלית התחתונה של הלשונית החדשה, ועוברים
            ללשונית <strong>Account</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            מזינים כתובת אימייל וסיסמה (לפחות 8 תווים) ולוחצים על <strong>Create account</strong>.
          </p>
          <p>
            לחלופין, לוחצים על <strong>Continue with Google</strong> כדי לא לנהל סיסמה.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>בודקים את תיבת הדואר, מחפשים את מייל האימות ולוחצים על הקישור שבו. זהו, ההתחברות הושלמה.</p>
        </div>
      </div>
      <div className="callout tip">
        <strong>סנכרון הגדרות</strong> - לאחר ההתחברות, פורמט השעון, הרקע המועדף, הווידג'טים והקישורים המהירים מסתנכרנים
        לענן ומופיעים בכל מכשיר שבו מחוברים ל-WindoM.
      </div>
      <h3>ניהול החשבון</h3>
      <p>
        כל מה שברשימה נמצא ב-Settings → <strong>Account</strong> אחרי ההתחברות.
      </p>
      <ul>
        <li>
          <strong>שם</strong> - משנים אותו תחת <strong>Profile</strong> ולוחצים על <strong>Save</strong>.
        </li>
        <li>
          <strong>סיסמה</strong> - בחשבון עם סיסמה אפשר להגדיר סיסמה חדשה תחת <strong>Change password</strong>. אם שכחת
          אותה, לוחצים על <strong>Forgot password?</strong> בטופס ההתחברות ו-WindoM שולח קישור לאיפוס במייל.
        </li>
        <li>
          <strong>Active sessions</strong> - כל דפדפן שמחובר לחשבון מופיע ברשימה. <strong>Revoke session</strong> מונע
          ממנו לחדש את ההתחברות; הוא עלול להמשיך לעבוד עד 15 דקות אחר כך.
        </li>
        <li>
          <strong>Sign out</strong> - מנתק את הדפדפן הזה מהחשבון.
        </li>
        <li>
          <strong>Delete account</strong> - תחת <strong>Danger Zone</strong>. מוחק לצמיתות את החשבון ואת כל מה שנשמר בו,
          כולל החיבורים ל-Calendar ול-Spotify. בחשבון עם סיסמה מתבקשים להזין אותה לאישור.
        </li>
      </ul>
      <p>
        מה החשבון שומר, ומה לעולם לא יוצא מהמכשיר שלך, מפורט ב<Link to="/he/privacy">מדיניות הפרטיות</Link>.
      </p>

      <h2 id="calendar">חיבור Google Calendar</h2>
      <p>
        WindoM מציג את אירועי Google Calendar הקרובים שלך בסרגל הצד כך שהיום שלך תמיד גלוי. זה דורש חשבון WindoM ואישור
        Google חד-פעמי.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>מוודאים שיש חשבון WindoM ושההתחברות אליו פעילה (Settings → Account).</p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            פותחים את Settings → <strong>Apps</strong> → לוחצים על הכרטיס <strong>Calendar</strong> → לוחצים על{' '}
            <strong>Connect</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            נפתח חלון אישור של Google. בוחרים את חשבון Google ולוחצים על <strong>Allow</strong>.
          </p>
          <p>
            WindoM מבקש גישת קריאה בלבד לאירועי היומן - הוא לא יכול ליצור, לערוך או למחוק דבר. ההרשאות המדויקות מפורטות
            ב<Link to="/he/privacy">מדיניות הפרטיות</Link>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          <p>סיימת. האירועים הקרובים מופיעים בסרגל הצד, מקובצים לפי יום.</p>
        </div>
      </div>
      <div className="callout tip">
        <strong>טווח הימים קדימה</strong> - כברירת מחדל מוצגים אירועים ל-7 הימים הבאים. אפשר לשנות ל-14 או 30 יום באותו
        כרטיס <strong>Calendar</strong> תחת Settings → Apps.
      </div>

      <h2 id="github">חיבור GitHub</h2>
      <p>
        ווידג'ט GitHub מציב שלושה מספרים בסרגל הצד: התראות שלא נקראו, בקשות משיכה שממתינות לסקירה שלך, ו-issues פתוחים
        שהוקצו לך. כל שורה מקשרת ישירות לעמוד המתאים ב-GitHub. נדרשים חשבון WindoM ואסימון גישה אישי שיוצרים בעצמך.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>מוודאים שיש חשבון WindoM ושההתחברות אליו פעילה (Settings → Account).</p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            נכנסים אל{' '}
            <a
              href="https://github.com/settings/tokens/new?scopes=notifications,repo&description=WindoM"
              target="_blank"
              rel="noreferrer"
            >
              github.com/settings/tokens/new
            </a>
            . הקישור מסמן מראש את שתי ההרשאות ש-WindoM צריך - <code>notifications</code> ו-<code>repo</code> - אז
            מוודאים שהן מסומנות, בוחרים תוקף נוח, ולוחצים על <strong>Generate token</strong>.
          </p>
          <p>
            מעתיקים את האסימון מיד. הוא מתחיל ב-<code>ghp_</code> ו-GitHub מציג אותו פעם אחת בלבד.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            פותחים את Settings → <strong>Apps</strong> → לוחצים על הכרטיס <strong>GitHub</strong>. מדביקים את האסימון
            בשדה <strong>Personal Access Token</strong> ולוחצים על <strong>Connect</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          <p>
            המספרים מופיעים בסרגל הצד ומתרעננים מעצמם. המתג <strong>Show GitHub in sidebar</strong> באותו כרטיס מסתיר את
            הווידג'ט בלי לנתק את החיבור.
          </p>
        </div>
      </div>
      <div className="callout warning">
        <strong>למה צריך את ההרשאה repo?</strong> ספירת בקשות הסקירה וה-issues שהוקצו לך מגיעה מממשק החיפוש של GitHub,
        שכולל מאגרים פרטיים רק עבור אסימון שנושא <code>repo</code>. ב-classic token ההרשאה הזו מעניקה גם גישת כתיבה,
        ש-WindoM לעולם אינו עושה בה שימוש - לכן כדאי להתייחס לאסימון כמו לסיסמה, ולבטל אותו דרך{' '}
        <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">
          הגדרות האסימונים שלך
        </a>{' '}
        אם מפסיקים להשתמש בווידג'ט.
      </div>

      <h2 id="spotify">
        חיבור Spotify
        <span className="badge byoa">BYOA</span>
      </h2>
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
      <h3>לפני שמתחילים</h3>
      <ul>
        <li>
          צריך חשבון WindoM (ראו <a href="#account">למעלה</a> - חינמי, לוקח דקה)
        </li>
        <li>
          צריך חשבון Spotify. גם חשבון חינמי וגם Premium מתחברים, אבל Spotify מאפשר לשלוט מבחוץ רק בחשבונות Premium -
          בחשבון חינמי הכפתורים לא עושים כלום ו-WindoM מציין שנדרש Premium.
        </li>
      </ul>
      <h3>שלב 1 - יצירת אפליקציית Spotify Developer</h3>
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
      <h3>שלב 2 - העתקת ה-Redirect URI מ-WindoM</h3>
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
      <h3>שלב 3 - הוספת ה-Redirect URI לאפליקציית Spotify</h3>
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
      <h3>שלב 4 - העתקת ה-Client ID וחיבור</h3>
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
      <h3>שירים מובילים</h3>
      <p>
        באותו כרטיס Spotify, מפעילים את <strong>Show top tracks in sidebar</strong> כדי להציג בסרגל הצד את עשרת השירים
        שהכי הושמעו בשבועות האחרונים. כל אחד מקשר לשיר ב-Spotify.
      </p>
      <h3>פתרון בעיות</h3>
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
    </DocsLayout>
  );
}
