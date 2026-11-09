import { DocsLayout } from '../../components/DocsLayout';
import { GITHUB_URL, STORE_URL } from '../../lib/site';
import { Link } from 'react-router';

/**
 * Hebrew support page.
 *
 * Translated from `pages/Support.tsx`, with the same headings in the same order
 * and the same explicit ids on the two headings other pages link to. Product
 * names, file paths and anything a reader has to type stay in English -
 * `chrome://extensions` translated is a string that does not work, and
 * "Settings → Apps → Calendar" has to match the English interface the
 * extension actually shows.
 */
export function Support() {
  return (
    <DocsLayout path="/he/support" eyebrow="עזרה" title="תמיכה" subtitle="פתרונות לתקלות שבאמת קורות" dir="rtl">
      <p>
        רוב התקלות ב-WindoM נופלות לאחת מכמה קטגוריות. כדאי לנסות קודם את הפתרון המתאים למטה. אם שום דבר לא עוזר,{' '}
        <a href={`${GITHUB_URL}/issues/new`}>אפשר לפתוח issue ב-GitHub</a> - או לעבור ל
        <Link to="/he/contact">יצירת קשר</Link> לכתובת המייל, ולמידע על זמני התגובה.
      </p>

      <h2>התחברות וחשבון</h2>

      <h3>ההגדרות לא עברו איתי למחשב אחר</h3>
      <p>
        ההגדרות נוסעות עם חשבון WindoM. אחרי התחברות דרך <strong>Settings → Account</strong> בשני המחשבים, פורמט השעון,
        בחירת הרקע, סידור הווידג'טים והקישורים המהירים יגיעו גם לשני. אם יש התחברות במחשב אחד ולא בשני, אין דבר שמקשר
        ביניהם.
      </p>
      <p>
        בלי חשבון, סנכרון הפרופיל של Chrome הוא זה שמעביר אותן, וזה מחייב ששני המחשבים יהיו מחוברים לאותו חשבון Chrome
        עם סנכרון פעיל - והוא נעצר בגבול אותו פרופיל, כך שדפדפן אחר או פרופיל עבודה לא יראו אותן.
      </p>
      <p>
        בכל מקרה, תמונות רקע, מזג אוויר שנשמר במטמון והיסטוריית הלשוניות לא נכללים בכוונה. הם גדולים, והם נשארים על
        המכשיר שיצר אותם.
      </p>

      <h3>שכחתי את הסיסמה</h3>
      <p>
        בטופס ההתחברות ב-<strong>Settings → Account</strong> לוחצים על <strong>Forgot password?</strong>, מזינים את
        כתובת המייל ולוחצים על <strong>Send reset link</strong>. הקישור מגיע במייל. מי שנרשם עם{' '}
        <strong>Continue with Google</strong> מתחבר שוב באותה דרך.
      </p>

      <h3>ההודעה "You've reached the maximum number of active sessions"</h3>
      <p>
        כל חשבון יכול להיות מחובר במספר מוגבל של דפדפנים בו-זמנית. אפשר להתנתק בדפדפן שכבר לא בשימוש, או, מדפדפן שעדיין
        מחובר, לפתוח את <strong>Settings → Account → Active sessions</strong> וללחוץ על <strong>Revoke session</strong>{' '}
        ליד זה שרוצים להסיר. התחברות שבוטלה עלולה להמשיך לעבוד עד 15 דקות לפני שהיא נגמרת.
      </p>

      <h3>מסך "האפליקציה לא אומתה" בחיבור ל-Google</h3>
      <p>
        Google מציגה את המסך הזה לכל אפליקציה שהאימות שלה מול Google טרם הושלם, ובטוח להמשיך מעבר לו. מה שלא יהיה כתוב
        במסך, התוסף מבקש אך ורק <em>לקרוא</em> את היומן שלך - ההרשאות המדויקות מפורטות ב
        <Link to="/he/privacy">מדיניות הפרטיות</Link>.
      </p>

      <h2>ווידג'טים וחיבורים</h2>

      <h3 id="spotify-connect">Spotify לא מתחבר</h3>
      <p>
        כמעט תמיד מדובר באחד משני דברים: ה-Client ID שהודבק ב-WindoM אינו של האפליקציה שלך, או שה-Redirect URI לא נוסף
        ונשמר בהגדרות האפליקציה ב-Spotify Developer Dashboard - מה שמופיע כשגיאת <em>Invalid Client</em>. מעתיקים את
        ה-URI בכפתור <strong>Copy</strong> שב-<strong>Settings → Apps → Spotify</strong> במקום להקליד אותו, וזוכרים שהוא
        משתנה אחרי התקנה מחדש של Chrome או החלפת פרופיל. <Link to="/he/guide/spotify">החלק על Spotify במדריך</Link> עובר
        על כל שלב, ויש בו רשימת פתרון בעיות משלו.
      </p>

      <h3>הכפתורים של Spotify לא עושים כלום</h3>
      <p>
        Spotify מאפשר לשלוט מבחוץ רק בחשבונות Premium. בחשבון חינמי WindoM יכול להציג מה מתנגן ואת השירים המובילים, אבל
        play, pause, next ו-previous נדחים, ו-WindoM מציין שנדרש Premium.
      </p>

      <h3>מזג האוויר מציג מקום שגוי</h3>
      <p>
        כשבחרת <strong>Use my current location</strong>, WindoM קורא את המיקום שלך מהדפדפן, ואם הדפדפן לא מצליח לאתר
        אותך הוא נופל בחזרה לזיהוי גס לפי כתובת ה-IP, שיכול להיות רחוק למדי ב-VPN או ברשת סלולרית. אפשר להגדיר עיר ידנית
        תחת <strong>Settings → Weather</strong>.
      </p>

      <h2>הרשאות</h2>

      <h3 id="all-sites">למה WindoM צריך גישה לכל האתרים?</h3>
      <p>
        בשביל <Link to="/he/guide/search">תיבת החיפוש</Link>. לחיצה על{' '}
        <bdi>
          <kbd>Ctrl</kbd> + <kbd>Win</kbd> + <kbd>H</kbd>
        </bdi>{' '}
        (
        <bdi>
          <kbd>Ctrl</kbd> + <kbd>Cmd</kbd> + <kbd>H</kbd>
        </bdi>{' '}
        ב-Mac) פותחת אותה מעל כל דף שנמצאים בו, וכדי שזה יעבוד בכל אתר, סקריפט קטן צריך להיטען לכל דף. Chrome מתאר את זה
        כיכולת לקרוא ולשנות נתונים בכל האתרים.
      </p>
      <p>
        הסקריפט נשאר מוסתר עד שלוחצים על הקיצור. הדבר היחיד שהוא בודק בדף הוא אם הדף כתוב מימין לשמאל, כדי שהתיבה תתאים
        לו; הוא לא קורא את תוכן הדף ולא שולח עליו שום דבר לשום מקום. הקוד נמצא ב-<code>web/src/content/</code> ב
        <a href={GITHUB_URL}>מאגר הקוד</a>.
      </p>
      <p>שאר ההרשאות ש-Chrome מציג משמשות ל:</p>
      <ul>
        <li>
          <strong>Tabs</strong> - סרגל הלשוניות, ולשוניות פתוחות כהצעות חיפוש
        </li>
        <li>
          <strong>Identity</strong> - חלונות ההתחברות של Google ושל Spotify
        </li>
        <li>
          <strong>Storage</strong> - ההגדרות, המשימות והתמונות שלך, על המכשיר
        </li>
      </ul>
      <p>
        <strong>History</strong> לא מתבקשת בהתקנה. Chrome מבקש אותה רק כשמפעילים את{' '}
        <Link to="/he/guide/history">היסטוריית הגלישה</Link>, לרשימת Recent ולהיסטוריה כהצעות חיפוש; כיבוי היסטוריית
        הגלישה מחזיר אותה.
      </p>
      <p>
        הרשימה המלאה של מה שנשמר ושל כל שירות ש-WindoM פונה אליו נמצאת ב<Link to="/he/privacy">מדיניות הפרטיות</Link>.
      </p>

      <h2>תוקן בגרסאות האחרונות</h2>
      <p>
        אם אחד מאלה מתאים למה שקורה אצלך, כדאי קודם לבדוק את הגרסה ב-
        <code>chrome://extensions</code>. Chrome בדרך כלל מעדכן תוספים תוך כמה שעות, והכפתור <strong>Update</strong>{' '}
        באותו עמוד מאלץ עדכון מיידי.
      </p>

      <h3>Google Calendar מתנתק שוב ושוב</h3>
      <p>
        אם היומן חובר לפני 26 באוקטובר 2026 והחיבור התנתק אחרי שבוע בערך - זו הייתה תקלת הגדרה אצלנו, לא משהו שעשית.
        Google מבטלת את ההרשאה לאפליקציות שמסך ההסכמה שלהן עדיין במצב בדיקה אחרי שבעה ימים, וזה היה המצב של WindoM. המסך
        פורסם ב-26 באוקטובר 2026, וחיבורים שנוצרו מאז נשארים פעילים.
      </p>
      <p>
        צריך לחבר מחדש פעם אחת דרך <strong>Settings → Apps → Calendar → Connect</strong>, ואז זה אמור להחזיק.
      </p>

      <h3>ההתחברות נראית מוצלחת ואז מנתקת אותי</h3>
      <p>
        תוקן בגרסה <strong>1.5.1</strong>. תקלה בשירות מחובר אחד - יומן, Spotify - נקראה כאילו כל ההתחברות פגה, מה שניתק
        אותך רגעים אחרי שהתחברת. ככל שהיו יותר שירותים מחוברים, זה קרה מהר יותר.
      </p>

      <h3>Spotify מתעלם מהלחיצה הראשונה</h3>
      <p>
        גם זה תוקן ב-<strong>1.5.1</strong>. הפקודות play, pause, next ו-previous הגיעו ל-Spotify כמו שצריך, אבל הדשבורד
        המשיך להציג את המצב שמלפני הפקודה למשך עד חמש עשרה שניות - כך שזה נראה כאילו כלום לא קרה, ולחיצה נוספת נראתה
        כאילו היא מתקנת את זה.
      </p>

      <h3>הווידג'ט של Gmail נעלם</h3>
      <p>
        כובה בגרסה <strong>1.5.0</strong>. קריאת דואר דרשה הרשאת Google מסוג שמחייב הערכת אבטחה שנתית של צד שלישי, בעלות
        של מאות עד אלפי דולרים בשנה. זה לא בר-קיימא עבור תוסף חינמי, ולכן הווידג'ט הוסר במקום לממן אותו על ידי שינוי מה
        ש-WindoM עושה עם הנתונים שלך.
      </p>
      <p>
        הקוד עדיין נמצא ב-repository מאחורי הגדרה בצד השרת שכבויה בשרת שאליו התוסף המפורסם מתחבר, ולכן עדיין אפשר למצוא
        את Gmail בקוד המקור. בשרת הזה ההרשאה אינה מבוקשת והכרטיס אינו מופיע. מי שמריץ שרת משלו יכול להפעיל אותה אצלו.
      </p>

      <h2>דיווח על משהו אחר</h2>
      <p>כדי שתקלה תטופל מהר, כדאי לכלול:</p>
      <ul>
        <li>
          את גרסת WindoM מתוך <code>chrome://extensions</code>
        </li>
        <li>את גרסת Chrome ומערכת ההפעלה</li>
        <li>מה עשית, מה קרה, ומה ציפית שיקרה במקום</li>
        <li>
          כל מה שמופיע בקונסול - לחיצה ימנית על הלשונית החדשה, <strong>Inspect</strong>, ואז הלשונית{' '}
          <strong>Console</strong>. שגיאות שם הן בדרך כלל כל התשובה.
        </li>
      </ul>
      <p>
        <a href={`${GITHUB_URL}/issues/new`}>Issues ב-GitHub</a> היא הדרך המהירה ביותר. לכל מה שלא צריך להיות פומבי -
        דיווח אבטחה, או שאלה על הנתונים שלך - ראו <Link to="/he/contact">יצירת קשר</Link>.
      </p>
      <p>
        WindoM הוא קוד פתוח, כך שאפשר גם לקרוא את הקוד עבור כל התנהגות שמתוארת כאן:{' '}
        <a href={GITHUB_URL}>github.com/YehudaBriskman/WindoM</a>. גם ביקורות ודיווחי תקלות ב
        <a href={STORE_URL}>Chrome Web Store</a> נקראים, אם כי GitHub הוא הדרך המהירה יותר - בחנות אין אפשרות להשיב
        בשאלת המשך.
      </p>
    </DocsLayout>
  );
}
