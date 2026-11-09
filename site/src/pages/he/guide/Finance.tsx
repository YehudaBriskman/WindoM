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
      <p>
        חזרה אל <Link to="/he/guide">המדריך למשתמש</Link>
      </p>
    </DocsLayout>
  );
}
