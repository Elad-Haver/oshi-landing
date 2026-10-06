# חיבור המועדון לגוגל שיטס

כל הרשמה שנשמרה מופיעה כשורה חדשה בגיליון "נרשמים". הדרך: הדף → `api/join` ב־Vercel → Apps Script של הגיליון.

## הקמה (פעם אחת, כ־10 דקות)
1. פותחים Google Sheet חדש, למשל "מועדון אושי אושי גבעת שמואל".
2. בתפריט: **Extensions → Apps Script**. מוחקים את התוכן ומדביקים את כל `Code.gs`. שומרים.
3. ב־Apps Script: **Project Settings → Script properties → Add**: שם `TOKEN`, ערך מחרוזת סודית ארוכה (למשל 40 תווים אקראיים).
4. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - מאשרים את ההרשאות ומעתיקים את כתובת ה־Web app (מסתיימת ב־`/exec`).
5. ב־Vercel → Project → Settings → Environment Variables:
   - `CLUB_WEBHOOK_URL` = כתובת ה־Web app
   - `CLUB_WEBHOOK_SECRET` = אותו ערך של `TOKEN`
6. ב־`config.js` של הדף: `endpoint: "/api/join"`, ופריסה מחדש.

## מה נשמר
תאריך הרשמה, שם מלא, טלפון, מייל, תאריך לידה, הסכמה לדיוור (כן/לא), סניף, מקור וקמפיין (מ־UTM), מזהה שליחה.

- טלפון או מייל שכבר רשומים לא נכנסים שוב, והנרשם רואה "כבר רשומים".
- שליחה חוזרת של אותה הרשמה (למשל אחרי ניתוק) לא יוצרת שורה כפולה.
- הגיליון מכיל מידע אישי: לשתף אותו רק עם מי שצריך.
