import { Link } from 'react-router';
import { DocsLayout } from '../../../components/DocsLayout';

/**
 * The Hebrew guide page for one feature: טמפרטורה ותנאים בזמן אמת בלשונית החדשה של WindoM מ-Open-Meteo. בלי מפתח API ובלי חשבון..
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. Mirrors the English page of the same name.
 */
export function Weather() {
  return (
    <DocsLayout path="/he/guide/weather" eyebrow="מדריך למשתמש" title="ווידג'ט מזג אוויר" dir="rtl">
      <h2>סקירה</h2>

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
      <h2>איך זה עובד</h2>
      <p>
        בכל לשונית חדשה הווידג'ט מציג קודם את הקריאה האחרונה ששמר, אם היא בת פחות מ-30 דקות, ואז מביא קריאה טרייה ומחליף
        אותה. כל עוד הלשונית פתוחה הוא מתרענן שוב כל 30 דקות. הווידג'ט הוא עיגול קטן עם הטמפרטורה והיחידה; מרחפים מעליו
        עם העכבר כדי להרחיב אותו ולראות סמל של התנאים, את העיר ותווית קצרה כמו <code>Clear</code>, <code>Rain</code> או{' '}
        <code>Snow</code>.
      </p>
      <p>
        Open-Meteo מחזיר קוד מספרי של מזג האוויר. WindoM הופך אותו לאחת התוויות האלה: Clear, Partly Cloudy, Clouds, Fog,
        Drizzle, Rain, Snow או Thunderstorm, ובוחר סמל יום או לילה מאותה קריאה.
      </p>

      <h2>ההגדרות בפירוט</h2>
      <ul>
        <li>
          <strong>Temperature Unit</strong> - פרנהייט (°F) או צלזיוס (°C). ברירת המחדל היא פרנהייט. שינוי היחידה ממיר את
          הקריאה השמורה מיד, כך שהמספר מתעדכן בלי להמתין לרענון.
        </li>
        <li>
          <strong>Location</strong> - שם עיר. ההצעות מתחילות אחרי שני תווים, ממתינות להפסקה קצרה בהקלדה, ומציגות עד שש
          ערים עם האזור והמדינה. בחירה שומרת את שם העיר; הווידג'ט מחפש את הקואורדינטות של העיר ומשתמש בהתאמה הטובה
          ביותר. ניקוי השדה מחזיר למיקום הנוכחי. אם עיר שהוקלדה לא נמצאת, הווידג'ט מציג <strong>City not found</strong>.
        </li>
        <li>
          <strong>Use my current location</strong> - מבקש מהדפדפן את המיקום שלך. זה המקום היחיד ש-WindoM שואל בו. אחרי
          האישור השדה מתרוקן וב-Settings מופיע <strong>Using your current location.</strong>
        </li>
        <li>
          אפשר להסתיר את הווידג'ט לגמרי עם המתג <strong>Weather</strong> ב-Settings → General; כברירת מחדל הוא מוצג.
        </li>
      </ul>

      <h2>מאיפה הנתונים מגיעים ומה יוצא מהמכשיר</h2>
      <p>ווידג'ט מזג האוויר פונה רק לשירותים שהוא צריך, ורק לפי האפשרויות שבהן אתם משתמשים:</p>
      <ul>
        <li>
          <strong>Open-Meteo</strong> (<code>api.open-meteo.com</code>) - הטמפרטורה הנוכחית, התנאים וסימון יום/לילה.
          נשלחים קו הרוחב וקו האורך של המקום שנבחר והיחידה שבחרת.
        </li>
        <li>
          <strong>Open-Meteo geocoding</strong> (<code>geocoding-api.open-meteo.com</code>) - הופך את העיר שהוקלדה
          לקואורדינטות ומספק את הצעות הערים ב-Settings. נשלח הטקסט שהקלדת.
        </li>
        <li>
          <strong>OpenStreetMap Nominatim</strong> (<code>nominatim.openstreetmap.org</code>) - רק כשמשתמשים במיקום
          הנוכחי: הופך את הקואורדינטות לשם עיר להצגה. נשלחות הקואורדינטות האלה.
        </li>
        <li>
          <strong>ipapi.co</strong> - רק כמוצא אחרון, אחרי שאישרת מיקום אבל הדפדפן לא הצליח להחזיר מיקום ולא נשמר מיקום
          מ-24 השעות האחרונות. הוא מחזיר מיקום גס לפי כתובת ה-IP.
        </li>
      </ul>
      <p>
        אף אחד מהם לא דורש מפתח API או חשבון. המיקום האחרון שלך (משמש למזג אוויר בלבד) והקריאה האחרונה נשמרים על המכשיר.
        אם מקלידים עיר בעצמכם, המיקום לא מתבקש מהדפדפן בכלל. ב<Link to="/he/privacy">מדיניות הפרטיות</Link> מופיעים כל
        השירותים ש-WindoM פונה אליהם.
      </p>

      <h2>עיר שהוקלדה או מיקום נוכחי</h2>
      <ul>
        <li>
          <strong>עיר שהוקלדה היא קבועה.</strong> היא לא תלויה במקום שבו אתם נמצאים, עובדת בכל רשת ולעולם לא מקפיצה בקשה
          מהדפדפן. זו הבחירה הטובה אם אתם משתמשים ב-VPN או רוצים את אותו מקום בכל יום.
        </li>
        <li>
          <strong>מיקום נוכחי עוקב אחריכם.</strong> הוא משתמש במיקום הדפדפן כשההרשאה כבר ניתנה, נופל למיקום שנשמר ב-24
          השעות האחרונות, ורק אחר כך לזיהוי לפי IP.
        </li>
      </ul>

      <h2>טיפים</h2>
      <ul>
        <li>
          כשמקלידים עיר, הווידג'ט משתמש בהתאמה הראשונה לשם שנשמר. אם השם משותף לכמה מקומות והווידג'ט מציג את הלא נכון,
          נסו איות אחר או מפורט יותר.
        </li>
        <li>
          הסתירו את הווידג'ט עם המתג Weather, או השתמשו בתבניות <strong>Minimal</strong>, <strong>Night Owl</strong> או{' '}
          <strong>Deep Focus</strong> מתוך <Link to="/he/guide/templates">תבניות פריסה</Link>, שמכבות אותו.
        </li>
      </ul>

      <h2>פתרון בעיות</h2>
      <ul>
        <li>
          <strong>הווידג'ט מציג סמל סיכה ו-"Set location".</strong> לא הוגדרה עיר ומיקום לא אושר. לוחצים עליו כדי לפתוח
          את Settings → Weather ובוחרים אחת משתי האפשרויות.
        </li>
        <li>
          <strong>"City not found".</strong> שירות ה-geocoding לא מצא התאמה לשם שהוקלד. נסו איות באנגלית, או בחרו מתוך
          ההצעות.
        </li>
        <li>
          <strong>מופיע סמל אזהרה.</strong> הווידג'ט לא הצליח להביא מזג אוויר ולא הייתה לו קריאה שמורה. הוא ינסה שוב
          ברענון הבא או בלשונית החדשה הבאה.
        </li>
        <li>
          <strong>אין חיבור לאינטרנט או ש-Open-Meteo לא נגיש.</strong> אם נשמרה קריאה קודמת, הווידג'ט ממשיך להציג אותה
          במקום שגיאה.
        </li>
        <li>
          <strong>"Location access is blocked for WindoM".</strong> ב-Chrome ההרשאה חסומה. אפשרו מיקום לתוסף בהגדרות
          האתר של Chrome ונסו שוב, או הקלידו עיר.
        </li>
        <li>
          <strong>הטמפרטורה ביחידה הלא נכונה.</strong> בדקו את <strong>Temperature Unit</strong> ב-Settings → Weather.
        </li>
      </ul>

      <h2>דפים קשורים</h2>
      <ul>
        <li>
          <Link to="/he/guide/clock">שעון</Link> - שעה ותאריך בלשונית החדשה
        </li>
        <li>
          <Link to="/he/guide/templates">תבניות פריסה</Link> - תבניות שמציגות או מסתירות את מזג האוויר
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
