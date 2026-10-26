import { DocsLayout } from '../../components/DocsLayout';

/**
 * Hebrew privacy policy.
 *
 * A translation, not a second policy. The English text at /privacy.html is the
 * authoritative one and is the version under Google's OAuth review - this page
 * says so in its own first paragraph, which is both standard practice and the
 * honest position: a translated contract that claims equal force is a
 * liability, because the two can only ever be as aligned as the translation.
 *
 * Scope names, permission names and service names stay in English, because
 * those are the exact strings Google's consent screen and Chrome's permission
 * prompts show.
 */
export function Privacy() {
  return (
    <DocsLayout
      path="/he/privacy"
      eyebrow="משפטי"
      title="מדיניות פרטיות"
      subtitle="עודכן לאחרונה: 27 באפריל 2026"
      dir="rtl"
    >
      <div className="callout">
        <strong>הנוסח המחייב הוא האנגלי.</strong> תרגום זה ניתן לנוחות הקריאה בלבד. במקרה
        של סתירה או אי-בהירות, <a href="/privacy.html">הנוסח האנגלי</a> הוא הקובע.
      </div>

      <p>
        WindoM הוא תוסף ל-Chrome שמחליף את עמוד הלשונית החדשה בדשבורד פרודוקטיביות אישי.
        מדיניות זו מסבירה בדיוק אילו נתונים נאספים, מה נשאר כולו על המכשיר שלך, וכיצד
        נעשה בהם שימוש. איננו מפרסמים, עוקבים או מוכרים נתונים.
      </p>

      <h2>מה נשאר על המכשיר שלך</h2>
      <p>
        הפריטים הבאים נשמרים אך ורק בדפדפן שלך באמצעות <code>chrome.storage</code>{' '}
        ו<strong>לעולם אינם נשלחים לשום שרת</strong>:
      </p>
      <ul>
        <li>הגדרות והעדפות הדשבורד</li>
        <li>משימות וקישורים מהירים</li>
        <li>תמונות רקע שהעלית בעצמך</li>
        <li>תמונות רקע שנשמרו במטמון מ-Unsplash (היסטוריית תמונות)</li>
        <li>נתוני מזג אוויר שנשמרו במטמון</li>
        <li>נקודות הציון האחרונות הידועות של מיקומך (לשימוש מזג האוויר בלבד)</li>
        <li>רשימת המעקב הפיננסית - המניות והמטבעות שהוספת</li>
        <li>היסטוריית לשוניות המוצגת בסרגל הצד (נקראת מהדפדפן המקומי, לעולם לא נשלחת)</li>
        <li>מצב ההדרכה והסגירה שלה</li>
      </ul>

      <h2>חשבון (אופציונלי)</h2>
      <p>
        יצירת חשבון היא אופציונלית לחלוטין. הדשבורד עובד במלואו ללא התחברות. אם בחרת
        ליצור חשבון, הפריטים הבאים נשמרים בשרתים שלנו:
      </p>
      <ul>
        <li>כתובת האימייל שלך וסיסמה מגובבת ב-bcrypt</li>
        <li>שם התצוגה שלך</li>
        <li>הגדרות הדשבורד שלך - מסונכרנות כדי שההעדפות יהיו עקביות בין המכשירים</li>
        <li>רשומות הפעלות פעילות (לניהול התחברויות ולזיהוי גישה לא מורשית)</li>
      </ul>
      <p>
        אפשר למחוק את החשבון ואת כל הנתונים הקשורים אליו בצד השרת בכל רגע דרך{' '}
        <strong>Settings → Account → Delete account</strong>. כל הנתונים נמחקים לצמיתות
        ומיידית.
      </p>

      <h2>חיבור ליומן Google (אופציונלי)</h2>
      <p>
        אם תחבר את חשבון Google שלך, WindoM מבקש את ההרשאות הבאות לקריאה בלבד, במסך הסכמה
        אחד: <code>calendar.readonly</code>, <code>openid</code>, <code>email</code>,{' '}
        <code>profile</code>. זו הרשימה המלאה; שום דבר נוסף אינו מבוקש.
      </p>
      <p>
        השימוש של WindoM במידע המתקבל מממשקי Google עומד ב
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noreferrer"
        >
          Google API Services User Data Policy
        </a>
        , לרבות דרישות ה-Limited Use. נתוני משתמש מ-Google לעולם אינם נמכרים, אינם משמשים
        לפרסום, אינם משמשים לאימון מודלים כלשהם, ואינם נקראים בידי אדם - אלא בהסכמתך
        המפורשת, לצורך פתרון תקלה שדיווחת עליה, או כאשר החוק מחייב זאת.
      </p>
      <p>
        אסימון הגישה שלך ל-Google נשמר <strong>מוצפן במנוחה</strong> בשרתים שלנו באמצעות
        AES-256-GCM, ומשמש אך ורק לביצוע בקשות בשמך. איננו משתפים אותו עם צדדים שלישיים.
      </p>
      <ul>
        <li>
          <strong>יומן:</strong> אנו מושכים את האירועים הקרובים שלך (כותרת, שעה, שם היומן)
          ומציגים אותם בדשבורד. איננו קוראים תיאורי אירועים, משתתפים, או יומן כלשהו מעבר
          לרשימה המוצגת.
        </li>
      </ul>
      <p>
        ניתוק Google דרך <strong>Settings → Apps</strong> מבטל מיידית את האסימון השמור
        ומוחק את כל הנתונים שנשמרו במטמון.
      </p>
      <p>
        <strong>Gmail כבוי.</strong> גרסאות קודמות יכלו להציג מספר הודעות שלא נקראו ואת
        שורות הנושא של דואר אחרון, מה שדרש את הרשאת <code>gmail.readonly</code> המוגבלת של
        Google. הקוד של הווידג'ט עדיין נמצא בתוסף ובשרת, אך הוא תלוי בהגדרה בצד השרת
        (<code>GMAIL_ENABLED</code>) שהיא <strong>כבויה</strong> בשרת שאליו התוסף המפורסם
        מתחבר. כל עוד היא כבויה, ההרשאה אינה נוספת למסך ההסכמה, השרת דוחה כל בקשת דואר,
        וכרטיס Gmail אינו מופיע תחת <strong>Settings → Apps</strong>. שום נתוני דואר אינם
        מגיעים לשרתים שלנו, ואסימונים שניתנו תחת ההסכמה הישנה מאבדים את הרשאת Gmail בפעם
        הבאה שתתחבר מחדש.
      </p>
      <p>
        הפעלת ההגדרה הזו מחייבת בקשה של הרשאה מוגבלת, ש-Google מתירה רק לאחר הערכת אבטחה
        שנתית של צד שלישי. אם היא תופעל אי פעם בשירות המתארח, מדיניות זו תעודכן ותתאר מה
        נקרא עוד לפני שהשינוי יעלה לאוויר. מי שמריץ שרת WindoM משלו יכול להפעיל אותה אצלו,
        ואז נתוני הדואר מגיעים לשרת שלו ומדיניות זו אינה חלה עליהם.
      </p>

      <h2>חיבור ל-Spotify (אופציונלי)</h2>
      <p>
        WindoM משתמש במודל <strong>Bring Your Own App (BYOA)</strong> עבור Spotify. אתה
        רושם אפליקציית Spotify Developer חינמית ומספק את ה-Client ID שלה בהגדרות WindoM.
        משמעות הדבר היא שנתוני המוזיקה שלך זורמים בין הדפדפן שלך לבין אפליקציית Spotify
        הרשומה על שמך - WindoM אינו מפעיל לקוח Spotify משותף.
      </p>
      <p>
        אסימון ה-OAuth שלך ל-Spotify נשמר מוצפן בשרתים שלנו ומשמש אך ורק למשיכת השיר
        המתנגן כעת (אמן, כותרת, עטיפת אלבום, מצב נגינה). איננו ניגשים לספרייה, לפלייליסטים,
        להיסטוריית ההאזנה או לנתוני העוקבים שלך. ניתוק Spotify מוחק מיידית את האסימון
        השמור.
      </p>

      <h2>הרשאות הדפדפן</h2>
      <p>WindoM מבקש את הרשאות Chrome הבאות ומשתמש בהן כמתואר:</p>
      <table>
        <thead>
          <tr>
            <th>הרשאה</th>
            <th>מדוע היא נדרשת</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>storage</code> / <code>unlimitedStorage</code>
            </td>
            <td>
              שמירת ההגדרות, המשימות, הקישורים, התמונות השמורות ורשימת המעקב הפיננסית
              בדפדפן שלך. <code>unlimitedStorage</code> נדרש רק עבור תמונות רקע שהועלו
              מקומית.
            </td>
          </tr>
          <tr>
            <td>
              <code>tabs</code>
            </td>
            <td>
              פתיחה, סגירה והצמדה של לשוניות מסרגל הצד. כותרות וכתובות של לשוניות משמשות
              מקומית בלבד למילוי סרגל הצד ולעולם אינן נשלחות לשום מקום.
            </td>
          </tr>
          <tr>
            <td>
              <code>history</code>
            </td>
            <td>
              קריאת היסטוריית הגלישה האחרונה שלך להצגת אתרים אחרונים בסרגל הצד ולהצעות
              חיפוש. נקראים רק 7 הימים האחרונים, ללא כפילויות לפי שם מארח, ועד 10 רשומות.
              נתונים אלה לעולם אינם עוזבים את המכשיר שלך.
            </td>
          </tr>
          <tr>
            <td>
              <code>identity</code>
            </td>
            <td>
              הפעלת זרימת ה-OAuth מסוג PKCE של Spotify דרך{' '}
              <code>chrome.identity.launchWebAuthFlow</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>ממשקים חיצוניים שהתוסף פונה אליהם ישירות</h2>
      <p>
        השירותים הבאים מקבלים פנייה ישירות מהדפדפן שלך. השרתים של WindoM אינם מעורבים
        בבקשות הללו, ואיננו משתפים נתונים אישיים עם השירותים האלה.
      </p>
      <table>
        <thead>
          <tr>
            <th>שירות</th>
            <th>מה נשלח</th>
            <th>מטרה</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Unsplash</strong> (<code>api.unsplash.com</code>)
            </td>
            <td>מחרוזת חיפוש / קטגוריה</td>
            <td>משיכת תמונות רקע לדשבורד</td>
          </tr>
          <tr>
            <td>
              <strong>Open-Meteo</strong> (<code>api.open-meteo.com</code>)
            </td>
            <td>קו רוחב וקו אורך</td>
            <td>משיכת נתוני מזג אוויר עדכניים. ללא מפתח API וללא חשבון.</td>
          </tr>
          <tr>
            <td>
              <strong>Open-Meteo Geocoding</strong> (<code>geocoding-api.open-meteo.com</code>)
            </td>
            <td>מחרוזת חיפוש של שם עיר</td>
            <td>המרת שם עיר שהוקלד לנקודות ציון עבור מזג האוויר</td>
          </tr>
          <tr>
            <td>
              <strong>Nominatim / OpenStreetMap</strong> (<code>nominatim.openstreetmap.org</code>)
            </td>
            <td>קו רוחב וקו אורך</td>
            <td>המרת נקודות ציון לשם עיר קריא</td>
          </tr>
          <tr>
            <td>
              <strong>ipapi.co</strong>
            </td>
            <td>כתובת ה-IP שלך (במשתמע)</td>
            <td>
              זיהוי מיקום לפי IP כגיבוי - בשימוש רק אם איתור המיקום של הדפדפן נדחה או אינו
              זמין
            </td>
          </tr>
          <tr>
            <td>
              <strong>Quotable</strong> (<code>api.quotable.io</code>)
            </td>
            <td>דבר</td>
            <td>משיכת ציטוט. אין מעורבות של נתונים אישיים.</td>
          </tr>
          <tr>
            <td>
              <strong>Yahoo Finance</strong> (<code>query1/query2.finance.yahoo.com</code>)
            </td>
            <td>סימולי המניות שהוספת</td>
            <td>משיכת מחירי מניות בזמן אמת עבור ווידג'ט הפיננסים</td>
          </tr>
          <tr>
            <td>
              <strong>CoinGecko</strong> (<code>api.coingecko.com</code>)
            </td>
            <td>מזהי המטבעות שהוספת</td>
            <td>משיכת מחירי מטבעות קריפטוגרפיים בזמן אמת</td>
          </tr>
          <tr>
            <td>
              <strong>Google Favicons</strong> (<code>google.com/s2/favicons</code>)
            </td>
            <td>שם דומיין</td>
            <td>משיכת סמלי אתר עבור הקישורים המהירים</td>
          </tr>
          <tr>
            <td>
              <strong>DuckDuckGo</strong> (<code>duckduckgo.com</code>)
            </td>
            <td>שם דומיין</td>
            <td>מקור גיבוי לסמלי אתר עבור הקישורים המהירים</td>
          </tr>
        </tbody>
      </table>
      <p>
        לכל אחד מהשירותים הללו מדיניות פרטיות משלו. מומלץ לעיין בה אם יש לך חשש לגבי שירות
        מסוים.
      </p>

      <h2>נתונים שאיננו אוספים</h2>
      <ul>
        <li>איננו משתמשים באנליטיקה, בפיקסלי מעקב או ב-SDK פרסומיים של צד שלישי</li>
        <li>איננו קוראים את תוכן הדפים שבהם אתה מבקר</li>
        <li>איננו אוספים הקשות מקלדת או קלט מטפסים באתרים אחרים</li>
        <li>איננו משתפים או מוכרים נתונים לצדדים שלישיים</li>
        <li>
          איננו ניגשים לדואר שלך - הרשאת הדואר כבויה בשירות המתארח, כמתואר למעלה, ושום
          נתוני דואר אינם מגיעים לשרתים שלנו
        </li>
      </ul>

      <h2>שיתוף נתונים</h2>
      <p>
        איננו מוכרים, משכירים או משתפים את הנתונים האישיים שלך עם צד שלישי כלשהו לצרכי
        שיווק, פרסום או כל מטרה מסחרית אחרת. הנתונים משמשים אך ורק לאספקת התכונות שהפעלת
        במפורש ב-WindoM.
      </p>

      <h2>אבטחה</h2>
      <p>
        כל התקשורת בין התוסף לשרתים שלנו מתבצעת ב-HTTPS. אסימוני OAuth (Google, Spotify)
        מוצפנים במנוחה באמצעות AES-256-GCM עם מפתח בצד השרת. סיסמאות מגובבות ב-bcrypt
        (cost factor 12). האימות משתמש באסימוני גישה קצרי מועד מסוג JWT (תוקף 15 דקות)
        ובאסימוני רענון מתחלפים הנשמרים כעוגיות{' '}
        <code>HttpOnly; Secure; SameSite=None</code>. שימוש חוזר באסימון רענון מזוהה וגורר
        ביטול אוטומטי של ההפעלה.
      </p>

      <h2>פרטיות ילדים</h2>
      <p>
        WindoM אינו מיועד לילדים מתחת לגיל 13. איננו אוספים ביודעין מידע אישי מילדים. אם
        לדעתך ילד מסר לנו מידע אישי, אנא צור קשר ונמחק אותו במהירות.
      </p>

      <h2>שינויים במדיניות זו</h2>
      <p>
        ייתכן שנעדכן מדיניות זו ככל שהתכונות משתנות. כאשר נעשה זאת, נעדכן את תאריך "עודכן
        לאחרונה" בראש העמוד. המשך השימוש ב-WindoM לאחר עדכון מהווה הסכמה למדיניות החדשה.
      </p>

      <h2>יצירת קשר</h2>
      <p>
        לשאלות על מדיניות זו או לבקשת מחיקת נתונים, ניתן לפנות לכתובת{' '}
        <a href="mailto:yehudabriskman@windom.app">yehudabriskman@windom.app</a>.
      </p>
    </DocsLayout>
  );
}
