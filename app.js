(function () {
  "use strict";

  var CFG = window.OSHI_CONFIG || {};
  var API = CFG.api || {};
  var MAP = API.fieldMap || {};
  var DEMO = !API.endpoint;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Replaceable asset slots ---------- */
  // A slot whose file is missing shows a labelled placeholder instead of a broken image.
  $$(".slot img").forEach(function (img) {
    var slot = img.closest(".slot");
    var markEmpty = function () { slot.classList.add("is-empty"); };
    var markFull = function () { slot.classList.remove("is-empty"); };
    if (img.complete) {
      if (img.naturalWidth === 0) markEmpty();
    }
    img.addEventListener("error", markEmpty);
    img.addEventListener("load", markFull);
  });

  /* ---------- Demo banner ---------- */
  if (DEMO) $("#demo-banner").hidden = false;

  /* ---------- Birth date selects ---------- */
  var MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  var daySel = $("#bday-d"), monthSel = $("#bday-m"), yearSel = $("#bday-y");
  var addOpt = function (sel, value, label) {
    var o = document.createElement("option");
    o.value = value; o.textContent = label;
    sel.appendChild(o);
  };
  for (var d = 1; d <= 31; d++) addOpt(daySel, String(d), String(d));
  MONTHS.forEach(function (m, i) { addOpt(monthSel, String(i + 1), m); });
  var thisYear = new Date().getFullYear();
  // Newest first; typing digits on a desktop select jumps straight to the year.
  for (var y = thisYear; y >= thisYear - 110; y--) addOpt(yearSel, String(y), String(y));

  /* ---------- Consent, links, benefits, branch info ---------- */
  var links = CFG.links || {};
  var consent = CFG.consent || {};
  var linkHtml = function (href, label) {
    var a = document.createElement("a");
    a.href = href; a.textContent = label; a.target = "_blank"; a.rel = "noopener";
    return a;
  };

  $("#consent-text").textContent = consent.text || "אני רוצה לקבל עדכונים והצעות מאושי אושי גבעת שמואל.";
  if (consent.required) $("#consent").required = true;

  if (links.privacyPolicy || links.clubTerms) {
    var legal = $("#legal-line");
    legal.append("בהצטרפות למועדון אתם מאשרים את ");
    if (links.clubTerms) legal.append(linkHtml(links.clubTerms, "תקנון המועדון"));
    if (links.clubTerms && links.privacyPolicy) legal.append(" ואת ");
    if (links.privacyPolicy) legal.append(linkHtml(links.privacyPolicy, "מדיניות הפרטיות"));
    legal.append(".");
    legal.hidden = false;

    var nav = $("#footer-links");
    if (links.privacyPolicy) nav.append(linkHtml(links.privacyPolicy, "מדיניות פרטיות"));
    if (links.clubTerms) nav.append(linkHtml(links.clubTerms, "תקנון המועדון"));
    nav.hidden = false;
  }

  var benefits = (CFG.benefits || []).slice(0, 3);
  if (benefits.length) {
    var ul = $("#benefits");
    benefits.forEach(function (b) {
      var li = document.createElement("li");
      var t = document.createElement("strong"); t.textContent = b.title || "";
      li.appendChild(t);
      if (b.text) { var s = document.createElement("span"); s.textContent = b.text; li.appendChild(s); }
      ul.appendChild(li);
    });
    ul.hidden = false;
  }

  var br = CFG.branch || {};
  var info = $("#branch-info");
  var addInfo = function (text, ltr, href) {
    var li = document.createElement("li");
    var el = href ? linkHtml(href, text) : document.createElement("span");
    if (!href) el.textContent = text;
    if (ltr) el.dir = "ltr";
    li.appendChild(el);
    info.appendChild(li);
  };
  if (br.address) addInfo(br.address);
  if (br.phone) addInfo(br.phone, true);
  if (br.hours) addInfo(br.hours);
  if (br.instagram) addInfo("אינסטגרם", false, br.instagram);
  if (info.children.length) info.hidden = false;

  /* ---------- Validation ---------- */
  var form = $("#join-form");
  var fields = {
    fullName: $("#fullName"),
    phone: $("#phone"),
    email: $("#email")
  };

  var normalizePhone = function (raw) {
    var digits = String(raw || "").replace(/[^\d+]/g, "");
    if (digits.indexOf("+972") === 0) digits = "0" + digits.slice(4);
    else if (digits.indexOf("972") === 0 && digits.length >= 11) digits = "0" + digits.slice(3);
    return digits.replace(/\+/g, "");
  };
  var PHONE_RE = /^0(5\d{8}|7\d{8}|[23489]\d{7})$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

  var readBirth = function () {
    var d = +daySel.value, m = +monthSel.value, y = +yearSel.value;
    if (!d || !m || !y) return { error: "נא לבחור יום, חודש ושנה." };
    var dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
      return { error: "התאריך שנבחר לא קיים. נא לבדוק את היום." };
    }
    var today = new Date();
    if (dt > today) return { error: "תאריך הלידה לא יכול להיות בעתיד." };
    if (CFG.minAge) {
      var limit = new Date(today.getFullYear() - CFG.minAge, today.getMonth(), today.getDate());
      if (dt > limit) return { error: "ההצטרפות למועדון מגיל " + CFG.minAge + "." };
    }
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return { value: y + "-" + pad(m) + "-" + pad(d) };
  };

  var rules = {
    fullName: function () {
      var v = fields.fullName.value.trim().replace(/\s+/g, " ");
      if (!v) return "נא להזין שם מלא.";
      if (v.length < 2 || !/[A-Za-z֐-׿]/.test(v)) return "נא להזין שם תקין.";
      return "";
    },
    phone: function () {
      var v = fields.phone.value.trim();
      if (!v) return "נא להזין מספר טלפון.";
      if (!PHONE_RE.test(normalizePhone(v))) return "מספר הטלפון לא תקין. לדוגמה: 050-1234567";
      return "";
    },
    email: function () {
      var v = fields.email.value.trim();
      if (!v) return "נא להזין כתובת מייל.";
      if (!EMAIL_RE.test(v)) return "כתובת המייל לא תקינה. לדוגמה: name@example.com";
      return "";
    },
    birth: function () { return readBirth().error || ""; },
    consent: function () {
      return consent.required && !$("#consent").checked ? "נדרש אישור כדי להצטרף." : "";
    }
  };

  var targets = {
    fullName: [fields.fullName],
    phone: [fields.phone],
    email: [fields.email],
    birth: [daySel, monthSel, yearSel],
    consent: [$("#consent")]
  };
  var errEl = {
    fullName: $("#fullName-err"),
    phone: $("#phone-err"),
    email: $("#email-err"),
    birth: $("#birth-err"),
    consent: $("#consent-err")
  };
  var touched = {};

  var check = function (key) {
    var msg = rules[key]();
    errEl[key].textContent = msg;
    targets[key].forEach(function (el) {
      if (msg) el.setAttribute("aria-invalid", "true");
      else el.removeAttribute("aria-invalid");
    });
    return !msg;
  };

  Object.keys(targets).forEach(function (key) {
    targets[key].forEach(function (el) {
      el.addEventListener("blur", function () {
        // Birth date is checked only once all three parts have been visited or filled.
        if (key === "birth" && !(daySel.value && monthSel.value && yearSel.value)) return;
        touched[key] = true;
        check(key);
      });
      var live = function () { if (touched[key]) check(key); };
      el.addEventListener("input", live);
      el.addEventListener("change", live);
    });
  });

  /* ---------- Submission ---------- */
  var btn = $("#submit");
  var btnLabel = $(".btn__label", btn);
  var msgBox = $("#form-msg");
  var busy = false;
  var submissionId = null;

  var uuid = function () {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  };

  var sourceInfo = function () {
    var out = {};
    try {
      var p = new URLSearchParams(location.search);
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
        if (p.get(k)) out[k] = p.get(k);
      });
    } catch (e) { /* ignore */ }
    out.page = "club-givat-shmuel";
    return out;
  };

  var setBusy = function (on) {
    busy = on;
    btn.disabled = on;
    btn.classList.toggle("is-loading", on);
    btn.setAttribute("aria-busy", on ? "true" : "false");
    btnLabel.textContent = on ? "שומרים את ההרשמה…" : "צרפו אותי למועדון";
    form.setAttribute("aria-busy", on ? "true" : "false");
  };

  var showMsg = function (html, isError) {
    msgBox.innerHTML = html;
    msgBox.classList.toggle("is-error", !!isError);
    msgBox.hidden = false;
    msgBox.focus({ preventScroll: true });
    msgBox.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  var buildPayload = function (birthIso) {
    var p = {};
    var k = function (name) { return MAP[name] || name; };
    p[k("fullName")] = fields.fullName.value.trim().replace(/\s+/g, " ");
    p[k("phone")] = normalizePhone(fields.phone.value);
    p[k("email")] = fields.email.value.trim().toLowerCase();
    p[k("birthDate")] = birthIso;
    p[k("marketingConsent")] = $("#consent").checked;
    p[k("branch")] = API.branchValue || "givat-shmuel";
    p[k("source")] = sourceInfo();
    p[k("submissionId")] = submissionId;
    return p;
  };

  var send = function (payload) {
    var controller = "AbortController" in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, API.timeoutMs || 15000);
    var headers = Object.assign({ "Content-Type": "application/json", "Accept": "application/json" }, API.headers || {});
    return fetch(API.endpoint, {
      method: API.method || "POST",
      headers: headers,
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined,
      credentials: "omit"
    }).then(function (res) {
      clearTimeout(timer);
      return res.text().then(function (text) {
        var body = null;
        try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
        return { status: res.status, body: body };
      });
    }, function (err) {
      clearTimeout(timer);
      throw err;
    });
  };

  var isSuccess = typeof API.isSuccess === "function"
    ? API.isSuccess
    : function (status) { return status >= 200 && status < 300; };
  var isDuplicate = typeof API.isDuplicate === "function" ? API.isDuplicate : function () { return false; };

  // A new submission id whenever the details change; a plain retry keeps the same id.
  form.addEventListener("input", function () { if (!busy) submissionId = null; });
  form.addEventListener("change", function () { if (!busy) submissionId = null; });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;
    msgBox.hidden = true;

    var order = ["fullName", "phone", "email", "birth", "consent"];
    var firstBad = null;
    order.forEach(function (key) {
      touched[key] = true;
      if (!check(key) && !firstBad) firstBad = targets[key][0];
    });
    if (firstBad) { firstBad.focus(); return; }

    // Bot trap filled: stop quietly.
    if ($("#company").value) return;

    if (!submissionId) submissionId = uuid();
    var payload = buildPayload(readBirth().value);

    setBusy(true);

    if (DEMO) {
      setTimeout(function () {
        setBusy(false);
        showMsg("<strong>מצב הדגמה</strong>הפרטים תקינים, אבל הטופס עוד לא מחובר למערכת המועדון ולכן ההרשמה לא נשלחה ולא נשמרה.", false);
        if (window.console) console.info("[demo] payload that would be sent:", payload);
      }, 700);
      return;
    }

    send(payload).then(function (r) {
      if (isSuccess(r.status, r.body)) {
        form.hidden = true;
        var ok = $("#success");
        ok.hidden = false;
        ok.focus();
        ok.scrollIntoView({ block: "nearest", behavior: "smooth" });
        submissionId = null;
        return;
      }
      setBusy(false);
      if (isDuplicate(r.status, r.body)) {
        showMsg("<strong>כבר רשומים</strong>הפרטים האלה כבר קיימים במועדון של הסניף.", false);
        return;
      }
      showMsg("<strong>ההרשמה לא נשמרה</strong>הפרטים שמילאתם נשארו בטופס. נסו לשלוח שוב בעוד רגע.", true);
    }).catch(function () {
      setBusy(false);
      showMsg("<strong>אין חיבור כרגע</strong>ההרשמה לא נשלחה. הפרטים נשארו בטופס, בדקו את החיבור ונסו שוב.", true);
    });
  });
})();
