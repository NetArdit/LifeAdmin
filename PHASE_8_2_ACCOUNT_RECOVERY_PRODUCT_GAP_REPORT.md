# Phase 8.2 — Account Lifecycle Completion, Password Recovery, Security Hardening & Product Gap Closure

**Process followed:** Gate 1 (audit, no code changes) → Gate 2 (classification) → Gate 3 (implementation + validation). Evidence tags: FILE / ROUTE / DATABASE / TEST / BROWSER / BUILD / CONFIG.
**Labels:** VERIFIED · NOT VERIFIED · GAP · BUG — VERIFIED · RISK — NOT REPRODUCED · PRE-EXISTING · FIXED · DEFERRED · DECISION REQUIRED.

---

## 1. Executive Summary

Forgot/Reset Password did **not exist** (GAP — MISSING FEATURE; zero hits across `src/`, `public/`, `web/src/`). It now exists end to end on the application side, with a token lifecycle verified in backend tests (21 new) and a real Edge browser matrix (42 checks). **Real email delivery does not exist and is NOT VERIFIED**: LifeAdmin has no email provider, and choosing one is a product/cost decision that was not made here. Delivery is behind a provider-neutral `sendMail()` with two transports only — a dev/test outbox and a production `none` (sends nothing).

Audit-driven design correction: the app's existing verification "demo mode" returns its code *in the HTTP response*. That is harmless for an authenticated user verifying their own phone, but would be a **total account takeover** if reused for password reset. The reset token is therefore never returned by any endpoint; it exists only in the email/outbox.

Verified defects found and fixed: session cookie never carried `Secure` (P1); password change left every other session alive (P1); an expired verification code was accepted for the rest of the calendar day (P1, found by a test written before the fix); no server-side rate limiting anywhere (P1); unknown-user login skipped bcrypt (timing difference); the family-owner deletion message told users to do things the product cannot do (P2).

One item needs a product decision and was deliberately **not** implemented: a family owner can never delete their account, because there is no delete-family, ownership-transfer, or owner-role-change feature. The block itself is safe and unchanged; only the copy was made truthful.

Results: backend **110/110** (89 → +21), lint clean, build clean, bundle unchanged (**350.94 kB / 79.76 kB gzip** — the auth screen is vanilla and not in the React bundle), **no dependencies added**, browser **42/42** after one test-script false negative was root-caused.

## 2. Phase 8 Baseline
As stated in the phase brief (10 React pages, FK map, owner-deletion block, 134/134 browser checks, 89/89 tests). Taken as evidence, not re-executed except where affected.

## 3. Phase 8 Evidence Reused
- FK map and family-owner block (`schema.sql`, Phase 8 §7) — re-confirmed by reading `schema.sql` and by TEST "account deletion still cascades reset tokens…" and BROWSER "family-owner deletion still blocked".
- Settings/theme/migration behavior, Assistant duplicate-request finding (not reopened), per-page functional evidence from Phases 2–8 (used for §25–33 unless contradicted).

## 4. Phase 8 Evidence Not Sufficient For Full Lifecycle
Phase 8 established change-password and deletion, not recovery. It said nothing about: forgot/reset, session behavior after password change, cookie `Secure`, rate limiting, verification-code expiry, or login timing. All were audited here.

## 5. Current Account Lifecycle Map

| Transition | Exists | Implementation | Evidence |
|---|---|---|---|
| Registration | Yes | `POST /api/auth/signup`, vanilla `pages/auth.js` | FILE `routes/auth.js`; Phase 8 browser signup used throughout |
| Login | Yes | `POST /api/auth/login` | TESTs (lockout, timing, reset-then-login); BROWSER 17–19 |
| Session | Yes | `sessions` table, `la_session` cookie | FILE `lib/auth.js` |
| Change password | Yes | `POST /api/settings/password` | TEST "changing your password signs out other sessions…"; BROWSER regression |
| Logout | Yes | `POST /api/auth/logout` | TEST "logout invalidates the session server-side"; BROWSER 20 |
| **Forgot password** | **Now yes** (was missing) | `POST /api/auth/forgot-password`, "Forgot your password?" on login | TESTs + BROWSER 1–6 |
| Reset email | Generated; **delivery NOT VERIFIED** | `lib/mailer.js` | TEST/BROWSER (outbox only) |
| Reset URL/token | Now yes | `<APP_BASE_URL>/#/reset-password/<token>` | TEST "production: …", "spoofed Host…" |
| Token validation / new password / invalidation | Now yes | `POST /api/auth/reset-password[/check]` | TESTs + BROWSER 7–16, 21–22 |
| Session handling after reset | All sessions deleted | `deleteSessionsForUser` | TEST + BROWSER (pre-reset session dead) |
| Login with new password | Verified | — | TEST + BROWSER 18–19, 23 |
| Settings / deletion | Yes | Phase 8 | see §21–22 |

## 6. Registration Audit
- Server-side validation of names, email (regex), phone, password ≥ 8, confirmation match (FILE `routes/auth.js` signup). bcryptjs, cost 10 — modern-adequate; hashing server-side; plaintext never stored (DATABASE `users.password_hash`).
- Session created on signup; loading/disabled state present in `auth.js`.
- **PRE-EXISTING RISK — DECISION REQUIRED:** duplicate email/phone returns "An account with this email or phone already exists" (enumeration). Removing it needs an email-verified signup flow (needs a provider) — deferred.
- **PRE-EXISTING GAP:** signup is not rate limited (not changed; abuse policy is a deployment decision).
- Password policy is length-only (P3, deferred).
- No password logging found: the only `console.error` in the request path logs unhandled error objects (FILE `errorHandler.js`); BROWSER server log grep for the test passwords = 0 hits.

## 7. Login Audit
- Generic "Invalid credentials." for unknown user and wrong password (FILE).
- **FIXED:** unknown identifier previously returned before bcrypt. Now a dummy hash is compared. TEST: unknown-user median ≥ 0.5× wrong-password median (**VERIFIED as a bound; exact millisecond figures were not recorded**).
- **FIXED (GAP → P1):** failed logins are limited per IP+identifier: 8 failures / 15 min → `429` + `Retry-After`; success resets the counter; applies identically to unknown accounts (TESTs).
- Protected endpoints reject unauthenticated requests (`requireAuth` on all `/api/*` except auth/config; TESTs from prior phases + this phase).
- Back button after logout does not restore the app: BROWSER (isolated + full script). Original check failed for a test-script reason (see §49).
- Credentials-in-transit: HTTPS termination is a deployment matter; NOT VERIFIED (no TLS deployment exists).

## 8. Logout Audit
Server deletes the session row and clears the cookie; replaying the pre-logout cookie yields `user: null` (TEST). Clear-cookie now carries matching attributes.

## 9. Session Management Audit
- Mechanism: 32-byte random hex id in `sessions` (server-side), 30-day fixed expiry, no sliding renewal (FILE `lib/auth.js`). New random id on every login (fixation not applicable).
- Cookie: HttpOnly ✔, SameSite=Lax ✔, **`Secure` was absent — BUG — VERIFIED, FIXED** (`Secure` iff `NODE_ENV=production`; TEST asserts both modes). `.env.example` had claimed this behavior already existed; `NODE_ENV` was never read in `src/`.
- **BUG — VERIFIED, FIXED:** password change did not invalidate other sessions. Now other sessions are deleted, current one kept (TEST). Reset deletes all.
- Account deletion: sessions cascade via FK (Phase 8).
- **PRE-EXISTING (P3, deferred):** session ids stored unhashed; expired sessions never purged; no idle timeout.

## 10. Change Password Audit
Requires current password (bcrypt compare), new ≥ 8, server-side. Wrong current password → 400 (Phase 8 + BROWSER). The pending-state disabling added in Phase 8 is a **DEFENSIVE CONTROL** (no duplicate request was ever reproduced). **NEW:** other sessions are signed out. Note: current-password guessing by someone holding a live session is not rate limited (P3; requires an already-compromised session).

## 11. Forgot Password Status
Was: **GAP — MISSING FEATURE**. Now implemented. Per-item checklist (§10 of the brief):

| # | Item | Status |
|---|---|---|
| 1–2 | Entry point + form | VERIFIED (BROWSER 1–2) |
| 3–4 | Request endpoint, generic response | VERIFIED (TEST/BROWSER 3–5) |
| 5–7 | Random token, storage (hash), expiry | VERIFIED (TEST) |
| 8–10 | Invalidation, single use, supersession | VERIFIED (TEST/BROWSER 11–12, 21) |
| 11–13 | Email creation, transport, template | Generated + outbox VERIFIED; **production transport does not exist** |
| 14 | Reset URL | VERIFIED (TEST, config rules) |
| 15–18 | Reset page/form/validation/confirmation | VERIFIED (BROWSER 7, 15, 16) |
| 19–21 | Invalid/expired/used states | VERIFIED (BROWSER 11–14) |
| 22–24 | Success, login after reset, sessions | VERIFIED |
| 25–27 | Rate limiting, abuse, enumeration | VERIFIED (in-memory; see §16) |
| 28–29 | Tests / browser tests | 21 backend + 42 browser |
| 30 | Production configuration | Documented in `.env.example`; **not deployed → NOT VERIFIED** |
| 31 | Real email delivery | **NOT VERIFIED — no provider** |

Real-email rule (brief §17), separately: request endpoint VERIFIED · token generation VERIFIED · persistence VERIFIED · expiry VERIFIED · invalidation VERIFIED · reset UI VERIFIED · password update VERIFIED · login after reset VERIFIED · email generation VERIFIED (outbox content inspected) · **actual email delivery NOT VERIFIED**.

## 12. Password Reset Status
`POST /api/auth/reset-password/check` (early invalid state) and `POST /api/auth/reset-password`. Validation (≥ 8, match) runs before token lookup, so a typo does not burn the token (TEST). The final update, token consumption and session deletion run in one SQLite transaction with a re-check of `used_at` inside it (guards concurrent use). Success does not auto-login; the user signs in with the new password.

## 13. Reset Token Architecture
- 32 bytes from `crypto.randomBytes` → 43-char base64url (256-bit; TEST asserts length).
- DATABASE (new): `password_reset_tokens(id, user_id FK→users ON DELETE CASCADE, token_hash UNIQUE, expires_at INTEGER ms, used_at, created_at)` + index on `user_id`. Only the SHA-256 hash is stored (TEST: raw token absent from all rows). SHA-256 is appropriate because the input is high-entropy random, not a human password.
- Expiry 30 min, enforced in JS server-side (epoch ms — deliberately not the SQL string comparison that caused the OTP bug).
- The token is never in any HTTP response (TEST) and never logged in production; in `development` the outbox prints the message (with link) to the server console — the documented local delivery path; silent under `NODE_ENV=test`.
- Cleanup of old rows: not implemented (P3); rows cascade on account deletion (TEST).

## 14. Token Expiry / Single-Use Verification
TEST: expired → 400 (same message as garbage and missing tokens); used → 400 on reuse; newer request supersedes older (older → 400); validation failure leaves token valid. BROWSER: reuse, expired (DB edit), invalid, superseded link states.

## 15. User Enumeration Analysis
Forgot-password: identical status and body for existing vs unknown (TEST `deepEqual`, BROWSER identical text); only the existing account produces mail. Rate limits key on the *submitted* email, so throttling is identical for unknown addresses (TEST). Response **timing of forgot-password was not measured — NOT VERIFIED** (the extra work for existing accounts is one insert + an in-memory outbox push). Login timing: see §7. Signup still enumerates (§6, DECISION REQUIRED).

## 16. Rate Limiting / Abuse Analysis
Before: none anywhere (grep + `package.json`). Now, `lib/ratelimit.js` (~50 lines, no dependency), fixed windows, in-memory:
- login failures 8/15 min per IP+identifier; forgot 3/15 min per IP+email and 20/15 min per IP; reset check/submit 15/15 min per IP; verification-code failures 10/15 min per user.
Honest limits: resets on restart; not shared across instances; behind a reverse proxy without `trust proxy`, `req.ip` is the proxy address (the per-IP forgot/reset caps would then be shared by all users) — **DECISION REQUIRED at deployment**. Frontend button disabling is not counted as protection. Signup and change-password are not limited (deferred).

## 17. Email Infrastructure
No mail library, provider, SMTP config, sender identity, or templates existed. Verification uses demo mode (code in response, comment says so — FILE `routes/auth.js`). Added `lib/mailer.js`: `sendMail({to,subject,text})`; `MAIL_TRANSPORT` = `outbox|none`, default `outbox` outside production and `none` in production. No retry logic (nothing to retry). **DECISION REQUIRED:** provider (SMTP host or transactional API), sender domain/SPF/DKIM, cost, secrets handling.

## 18. Email Delivery Status
**NOT VERIFIED — no email was sent or received.** All evidence is from the in-memory outbox / dev console. In production with no provider the endpoint still answers generically and sends nothing; users would never receive reset mail — so "Forgot password" must not be relied on in a public deployment until a provider is chosen.

## 19. Reset URL Architecture
`<APP_BASE_URL>/#/reset-password/<token>`. Base comes from `APP_BASE_URL` only — never from Host/Forwarded headers (TEST with spoofed `X-Forwarded-Host`/`Origin`). Production requires `https://`; missing or `http://` base → no token created, no mail, error logged (TEST). Dev default `http://localhost:PORT`. The token is in the URL **fragment**, which browsers do not send to servers or in Referer; it is removed with `history.replaceState` after success. No redirect parameters exist (no open-redirect surface). Trade-off: the token remains in browser history until success.

## 20. Password Security
bcryptjs cost 10 (unchanged); reset and change use the same `hashPassword`; min length 8 only (P3); no breach/complexity check (deferred). Passwords/tokens never logged (server-log grep = 0 for test passwords; no unhandled-error entries).

## 21. Account Deletion
Unchanged semantics (password required; cascades; sessions removed). Verified again through TEST (member deletes → reset tokens cascade) and BROWSER (owner blocked). Copy fixed (§22).

## 22. Family Owner Lifecycle
Owner deletion is still **blocked** (safe; account and family survive — BROWSER). **GAP — DECISION REQUIRED (P1):** `routes/family.js` has no delete-family, no ownership transfer (`PATCH` role accepts only `admin|member`), and no "leave family" for members. The old message told owners to "transfer ownership or delete the family", which are impossible actions. Copy is now accurate ("…isn't available in LifeAdmin yet"). Options for the decision: (a) owner transfer to an existing admin; (b) explicit delete-family with a member-data policy; (c) both. Nothing was implemented.

## 23. User → Data FK Map (`schema.sql`)
`sessions`, `otp_codes`, `password_reset_tokens`, `tasks.owner_id`, `bills`, `decisions`(+criteria/options), `goals`(+milestones), `eco_logs`, `ai_conversations`(+`ai_messages`), notifications/activity per table, `family_members.user_id` → **ON DELETE CASCADE**. `tasks.assigned_to`, `shopping_items.added_by`, one nullable `user_id` on the activity table → **SET NULL**. `families.owner_id` → **no action (blocked by application guard)**. Personal data cascades; shared family data is never deleted by another member's account deletion.

## 24. Settings Audit
Controls: profile (name save), password change, phone/email demo verification, notifications, theme, AI toggle, export, demo data, account deletion (all from Phase 8; BROWSER regression re-ran password change, deletion block, all 10 pages). **Distinction preserved:** Settings offers *change* password (authenticated); *forgot* password lives on the logged-out login screen only. Verification modal remains demo-mode (authenticated only, so acceptable). Accessibility for the new auth screens: §35.

## 25–33. Product audits (Dashboard, Tasks, Family, BillSense, Goals, EcoLife, Timeline, DecisionFlow, Assistant)
Method: prior-phase browser evidence reused; this phase added a **backend authorization matrix** (TEST, 25 mutating/reading calls across tasks, bills, goals, decisions, eco, family, shopping, chat by a second user → all 403/404, and the owner's data unchanged) — VERIFIED. No IDOR found. Gaps below were identified from reading source in this session (not browser-tested this phase), all classified deferred:

| Area | Observation | Class |
|---|---|---|
| Dashboard | Aggregates tasks/bills/goals/family activity; owner-scoped (FILE `routes/dashboard.js`); no gap found | — |
| Tasks | Full lifecycle exists (Phase 2 evidence); no new gap | — |
| Family | No leave / delete family / transfer (§22) | P1 GAP, DECISION REQUIRED |
| BillSense | Bills are private-only by design; no way to revert "paid" | P3 |
| Goals | UI has create/delete/milestone add/toggle but no goal edit or milestone delete (backend supports both) | P2/P3 DEFERRED |
| EcoLife | Create/delete only, by design | — |
| Timeline | Read-only feed, complete | — |
| DecisionFlow | UI has no delete-decision (route exists); deterministic scoring intact | P3 DEFERRED |
| Assistant | Not touched; Phase 7 evidence stands | — |

## 34. UX/UI Findings
New screens reuse existing tokens/classes (`auth-*`, `btn`, `field`, `field-error`); no new colors, gradients or dependencies. Success notice uses `--accent-600`. Loading/disabled states mirror login. Generic messaging avoids account disclosure.

## 35. Accessibility Findings
BROWSER: "Forgot" link reachable by Tab and activated by Enter; input has `<label for>`; form errors are `role="alert"`; the confirmation and reset-link check use `role="status"`; submit works via Enter. **P3 (deferred, not touched):** login password field still declares `autocomplete="new-password"` (should be `current-password` for password managers).

## 36. Security Findings

| Finding | Class | Status |
|---|---|---|
| No reset flow | GAP | FIXED (app side) |
| Reset via demo-mode pattern would be account takeover | Design constraint | Avoided |
| Cookie lacked `Secure` | BUG — VERIFIED | FIXED |
| Password change kept other sessions | BUG — VERIFIED | FIXED |
| Verification code valid all day after expiry | BUG — VERIFIED (TEST failed 200≠400 pre-fix) | FIXED |
| No rate limiting | GAP | FIXED (in-memory; limits in §16) |
| Login unknown-user timing | RISK — NOT REPRODUCED as exact ms | Mitigated |
| Signup enumeration | PRE-EXISTING RISK | DEFERRED / DECISION |
| CSRF: `SameSite=Lax` + JSON-only bodies, no tokens/CORS | PRE-EXISTING | Not changed; NOT VERIFIED by attack test |
| Session ids unhashed; no purge | PRE-EXISTING P3 | DEFERRED |
| XSS: new auth markup escapes server messages (`escapeText`); notice text is static | VERIFIED by inspection | — |
| Frontend storage | No new `localStorage` use | — |
| Secrets in frontend / AI keys | None added | — |

## 37. Privacy Findings
Reset email contains only the link and generic text — no password, no personal data beyond the recipient address. Nothing sent to AI. Server logs contain no passwords/tokens in production; in `development` the outbox prints the reset link (intended local path).

## 38. Performance Findings
No new API polling; three small endpoints; in-memory maps pruned at 1000 keys. One `bcrypt.hashSync` at process start (~tens of ms) for the dummy hash. React bundle unchanged.

## 39. Cost/Infrastructure Findings
No new service, dependency, or paid infrastructure. Email delivery will require one (decision).

## 40. Dependency Changes
**None** (`package.json`/`web/package.json` untouched).

## 41. P0 Findings
None identified (no data-integrity or account-takeover path found beyond the items fixed above; the demo-code-reuse hazard was avoided at design time).

## 42. P1 Findings
Forgot/reset missing (fixed); cookie `Secure` (fixed); sessions after password change (fixed); OTP expiry (fixed); rate limiting (fixed, in-memory); **family owner lifecycle gap (DECISION REQUIRED)**; production email provider (DECISION REQUIRED).

## 43. P2 Findings
Misleading owner-deletion copy (fixed); login-timing equalisation (fixed); Goals edit / milestone delete UI (deferred).

## 44. P3/P4 Deferred
Session hashing/purge/idle timeout; password strength policy; login `autocomplete`; reset-token row cleanup; DecisionFlow delete UI; un-pay a bill; rate limit on signup/change-password; SMTP retry logic.

## 45. Decision Required
1. Email provider (SMTP/API), sender domain, cost. 2. Production origin, HTTPS termination, `trust proxy`. 3. Family ownership policy (transfer / delete family / leave family). 4. Signup enumeration vs email-verified signup. 5. Shared/distributed rate-limit store if multi-instance. 6. Whether "Forgot password" may be shown publicly before delivery exists.

## 46. Implemented Changes
Reset lifecycle (routes, token lib, mailer, UI), `Secure` cookie, session invalidation on change/reset, OTP expiry fix, in-memory limiters (login, forgot, reset, OTP), login timing equalisation, accurate owner-block copy, `#page-root` guard so hash changes on the auth screen no longer throw, `.env.example` documentation.

## 47. Files Changed
`src/db/schema.sql`, `src/lib/auth.js`, `src/routes/auth.js`, `src/routes/settings.js`, **new** `src/lib/mailer.js`, `src/lib/ratelimit.js`, `src/lib/authLimits.js`, **new** `test/account-recovery.test.js`, `public/js/pages/auth.js`, `public/js/app.js`, `eslint.config.js` (`history` global), `.env.example`.

## 48. Database Changes
New table `password_reset_tokens` + index (see §13), created by `schema.sql` `CREATE … IF NOT EXISTS` on start. Tested on fresh databases (every test file uses a new DB). **Migration onto a pre-existing populated database: not exercised — NOT VERIFIED** (mechanism is additive-only). No FK semantics changed.

## 49. Browser Verification Matrix (Edge/Playwright, `NODE_ENV=development`)
Part A 34/34, part B 8/8 (42 total): forgot entry; unknown vs existing identical; token/link generated; valid link; refresh keeps form; short/mismatch rejected; success + notice + token removed from URL; reuse blocked; expired blocked; invalid blocked; "request new link"; old password rejected; new password login → protected app; logout; back-after-logout; pre-reset session killed; supersede; throttling message; keyboard/label/live-region; owner-block copy; Settings password change keeps session; all 10 pages, no overflow; 320/360/375/390/414/tablet/desktop layouts (forgot, reset, invalid); full mobile flow at 375. Uncaught page errors: none. Console errors: only deliberate 400/401/429 negative paths.
**Corrected false negative:** "Back after logout" failed once because the tested page had no in-app history, so `goBack()` left the site for `about:blank`. An isolated repro with in-app history showed the correct behavior (login form, no shell, `/me` null); the script was fixed and re-run after a server restart (limiters are in-memory) — 34/34.
Not run in a browser: production-mode HTTPS cookie (header-level TEST only).

## 50. Security Verification Matrix
Covered by TESTs (110 total): generic forgot response; hash-only storage; single use; expiry; supersession; invalid-token uniformity; validation without token burn; forgot/login/OTP throttling incl. unknown accounts; login timing bound; mail `none`; production base-URL rules; spoofed Host; cookie flags; session invalidation on change/reset/logout; OTP expiry; IDOR matrix; deletion cascade + owner-block copy. **Not tested:** CSRF attack simulation, TLS, proxy IP behavior, real email.

## 51. Regression Results
BROWSER: login, logout, Settings password change, owner-deletion block, all 10 pages (load + no overflow). Backend: all 89 prior tests pass unchanged. Bugs found in regression: none.

## 52. Backend Test Results
`npm test`: **110 tests, 110 pass, 0 fail** (89 existing + 21 new).

## 53. Lint Results
`npx eslint .` exit 0 (one initial error — undefined `history` global — fixed in `eslint.config.js`).

## 54. Production Build Results
`npm run build` (web/) succeeds.

## 55. Bundle Impact
350.94 kB raw / 79.76 kB gzip before and after (auth screen is vanilla, outside the React bundle).

## 56. Remaining Risks
Reset email cannot be delivered in production until a provider exists; in-memory limiters reset on restart and are per-process; proxy IP handling undefined; family owners cannot delete accounts; signup enumeration; unhashed session ids; length-only password policy.

## 57. NOT VERIFIED Items
Real email delivery; forgot-password response timing; production HTTPS/`Secure` cookie in a browser; behavior behind a reverse proxy; migration onto a populated existing DB; CSRF attack simulation; exact login-timing numbers (only a ratio bound was asserted).

## 58. Final Verdict — explicit answers
1. **Entire account lifecycle complete?** Application-side yes; **not complete for production** (no email delivery; owner lifecycle gap).
2. **Forgot Password exists?** Yes (was missing).
3. **Password Reset exists?** Yes.
4. **Reset-token lifecycle secure?** Verified for what was tested: 256-bit random, hash-only storage, 30-min server-enforced expiry, single use, supersession, generic errors, throttled, never returned or (in production) logged. Residual: in-memory limits, token in URL fragment until success.
5. **Actual email delivery verified?** **No** — none exists.
6. **Login after reset verified?** Yes (TEST + BROWSER, desktop and 375px).
7. **Sessions handled correctly after change/reset?** Yes now: change keeps current, drops others; reset drops all (TEST + BROWSER). Was a verified bug before.
8. **Account deletion safe under current lifecycle?** Yes (cascades personal data, never shared family data; owner blocked).
9. **Family-owner deletion still protected?** Yes (BROWSER + TEST).
10. **P0 blockers?** None found.
11. **P1 basic product gaps?** Yes: email provider; family ownership lifecycle (both DECISION REQUIRED).
12. **P2 worth fixing now?** Fixed: owner copy, login timing. Remaining P2: Goals edit UI (deferred).
13. **Infrastructure/provider decisions?** Yes — §45 items 1, 2, 5.
14. **NOT VERIFIED:** §57.
15. **Recommended next phase:** a **decision gate, then a small implementation phase ("8.3")**: (a) ChatGPT decides email provider + production origin/proxy; (b) decides family ownership policy; then implement the provider transport behind the existing `sendMail()` (config + one real-delivery test into a real inbox) and the chosen owner-lifecycle feature with tests. Only after that, run the final whole-product audit. No further features should be added before those decisions.

*This phase was stopped here per instruction; Phase 9 was not started.*
