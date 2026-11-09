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
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
