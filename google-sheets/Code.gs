/**
 * אושי אושי גבעת שמואל: קליטת נרשמי המועדון לגוגל שיטס.
 * מותקן כ־Apps Script מתוך הגיליון (Extensions → Apps Script) ונפרס כ־Web app.
 * ההוראות המלאות ב־google-sheets/README.md.
 *
 * Script property נדרש: TOKEN (מחרוזת סודית ארוכה, זהה ל־CLUB_WEBHOOK_SECRET ב־Vercel).
 */

var SHEET_NAME = 'נרשמים';
var HEADERS = ['תאריך הרשמה', 'שם מלא', 'טלפון', 'מייל', 'תאריך לידה', 'הסכמה לדיוור', 'סניף', 'מקור', 'קמפיין', 'מזהה שליחה'];

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad_json' });
  }

  var token = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!token || data.token !== token) return json_({ ok: false, error: 'unauthorized' });

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = sheet_();
    var phone = String(data.phone || '');
    var email = String(data.email || '').toLowerCase();
    var sid = String(data.submission_id || '');

    var last = sheet.getLastRow();
    if (last > 1) {
      var rows = sheet.getRange(2, 3, last - 1, 8).getValues(); // columns C..J
      for (var i = 0; i < rows.length; i++) {
        // Same submission retried: already saved, report success.
        if (sid && String(rows[i][7]) === sid) return json_({ ok: true, repeated: true });
        if (String(rows[i][0]) === phone || String(rows[i][1]).toLowerCase() === email) {
          return json_({ ok: false, duplicate: true });
        }
      }
    }

    var src = data.source || {};
    sheet.appendRow([
      new Date(),
      safe_(data.full_name),
      safe_(phone),
      safe_(email),
      safe_(data.birth_date),
      data.marketing_consent === true ? 'כן' : 'לא',
      safe_(data.branch),
      safe_(src.utm_source || ''),
      safe_(src.utm_campaign || ''),
      safe_(sid)
    ]);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.getRange('C:C').setNumberFormat('@'); // keep the leading 0 in phone numbers
    sh.getRange('E:E').setNumberFormat('@');
    sh.setRightToLeft(true);
  }
  return sh;
}

// Text as text: blocks formula injection and keeps leading zeros.
function safe_(v) {
  var s = String(v == null ? '' : v).slice(0, 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
