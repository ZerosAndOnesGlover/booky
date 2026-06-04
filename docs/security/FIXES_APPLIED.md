# Booky — Security Fixes Applied

**Date:** 2026-06-04 · **Branch:** `security-fixes` · Companion to [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md)

All 15 findings from the audit were addressed. Verified: full server syntax sweep passes, all modules load without runtime errors, client builds clean, and dependency audits re-run.

> ⚠️ **Read "Required deployment actions" below before deploying** — three steps are needed or production will misbehave.

---

## Required deployment actions (do these on deploy)

1. **Set the new environment variables** (see updated `server/.env.example`):
   - `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` — needed only if/when you run the seed.
   - `RESEND_API_KEY` — was always required by the code; now documented.
   - `NODE_ENV=production` — **important**: several fixes key off this (no schema auto-ALTER, no LAN CORS, error-message suppression).
   - `DB_CA_CERT` *(optional)* — set to the DB provider's CA PEM to turn on TLS certificate verification.
2. **Run the one-time column migration** (because production no longer auto-ALTERs the schema):
   ```bash
   cd server && node scripts/addSecurityColumns.js
   ```
   Adds `admins.otp_attempts` and `admins.token_version`. Idempotent. *(Local/dev still auto-adds them via `alter` when `NODE_ENV` ≠ production.)*
3. **Rotate the admin password** if the old hardcoded default (`Booky@Admin2025`) was ever used.

Optional hardening: tighten the CSP `connect-src` in `client/vercel.json` from `https:` to your exact API origin.

---

## What changed, by finding

| ID | Fix | Files |
|----|-----|-------|
| BKY-01 | Seed admin creds read from `SEED_ADMIN_*` env; password no longer logged | `server/config/seed.js` |
| BKY-02 | OTP: timing-safe compare + per-account lockout (invalidates code after 5 wrong tries) | `server/models/Admin.js`, `server/controllers/auth.controller.js` |
| BKY-03 | All public-submission fields HTML-escaped in notification email | `server/services/email.service.js` |
| BKY-04 | Magic-byte content validation centralized in `uploadToCloudinary` (rejects MIME spoofing) | `server/middleware/upload.js` |
| BKY-05 | Hardened DOMPurify allowlist + CSP/security headers (SPA rewrites preserved); DOMPurify upgraded | `server/controllers/blog.controller.js`, `client/vercel.json` |
| BKY-06 | DB TLS verifies server cert when `DB_CA_CERT` is set (safe fallback otherwise) | `server/config/db.js` |
| BKY-07 | No `alter:true` in production; plain `sync()` there | `server/config/syncDb.js` |
| BKY-08 | `npm audit fix` (react-router→7.16, dompurify→3.4.8, ws, qs); removed unused `nodemailer` | both `package*.json` |
| BKY-09 | `jwt.verify` pinned to `HS256` | `server/middleware/auth.js` |
| BKY-10 | Stored URLs validated to http(s) only (`safeUrl`) for settings links + book links | `server/utils/url.js`, `server/controllers/settings.controller.js`, `server/controllers/book.controller.js` |
| BKY-11 | `token_version` revocation: bumped on password change/reset, checked in middleware; change-password re-issues a fresh token; dead cookie code removed | `server/models/Admin.js`, `server/middleware/auth.js`, `server/controllers/auth.controller.js`, `client/src/pages/admin/Settings.jsx` |
| BKY-12 | Length bounds on `author_name` + quote text fields; explicit `100kb` body limit | `server/routes/comment.routes.js`, `server/routes/quote.routes.js`, `server/server.js` |
| BKY-13 | Client IP from proxy-aware `req.ip` instead of raw `X-Forwarded-For` | `server/controllers/analytics.controller.js` |
| BKY-14 | AI prompt masks customer names to initials; message roles validated; best-effort daily request cap | `server/controllers/ai.controller.js` |
| BKY-15 | Refreshed `.env.example`; removed dead request interceptor; LAN CORS gated to non-production | `server/.env.example`, `client/src/services/api.js`, `server/server.js` |

New files: `server/utils/url.js`, `server/scripts/addSecurityColumns.js`.

---

## Partial / documented follow-ups (not auto-applied)

- **BKY-04 (private manuscript delivery):** content validation is in place, but manuscripts are still stored at public Cloudinary URLs. Switching to authenticated/signed delivery requires Cloudinary account configuration + an admin-side change to view files via signed URLs — left as a deliberate follow-up.
- **BKY-05 (CSP `connect-src`):** currently `'self' https:` to avoid breaking API/streaming calls when the exact prod API origin is unknown. Pin it to your API domain for a tighter policy.
- **BKY-08 remaining advisories:** the leftover moderate/low items (`sequelize`→`uuid`, `geoip-lite`/`express-rate-limit`→`ip-address`, `@anthropic-ai/sdk`, `quill`) are only "fixable" via destructive major downgrades and are not reachable in this app's usage. Left intentionally; track via Dependabot.
