
/**
 * What the backend needs to boot.
 *
 * Extracted from the setup page so the English and Hebrew versions render the
 * same table instead of keeping two copies of it. This list is the
 * authoritative answer to "what goes in `backend/.env`", and a duplicated
 * authoritative list is one that eventually disagrees with itself - the same
 * reason DOCS_PAGES exists rather than a sidebar written out per page.
 *
 * Variable names and example values are never translated: they are strings a
 * reader has to type exactly.
 */

export type Requirement = 'yes' | 'no' | 'google' | 'calendar' | 'spotify';

export interface EnvVar {
  name: string;
  /** Description in English. `code` marks fragments to render as code. */
  en: string;
  he: string;
  required: Requirement;
}

export const REQUIREMENT_LABELS: Record<Requirement, { en: string; he: string }> = {
  yes: { en: 'Yes', he: 'כן' },
  no: { en: 'No', he: 'לא' },
  google: { en: 'For Google features', he: 'לתכונות Google' },
  calendar: { en: 'For Calendar', he: 'ליומן' },
  spotify: { en: 'For Spotify', he: 'ל-Spotify' },
};

export const ENV_VARS: EnvVar[] = [
  {
    name: 'PORT',
    en: 'Port the backend listens on. Default: 8080',
    he: 'הפורט שהשרת מאזין בו. ברירת מחדל: 8080',
    required: 'no',
  },
  {
    name: 'DATABASE_URL',
    en: 'Postgres connection string. When using Docker Compose this is set automatically.',
    he: 'מחרוזת החיבור ל-Postgres. בהרצה עם Docker Compose היא נקבעת אוטומטית.',
    required: 'yes',
  },
  {
    name: 'JWT_ACCESS_SECRET',
    en: 'Random secret used to sign access tokens. Generate with openssl rand -base64 32',
    he: 'סוד אקראי לחתימת אסימוני גישה. אפשר לייצר עם openssl rand -base64 32',
    required: 'yes',
  },
  {
    name: 'REFRESH_TOKEN_SECRET',
    en: 'Random secret used to sign refresh tokens. Generate separately from the above.',
    he: 'סוד אקראי לחתימת אסימוני רענון. יש לייצר בנפרד מהסוד שלמעלה.',
    required: 'yes',
  },
  {
    name: 'TOKEN_ENC_KEY_BASE64',
    en: '32 random bytes base64-encoded. Used to encrypt OAuth tokens at rest.',
    he: '32 בתים אקראיים בקידוד base64. משמש להצפנת אסימוני OAuth במנוחה.',
    required: 'yes',
  },
  {
    name: 'GOOGLE_CLIENT_ID',
    en: 'OAuth 2.0 Client ID from Google Cloud Console.',
    he: 'מזהה לקוח OAuth 2.0 מתוך Google Cloud Console.',
    required: 'google',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    en: 'OAuth 2.0 Client Secret from Google Cloud Console.',
    he: 'סוד לקוח OAuth 2.0 מתוך Google Cloud Console.',
    required: 'google',
  },
  {
    name: 'GOOGLE_REDIRECT_URI',
    en: 'Callback URL for Google Sign-in. Example: http://localhost:8080/auth/google/callback',
    he: 'כתובת חזרה להתחברות עם Google. לדוגמה: http://localhost:8080/auth/google/callback',
    required: 'google',
  },
  {
    name: 'GOOGLE_OAUTH_REDIRECT_URI',
    en: 'Callback URL for Google Calendar OAuth. Example: http://localhost:8080/oauth/google/callback',
    he: 'כתובת חזרה ל-OAuth של יומן Google. לדוגמה: http://localhost:8080/oauth/google/callback',
    required: 'calendar',
  },
  {
    name: 'SPOTIFY_CLIENT_ID',
    en: 'Client ID from your Spotify Developer app.',
    he: 'מזהה הלקוח מאפליקציית ה-Spotify Developer שלך.',
    required: 'spotify',
  },
  {
    name: 'SPOTIFY_CLIENT_SECRET',
    en: 'Client Secret from your Spotify Developer app.',
    he: 'סוד הלקוח מאפליקציית ה-Spotify Developer שלך.',
    required: 'spotify',
  },
  {
    name: 'SPOTIFY_REDIRECT_URI',
    en: 'Callback URL for Spotify OAuth. Example: http://localhost:8080/oauth/spotify/callback',
    he: 'כתובת חזרה ל-OAuth של Spotify. לדוגמה: http://localhost:8080/oauth/spotify/callback',
    required: 'spotify',
  },
  {
    name: 'CORS_ALLOWED_ORIGINS',
    en: 'Comma-separated list of allowed origins. Include your extension ID and localhost ports.',
    he: 'רשימת מקורות מורשים מופרדת בפסיקים. יש לכלול את מזהה התוסף ואת הפורטים המקומיים.',
    required: 'yes',
  },
  {
    name: 'EXTENSION_REDIRECT_BASE',
    en: 'The chromiumapp.org URL for your extension. Used as the OAuth redirect base for the Chrome identity flow.',
    he: 'כתובת ה-chromiumapp.org של התוסף שלך. משמשת כבסיס ההפניה של OAuth בזרימת ה-identity של Chrome.',
    required: 'google',
  },
  {
    name: 'SMTP_HOST',
    en: 'SMTP server. Defaults to smtp.gmail.com, so leaving it unset preserves the Gmail behaviour. Any provider works - Resend is smtp.resend.com, Brevo is smtp-relay.brevo.com.',
    he: 'שרת SMTP. ברירת המחדל היא smtp.gmail.com, כך שהשארתו ריק משמרת את התנהגות Gmail. כל ספק עובד - Resend הוא smtp.resend.com, ו-Brevo הוא smtp-relay.brevo.com.',
    required: 'no',
  },
  {
    name: 'SMTP_PORT',
    en: 'Defaults to 465, which uses implicit TLS. Port 587 negotiates STARTTLS instead; the code follows the port, so the two stay consistent.',
    he: 'ברירת המחדל היא 465, המשתמש ב-TLS מרומז. פורט 587 מנהל משא ומתן על STARTTLS במקום; הקוד עוקב אחרי הפורט, כך שהשניים נשארים עקביים.',
    required: 'no',
  },
  {
    name: 'SMTP_USER',
    en: 'SMTP username. Not required to be an email address - several providers use a plain login, such as the literal resend. If this and SMTP_PASS are unset, emails are printed to the console instead of sent.',
    he: 'שם המשתמש ל-SMTP. אינו חייב להיות כתובת אימייל - כמה ספקים משתמשים בשם פשוט, למשל resend. אם הוא ו-SMTP_PASS ריקים, הודעות מודפסות לקונסול במקום להישלח.',
    required: 'no',
  },
  {
    name: 'SMTP_PASS',
    en: '16-character Google App Password for the SMTP account. Generate at myaccount.google.com → Security → 2-Step Verification → App Passwords.',
    he: 'סיסמת אפליקציה של Google בת 16 תווים עבור חשבון ה-SMTP. ניתן לייצר בכתובת myaccount.google.com ← Security ← 2-Step Verification ← App Passwords.',
    required: 'no',
  },
  {
    name: 'FROM_EMAIL',
    en: 'The "From" address shown on outbound emails. Defaults to noreply@windom.app. On Gmail it must be SMTP_USER or a verified alias of it; dedicated providers only require the domain to be verified with them.',
    he: 'כתובת ה-"From" שמוצגת בהודעות יוצאות. ברירת המחדל היא noreply@windom.app. ב-Gmail היא חייבת להיות SMTP_USER או כינוי מאומת שלו; ספקים ייעודיים דורשים רק שהדומיין יאומת אצלם.',
    required: 'no',
  },
  {
    name: 'APP_URL',
    en: 'Public base URL of the backend. Used to build email verification and password-reset links. Example: http://localhost:8080.',
    he: 'כתובת הבסיס הציבורית של השרת. משמשת לבניית קישורי אימות אימייל ואיפוס סיסמה. לדוגמה: http://localhost:8080.',
    required: 'no',
  },
];

/** The example `.env`, which is identical in both languages bar its comments. */
export const EXAMPLE_ENV = (locale: 'en' | 'he'): string => {
  const comment = locale === 'he'
    ? '# אימייל - אופציונלי. אם יושמט, הודעות אימות ואיפוס מודפסות לקונסול.'
    : '# Email - optional. If omitted, verification/reset emails are printed to the console.';

  return `PORT=8080
NODE_ENV=development
DATABASE_URL=postgresql://windom:windom@localhost:5433/windom
JWT_ACCESS_SECRET=your-generated-secret-here
REFRESH_TOKEN_SECRET=your-other-generated-secret-here
TOKEN_ENC_KEY_BASE64=your-generated-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8080/oauth/google/callback
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:8080/oauth/spotify/callback
CORS_ALLOWED_ORIGINS=chrome-extension://YOUR_EXTENSION_ID,http://localhost:3000,http://localhost:5173
EXTENSION_REDIRECT_BASE=https://YOUR_EXTENSION_ID.chromiumapp.org
${comment}
# SMTP_USER=you@yourdomain.com
# SMTP_PASS=your-16-char-app-password
# FROM_EMAIL=noreply@windom.app
# APP_URL=http://localhost:8080`;
};

