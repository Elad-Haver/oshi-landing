# דף הרשמה למועדון אושי אושי גבעת שמואל

דף סטטי (HTML, CSS, JS) ללא ספריות. מעלים את התיקייה כמו שהיא לכל אחסון סטטי (או לעמוד ב־WordPress דרך תבנית ריקה / Custom HTML).

## קבצים
| קובץ | מה יש בו |
|---|---|
| `index.html` | מבנה הדף |
| `styles.css` | העיצוב (Mobile First) |
| `app.js` | בדיקת תקינות, שליחה, מצב הדגמה |
| `config.js` | **כל ההגדרות לעריכה**: חיבור למערכת, מסמכים, נוסח הסכמה, הטבות, פרטי סניף |
| `assets/` | מקום ללוגו, לתמונות ולפונט |

## נכסים
| נכס | נתיב | מצב |
|---|---|---|
| לוגו מקורי (גרסה לרקע כהה) | `assets/logo.svg` (וקטור), `assets/logo.png` (לרשת) | נמסר |
| תמונת הסניף (ראשית) | `assets/img/branch.jpg` | חסרה. עד אז מופיע מקום ריק מסומן |
| גלריה | `assets/img/gallery-1..4.*` | מגדל רולים, כיסונים, רול סלמון-אבוקדו, ערימת רולי סלמון |
| פונט FbOgen | `assets/fonts/FbOgen-Black.woff2`, `FbOgen-Bold.woff2` | חסר. עד אז הכותרות ב־Assistant |

כל תמונה קיימת ב־WebP וב־JPG, בשני גדלים (`-800`/`-600` לנייד).

## חיבור למערכת המועדון
לחיבור לגוגל שיטס: [google-sheets/README.md](google-sheets/README.md).

ב־`config.js`:
1. `api.endpoint`: כתובת ה־API או ה־Webhook. כל עוד ריק, הדף במצב הדגמה ולא נשלח דבר.
2. `api.fieldMap`: שמות השדות שהמערכת מצפה להם.
3. `api.isSuccess` / `api.isDuplicate`: אם המערכת מחזירה תשובה מיוחדת להצלחה או לרשום קיים.
4. לא לשים מפתחות סודיים ב־`headers`: הקובץ גלוי. אם נדרש מפתח, לשלוח דרך שרת ביניים.
5. השרת צריך לאפשר CORS מהדומיין של הדף.

הבקשה: `POST` עם JSON, לדוגמה:
```json
{
  "full_name": "ישראל ישראלי",
  "phone": "0501234567",
  "email": "name@example.com",
  "birth_date": "1990-03-12",
  "marketing_consent": false,
  "branch": "givat-shmuel",
  "source": { "page": "club-givat-shmuel", "utm_source": "instagram" },
  "submission_id": "uuid"
}
```
הודעת "ברוכים הבאים" מוצגת רק אחרי תשובת הצלחה מהמערכת. `submission_id` נשאר זהה בניסיון חוזר עם אותם פרטים, כך שהמערכת יכולה לסנן כפילויות.

## פרסום ב־Vercel
התיקייה מוכנה לפריסה כאתר סטטי, עם פונקציה אחת: `api/join.js`.
1. ב־Vercel → Settings → Environment Variables: `CLUB_WEBHOOK_URL` (חובה), ואם צריך `CLUB_WEBHOOK_SECRET` ו־`CLUB_WEBHOOK_AUTH_HEADER`.
2. ב־`config.js`: `endpoint: "/api/join"`.
3. פריסה מחדש. כל עוד `CLUB_WEBHOOK_URL` חסר, הפונקציה מחזירה 503 והדף מציג שההרשמה לא נשמרה.

## עוד להשלמה
- קישורים למדיניות פרטיות ולתקנון המועדון (`links`).
- אישור משפטי לנוסח ההסכמה לדיוור (`consent.text`).
- הטבות מאושרות, אם יש (`benefits`, עד 3).
- כתובת, טלפון ושעות מאומתים (`branch`). כשרות: להציג רק "כשר", לפי תיק המותג, ורק אחרי אימות לסניף.
- גיל מינימלי, אם התקנון קובע (`minAge`).
