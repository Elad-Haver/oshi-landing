// Vercel serverless proxy: receives the sign-up from the page and forwards it to the club system.
// Keeps the club system's URL and secret out of the browser.
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   CLUB_WEBHOOK_URL       required. The club system's API / webhook URL.
//   CLUB_WEBHOOK_SECRET    optional. Sent in the body as "token" (Google Apps Script) and,
//                          when CLUB_WEBHOOK_AUTH_HEADER is set, also in that header.
//   CLUB_WEBHOOK_AUTH_HEADER optional header name for the secret (e.g. "Authorization").
//   ALLOWED_ORIGIN         optional. Restrict cross-origin calls (same-origin calls always work).

const PHONE_RE = /^0(5\d{8}|7\d{8}|[23489]\d{7})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

module.exports = async (req, res) => {
  const origin = process.env.ALLOWED_ORIGIN;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });

  const target = process.env.CLUB_WEBHOOK_URL;
  if (!target) return res.status(503).json({ ok: false, error: "not_configured" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ ok: false, error: "bad_json" }); }
  }
  body = body || {};

  // Server-side check of the default field names (adjust if config.js fieldMap changes).
  const name = String(body.full_name || "").trim();
  const phone = String(body.phone || "");
  const email = String(body.email || "").trim();
  const birth = String(body.birth_date || "");
  if (name.length < 2 || !PHONE_RE.test(phone) || !EMAIL_RE.test(email) || !DATE_RE.test(birth)) {
    return res.status(422).json({ ok: false, error: "invalid_fields" });
  }

  const headers = { "Content-Type": "application/json", "Accept": "application/json" };
  if (process.env.CLUB_WEBHOOK_SECRET && process.env.CLUB_WEBHOOK_AUTH_HEADER) {
    headers[process.env.CLUB_WEBHOOK_AUTH_HEADER] = process.env.CLUB_WEBHOOK_SECRET;
  }
  if (body.submission_id) headers["Idempotency-Key"] = String(body.submission_id);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers,
      // Apps Script cannot read headers, so the shared secret also travels in the body as "token".
      body: JSON.stringify({ ...body, token: process.env.CLUB_WEBHOOK_SECRET || undefined, received_at: new Date().toISOString() }),
      redirect: "follow",
      signal: controller.signal
    });
    clearTimeout(timer);
    if (upstream.ok) {
      // Google Apps Script always answers 200; read its JSON to know the real result.
      let result = null;
      try { result = await upstream.json(); } catch (e) { result = null; }
      if (result && result.ok === false) {
        if (result.duplicate) return res.status(409).json({ ok: false, error: "duplicate" });
        return res.status(502).json({ ok: false, error: result.error || "rejected" });
      }
      return res.status(200).json({ ok: true });
    }
    if (upstream.status === 409) return res.status(409).json({ ok: false, error: "duplicate" });
    return res.status(502).json({ ok: false, error: "upstream_" + upstream.status });
  } catch (e) {
    clearTimeout(timer);
    return res.status(504).json({ ok: false, error: "upstream_unreachable" });
  }
};
