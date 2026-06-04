# Booky — Security Assessment Report

**Application:** Booky Editing Services (React 19 SPA + Express 5 / Sequelize / PostgreSQL API)
**Assessment date:** 2026-06-04
**Assessed by:** Security review (static source review + dependency audit)
**Branch / commit reviewed:** `main` @ `f0c0856`
**Type:** White-box source code review — no live exploitation performed

---

## 1. Executive Summary

Booky is a single-admin marketing + blog platform with a public front end and a token-authenticated admin panel. **The overall security posture is good for a project of this size.** The codebase shows deliberate security engineering: account lockout, email-OTP device 2FA, hashed reset tokens, enumeration-safe password reset, per-route rate limiting, server-side HTML sanitisation, parameterised ORM queries, explicit field whitelisting (no mass assignment), a production-safe error handler, and secrets kept out of version control.

No critical, directly-exploitable remote vulnerabilities (RCE, SQL injection, auth bypass, secret leakage) were found in the application code. The findings below are a mix of **one credentials/2FA hardening chain that deserves priority**, several **medium** data-handling and configuration issues, and a set of **low / defence-in-depth** items.

### Findings at a glance

| ID | Severity | Title | Area |
|----|----------|-------|------|
| BKY-01 | **High** | Hardcoded default admin credentials committed to the repo | Auth / Secrets |
| BKY-02 | **High** | OTP verification has no per-account brute-force lockout | Auth / 2FA |
| BKY-03 | Medium | Unescaped public input injected into admin notification emails | Output encoding |
| BKY-04 | Medium | Insecure public manuscript upload (MIME-only check, raw + public storage) | File upload |
| BKY-05 | Medium | XSS defence-in-depth gaps (outdated DOMPurify + no front-end CSP) | XSS |
| BKY-06 | Medium | Database TLS certificate verification disabled | Transport security |
| BKY-07 | Medium | Schema auto-sync (`alter: true`) runs on every server boot | Data integrity |
| BKY-08 | Medium | Vulnerable third-party dependencies (incl. one High advisory) | Supply chain |
| BKY-09 | Low | JWT verification does not pin the signing algorithm | Auth |
| BKY-10 | Low | Stored URLs not scheme-validated (`javascript:` possible) | Injection |
| BKY-11 | Low | No token/session revocation on password change or logout | Session mgmt |
| BKY-12 | Low | Validator ↔ DB length mismatches; reliance on implicit body limit | Validation |
| BKY-13 | Low | Spoofable `X-Forwarded-For` trusted in client-IP helper | Spoofing |
| BKY-14 | Low | AI endpoint embeds customer PII in prompt; cost abuse if token leaks | Data exposure |
| BKY-15 | Info | Hygiene: unused `nodemailer` dep, stale `.env.example`, dead code, LAN CORS | Maintenance |

---

## 2. Scope & Methodology

- **In scope:** `server/` (Express API, controllers, middleware, models, services, config) and `client/` (React SPA) source code, route authorisation, input validation, authentication/authorisation flows, file handling, output encoding, secrets management, and dependency posture (`npm audit`).
- **Out of scope / not verified:** runtime/deployment configuration (Render, Vercel, Cloudinary dashboard settings), the live database contents, the production `.env`, and whether the deployed admin password has been rotated. Items that depend on deployment are flagged as “verify in production”.
- **Method:** manual static review of every controller, route, middleware, model and service; client-side review of auth/token handling and rendering sinks; `npm audit` on both packages; targeted grep for injection sinks (`eval`, `child_process`, raw SQL, `dangerouslySetInnerHTML`) and secret patterns.

---

## 3. Detailed Findings

> Severity uses an informal Critical / High / Medium / Low / Info scale based on likelihood × impact in this app's single-admin threat model.

---

### BKY-01 — Hardcoded default admin credentials committed to the repository · **High**

**Location:** `server/config/seed.js:19-25`

```js
const password_hash = await bcrypt.hash('Booky@Admin2025', 12);
await Admin.create({ email: 'admin@bookyediting.com', password_hash });
console.log('Password: Booky@Admin2025');
```

**Description.** The database seed script creates the first admin with a fixed, known email and password (`admin@bookyediting.com` / `Booky@Admin2025`). For a portfolio project these values are effectively public — anyone reading the repository knows the initial admin credentials.

**Impact.** If the deployed instance was seeded with these values and the password was never rotated, an attacker already holds half of the authentication factors. The only remaining barrier is the email-OTP device check (see BKY-02). This converts a "two-factor" login into a "one-factor + OTP-guessing" problem and meaningfully raises the value of any weakness in the OTP flow.

**Recommendation.**
1. **Rotate the production admin password immediately** if the seed default was ever used (verify in production).
2. Move seed credentials to environment variables and fail loudly if absent:
   ```js
   const email = process.env.SEED_ADMIN_EMAIL;
   const pw = process.env.SEED_ADMIN_PASSWORD;
   if (!email || !pw) throw new Error('Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD');
   ```
3. Remove the plaintext password from `console.log`.
4. Consider forcing a password change on first login.

---

### BKY-02 — OTP verification lacks per-account brute-force protection · **High**

**Location:** `server/controllers/auth.controller.js:108-147`, `server/routes/auth.routes.js:27-33`

**Description.** Unknown-device logins require a 6-digit email OTP. `verifyOtp` compares the submitted code but:
- It does **not** count or cap failed attempts per account.
- It does **not** invalidate the OTP after N wrong guesses.
- The only throttle is `otpLimiter` — **10 attempts / 10 minutes keyed on IP address**.

A 6-digit code is a 1,000,000-value space. Because throttling is per-IP rather than per-account, an attacker using a pool of proxies/IPs can submit far more than 10 guesses against a single live OTP within its 10-minute window. Triggering a login (possible with the public password from BKY-01) generates a fresh OTP the attacker can then grind.

**Impact.** Chained with BKY-01 (known password), a determined attacker with rotating IPs has a realistic path to defeat the OTP and achieve full admin account takeover. On its own (password unknown) the risk is much lower, but the OTP step is the last line of defence and should not be IP-throttled only.

**Recommendation.**
- Add a per-account OTP attempt counter (e.g., `otp_attempts` on `Admin`). After ~5 failures, null out `otp_code`/`otp_expires_at` and force a fresh login.
- Use a constant-time comparison for the OTP hash (`crypto.timingSafeEqual`).
- Optionally raise the OTP length to 8 digits and reduce its lifetime to ~5 minutes.

---

### BKY-03 — Unescaped public input injected into admin notification emails · **Medium**

**Location:** `server/services/email.service.js:37-64` (and OTP/reset templates use server-controlled data only)

```js
subject: `New Quote Request — ${submission.full_name}`,
html: `... <td>${submission.full_name}</td> ... <td>${submission.book_title}</td> ...`
```

**Description.** Quote-submission fields (`full_name`, `email`, `phone`, `book_title`, `genre`, …) come from an **unauthenticated public form** and are interpolated **without HTML-escaping** into the notification email sent to the business owner.

**Impact.** HTML/content injection into the admin's inbox. An attacker can submit a quote whose `full_name`/`book_title` contains arbitrary HTML (e.g., a fake "Click here to verify" anchor pointing at a phishing site), rendered inside a legitimate-looking Booky notification. Most mail clients strip `<script>`, so this is HTML/phishing injection rather than classic XSS — but it is a convincing social-engineering primitive against the admin. The same values also flow to the WhatsApp message (that path is URL-encoded and safe).

**Recommendation.** HTML-escape every interpolated user value before embedding it in email HTML:
```js
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
// ...subject: `New Quote Request — ${esc(submission.full_name)}`
```
Keep the subject line free of raw user input as well.

---

### BKY-04 — Insecure public manuscript upload · **Medium**

**Location:** `server/middleware/upload.js:8-29`, `server/controllers/quote.controller.js:19-27`, `server/routes/quote.routes.js`

**Description.** The public quote form accepts a file upload with three weaknesses:
1. **Content type is validated only by the client-supplied MIME string** (`file.mimetype`), which is trivially spoofable. There is no magic-byte/content inspection.
2. The manuscript is stored on Cloudinary as **`resource_type: 'raw'`** with **`use_filename: true`** and served from a **public** `secure_url` with no access control or expiry.
3. `multer` buffers the **full 20 MB into memory before validation runs** (multer is mounted before the express-validator chain), so invalid/abusive submissions still consume memory.

**Impact.**
- *Confidentiality:* uploaded manuscripts (sensitive, unpublished author IP) live at public Cloudinary URLs — anyone who obtains/leaks a URL can read them. There is no authn on retrieval.
- *Malware hosting / phishing:* an attacker can spoof a benign MIME type and upload arbitrary content served from a trusted-looking `res.cloudinary.com` URL; the admin may download a booby-trapped "manuscript" while triaging quotes.
- *Resource pressure:* 20 MB memory buffering per request (rate-limited to 10/hour/IP, but IP-rotatable).

**Recommendation.**
- Validate true file type by inspecting magic bytes (e.g., `file-type`) and reject mismatches; restrict to the document types you actually accept.
- Use Cloudinary **authenticated/private** delivery (signed, expiring URLs) for manuscripts instead of public `secure_url`.
- Reduce the size limit to a realistic manuscript ceiling and consider streaming/scanning rather than full in-memory buffering.

---

### BKY-05 — XSS defence-in-depth gaps · **Medium**

**Location:** `client/src/pages/public/BlogPost.jsx:119` (`dangerouslySetInnerHTML`), `server/controllers/blog.controller.js:5-8,131,175` (DOMPurify), `server/package.json` (`dompurify ^3.3.3`), `server/server.js:25` (helmet on API only)

**Description.** Blog HTML is the single `dangerouslySetInnerHTML` sink in the app and is rendered to **all public visitors**. It is sanitised server-side with DOMPurify on write, which is the right approach — but two gaps weaken the guarantee:
1. **The pinned DOMPurify version (≤3.3.3) has published sanitiser-bypass advisories** (FORBID_TAGS bypass, SAFE_FOR_TEMPLATES bypass, prototype-pollution→XSS via CUSTOM_ELEMENT_HANDLING). See BKY-08.
2. **There is no Content-Security-Policy protecting the front end.** `helmet()` is applied to the Express API only; the React app is served separately (Vercel) and the server does not serve it, so helmet's CSP never reaches the page where the HTML is rendered. There is also no client-side sanitisation fallback before injection.

Exploitability is currently limited because only the authenticated admin can author blog posts. The real risk is *latent*: a sanitiser bypass + admin pasting untrusted content + no CSP = stored XSS executing in every visitor's browser.

**Recommendation.**
- Upgrade DOMPurify (`npm audit fix`) and pin a hardened config (explicit tag/attribute allowlist; forbid `iframe`/`object`/`embed`/event handlers).
- Add a CSP on the front-end host (Vercel headers / `vercel.json`), e.g. `default-src 'self'; object-src 'none'; frame-ancestors 'none'`, tuned for Cloudinary image origins.
- Treat server-side sanitisation as one layer, not the only one.

---

### BKY-06 — Database TLS certificate verification disabled · **Medium**

**Location:** `server/config/db.js:13-18`

```js
ssl: { require: true, rejectUnauthorized: false }
```

**Description.** For non-local connections SSL is required but certificate validation is disabled. The client encrypts but does not verify it is talking to the genuine database server.

**Impact.** An attacker able to position themselves on the network path between the API host and the Postgres host can MITM the "encrypted" connection — intercepting queries and, critically, the database credentials embedded in `POSTGRES_URL`. On managed platforms where app and DB share a provider network this is lower-likelihood, but it remains a real transport-security weakness.

**Recommendation.** Use the database provider's CA certificate and set `rejectUnauthorized: true` (supply `ca:` in `dialectOptions.ssl`). If the managed provider only offers self-signed certs, document the residual risk explicitly.

---

### BKY-07 — Automatic schema sync (`alter: true`) on every boot · **Medium**

**Location:** `server/config/syncDb.js:17`

```js
await sequelize.sync({ alter: true });
```

**Description.** Every server start runs `sync({ alter: true })`, which inspects models and issues `ALTER TABLE`s to make the live schema match. This is a data-integrity/availability risk rather than a classic vulnerability (the user asked for risks too): `alter` can drop/recast columns, fail mid-migration, hold locks, or diverge subtly between environments, and it runs automatically with production data.

**Impact.** Potential data loss or corruption and downtime triggered simply by deploying a model change — no attacker required.

**Recommendation.** Move to explicit, reviewed migrations (`sequelize-cli` / Umzug). At minimum, gate `alter` behind a non-production guard and run `sync()` (no alter) in production.

---

### BKY-08 — Vulnerable third-party dependencies · **Medium**

**Location:** `client/package.json`, `server/package.json` (`npm audit`, 2026-06-04)

**Client (7 advisories — 3 High, 2 moderate, 2 low):**
- **`react-router` / `react-router-dom` 7.0–7.14.1 — High.** Advisories: turbo-stream deserialization → *unauth RCE*, open redirect via protocol-relative `//` paths, DoS via `__manifest`. The **RCE vector requires React Router server/framework mode (SSR)**, which this Vite SPA does not use, so practical impact here is lower — but the **open-redirect** and **DoS** items can apply to client routing, and the fix is non-breaking. **Upgrade.**

**Server (moderate):**
- `dompurify ≤3.3.3` — sanitiser bypass advisories (see BKY-05). Non-breaking fix.
- `ws 8.0–8.20` — uninitialised memory disclosure.
- `qs` — DoS in `stringify`.
- `nodemailer ≤8.0.4` — SMTP CRLF injection — **not exploitable here because `nodemailer` is never imported** (the app uses Resend); remove the dependency.
- `@anthropic-ai/sdk`, `ip-address` (via `express-rate-limit`/`geoip-lite`), `uuid` (via `sequelize`) — moderate, mostly not reachable in this usage.

**Recommendation.** Run `npm audit fix` in both packages for the non-breaking upgrades (react-router, dompurify, ws, qs). Review the `--force` breaking ones (sequelize/uuid, geoip-lite) deliberately. Remove unused `nodemailer`. Add a periodic `npm audit` / Dependabot check.

---

### BKY-09 — JWT verification does not pin the signing algorithm · **Low**

**Location:** `server/middleware/auth.js:12`

```js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

**Description.** `algorithms` is not specified. With a symmetric HMAC secret the classic RS256→HS256 confusion attack does not apply, so this is hardening rather than an active bug, but pinning the algorithm removes a whole class of future foot-guns.

**Recommendation.** `jwt.verify(token, secret, { algorithms: ['HS256'] })`. Also ensure `JWT_SECRET` is a long, high-entropy value in production.

---

### BKY-10 — Stored URLs are not scheme-validated · **Low**

**Location:** `server/controllers/settings.controller.js:21-37` (social + manuscript form URLs), `server/controllers/book.controller.js` (book `links`)

**Description.** Admin-supplied URLs (social links, `manuscript_inquiry_form_url`, book purchase links) are stored without validating the scheme and later rendered as `href`/`src` on public pages. A value like `javascript:…` could become a clickable XSS vector. Input is admin-only, so likelihood is low, but these render on public pages and deserve validation.

**Recommendation.** Validate stored URLs against an `https?:` allowlist (reject `javascript:`, `data:`, etc.) on write, and/or enforce it again at render.

---

### BKY-11 — No token/session revocation on password change or logout · **Low**

**Location:** `server/controllers/auth.controller.js:149-153, 162-184`, `client/src/context/AuthContext.jsx`

**Description.** Auth is stateless JWT (24h default lifetime). `logout` only clears client state (and a cookie that is never actually set), and `changePassword` does not invalidate previously issued tokens. A leaked/stolen token stays valid until expiry even after the password is changed.

**Recommendation.** For a single-admin app this is low priority. If you want true revocation, add a `token_version` to `Admin`, embed it in the JWT, bump it on password change/logout, and check it in `authMiddleware`. Also remove the dead `res.clearCookie('booky_token')` logic.

---

### BKY-12 — Validator ↔ DB length mismatches; implicit body-size reliance · **Low**

**Location:** `server/routes/comment.routes.js` (`body` max 1000) vs `server/models/BlogComment.js:15-24` (`STRING(600)`); `server/server.js:49` (`express.json()` with no explicit limit)

**Description.** Comment `body` validation allows up to 1000 chars but the column is `STRING(600)`, so a 601–1000-char comment passes validation then throws a DB error (handled as a generic 500) — a robustness bug, not a breach. `author_name` has no length validator (the `STRING(255)` column bounds it, but over-length input errors rather than rejects cleanly). The app also relies on Express's implicit ~100 KB JSON limit rather than setting one explicitly.

**Recommendation.** Align validator limits with column sizes; add explicit `isLength` bounds on all free-text fields; set explicit body limits (`express.json({ limit: '100kb' })`).

---

### BKY-13 — Spoofable `X-Forwarded-For` trusted in client-IP helper · **Low**

**Location:** `server/controllers/analytics.controller.js:10-14`

**Description.** `getClientIp` takes the left-most `X-Forwarded-For` value, which is client-controlled. It is used only for geo-IP country/city tagging of page views, so the impact is limited to falsified analytics geography. Express's `trust proxy: 1` correctly governs the rate-limiter's `req.ip`, so limiter bypass is not enabled by this helper.

**Recommendation.** Derive the IP from the trusted-proxy-aware `req.ip` rather than parsing the raw header; treat geo data as best-effort.

---

### BKY-14 — AI endpoint embeds customer PII in prompt; cost abuse if token leaks · **Low**

**Location:** `server/controllers/ai.controller.js:32-49, 69-127, 155-160`, `server/routes/ai.routes.js`

**Description.** The admin AI assistant is correctly authenticated and rate-limited (20/min). Its system prompt embeds **live customer PII** (recent quote requesters' full names, business analytics). This is acceptable for the admin, but means any compromise of an admin token (e.g., via the XSS path in BKY-05) exposes customer data through the AI and allows running up Anthropic API cost. Client-supplied `messages` are forwarded with attacker-chosen `role`/`content` (minor).

**Recommendation.** Keep the endpoint admin-only (it is). Consider minimising PII in the prompt (initials instead of full names), and add a coarse per-account daily token/cost cap. Optionally validate `role ∈ {user, assistant}`.

---

### BKY-15 — Maintenance & hygiene · **Info**

- **Unused dependency:** `nodemailer` is in `server/package.json` but never imported (the app uses Resend). Remove it — it drops the SMTP-injection advisory and reduces attack surface.
- **Stale `.env.example`:** lists `EMAIL_HOST/PORT/USER/PASS` (nodemailer-era) but omits `RESEND_API_KEY`, which the code actually requires. Update so deployments configure the right secrets.
- **Dead code:** the `booky_token_ref` request interceptor (`client/src/services/api.js:12-17`) does nothing; `res.clearCookie('booky_token')` clears a cookie that is never set; `withCredentials: true` is unnecessary for header-based auth.
- **CORS allows private-LAN origins** on `:5173` (`server/server.js:30`) for local previews — harmless in practice but worth removing from production config.

---

## 4. What the application does well (positive observations)

These are working controls worth preserving through future changes:

- **Secrets management:** `server/.env` is git-ignored and never committed; no hardcoded secrets in tracked code; client only exposes the public `VITE_API_URL`.
- **Authentication:** bcrypt (cost 12); account lockout after 5 failures (15 min); **email-OTP device 2FA** with the code delivered to a fixed owner address (an attacker cannot redirect it); enumeration-safe `forgot-password`; reset tokens are 256-bit, hashed at rest, single-use, and 1-hour-scoped.
- **Authorisation:** every `/admin/*` route is gated by `authMiddleware`; public endpoints expose only published/approved/active records.
- **Injection resistance:** Sequelize parameterises queries; the only `literal()` uses are hardcoded aliases; no `eval`/`exec`/`child_process` anywhere.
- **Output handling:** React auto-escapes all user content except the deliberately-sanitised blog body (DOMPurify); comments/testimonials are moderated before display.
- **Abuse controls:** per-route rate limiters on login, OTP, forgot-password, comments, testimonials, quotes, analytics and AI; honeypot field on the quote form; pagination caps.
- **Hardening:** `helmet()` on the API; restrictive CORS allowlist; production-safe error handler that suppresses stack traces and raw Sequelize errors; no mass assignment (explicit field whitelisting throughout); UUID primary keys for admins (non-enumerable).

---

## 5. Prioritised remediation roadmap

**Now (this week)**
1. BKY-01 — Rotate the production admin password; move seed creds to env vars.
2. BKY-02 — Add per-account OTP attempt lockout + timing-safe compare.
3. BKY-08 — `npm audit fix` (client + server); remove `nodemailer`.

**Soon (this month)**
4. BKY-03 — HTML-escape user input in notification emails.
5. BKY-04 — Magic-byte file validation + private Cloudinary delivery for manuscripts.
6. BKY-05 — Upgrade/harden DOMPurify; add a front-end CSP.
7. BKY-06 — Enable DB TLS certificate verification.
8. BKY-07 — Replace boot-time `alter: true` with reviewed migrations.

**Backlog (hardening)**
9. BKY-09 → BKY-15 — pin JWT algorithm, validate stored URL schemes, align validators/limits, fix IP helper, trim AI prompt PII + add cost cap, and clear the hygiene items.

---

*This report is based on static source review as of 2026-06-04. Items marked "verify in production" depend on deployment/runtime configuration that was not accessible during the review. Re-test after remediation.*
