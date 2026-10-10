# Phase 8.3 — Real Email Delivery + Family Ownership Lifecycle + Targeted Production Hardening

Evidence tags used throughout: **VERIFIED** (observed in this session by a test or real-browser run) · **IMPLEMENTED BUT NOT PRODUCTION-VERIFIED** · **NOT VERIFIED** · **DEFERRED**.

---

## 1. Executive summary

- **Email.** A Resend adapter now sits behind the existing `sendMail()` (route → `requestPasswordReset()` service → `sendMail()` → adapter). It is fail-closed, server-side only, and tested against a **local mock provider**. **No real email was sent or received in this phase.** No Resend account, API key, verified sender domain or production origin exists in this environment, so the provider-configuration gate was reached and stopped at: production email is **NOT VERIFIED**. What is required is listed in §3, §6, §7 and §12.
- **Family lifecycle.** *Transfer ownership* and *Leave family* are implemented, enforced by the backend, atomic, and verified by 12 backend tests and 26 real-browser checks. Account deletion now works after a transfer + leave; a sole-member owner stays blocked, with copy that only names paths that exist.
- **Extra finding (pre-existing, fixed):** `confirmDialog` rendered its message as raw HTML; a task titled `<img src=x onerror=…>` executed script when its delete dialog opened. Reproduced in a real browser, fixed by escaping, re-verified (§20).
- **Shared-component change:** the modal now moves focus in, traps Tab, and restores focus on close (needed for the accessibility requirement; §25).
- **Gates:** 135/135 backend tests (baseline 110), lint clean, build OK, no new dependencies, no secret strings in `public/` or `web/src`.

---

## 2. Phase 8.2 baseline reused

Reused unchanged: the 256-bit single-use hashed reset token (`password_reset_tokens`, 30-min TTL, newer request supersedes older, reset deletes all sessions), the enumeration-safe generic response, in-memory limiters (`ratelimit.js` / `authLimits.js`), the URL-fragment reset route `#/reset-password/<token>`, the reset UI in `public/js/pages/auth.js`, and the 21 Phase 8.2 account-recovery tests (all still pass). **VERIFIED** (full suite green; the Phase 8.2 browser matrix re-run: 34/34).

Changed on top of that baseline: the mailer (adapter + selection), token creation/invalidation moved into a service, and the forgot-password route now `await`s the service.

---

## 3. Email provider decision

Resend, as approved in the brief. Reasons that are visible in the code: one HTTPS `POST` with a Bearer key, no SDK required (built-in `fetch`, so **no new dependency**), sender identity is a verified domain the operator controls.

**Not decided by me and not invented:** the sender domain. There is no default `MAIL_FROM`. No second provider and no SMTP fallback exist (an unknown `MAIL_TRANSPORT` value such as `smtp` is ignored — tested).

Provider request shape (`POST https://api.resend.com/emails`, JSON `{from, to:[…], subject, text, html}`) is implemented from the documented API; it was **verified only against my mock**, not against the live service (**NOT VERIFIED** live).

---

## 4. Provider integration architecture

```
POST /api/auth/forgot-password  (src/routes/auth.js)
  → validate + rate-limit
  → requestPasswordReset(email)   (src/lib/passwordReset.js: token, URL, template, invalidate-on-failure)
  → sendMail({to,subject,text,html})   (src/lib/mailer.js, provider-neutral)
  → transport: outbox | none | resend   (only sendViaResend knows Resend)
```

- `sendMail()` never throws and returns only `{delivered, transport, error?}` with generic codes (`not_configured`, `provider_rejected`, `provider_unreachable`, `no_provider`). Provider response bodies are never returned or logged (only the HTTP status code).
- Timeout via `AbortController` (`MAIL_TIMEOUT_MS`, default 10 s).
- Transport selection: explicit `MAIL_TRANSPORT` if valid; else in production `resend` when both `RESEND_API_KEY` and `MAIL_FROM` are set, otherwise `none`; outside production `outbox`. **VERIFIED** (unit test).
- `RESEND_API_BASE` (test-only override) is honoured only when `NODE_ENV !== 'production'`, so a stray variable can never redirect the API key. **VERIFIED** (test stubs `fetch` and asserts the production URL is `https://api.resend.com/emails`).

---

## 5. Environment variables

All server-side; placeholders only in `.env.example`; no `.env` exists in the project; no value was written anywhere else.

| Variable | Purpose | Notes |
|---|---|---|
| `RESEND_API_KEY` | Provider credential | Never logged, never returned, never in `public/`/`web/src` (grep-verified) |
| `MAIL_FROM` | Sender, e.g. `LifeAdmin <no-reply@your-verified-domain>` | Must be on a Resend-verified domain; no default |
| `MAIL_TRANSPORT` | Optional override `outbox\|none\|resend` | Existing name, reused |
| `MAIL_TIMEOUT_MS` | Optional provider timeout | Default 10000 |
| `APP_BASE_URL` | Public origin for reset links | Existing name, reused (the brief's `APP_PUBLIC_URL` was only an example); https required in production |
| `RESEND_API_BASE` | Test-only mock endpoint | Ignored in production |

`.env.example` also carries the deployment warning and the rate-limit topology note. **VERIFIED** (file content).

---

## 6. Sender domain status

**NOT VERIFIED — none exists in this environment.** Required before real delivery: a sending domain you control, added in the Resend account, with the SPF/DKIM DNS records Resend gives you published and shown as verified. Until then Resend rejects the send; the app handles that safely (§11). I did not invent a domain.

---

## 7. Production origin

**NOT VERIFIED — none provided.** `APP_BASE_URL` must be the real public `https://` origin. In production, a missing, malformed, or `http://` value builds **no link and sends no email** (tested). The origin is never taken from the request `Host` header. In non-production it defaults to `http://localhost:<PORT>` (dev/test only).

---

## 8. Email delivery implementation

- `src/lib/mailer.js` — rewritten (transports, Resend adapter).
- `src/lib/passwordReset.js` — new service; never throws; resolves identically whether or not the account exists.
- `src/lib/auth.js` — added `invalidateResetTokens(userId)`.
- `src/routes/auth.js` — forgot-password delegates to the service; response is always `200 { ok:true, message: <generic> }`.
- `eslint.config.js` — added `AbortController` and `Response` globals (Node built-ins).

**VERIFIED** via 13 new backend tests (`test/email-provider.test.js`) plus the 21 existing recovery tests. **Delivery to a real inbox: NOT VERIFIED.**

---

## 9. Email template

Subject **"Reset your LifeAdmin password"**. Plain-text and HTML parts. Content: LifeAdmin name, one clear button/link "Choose a new password", a fallback copyable address, "works once and expires in 30 minutes", "If you didn't request this, you can safely ignore this email — your password won't change", "Never share this link". No images, no tracking pixels, no third-party fonts, no password, no secrets. The link is HTML-escaped in the attribute and text. **VERIFIED** by test assertions on the request body sent to the mock (expiry text, ignore-note, no `localhost`/`127.0.0.1`, no `<img`/tracking, `<a href="https://…/#/reset-password/…">`). Visual rendering in real mail clients: **NOT VERIFIED** (no real send).

---

## 10. Reset URL construction

`${APP_BASE_URL}/#/reset-password/${token}` — the token is in the URL fragment (not sent to servers in the request line, not in access logs or `Referer`). Origin is configured, https-only in production, never from the request. **VERIFIED** (tests: production without base / with `http://` → no email and no token left; https base used verbatim).

---

## 11. Provider failure behaviour

| Scenario | Result | Evidence |
|---|---|---|
| Provider 401 / 500 | `delivered:false`, generic response to the user, log line `… (HTTP 500).` only | VERIFIED (test) |
| Timeout / unreachable | bounded (~`MAIL_TIMEOUT_MS`), `provider_unreachable` | VERIFIED (test) |
| Missing key or sender | no HTTP call, `not_configured` | VERIFIED (test) |
| Failed delivery + token | the just-created token is **invalidated**; no unused, unexpired token remains; using the would-be link → 400 | VERIFIED (test) |
| Provider body / key / message text / token in logs or response | absent | VERIFIED (test captures `console.*`) |
| Success vs failure response to the caller | identical `200 {ok:true,message}` | VERIFIED (test compares `deepEqual`) |
| Unknown email | provider never called, identical response | VERIFIED (test) |

Trade-off (by design): if a timeout occurs *after* the provider actually accepted the message, that link is invalidated; the user requests another (limited to 3 per 15 min per IP+email).

---

## 12. Real inbox test

**NOT PERFORMED — blocked at the provider-configuration gate.** Required steps once configuration exists: (1) real account, (2) Forgot password, (3) real email received, (4) link opened, (5) password changed, (6) old password fails, (7) new password works, (8) previous sessions invalidated. Steps 5–8 are verified through the dev-outbox path and tests (§13); steps 1–4 with a real provider and inbox are **NOT VERIFIED**.

---

## 13. Password recovery verification

Real-browser (Edge, headless) run of the full recovery matrix against the refactored service using the **dev outbox** (NOT real delivery): **34/34 passed** — neutral response for existing/unknown emails, exactly one email for the existing account and none for the unknown one, valid link opens the form, refresh keeps it, short/mismatched password rejected, success returns to sign-in and strips the token from the address bar, reuse/expired/invalid link → "can't be used" state, old password rejected, new password works, session opened before the reset is signed out, superseded link dead, 4th request throttled, keyboard/label/live-region checks, and regressions (owner-block copy, password change keeps the current session, all 10 pages load without overflow). **VERIFIED (outbox path)**; **NOT VERIFIED** with a real provider.

---

## 14. Rate limiter deployment analysis

Inspected: `server.js` (no `trust proxy`, no clustering, plain `app.listen`), `src/lib/ratelimit.js`, `authLimits.js`, and the auth routes. No Dockerfile, process-manager or platform config exists in the repo, so the real topology is **unknown**.

- Limits are per-process in-memory fixed windows: login failures 8/15 min per IP+identifier; forgot 3/15 min per IP+email and 20/15 min per IP; reset 15/15 min per IP; OTP failures 10/15 min per user. Counters reset on restart.
- **Single instance, exposed directly:** adequate. **VERIFIED** (tests + browser 429).
- **Multiple instances:** each has its own counters, so the effective limit is multiplied by the instance count. **Not fixed** (would need shared storage — out of scope; no Redis/paid infra).
- Nothing was changed. Minimum future architecture if multi-instance is needed: a shared counter store (e.g. one small database table or an external store) keyed the same way. **DEFERRED**.

---

## 15. Reverse proxy analysis

`req.ip` is used as the limiter key. Without Express `trust proxy`, behind a proxy it is the **proxy's** address, so all users share one IP bucket (the per-IP limits would then throttle everyone together; per-IP+email limits still separate accounts). Setting `trust proxy` wrongly would let a client spoof `X-Forwarded-For` and evade limits. Because the topology is unknown I added **no** `TRUST_PROXY` setting and documented the constraint in `.env.example` and the README. The session cookie `Secure` flag follows `NODE_ENV=production`; browser behaviour behind real HTTPS termination is **NOT VERIFIED**.

---

## 16. Family ownership model

Ownership is stored twice: `families.owner_id` (no `ON DELETE`) and the member row with `role='owner'`. They must agree. Placeholder (invited, unregistered) members have `user_id NULL` and can never be owners. `family_members.user_id` cascades on user deletion; other user FKs cascade or set NULL. The brief's no-auto-transfer rule is kept: nothing anywhere transfers or deletes a family automatically.

---

## 17. Transfer ownership implementation

`POST /api/family/:id/transfer-ownership { memberId }` (`src/routes/family.js`):

- Owner only (`requireRole(['owner'])`) → non-owner/admin/outsider 403, unauthenticated 401.
- Target must be a member **of this family** (404 otherwise), not the owner/self (400), and a **registered** member (400 for placeholders); non-numeric/missing id → 400.
- One `db.tx`: `families.owner_id` ← target, old owner row → `member`, target row → `owner`; ownership is re-checked inside the transaction (defence in depth; the driver is synchronous so it cannot actually interleave).
- Logs an `ownership_transferred` activity entry and notifies the new owner. Nothing is deleted.
- UI: Family → Members → **Make owner** (owner only, on registered non-owner members) → confirmation dialog stating who becomes owner, that the current owner becomes a regular member and loses management rights, that nothing is deleted, and that only the new owner can transfer back. Confirm label "Transfer ownership"; default focus is Cancel.

**VERIFIED** (backend tests + browser).

---

## 18. Leave family implementation

`POST /api/family/:id/leave`: any member who is **not** the owner may leave (row removed; `member_left` activity entry; family, other members and shared data untouched). An owner gets 400 "Transfer ownership to another member before leaving this family." An outsider gets 403 and a double leave gets 403. UI: **Leave family** button for non-owners with a confirmation dialog (consequence text, rejoin needs a new invite); owners instead see a hint ("…first transfer ownership with 'Make owner' on another member") and a sole-member owner sees "…only registered member, so you can't leave it or transfer ownership yet. Invite someone to join first." After the last family is left the page falls back to the no-family state. **VERIFIED** (backend + browser).

---

## 19. Account deletion after transfer

- Owner with another registered member: blocked, message "Transfer ownership to another member first (Family → Members → Make owner)…". 
- Sole-member owner: blocked, message names the invite-code path and states honestly that "Deleting a family isn't available in LifeAdmin yet." Delete-family is **not** implemented and is not offered.
- After transfer (with or without leaving first): deletion succeeds. In the browser: owner → transfer → leave → delete account → login screen; the account can no longer sign in; the family survives with the new owner and the remaining member; shared shopping items survive (`added_by` becomes NULL). **VERIFIED** (test + browser).
- **Data note (existing schema, not changed):** deleting an account also deletes that user's own chat messages in the family (`messages.user_id` cascades) — observed 1 → 0 in the test. See §31.

---

## 20. Security analysis

| Item | Status |
|---|---|
| Authorization is server-side for transfer and leave; UI hiding is convenience only | VERIFIED (tests hit the API directly as member/admin/outsider/unauthenticated) |
| Atomicity: a failure at the last step leaves `owner_id` and all roles unchanged | VERIFIED (temporary SQLite trigger forces the failure; rollback confirmed) |
| Exactly one owner row, always equal to `families.owner_id` | VERIFIED |
| Old owner loses all owner powers immediately (add member, change role, remove member, transfer → 403) | VERIFIED |
| Reset token never in HTTP response or logs (incl. production mode) | VERIFIED |
| API key never logged/returned/in frontend | VERIFIED (tests + grep of `public/` and `web/src`) |
| Failed delivery leaves no usable token | VERIFIED |
| Enumeration: identical response/status for known, unknown, and failed-delivery cases | VERIFIED |
| API key cannot be redirected via env in production | VERIFIED |
| **Pre-existing stored-XSS in `confirmDialog`** | **Found and fixed.** Before: a task titled `PROBE <u id="xss-u">under</u><img src=x onerror="window.__xss=1">` → opening its Delete dialog injected the elements and set `window.__xss` (browser evidence, `xss-before.log`). After: `title`, `message`, `confirmLabel` are HTML-escaped in `public/js/components/confirm.js`; the same probe shows the literal text and no injected nodes (`xss-after.log`). Scope note: task/bill titles are owner-scoped, so the practical exposure was self-XSS in those dialogs; the fix is app-wide because the family dialogs added here also show user-controlled names. No caller relied on HTML in these strings. Other places that render user text as HTML were **not audited** (belongs to the final audit). |
| Modal `aria-label` interpolates the title unescaped | Titles are now escaped by `confirmDialog`; other callers pass static titles. Not otherwise changed. |

**Overall security: LIMITATIONS** (production email unverified; rate limiting single-process; proxy trust undecided).

---

## 21. Authorization tests

In `test/family-ownership.test.js` (all pass): member/admin/outsider/unauthenticated → 403/403/403/401 on transfer; outsider and unauthenticated on leave → 403/401; owner leave → 400; target validation (self, unknown id, other family's member, unregistered placeholder, missing, non-numeric); after transfer the old owner is refused for add-member/role-change/remove-member/transfer while the new owner is allowed (and can transfer back).

---

## 22. Backend tests

`npm test`: **135/135 pass** (baseline 110 → +12 family lifecycle, +13 email provider). Both new files use disposable databases; the email tests use a local `node:http` mock provider and stub `fetch` for production-mode cases, so **the real network is never contacted**. Email tests cover: transport selection; success request shape (URL, method, Bearer header, JSON body); missing config; 401/500; timeout/unreachable; production URL pinning; forgot-password through the adapter with token extraction and the full reset; unknown email; failure → invalidated token and clean logs; timeout → invalidated token; production without/with-http `APP_BASE_URL`; production logs contain no token or link. Family tests cover the list in §17–§21 plus atomicity, single-member owner, full flow, and delete-after-transfer-without-leaving.

---

## 23. Browser tests

Edge (Playwright, headless) against a dev server on a **temporary database** (not the real `data/`):

- `verify-phase83-family.mjs` — **26/26**: owner/non-owner views; dialog wording; family name containing HTML shown as text; Escape and Cancel change nothing; confirm updates roles for old owner, new owner and third member; old owner refused by API; leave (Cancel then confirm); account deletion after leave → login screen, deleted account cannot sign in; family intact; non-owner leave; sole-member owner hints and blocked deletion; still signed in.
- `verify-phase83-recovery.mjs` — **34/34** (outbox path).
- Console: only the deliberate 4xx responses from negative tests (a 403 on the old-owner API attempt, a 400 on the blocked deletion, the throttling 429, etc.); **0 page errors, 0 5xx**.

---

## 24. Responsive tests

`verify-phase83-responsive.mjs` at 320 / 360 / 375 / 390 / 414 / 768 / 1280 px with a very long member and family name: no horizontal overflow on the owner or member Members tab; "Make owner" (height 32 px) and "Leave family" fully inside the viewport; transfer and leave dialogs fit with both buttons reachable. **All viewport checks passed (35/35 incl. keyboard).** Screenshots viewed at 320 px show the button wrapping under the member card and the hint text below. Requires one CSS addition (`.member-card { flex-wrap: wrap }`, `.member-actions`, `.member-lifecycle-note` in `public/css/pages.css`). Only Edge/Chromium at emulated sizes; real devices/other engines **NOT VERIFIED**.

---

## 25. Accessibility tests

- "Make owner" / remove buttons have per-member accessible names (`Make <name> the owner`, `Remove <name>`).
- Dialog exposes `role="dialog" aria-modal="true"` with its title as the name (unchanged pattern).
- **Fixed gap (shared modal):** before, focus stayed on the page behind the dialog (observed: "focus moves into the dialog" FAIL). Now initial focus goes to the first field in the body, else the first footer button (Cancel for confirm dialogs, the safe choice); Tab and Shift+Tab are trapped inside; Escape/close restores focus to the opener; a listener leak when a modal replaces another was removed. **VERIFIED** (Tab cycled through Transfer › Close › Cancel repeatedly, never leaving the dialog; Escape returned focus to the opener; the whole transfer was completed with keyboard only).
- Recovery form label/live-region/keyboard checks pass (§13).
- Not run: a screen reader, contrast measurement beyond existing design tokens, `prefers-reduced-motion`.

---

## 26. Regression tests

Prior-phase real-browser scripts re-run after the modal, confirm and Members changes: Tasks 24/24, BillSense 62/62, Phase 5 (Goals/EcoLife/…) 82/82, Phase 6 96/96, Phase 7 (Assistant) 107/107, Phase 8 (Settings) 42/42 + 92/92, tabs 51/51, Family 26/26 (script selector updated from `aria-label="Remove"` to `^="Remove"` because the label now includes the member's name — an intentional accessibility change). Login/Signup are exercised by every script's sign-up and by the recovery run; Dashboard and Timeline load in the 10-page check and the phase scripts. `verify-confirmdialog.mjs` (Phase 2.5) is **stale** — it targets a pre-migration selector (`#create-family-btn`) and stopped at 0/0; it was not run successfully, but its coverage (delete dialogs) is exercised by the Tasks, BillSense, Family and Phase 5/6 scripts above.

---

## 27. Build / lint status

- `npm run lint`: clean. `npm test`: 135/135. `npm --prefix web run build`: OK.

## 28. Dependency changes

**None.** `package.json` / `web/package.json` and lockfiles untouched (Resend called with built-in `fetch`).

## 29. Bundle impact

| | JS | gzip |
|---|---|---|
| Baseline (start of 8.3) | 350.94 kB | 79.76 kB |
| After | **354.90 kB** | **80.89 kB** |
| Delta | +3.96 kB | +1.13 kB |

Growth comes from the Members-tab actions and the modal focus management. No secret strings in the bundle (grep for `RESEND`, `MAIL_FROM`, `api.resend.com`, `re_…` keys: none).

---

## 30. Cost

**NOT VERIFIED.** Resend is a paid-tier-capable third-party service; I did not check current plans, free-tier limits or per-message pricing, and no account exists. Reset emails are low-volume (max 3 per email per 15 minutes). Check Resend's current pricing before launch. No other infrastructure was added.

## 31. Privacy / data considerations

- Recipient address and message content are sent to Resend (a third-party processor) whenever a reset is requested for an existing account; this should be reflected in the privacy policy. The UI copy "Local-first · Your data stays on this machine" is no longer fully accurate for password-reset email in a production deployment — **flagged, not changed**.
- Reset tokens are stored only as SHA-256 hashes; the fragment-based link keeps the token out of server logs.
- Deleting an account deletes that user's own chat messages in shared families (existing cascade; other members lose those messages). Shared items (e.g. shopping) survive with the author cleared. Not changed; product owner should confirm this is desired.
- Leaving a family removes the membership row only; the leaver's contributions remain (other than as above).

---

## 32. Known limitations

1. Real email delivery, deliverability (SPF/DKIM/DMARC, spam placement) and rendering in real clients are unproven.
2. Rate limiting is per-process in memory; proxy client-IP trust is undecided (§14–15).
3. An ambiguous provider timeout after actual delivery invalidates that link.
4. After transferring, the new owner is the only one who can transfer back; there is no ownership-recovery path if an owner becomes unreachable (by design: no auto-transfer).
5. No Delete Family exists, so a sole-member owner cannot delete their account or leave — stated honestly in the UI.
6. Confirm dialog text is now plain text (no bold in the transfer message).
7. The Settings "Delete account" card copy does not mention the owner requirement (the blocked-deletion message does).

## 33. Unverified items

Real Resend delivery and API acceptance of the request shape; DNS/domain verification; production HTTPS origin and Secure cookies end-to-end; reverse-proxy behaviour; multi-instance behaviour; Firefox/Safari/real mobile devices; screen-reader behaviour; Resend cost/limits.

## 34. Deferred items

Shared/distributed rate limiting; `trust proxy` configuration once topology is known; Delete Family; ownership-recovery flow; privacy-policy text and the "local-first" tagline; audit of other raw-HTML rendering sites (for the final whole-product audit).

---

## 35. Final evidence table

| Claim | Status | Evidence |
|---|---|---|
| Resend adapter behind `sendMail()`, no new dependency | VERIFIED | code, package files untouched, 13 mock-provider tests |
| Real email delivered to a real inbox | **NOT VERIFIED** | no credentials/domain/origin; §12 |
| Provider failure is enumeration-safe, leaves no usable token, leaks nothing | VERIFIED | tests |
| Reset link uses configured https origin, never localhost in production | VERIFIED | tests |
| Reset token not in response or logs | VERIFIED | tests |
| Full recovery flow (outbox path) in browser | VERIFIED (dev outbox) | 34/34 |
| Transfer ownership: owner-only, target rules, atomic, both fields agree | VERIFIED | 12 backend tests, trigger-forced rollback |
| Leave family: non-owner only; owner blocked; outsider refused | VERIFIED | tests + browser |
| Old owner cannot manage after transfer; new owner can | VERIFIED | tests + browser |
| Account deletion after transfer(+leave); sole owner blocked; copy accurate | VERIFIED | test + browser |
| `confirmDialog` XSS found, fixed | VERIFIED | before/after browser probe |
| Modal focus management | VERIFIED | keyboard checks in Edge |
| Responsive 320–1280 | VERIFIED (Edge emulation) | 35/35 |
| Regression across pages | VERIFIED | 8 prior scripts + Family; 1 stale script noted |
| Rate limiter adequate for single instance only | VERIFIED (analysis) | code inspection; not for multi-instance |
| Production readiness of email | **NOT VERIFIED** | §6, §7, §12 |
| 135/135 tests, lint clean, no dependency change, bundle 354.90 / 80.89 kB | VERIFIED | commands run at end |

## 36. Final verdict

The code and behaviour that can be verified without external accounts are done and verified. The one thing this phase cannot prove is real email delivery, and I have not claimed it. To close it, the operator must: create a Resend account; add and verify a sending domain (DNS); create an API key; set `RESEND_API_KEY`, `MAIL_FROM` and an https `APP_BASE_URL` in the host's secret settings with `NODE_ENV=production`; then run the real-inbox test in §12.

PHASE 8.3 VERDICT: PASS WITH LIMITATIONS
PRODUCTION EMAIL: NOT VERIFIED
FAMILY OWNERSHIP: VERIFIED
ACCOUNT DELETION: VERIFIED
SECURITY: LIMITATIONS
NEXT RECOMMENDATION: SPECIFIC BLOCKER REMAINS — real-inbox test needs a Resend account, verified sender domain, API key and https production origin (nothing else blocks the final whole-product audit)
