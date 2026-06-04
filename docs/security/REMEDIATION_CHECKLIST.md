# Booky — Security Remediation Checklist

Companion to [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md). Work top-to-bottom; each item lists the file(s), the fix, and a verification step. Tick boxes as you go.

---

## Priority 1 — Do now

### ☐ BKY-01 · Remove default admin credentials
- **Files:** `server/config/seed.js`
- **Fix:**
  - Rotate the live admin password **if** the seed default (`Booky@Admin2025`) was ever deployed.
  - Read seed creds from env; remove the plaintext `console.log`:
    ```js
    const email = process.env.SEED_ADMIN_EMAIL;
    const pw    = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !pw) { console.error('Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD'); process.exit(1); }
    const password_hash = await bcrypt.hash(pw, 12);
    await Admin.create({ email, password_hash });
    ```
- **Verify:** fresh seed fails without the env vars; no password printed to logs.

### ☐ BKY-02 · OTP brute-force lockout
- **Files:** `server/models/Admin.js`, `server/controllers/auth.controller.js`
- **Fix:** add `otp_attempts INTEGER DEFAULT 0`. In `verifyOtp`, on each wrong code increment it; at ≥5 clear `otp_code`/`otp_expires_at` and return "code invalidated, log in again". Reset to 0 on success. Use constant-time compare:
  ```js
  const a = Buffer.from(otpHash), b = Buffer.from(admin.otp_code || '');
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  ```
- **Verify:** 5 wrong codes invalidate the OTP regardless of source IP.

### ☐ BKY-08 · Patch dependencies
- **Files:** `client/package.json`, `server/package.json`
- **Fix:**
  ```bash
  (cd client && npm audit fix)     # react-router, etc. (non-breaking)
  (cd server && npm audit fix)     # dompurify, ws, qs (non-breaking)
  (cd server && npm uninstall nodemailer)   # unused; clears SMTP-injection advisory
  ```
  Review `--force` upgrades (sequelize/uuid, geoip-lite) separately.
- **Verify:** `npm audit` shows the High/red items resolved; app boots and login/AI/upload still work.

---

## Priority 2 — Soon

### ☐ BKY-03 · Escape user input in emails
- **Files:** `server/services/email.service.js`
- **Fix:** add an `esc()` helper and wrap every `${submission.*}` in subject + body:
  ```js
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  ```
- **Verify:** submit a quote with `full_name = <b>x</b><a href=//evil>clk</a>`; the email shows literal text, not rendered HTML.

### ☐ BKY-04 · Harden manuscript upload
- **Files:** `server/middleware/upload.js`, `server/controllers/quote.controller.js`
- **Fix:** validate magic bytes (`file-type`) and reject MIME/extension mismatches; switch Cloudinary manuscript uploads to `type: 'authenticated'` (or `private`) and generate signed, expiring URLs for the admin; lower the 20 MB cap to a realistic value.
- **Verify:** a `.html` file renamed `.pdf` with spoofed MIME is rejected; manuscript URL is not publicly fetchable without a signature.

### ☐ BKY-05 · XSS defence-in-depth
- **Files:** `server/controllers/blog.controller.js`, front-end host config (`vercel.json`)
- **Fix:** after upgrading DOMPurify, pin a strict config:
  ```js
  DOMPurify.sanitize(body, {
    ALLOWED_TAGS: ['p','br','strong','em','u','a','h1','h2','h3','ul','ol','li','blockquote','img','code','pre'],
    ALLOWED_ATTR: ['href','src','alt','title','target','rel'],
    FORBID_TAGS: ['style','iframe','object','embed','form'],
  });
  ```
  Add a CSP header on the front end (Vercel), e.g. `default-src 'self'; img-src 'self' https://res.cloudinary.com data:; object-src 'none'; frame-ancestors 'none'`.
- **Verify:** a `<script>`/`<iframe>`/`onerror` in post body is stripped; browser console shows CSP active on the live site.

### ☐ BKY-06 · Verify DB TLS certificate
- **Files:** `server/config/db.js`
- **Fix:** supply the provider CA and set `rejectUnauthorized: true`:
  ```js
  ssl: { require: true, rejectUnauthorized: true, ca: process.env.DB_CA_CERT }
  ```
- **Verify:** connection succeeds with verification on; fails against a wrong/self-signed cert.

### ☐ BKY-07 · Replace boot-time `alter: true`
- **Files:** `server/config/syncDb.js`
- **Fix:** adopt migrations (`sequelize-cli`/Umzug). Interim guard:
  ```js
  await sequelize.sync(process.env.NODE_ENV === 'production' ? {} : { alter: true });
  ```
- **Verify:** production boot performs no `ALTER TABLE`; schema changes go through reviewed migrations.

---

## Priority 3 — Hardening backlog

### ☐ BKY-09 · Pin JWT algorithm
`server/middleware/auth.js` → `jwt.verify(token, secret, { algorithms: ['HS256'] })`. Confirm `JWT_SECRET` is long/high-entropy in prod.

### ☐ BKY-10 · Validate stored URL schemes
`settings.controller.js`, `book.controller.js` — reject anything not `http(s):` for social/form/book links on write.

### ☐ BKY-11 · Session revocation (optional)
Add `token_version` to `Admin`, embed in JWT, bump on password change/logout, check in `authMiddleware`. Remove dead `clearCookie`/`withCredentials` code.

### ☐ BKY-12 · Align validation limits
Match validator `isLength` to DB column sizes (e.g., comment body); add length bounds to `author_name`; set `express.json({ limit: '100kb' })`.

### ☐ BKY-13 · Trustworthy client IP
`analytics.controller.js` — derive IP from `req.ip` (proxy-aware) instead of raw `X-Forwarded-For`.

### ☐ BKY-14 · Minimise AI prompt PII + cost cap
`ai.controller.js` — use initials not full names in the system prompt; add a per-account daily token/cost cap; validate `role ∈ {user, assistant}`.

### ☐ BKY-15 · Hygiene
Update `server/.env.example` (add `RESEND_API_KEY`, drop unused `EMAIL_*`); remove dead `booky_token_ref` interceptor; drop LAN-CORS regex from production.

---

## Suggested verification pass (after fixes)
1. `npm audit` clean (or only accepted, documented items) in both packages.
2. Login flow: lockout, OTP issuance, **OTP lockout after 5 wrong codes**, reset-password single-use all behave.
3. Submit a hostile quote (HTML in name + spoofed-type file) → email is escaped, file rejected/private.
4. Publish a blog post containing `<script>`/`<iframe>` → stripped; CSP visible on the live page.
5. Confirm production DB connects with `rejectUnauthorized: true` and boot runs no `ALTER`.

*Generated 2026-06-04 alongside SECURITY_AUDIT.md.*
