import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: מחירי מניות וקריפטו בזמן אמת בלשונית החדשה של WindoM, מ-Yahoo Finance ומ-CoinGecko..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Finance() {
  return (
    <DocsLayout path="/he/guide/finance" eyebrow="מדריך למשתמש" title="לוח מחוונים פיננסי" dir="rtl">
      <h2>סקירה</h2>

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
      <h2>מה מוצג בכל כרטיס</h2>
      <p>
        כל שורה כוללת סמל, מחיר ושינוי באחוזים. המחירים מוצגים עם סימן דולר (מחירי קריפטו מתבקשים מ-CoinGecko בדולרים
        אמריקאיים). בכרטיס <strong>Stocks</strong> האחוז הוא השינוי המדווח ליום המסחר הנוכחי; בכרטיס{' '}
        <strong>Crypto</strong> זה השינוי ב-24 השעות האחרונות. שינוי חיובי מסומן בסימן פלוס. כרטיס שיש בו יותר שורות ממה
        שנכנס אפשר לגלול בנפרד.
      </p>
      <p>
        כרטיס מופיע רק כשיש מה להציג בו: לפחות טיקר (או מטבע) אחד ברשימה, והמתג <strong>Show</strong> שלו דולק. כשאין
        דבר ברשימות, לא מוצג שום כרטיס Finance.
      </p>

      <h2>ההגדרות בפירוט</h2>
      <ul>
        <li>
          <strong>Stocks</strong> - תיבת חיפוש המבוססת על Yahoo Finance. התוצאות מוגבלות למניות, ETF, מדדים וקרנות
          נאמנות, עד שמונה בכל פעם, ואפשר לנוע ביניהן עם מקשי החצים, לבחור עם <kbd>Enter</kbd> ולסגור את הרשימה עם{' '}
          <kbd>Esc</kbd>. טיקרים שנבחרו מופיעים כגלולות קטנות; ה-<strong>x</strong> שבגלולה מסיר אותה. בחירה בטיקר שכבר
          נבחר מסירה אותו.
        </li>
        <li>
          <strong>Crypto</strong> - רשימה קבועה של שמונה מטבעות: Bitcoin (BTC), Ethereum (ETH), Solana (SOL), XRP,
          Dogecoin (DOGE), Cardano (ADA), Avalanche (AVAX) ו-Chainlink (LINK). לוחצים על מטבע כדי לעקוב אחריו, ולוחצים
          שוב כדי להפסיק. המחירים מתבקשים בדולרים.
        </li>
        <li>
          <strong>Show</strong> - מופיע ליד <strong>Stocks</strong> או <strong>Crypto</strong> ברגע שברשימה יש לפחות
          פריט אחד. הוא מסתיר את הכרטיס בלי למחוק את הרשימה.
        </li>
      </ul>
      <p>
        שתי הרשימות מתחילות ריקות, ולכן שום דבר לא מופיע עד שמוסיפים משהו. הוספת הטיקר או המטבע הראשונים מפעילה את
        הכרטיס אוטומטית; הסרת האחרון מכבה אותו.
      </p>

      <h2>איך זה עובד</h2>
      <p>
        WindoM מביא את המניות והמטבעות שלך יחד ומרענן אותם כל 5 דקות כל עוד הלשונית פתוחה. בין רענונים התוצאה האחרונה
        נשמרת במטמון על המכשיר, כך שלשונית חדשה יכולה להציג מחירים מיד ולא לחכות. שינוי באחת הרשימות עוקף את המטמון
        ומביא נתונים מיד.
      </p>
      <p>
        במניות, WindoM מבקש מ-Yahoo Finance את כל הטיקרים שלך בבקשה אחת. אם הבקשה נכשלת או חוזרת ריקה, הוא עובר לבקש כל
        טיקר בנפרד וקורא מהתוצאה את המחיר האחרון ואת הסגירה הקודמת. טיקר שלא ניתן לתמחר מושמט מהכרטיס ולא מוצג עם מספר
        שגוי.
      </p>

      <h2>מאיפה הנתונים מגיעים</h2>
      <ul>
        <li>
          <strong>Yahoo Finance</strong> (<code>query1.finance.yahoo.com</code>) - הצעות חיפוש למניות בזמן ההקלדה
          ב-Settings, ומחירי מניות, ETF ומדדים. נשלח הטקסט שהקלדת בתיבת החיפוש או סמלי הטיקרים שברשימה.
        </li>
        <li>
          <strong>CoinGecko</strong> (<code>api.coingecko.com</code>) - מחירי קריפטו. נשלחים המזהים של המטבעות שאתה עוקב
          אחריהם.
        </li>
      </ul>
      <p>
        אלה שירותים ציבוריים שאינם דורשים מפתח או התחברות, ו-WindoM אינו שולח להם את שמך או את החשבון שלך. רשימת המעקב
        עצמה נשמרת בהגדרות הדפדפן; היא מגיעה לשרתים של WindoM רק אם יש לך חשבון WindoM וההגדרות שלך מסתנכרנות. ב
        <Link to="/he/privacy">מדיניות הפרטיות</Link> מופיעים כל השירותים שהתוסף פונה אליהם.
      </p>
      <div className="callout warn">
        <strong>מידע, לא ייעוץ.</strong> המחירים מוצגים כפי שהשירותים הנזכרים מחזירים אותם. WindoM אינו מבטיח שערך מסוים
        עדכני או שלם, ולכן אין להסתמך על הלוח לצורך החלטות מסחר.
      </div>

      <h2>טיפים</h2>
      <ul>
        <li>חפשו לפי שם החברה אם אינכם יודעים את הטיקר; הסמל מוצג ליד כל תוצאה.</li>
        <li>שמרו על רשימות קצרות. הכרטיסים נועדו להעיף בהם מבט; כמה טיקרים נקראים טוב יותר מגלילה ארוכה.</li>
        <li>
          שלבו את הלוח עם פריסה שקטה יותר מ<Link to="/he/guide/templates">תבניות פריסה</Link>, או השתמשו ב
          <Link to="/he/guide/focus">מצב Focus</Link> כשרוצים שהלשונית תישאר מחוץ לדרך.
        </li>
      </ul>

      <h2>פתרון בעיות</h2>
      <p>
        <strong>הכרטיס מציג "Unable to load".</strong> לא ניתן היה להגיע לשירותים, ולכן אין מחירים להציג בכרטיס הזה.
        בדקו את החיבור ופתחו לשונית חדשה; WindoM ינסה שוב ברענון הבא, בעוד 5 דקות.
      </p>
      <p>
        <strong>הכרטיס מציג "No data".</strong> השירות ענה אבל לא החזיר דבר שמיש עבור הרשימה שלך, למשל סמל ש-Yahoo
        Finance אינו מתמחר. הסירו את הסמל וחפשו אותו שוב.
      </p>
      <p>
        <strong>הכרטיס מציג "Loading…".</strong> זה מוצג במהלך הטעינה הראשונה, לפני שיש מחירים.
      </p>
      <p>
        <strong>הוספתי מטבע ושום דבר לא הופיע.</strong> פתחו שוב לשונית חדשה, או המתינו לרענון הבא. אם CoinGecko אינו
        נגיש, כרטיס Crypto מציג שגיאה עד שהוא עונה.
      </p>

      <h2>דפים קשורים</h2>
      <ul>
        <li>
          <Link to="/he/guide/templates">תבניות פריסה</Link> - סידור הלשונית החדשה סביב הלוח
        </li>
        <li>
          <Link to="/he/guide/focus">טיימר פוקוס</Link> - להשקיט את הלשונית בזמן עבודה
        </li>
        <li>
          <Link to="/he/guide/account">חשבון</Link> - סנכרון הגדרות בין דפדפנים
        </li>
        <li>
          <Link to="/he/privacy">מדיניות פרטיות</Link> ו<Link to="/he/support">תמיכה</Link>
        </li>
      </ul>
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
