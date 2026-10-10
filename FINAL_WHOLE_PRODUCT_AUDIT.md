# LifeAdmin — Final Whole-Product Audit

Audit / validation / gap-discovery only. **No product code was changed during this audit** (verified: no file under `src/`, `public/`, `web/src/` or `server.js` is newer than the Phase 8.3 report). Everything created is evidence: scripts, logs and screenshots in [audit-evidence/](audit-evidence/). All probes ran against disposable databases; the real `data/` folder was not touched.

Evidence labels: **VERIFIED** (observed in this audit by test/probe/browser) · **IMPLEMENTED** (present in code; not exercised end to end) · **NOT VERIFIED** · **DEFERRED** · **BLOCKED**. Finding IDs (F-xx) are used throughout and collected in §24.

Audit environment: Windows, Node v24.20.0, Edge (Playwright, headless), no `ANTHROPIC_API_KEY`, no Resend credentials.

---

## 1. Executive summary

LifeAdmin is a coherent product: ten React pages behind one shell, a consistent design system, a working auth/recovery/family lifecycle, and an honest degradation path when AI or email are absent. The frontend rendering layer is sound against script injection (39/39 dynamic checks, §7). The 135 backend tests, lint and build all pass.

The audit nevertheless found concrete defects that the per-phase reviews did not surface, because those reviews tested each migrated page against its own contract rather than probing across users, families and features:

- **Cross-family authorization gaps** (demonstrated): a non-member can attach a bill to any family and push attacker-chosen text into that family's activity feed and notifications (F-01); a member of any family can react to any message in another family (F-02); family invite codes can be guessed without any throttle, removed members can simply rejoin, and demo-seeded families use a 9,000-value code that an outsider guessed and used to read the family's chat (F-03).
- **A privacy promise is broken** (demonstrated): tasks marked *private* inside a family leak their titles to the whole family via the activity feed, Timeline and search, and their comments leak through notifications (F-04).
- **Features that claim to do something and don't** (demonstrated/code-verified): the "Use AI features" switch and the notification preferences are stored but never read; task reminders are collected but nothing sends them; "Verify email/phone" hands the code back in the response in every environment (F-05, F-19).
- **Family chat stops updating after 200 messages** (demonstrated, F-18).
- **Accessibility failures at WCAG Level A** (demonstrated with axe-core and real keyboard tests): task, bill and decision rows and the Family tab strip cannot be operated by keyboard; form fields are unlabeled; icon buttons have no names (F-24, F-25). This includes the Family → Members tab where Phase 8.3 placed *Transfer ownership* and *Leave family* (§26 corrects a claim in the 8.3 report).
- Smaller integrity, validation, UX and operations gaps (§24).

Confirmed severity distribution of security-relevant findings: **HIGH 1** (F-03, demo-seeded families), **MEDIUM 7**, **LOW 5** (plus the theoretical absence of a CSRF token). No CRITICAL finding. **No confirmed XSS in reachable code.**

Verdict in §28: **not ready for public production**; suitable for local or trusted-family use today. The blocking items are small, well-bounded corrections, not redesigns.

---

## 2. Evidence base and current baseline

Read: all 14 phase reports and `LIFE_ADMIN_FULL_AUDIT.md`; the current code (all `src/routes`, `src/lib`, schema, shell, modal/confirm/toast, Family/Assistant/Settings/Decision components, ChatTab). Where reports and code disagree, code was used.

| Baseline item | Result | Evidence |
|---|---|---|
| Backend tests | **135 / 135 pass** | `npm test` at audit end |
| Lint | clean | `npm run lint` |
| Production build | OK; `public/app/main.js` **354.90 kB (80.89 kB gzip)** — unchanged since Phase 8.3 | `npm --prefix web run build` |
| Runtime dependency audit | **0 vulnerabilities** (`npm audit --omit=dev`) | run in audit |
| Web dev-dependency audit | 2 (1 moderate, 1 high): `vite`/`esbuild` **dev-server** advisories; build-time only, not in the shipped bundle | `npm audit` in `web/` |
| Source changed since 8.3 | none | `find … -newer` |
| Prior browser suites re-run at end of Phase 8.3 on identical code | Tasks 24, BillSense 62, Phase 5 82, Phase 6 96, Phase 7 107, Settings 42+92, tabs 51, Family 26, 8.3 family 26, 8.3 recovery 34, 8.3 responsive 35 — all passed | Phase 8.3 report §23–26. **Reused as historical evidence, not re-run** |
| Stale script | `verify-confirmdialog.mjs` targets a pre-migration selector and cannot run | noted in 8.3 |

New audit executions (all reproducible from `audit-evidence/`): 53 backend probes; a 39-check dynamic XSS run; a 14-check journey/failure/responsive run + axe-core scans; keyboard operability probes.

---

## 3. Product coherence and feature classification

Product proposition: *"Tell it what's happening. It organizes what's next."*

**Coherence — VERIFIED.** One shell, one navigation, one modal/confirm/toast system, one design-token set with light and dark themes; every page uses the same empty/loading/error patterns; the Dashboard aggregates tasks, bills, decisions and goals; Timeline unifies activity; search spans tasks, bills, decisions, goals, chat and comments. AI is optional everywhere and degrades to an explicit "not configured" state (Phase 7 evidence).

**Coherence gaps (evidence-based, not stylistic):**
- EcoLife is isolated: it writes no activity, no notification, is not on the Dashboard and not in Timeline (`src/routes/ecolife.js`, `src/routes/dashboard.js`).
- Settings exposes controls with no effect (F-19). Onboarding's "Load demo data" injects fake data into real family spaces (F-20).
- Terminology is consistent (Family / Members / Owner / Admin / Member) but *Admin* is not explained anywhere and cannot be assigned from the UI (the API supports it).
- Dev-speak reaches end users: "ANTHROPIC_API_KEY", "your .env file", "local demo" (F-29).

Feature classification (no ranking):

| Area | Class | Note |
|---|---|---|
| Authentication / account lifecycle | CORE | signup, login, logout, reset, change password, delete, verify (demo) |
| Dashboard | CORE | aggregates four data types |
| Tasks | CORE | reminders field INCOMPLETE (never fires, F-19) |
| Family | CORE | chat BROKEN beyond 200 messages (F-18); tabs not keyboard-operable (F-24) |
| BillSense | CORE | pay/recur works; validation gaps (F-14) |
| Goals | SUPPORTING | stale progress edge (F-15) |
| Timeline | SUPPORTING | leaks private-task titles (F-04) |
| DecisionFlow | SUPPORTING | deterministic scoring; AI optional |
| Assistant | SUPPORTING | AI optional; ignores the AI switch (F-19) |
| EcoLife | QUESTIONABLE | isolated from the rest of the product (see above) |
| Settings | SUPPORTING | two INCOMPLETE controls (AI, notifications) |
| Demo data | QUESTIONABLE | first-run helper that pollutes real data (F-20) |
| Legacy vanilla pages (`public/js/pages/*` except `auth.js`) | REDUNDANT | dead code, F-33 |
| Task reminders | INCOMPLETE | field only |
| Delete family, admin promotion UI, undo payment | DEFERRED | acknowledged in earlier phases |

---

## 4. User journeys

| Journey | Result | Evidence |
|---|---|---|
| **A** New user → signup → Dashboard → create task → complete → Dashboard | **VERIFIED** works. Friction: none blocking. After refresh, session and route persist. | `audit-browser.log` A1–A6 |
| **B** Forgot → reset → login → Settings | **VERIFIED** on the dev-outbox path (34/34, Phase 8.3, code unchanged); real email **NOT VERIFIED** | §23 |
| **C** Owner → family → invite → transfer → leave → delete account | **VERIFIED** (26/26 browser, 12 backend, Phase 8.3). New caveats: the Members tab is not keyboard-reachable (F-24); an owner can demote themself and orphan the family (F-13) | probes |
| **D** Member → join → chat → shopping → leave | Works; **chat freezes at 200 messages** (F-18); removed/left members can rejoin with the same code (F-03); leaving keeps assigned-task access (F-11) | probes |
| **E** BillSense → Goals → EcoLife → Timeline | Work (Phase 5/6 suites reused). Friction: no validation on bill fields (F-14); Timeline shows private-task titles (F-04) | probes |
| **F** DecisionFlow → detail → scoring → AI | Scoring deterministic and correct (Phase 6); AI path **NOT exercised** (no key) beyond graceful "not configured". Rows not keyboard-openable (F-24) | code + Phase 6 |
| **G** Assistant → Chat → Plan → Weekly review → Add to Tasks | Works as far as testable without a key; `plan/apply` trusts a client-supplied preview and is non-transactional (F-14) | code |

Cross-journey observations: refresh persists routes; logout invalidates the session; **session expiry mid-use leaves the user on a page showing the raw message "Not authenticated." with no redirect** (F-21, screenshot `audit-evidence/screenshots/F1-session-expired.png`); backend-down shows "Couldn't load this page — Network error — is the server running?" and keeps forms open on failed saves (**VERIFIED**, F2/F2b) and a reload restores the session after the server returns (F3).

---

## 5. Authentication and account lifecycle

| Step | State | Evidence |
|---|---|---|
| Signup | Works; password ≥ 8, no maximum, no strength rules; **no rate limit** (25/25 rapid signups succeeded); message reveals existing accounts (F-09) | probes |
| Login | Enumeration-safe (timing equalised, generic message); limited 8/15 min per IP+identifier | Phase 8.2 + code |
| Session | 30-day random 256-bit id in an httpOnly, SameSite=Lax cookie; `Secure` when `NODE_ENV=production` (**VERIFIED**: `Set-Cookie … HttpOnly; Secure; SameSite=Lax`); new session per login; other sessions killed on password change/reset | probes COOKIE-1/2 |
| Session expiry | Expiry compared as ISO string vs SQLite `datetime('now')` string → a session expired earlier the same UTC day is still accepted (**VERIFIED**, F-08) | probe SESSION-EXP-1 |
| Logout | Destroys the current session and clears the cookie | code |
| Forgot / reset | Generic response; hashed single-use 30-min token; superseded by newer request; reset ends all sessions; failed delivery invalidates the token | 8.2/8.3 tests |
| Verify email/phone | **Demo mode in every environment**: the code is returned in the response (`demoCode`) when `NODE_ENV=production` (**VERIFIED**, F-05); no limit on requesting codes (30/30) | probes OTP-1/2 |
| Change password | Requires current password | code |
| Account deletion | Password required; blocked for family owners with accurate copy; works after transfer | 8.3 |
| Family ownership transfer / leave | Correct and atomic (rollback proven) — but owner self-demotion bypasses the model (F-13) | 8.3 + probe |
| Real email | **NOT PRODUCTION VERIFIED** | §23 |

The lifecycle is internally coherent for the paths users are led through. The gaps are at its edges (F-05, F-08, F-09, F-13, F-21).

---

## 6. Security audit

Method: full read of every route/lib/middleware file; 53 executable probes (`audit-evidence/audit-probes.cjs`, results in `audit-probes.out.txt`); dependency audit; header/cookie inspection. "FINDING" below means the probe **demonstrated** the behaviour.

### 6.1 What held up (VERIFIED)
- Owner-scoped data (tasks, bills, goals, decisions, EcoLife) is inaccessible to other users and to unauthenticated requests: **16/16 probes** returned 403/404/401 as required; other users' list endpoints return nothing (AUTHZ-1/2).
- Family, chat and shopping endpoints return 403 to non-members on **11/11 probes**; plain members are refused add/role/remove/transfer (AUTHZ-3/4).
- SQL: every query is parameterised; dynamic `UPDATE … SET` column names come from fixed allow-lists (`map` objects), never from request keys. No injection vector found.
- Passwords: bcryptjs (cost 10). Reset tokens: 256-bit random, only SHA-256 stored. Errors: 500s return a generic message; stack traces are not sent.
- Secrets: API key and mail credentials are server-side only (grep of `public/`, `web/src`, and the built bundle).
- CSRF: no token, but all state-changing routes are POST/PATCH/DELETE with a JSON body (the JSON parser ignores other content types) and the cookie is SameSite=Lax. **LOW / theoretical**; no state-changing GET exists.
- Runtime dependencies: 0 known vulnerabilities.

### 6.2 Findings

Each block: PROBLEM · ROOT CAUSE · EVIDENCE · SEVERITY · PROPOSED FIX · RISK · DEPENDENCIES · SCOPE.

**F-01 Bills can be attached to any family** — MEDIUM
- PROBLEM: any authenticated user can create a bill with someone else's `familyId`, mark it paid, and have attacker-controlled text appear in that family's activity feed and in every member's notifications. A non-existent id returns HTTP 500.
- ROOT CAUSE: `POST /api/bills` stores `b.familyId` without `requireMembership` (`src/routes/bills.js:114-128`); `/pay` then calls `logActivity`/`notifyFamily` for that id. `bills.family_id` has no UI to set it at all.
- EVIDENCE: SEC-BILL-FAMILY-1/2/3 — non-member created the bill (201); bill name "PHISH: verify your account at evil.example" appeared in the victim feed and notifications; `familyId: 999999` → 500.
- FIX: require membership when `familyId` is supplied (or remove the field); validate it is an integer.
- RISK: none for the UI (never sends it). DEPENDENCIES: none. SCOPE: a few lines + tests.

**F-02 Chat reactions cross family boundaries** — MEDIUM
- PROBLEM: membership is checked for the family in the URL, but not that the message belongs to it; the emoji is unbounded; a missing message id returns 500.
- ROOT CAUSE: `src/routes/chat.js:70-82` inserts `(message_id, user_id, emoji)` from URL/body directly.
- EVIDENCE: SEC-CHAT-REACT-1/2 — a member of family 2 reacted to a message in family 1 with a 50-character string, visible to family 1; nonexistent id → 500.
- FIX: look up the message `WHERE id=? AND family_id=?`; cap emoji length. RISK: none. SCOPE: small.

**F-03 Family invite codes** — HIGH (demo-seeded families) / MEDIUM (all families)
- PROBLEM: (a) `POST /api/family/join` has no rate limit (120 wrong codes → 120× HTTP 400, no 429); (b) codes never expire or rotate and there is no rotation route; (c) a member removed by the owner can rejoin with the same code; (d) families created by "Load demo data" get `DEMO` + 4 digits — 9,000 possibilities; an outsider guessed one within a ±30 window in 31 tries and read the family's chat. Regular codes are 32 bits, unthrottled.
- ROOT CAUSE: `src/routes/family.js:93-123` (no limiter, no revocation) and `src/db/seed-demo.js` (`'DEMO' + Math.floor(1000 + Math.random()*9000)`).
- EVIDENCE: SEC-INVITE-1…6 (rejoin 201; rotation route 404; unlimited attempts; demo code guessed; chat read).
- FIX: reuse the existing in-memory limiter for `/join`; generate demo codes with the normal generator; add "regenerate invite code" for owners (invalidate on removal). RISK: low. DEPENDENCIES: F-20 if the demo family is removed. SCOPE: small–medium.

**F-04 "Private" tasks leak inside families** — MEDIUM (privacy)
- PROBLEM: a task created with a `familyId` and `visibility: 'private'` is hidden as a task but its title appears to all members in the family activity feed and Timeline; its comments appear in search and, via notifications, expose the title and comment body to members who cannot open the task.
- ROOT CAUSE: `logActivity`/`notifyFamily` are called whenever `family_id` is set, ignoring `visibility` (`src/routes/tasks.js:194-217, 389-410`); search's comment query filters only on `t.family_id` (`src/routes/search.js:42-46`).
- EVIDENCE: PRIV-TASK-1/2/3/5 and the follow-up probe (third member received notification title "commented on \"SECRET private title\"" and body "SECRET comment body" while `GET /api/tasks/:id` → 404).
- FIX: gate all four on `visibility === 'family'` (or drop `family_id` for private tasks). RISK: activity feed loses private entries (intended). SCOPE: small + tests.

**F-05 Email/phone "verification" is a demo in every environment** — MEDIUM
- PROBLEM: the response contains the code; a "Verified" badge proves nothing; requesting codes is unlimited. Nothing else gates on verification, so this is a misleading trust signal rather than an access bypass.
- ROOT CAUSE: `src/routes/auth.js:168-204` deliberately returns `demoCode`, with no environment guard.
- EVIDENCE: OTP-1 (`NODE_ENV=production` still returned `demoCode`), OTP-2.
- FIX: hide the feature (and the badges) in production until a provider exists, or send the code by the (already-built) mail path for email. RISK: low. SCOPE: small (hide) / medium (email OTP). **Product decision required.**

**F-06 No HTTP security headers** — LOW
- EVIDENCE: HEADERS-1 — no `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`; `X-Powered-By: Express` present. Mitigated today by SameSite=Lax (cross-site framed pages are unauthenticated) and by the absence of XSS.
- FIX: a small header middleware (no dependency). SCOPE: small; CSP needs a check that the inline theme script in `index.html` still runs (nonce/hash).

**F-07 No throttling on signup, family join, OTP request, or AI endpoints** — MEDIUM (AI, when a key is set) / LOW (others)
- EVIDENCE: RATE-SIGNUP-1 (25/25 succeeded, each costs a bcrypt hash), SEC-INVITE-3, OTP-2; code: `authLimits` is used only in `routes/auth.js`; the eight AI endpoints have no per-user limit and the default model is `claude-opus-5` (`src/lib/ai.js:13`). **AI cost abuse IMPLEMENTED-by-code only — not exercised (no key).**
- FIX: reuse the in-memory limiter for these routes; add a per-user daily AI budget. SCOPE: small–medium.

**F-08 Session handling details** — LOW
- Expired sessions are honoured until UTC midnight of the expiry day (SESSION-EXP-1, same defect class as the OTP bug fixed in 8.2). Session ids are stored in clear (a database read yields usable sessions); no cleanup of expired sessions, used reset tokens, or old OTP rows.
- FIX: compare ISO to ISO (or store epoch ms), hash session ids, add a periodic purge. SCOPE: small.

**F-09 Account/phone enumeration and non-consensual family add** — MEDIUM (privacy)
- PROBLEM: any user can add any phone number to their own family. If it belongs to an account, that person is added immediately (no accept step) and their **full name is returned** — a phone→name lookup; signup also confirms that an email/phone already exists.
- EVIDENCE: PRIV-PHONE-1, ENUM-SIGNUP-1. Phone numbers are unverified, so a user can also register someone else's number.
- FIX: invitations that require acceptance; show name only after acceptance; decide on signup-enumeration policy (previously listed as a product decision in 8.2). SCOPE: medium. **Product decision required.**

**F-10 Task edit rights and unvalidated PATCH** — LOW
- Anyone who can see a task (owner, assignee, or any member of a family-visible task) can change any field, including `visibility` and `assignedTo`; the assignee widened a private task to `family`, renamed it and set `status: "weird-status"` (AUTHZ-ASSIGNEE-1). PATCH does not validate status/priority/visibility, unlike POST.
- FIX: allow-list editable fields by role; reuse POST validators. SCOPE: small.

**F-11 Leaving/removal does not revoke task access** — LOW
- After leaving, the former member can still read a task assigned to them in that family (LIFECYCLE-LEAVE-1). Their own family-visible content remains in the family (see §9).
- FIX: clear `assigned_to` for that family's tasks on leave/removal, or tie access to current membership. SCOPE: small.

**F-12 Parser error text is returned** — LOW: malformed JSON → 400 `"Unexpected end of JSON input"` (ERR-JSON-1). Harmless, but the global handler forwards any `err.message` with a 4xx status. FIX: map to a fixed message.

**F-13 Owner can demote themself, orphaning the family** — MEDIUM (integrity)
- `PATCH /api/family/:id/members/:memberId` allows `role: 'member'` on the owner's own row: the family then has **zero owner rows while `families.owner_id` still points at the owner** — nobody can manage it, *Transfer ownership* returns 403, account deletion stays blocked, and there is no UI/API recovery (INTEGRITY-OWNER-1/2/3).
- ROOT CAUSE: the endpoint never checks that the target is not the owner (`family.js:185-195`); no DB constraint enforces exactly one owner row.
- FIX: refuse changes to an `owner` row; optionally add a partial unique index on `(family_id) WHERE role='owner'`. SCOPE: small. This corrects an assumption in the 8.3 report that both ownership fields "must always agree".

**F-14 Input validation is uneven** — LOW security / P1 robustness
- Bill `recurrence: "daily"` is accepted then **Pay → HTTP 500** (`due_date` set to NULL); `dueDate: "not-a-date"` accepted; PATCH amount `-50` accepted; PATCH task title `""` and an object both accepted/500; a **900,000-character** title accepted (only the 1 MB body cap applies); `plan/apply` trusts a client-supplied preview and is non-transactional (VALID-BILL-1/2/3, VALID-TASK-1/2, VALID-LEN-1).
- FIX: one shared validator per resource (enum/date/number/length), applied to POST and PATCH. SCOPE: medium (mechanical).

(Remaining findings F-15 … F-38 are described in §9–§20 and tabulated in §24.)

### 6.3 Security severity summary
CRITICAL: none · HIGH: F-03 · MEDIUM: F-01, F-02, F-04, F-05, F-07(AI), F-09, F-13 (+ F-03 for regular codes) · LOW: F-06, F-08, F-10, F-11, F-12, CSRF-token absence (theoretical). Severities are for a public deployment; for a single trusted household most are LOW.

---

## 7. User-controlled HTML / XSS sink audit

**Result: no confirmed XSS in reachable code. Not a claim of absence** — it is bounded by the method below.

**Method.** (1) Static: all sinks enumerated repository-wide (`dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, `href={…}`, `window.open`, `location` assignments). (2) Which files are reachable: the router's page map loads **only** `/app/main.js` (React) for all ten pages; `public/js/pages/*.js` other than `auth.js` are not imported anywhere. (3) Dynamic: every user-controlled field was populated with `<img src=x onerror=…>` and `"><svg onload=…>` payloads (including the author's **own name**, family name, invited-member display name, emoji, decision criteria/pros/cons, and simulated AI output written straight to the DB), then all pages, tabs, modals, notifications and the command palette were opened as the author and as a second member. Success = no script ran, no payload element existed in the DOM.

**Dynamic result: 39/39 PASS** (`audit-xss.log`): no execution, no injected `img`/`svg`/`onmouseover`, payload text rendered as text (`rendered:true` on every populated view).

| Sink | Data source | Class |
|---|---|---|
| React JSX text (all 10 pages, all tabs, task/decision detail, chat, members, shopping, activity, timeline, notifications content) | every user field, AI text | **SAFE** (React escaping; dynamically verified) |
| `web/src/components/Icon.jsx` `dangerouslySetInnerHTML` | static icon table, `name`/`cls` from source | **STATIC TRUSTED HTML** |
| `<a href={a.link}>` (ActivityCard, ActivityTab, Timeline, ItemRow, OverviewTab) | server-generated `#/tasks/<id>` etc. | **SAFE** today (links are server constants; fragile if user text ever reached `link`) |
| `confirmDialog` `title`/`message`/`confirmLabel` | task/bill titles, member/family names | **ESCAPED** — was **CONFIRMED XSS** (fixed and re-verified in 8.3; re-verified here through the delete dialog with the payload task) |
| `modal.js` `openModal({title, bodyHtml, footerHtml})` | callers pass static strings; `VerifyModal` title interpolates `channel` ∈ {phone,email} | **STATIC TRUSTED HTML** (`aria-label="${title}"` is unescaped but never receives user data) |
| `toast.js` message | any | **ESCAPED** (`escapeHtml`) |
| `app.js` shell: user chip name | first/last name | **ESCAPED** |
| `app.js` shell: **avatar initials** `${initials(first,last)}` | first/last name | **SAFE from script injection** (two characters only) but **not escaped**: names `"<"` + `"b"` produce a stray `<b< div="">` element and a broken user chip (**VERIFIED**, `screenshots/initials-glitch.png`) — cosmetic markup break, F-28 |
| `app.js` notifications list: `href="${n.link}"`, `data-id`, titles/bodies | server links; titles/bodies | link **SAFE (server constant)**; text **ESCAPED** |
| `app.js` command palette: `href="${r.link}"`, `${r.type}`, `${escapeHtml(r.title)}`, `escapeHtml(q)` | search results, query | **ESCAPED / SAFE** (verified with payload query) |
| `app.js` `errorHtml` | `ApiError.message` | **ESCAPED** |
| `auth.js` templates | static; reset `notice` text is static; server message via `escapeText` | **SAFE** |
| URL/hash params (`#/tasks/<id>`, `#/decisionflow/<id>`, `#/reset-password/<token>`) | `location.hash` | Used only as fetch path segments and tokens; not rendered as HTML. **POTENTIAL (theoretical, LOW):** a crafted hash such as `#/tasks/../settings/export` makes the client issue a GET to another same-origin API path (result is not exposed to an attacker). |
| `public/js/pages/*.js` (10 legacy files, ~102 `innerHTML` uses, ~117 KB) | pre-migration templates | **NOT REACHABLE** — not imported; **not traced line-by-line**. Their `confirmDialog` callers are neutralised by the sink fix. Recommend deleting them (F-33). |
| AI-generated text (assistant replies, reasoning, risks, tips, weekly review) | model output | **SAFE** — rendered through React text nodes; verified with simulated malicious AI output in the DB |

The Phase 8.3 finding (delete-dialog XSS) is **FIXED and re-verified**; its classification for the final state is: **no remaining confirmed XSS**.

---

## 8. Authorization matrix

Legend: ✔ allowed · ✖ refused (status) · — n/a. "Other" = a different authenticated user; "Anon" = unauthenticated. All cells **VERIFIED** by probe unless noted.

| Resource / action | Owner/author | Member (same family) | Other | Anon |
|---|---|---|---|---|
| Task read/patch/comment/postpone | ✔ | family-visible ✔; private ✖404 | ✖404 | ✖401 |
| Task delete | ✔ | ✖404 | ✖404 | ✖401 |
| Bills, goals, decisions, EcoLife (all verbs) | ✔ | ✖404 (owner-scoped) | ✖404 | ✖401 |
| **Bill create with `familyId`** | ✔ | ✔ | **✔ (F-01)** | ✖401 |
| Family read / activity / shopping / chat | ✔ | ✔ | ✖403 | ✖401 |
| **Chat react (message id)** | ✔ | ✔ | **✔ if member of any family (F-02)** | ✖401 |
| Add member / change role / remove member | ✔ (owner; admin add/remove) | ✖403 | ✖403 | ✖401 |
| Owner demotes self | **✔ (F-13)** | — | — | — |
| Transfer ownership | ✔ owner only | ✖403 | ✖403 | ✖401 |
| Leave family | ✖400 owner / ✔ others | ✔ | ✖403 | ✖401 |
| Join family | — | — | ✔ with code (**no throttle, F-03**) | ✖401 |
| Settings (profile, prefs, password, export) | own only | own only | own only | ✖401 |
| Account deletion | own only, password required; blocked for owners | same | — | ✖401 |
| Password reset | anyone with a valid emailed token; rate-limited | | | ✔ (public) |

Frontend restrictions (owner-only buttons, hidden controls) are backed by server checks for every family operation (AUTHZ-3/4, 8.3 tests). The exceptions are the cross-tenant gaps above.

---

## 9. Data lifecycle and privacy

| Event | Behaviour | Evidence |
|---|---|---|
| Create/edit/delete own data | Direct; deleting a task/bill/goal/decision cascades to children | schema + tests |
| Leave / be removed | Membership row only is deleted. **Own family-visible tasks, chat messages, comments, shopping items stay in the family.** Assigned-task access remains (F-11). Same code rejoins (F-03). | probes |
| Ownership transfer | Both ownership fields change atomically; nothing deleted | 8.3 |
| Owner deletes account | Blocked while they own a family (accurate copy) | 8.3 |
| Family remains after owner deletion | Only reachable after transfer; family survives | 8.3 |
| Member deletes account | See below | LIFECYCLE-DEL-1/2 |

**Exact behaviour when an account is deleted (VERIFIED, LIFECYCLE-DEL-1/2):** `DELETE FROM users` cascades by foreign key. In a shared family this removes: the user's **chat messages** (`messages.user_id … ON DELETE CASCADE`, observed 1→0) and the reactions on them; the user's **comments on other people's tasks** (1→0); **tasks they shared with the family** (`tasks.owner_id … CASCADE` — the family-visible task and *all other members' comments on it* disappear for everyone; observed 2→1); their reactions. Kept but anonymised (`SET NULL`): shopping items (`added_by`), activity rows (`user_id`), assignments. Bills/goals/decisions/EcoLife are private and removed with the user.

- **Consistent with schema semantics?** Yes — it is exactly what the declared foreign keys say.
- **Consistent across content types?** No: chat/comments/tasks vanish, shopping items and activity persist anonymously.
- **Could it surprise remaining members?** Yes: conversations lose one side with no placeholder or notice, and a task assigned to someone else can disappear because its *creator* left.
- **Classification: NEEDS PRODUCT DECISION** (keep as "deletion removes my content", or keep family content and show "Former member"), which would then be **NEEDS TECHNICAL CHANGE** (nullable author + `SET NULL`, UI fallback). Not changed in this audit. The private-task leak (F-04) is a separate **PRIVACY CONCERN**.

Other privacy items: phone→name lookup (F-09); third-party processors — message/plan/decision text is sent to Anthropic when AI is used and recipient emails to Resend when reset mail is sent (documented; the "Local-first · Your data stays on this machine" tagline is inaccurate in a hosted deployment); OTP/demo codes (F-05).

---

## 10. Database and integrity

| Aspect | State |
|---|---|
| Foreign keys | `PRAGMA foreign_keys = ON`; **`PRAGMA foreign_key_check` returned no violations after all probes** (INTEGRITY-FK-1) |
| Cascades | user→sessions/tasks/bills/goals/decisions/eco/notifications/ai/comments/messages/reactions/members: CASCADE. `tasks.assigned_to`, `tasks/bills/decisions.family_id`, `shopping_items.added_by`, `activity_log.user_id`: SET NULL. `families.owner_id`: **no ON DELETE** (blocks user deletion — relied upon by the deletion guard). `family_members.family_id`: CASCADE |
| Accidental cascade | Account deletion removes family-shared tasks/chat/comments (see §9) |
| Missing protection | No FK on `decisions.chosen_option_id` (deleting the chosen option leaves a dangling "decided" state, F-16, code inspection — not exercised); no CHECK/enum constraints on status/role/recurrence/visibility (F-14); no constraint for "exactly one owner" (F-13) |
| Unique constraints | `users.email/phone`, `families.invite_code`, `(family_id,user_id)`, `token_hash`, reaction triple — adequate. Note `family_members(family_id, user_id)` with `user_id NULL` placeholders permits duplicate placeholders per phone at the DB level (app checks) |
| Indexes | Present on the hot paths (tasks owner/family/due/status, messages(family_id,created_at), notifications, activity). Absent (not needed at current scale): `family_members(user_id)`, `goal_milestones(goal_id)`, `bill_payments(bill_id)`, `decision_*(decision_id)`, `ai_conversations(user_id)` (F-30, P3) |
| Transactions | Used for password reset and ownership transfer (rollback proven). Not used for: account deletion (single statement), `plan/apply`, AI upserts, demo seeding (multi-statement, non-atomic) |
| Migrations | `CREATE TABLE IF NOT EXISTS` + one `ensureColumn` helper; **no schema version, no migration runner, no rollback path**. Additive changes on an existing populated database (e.g. `password_reset_tokens`) were **not exercised** — NOT VERIFIED (mechanism is additive-only) |
| Reset tokens / sessions | Tokens hashed; sessions stored in clear; no purge of expired sessions/tokens/OTPs (F-08) |
| Orphan risk | Only soft references: activity/notification `link`, `chosen_option_id`. No FK orphans found |

No destructive migration was performed.

---

## 11. AI audit

| Requirement | State | Evidence |
|---|---|---|
| AI optional; app fully usable without | **VERIFIED** — every AI route returns `{ok:false,error}`; UI shows explicit unavailable states; Phase 5/6/7 suites ran with no key | Phase 5–7 |
| Deterministic logic stays deterministic | **VERIFIED by code** — DecisionFlow weighted scoring, confidence, recommended option, bill stats, EcoLife rollups, scheduler placement are computed server-side; AI supplies criteria/ratings/text only | `decisions.js`, `bills.js`, `scheduler.js` |
| AI does not silently decide | **VERIFIED by code/UI** — "Decide" is an explicit user action (`/decide`); AI output is labelled "AI reasoning"; plan needs an explicit "Add to tasks" | UI + routes |
| Structured output validated | **IMPLEMENTED** — Zod schemas via `messages.parse`; a `null` parse returns a friendly error | `ai.js` |
| Malformed output / provider failure | **IMPLEMENTED** — mapped to generic messages (429, 401/403, 5xx, timeout); no provider bodies returned | `ai.js:53-60` |
| API key server-side | **VERIFIED** — never in `public/`/`web/src`/bundle | grep |
| Prompts leak secrets | none found; prompts contain the user's own selected data only | code |
| User data exposure understood | Task titles, bill names/amounts, goals, family task titles, decision text and free text are sent to Anthropic when AI is used. Assistant context includes *family-visible* tasks of other members when the message mentions "family" | `ai.js` route |
| Presented as certainty? | Decision "confidence" is deterministic but is displayed inside an "AI reasoning" card; no "may be wrong" note. Minor (F-29) | UI |
| Loading/disabled states | **VERIFIED** (Phase 7) — inputs and suggestion pills disabled while sending; analyze/plan buttons disabled | UI |
| **"Use AI features" setting** | **Not enforced anywhere on the server or client** (`ai_enabled` is only stored/returned). A user who turns AI off still has the endpoints run (PREFS-2) — F-19 | probe + grep |
| Cost control | None: no quota/limit; default model `claude-opus-5` (F-07) | code |
| Prompt injection | Instruction-level only (documented since Phase 7). Blast radius is low: prompts carry only the requesting user's own data, and output is text | Phase 7 |
| Live provider behaviour | **NOT VERIFIED** — no key available |  |

---

## 12. Feature completeness

| Area | Status |
|---|---|
| Dashboard | IMPLEMENTED |
| Tasks | IMPLEMENTED WITH LIMITATION — reminders never fire (INCOMPLETE); PATCH validation (F-10/14) |
| Family | IMPLEMENTED WITH LIMITATION — chat cap (F-18), invite lifecycle (F-03), no admin UI, no delete-family (DEFERRED) |
| BillSense | IMPLEMENTED WITH LIMITATION — validation (F-14); no undo of a payment (deferred in 8.2) |
| Goals | IMPLEMENTED WITH LIMITATION — stale progress after deleting the last milestone (F-15, VALID-GOAL-1: progress stays 100/completed with 0 milestones) |
| EcoLife | IMPLEMENTED (isolated) |
| Timeline | IMPLEMENTED WITH LIMITATION — F-04 |
| DecisionFlow | IMPLEMENTED |
| Assistant | IMPLEMENTED WITH LIMITATION — needs key (**NOT VERIFIED live**); ignores AI switch (F-19) |
| Settings | IMPLEMENTED WITH LIMITATION — AI and notification controls do nothing (F-19) |
| Auth | IMPLEMENTED WITH LIMITATION — F-05, F-08, F-09, F-21 |
| **MISSING BUT ESSENTIAL** (required by existing flows) | (1) Chat must keep showing new messages beyond 200 (F-18). (2) Either working notification/AI preferences or removal of those controls. (3) Invite-code revocation, since removal exists but is not enforceable. (4) A signed-out state on session expiry. No new product features are proposed. |

---

## 13. UX and UI consistency

VERIFIED consistent: typography, spacing, buttons, cards, modals (single implementation, now with focus management), toasts, empty/loading/error states, destructive-action confirmation, dark mode. Gaps: (a) session expiry shows a raw error inside a live shell (F-21); (b) placeholder/help text with developer vocabulary (F-29); (c) the Family tab strip is the only tabs implementation without tab semantics (Assistant and Settings have full ARIA tablists); (d) demo-mode language ("UI-ready but disabled in this local demo"); (e) 11-px badges carry the only priority indicator (contrast, F-26). No redesign is justified by the evidence.

---

## 14. Responsive audit

**Standard content — PASS.** Phase 3.5–8.3 suites at 320/360/375/390/414/768/1280 passed, reused as historical evidence (code unchanged), plus Phase 8.3's 35 viewport checks on the Members tab and dialogs; login/signup/forgot fit at all 7 widths (R2 **PASS**).

**Stress content — FAIL (F-27).** With one 90-character *unbroken* string (e.g. a pasted URL) in task, bill, goal, decision and shopping fields, page-level horizontal overflow appears on **Dashboard, Goals, Timeline, DecisionFlow detail, Family → Shopping list, and BillSense (320/360)**, at every width up to desktop (e.g. 320 px: Dashboard +497 px, Goals +859 px, Timeline +551 px, Decision detail +1760 px; 1280 px: Dashboard +456, Goals +155, Decision detail +1056). Tasks, Task detail, EcoLife, Assistant, Settings and Family members/chat passed. Root cause: text containers lack `overflow-wrap:anywhere`/`min-width:0` in those layouts (same mechanism as the earlier `.dash-grid` finding). Very long *names with separators* (earlier phases) wrap correctly. `audit-browser.log` lists every offender.

---

## 15. Accessibility audit

Method: axe-core 4.10.2 on 12 views + task modal in light and dark, plus real keyboard tests. Findings (all **VERIFIED**):

| Finding | Evidence | WCAG |
|---|---|---|
| **Task, bill and decision list rows are mouse-only.** Tab stops on Tasks are the filters, "New task", checkboxes; on DecisionFlow only "New decision" — **no existing decision can be opened by keyboard**; task/bill detail (edit, delete, comments) likewise | `audit-kbd.mjs`, axe clickable scan | 2.1.1 (A) |
| **Family tab strip not keyboard-operable** — `div.tab` with `onClick`, no `tabindex`/role; 0 of 5 tabs received focus in 60 Tab presses. Chat, Shopping and **Members (transfer/leave)** are therefore mouse-only | `audit-kbd2.mjs` | 2.1.1 (A), 4.1.2 |
| **Form controls unlabeled**: `<label>` elements are not associated (`for`/wrap) with their inputs — none of the 10 labels in the Task form is associated; 4 in Settings profile; 7 inputs + 3 selects in the task modal (axe `label` critical, `select-name` critical) | axe, DOM probe | 1.3.1, 4.1.2 (A) |
| **Icon-only buttons without names**: Goals milestone check buttons (8) (axe `button-name` critical) | axe | 4.1.2 (A) |
| **Contrast**: priority/category badges 2.24–3.85:1 (light) and 3.26–3.74:1 (dark); secondary text 3.97:1; search placeholder 4.31:1; **dark-mode primary buttons white on #7ea3dc = 2.57:1** ("New task", "Add bill") | axe details in `audit-a11y2.log` | 1.4.3 (AA) |
| Scrollable `.tabs` region not focusable (axe) | axe | 2.1.1 |
| Login/Signup have no `main` landmark; heading order skips on Goals/Assistant | axe | 1.3.1 (moderate) |

What is good (VERIFIED): modal `role="dialog" aria-modal`, initial focus on the safe button, Tab trapping and focus restoration (added in 8.3); Settings and Assistant have full ARIA tablists; auth form errors use `role="alert"`, confirmations `role="status"`; the delete-task, transfer-ownership and leave-family dialogs behave correctly once opened. Screen-reader testing was **NOT performed**.

---

## 16. Performance

- Bundle: one 354.90 kB (80.89 kB gzip) file for all pages; no route-level splitting. Acceptable for this size; no evidence of a real cost — no action.
- Polling: notifications every 20 s (never paused when the tab is hidden; errors silently swallowed); chat every 6 s re-downloading the full list (up to 200 messages). Measured: 20 chat polls of 200 messages = 393 ms server-side; `GET /api/tasks` with 300 tasks = 51 ms / 133 KB (probe3). **No evidence of a real cost at current scale.**
- N+1 patterns: `goals` list (milestones per goal), `family` list (members per family) — small N.
- **The only performance-related defect with user impact is the chat query itself** — `ORDER BY created_at ASC LIMIT 200` returns the *oldest* 200, so message 201+ never appears (probe3: 205 posted → last returned `m200`). It is a correctness bug (F-18); the `since` parameter the API supports is unused by the client. Fix: return the newest N (or page) and use `since` for polling.
- AI request behaviour: single request per action, disabled controls; no caching/quotas (F-07).
- The unhandled rejection from `ChatTab.load()` when a poll fails is noise, not cost.

---

## 17. Error and failure-mode audit

| Failure | Result | Class |
|---|---|---|
| Backend unavailable | "Couldn't load this page — Network error — is the server running?"; failed saves show the same message and **keep the form open**; reload after restart restores everything | **VERIFIED** (F2/F2b/F3, screenshot). Wording is developer-oriented (F-29) |
| Authentication expiry | Stays in the shell with raw text "Not authenticated."; nothing redirects; notification polling fails silently forever | **VERIFIED defect** (F-21) |
| Invalid input | Field errors on signup/reset/most creates; **uneven** elsewhere: some cases 500 with a generic message (F-14) | VERIFIED |
| Unauthorized access | 401/403/404 as required | VERIFIED |
| Missing records | 404 with a clear message; two 500s on nonexistent ids (F-01, F-02) | VERIFIED |
| Duplicate actions | AI/dialog buttons disabled while in flight; marking a bill paid twice creates two payments (no guard) | code + probe |
| Email provider failure / timeout | Generic user response; token invalidated; no provider text/key/token in logs | **VERIFIED (mock)** — 8.3 tests |
| Expired / reused reset token | "invalid, expired or already used" state | VERIFIED (8.2/8.3) |
| Family transfer failure / rollback | Trigger-forced failure left both ownership fields unchanged | VERIFIED (8.3) |
| Account deletion blocked | Clear, accurate copy | VERIFIED |
| AI provider unavailable | Friendly generic error; UI restores the input | IMPLEMENTED; live provider NOT VERIFIED |
| Sensitive detail in errors | 500s generic; 4xx from the body parser expose parser text (F-12) | VERIFIED |

---

## 18. Deployment / production readiness

| Item | Class | Notes |
|---|---|---|
| Production build | **VERIFIED** | reproducible; `postinstall` builds the web bundle (needs network + web devDependencies at install) |
| Environment variables | **VERIFIED** documented (`.env.example`): `PORT`, `NODE_ENV`, `ANTHROPIC_*`, `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TRANSPORT`, `MAIL_TIMEOUT_MS`, `APP_BASE_URL`. **No startup validation**: a production start with missing `APP_BASE_URL`/mail settings only logs when a reset is requested (F-30) |
| HTTPS / Secure cookie | Cookie attribute **VERIFIED**; TLS termination itself **DEPLOYMENT DEPENDENT / NOT VERIFIED** |
| Public origin | **DEPLOYMENT DEPENDENT** (`APP_BASE_URL`) |
| Email provider | **NOT VERIFIED** (§23) |
| Secrets | **VERIFIED** not in source/bundle; no `.env` committed (`.gitignore`) |
| Logging | Errors only, `console.error`; no request/audit log; no auth-event log (F-30) |
| Database persistence | SQLite file under `data/` next to the code; WAL. **DEPLOYMENT DEPENDENT**: on ephemeral-disk hosts data is lost; no backup/restore procedure documented; no `busy_timeout`; single writer (F-31) |
| Migration strategy | none beyond additive `IF NOT EXISTS` + `ensureColumn` (F-31) |
| Rate limiting | In-memory, per process; adequate only for one instance reached directly; proxy `req.ip` issue documented (8.3) — **DEPLOYMENT DEPENDENT** (F-35) |
| Reverse proxy | `trust proxy` intentionally unset; behaviour behind a proxy **NOT VERIFIED** |
| Multi-instance | **NOT SUPPORTED** (in-memory limiter; SQLite file) |
| Startup / health | Starts cleanly; no `/health` (404), no graceful shutdown, no process-level handlers (F-30) |
| Node version | `engines: >=22.5.0`; `node:sqlite` was behind a flag before Node 22.13 (from Node documentation, **NOT VERIFIED locally** — audit ran on v24.20.0) and is still an evolving module; the range should be checked (F-32) |
| Static assets | `Cache-Control: no-cache` on everything; no compression; no fingerprinted assets — fine at this size |
| Dead code shipped | ~117 KB of unreachable legacy pages (F-33) |

Nothing here is claimed production-ready because the build passes.

---

## 19. Cost

| Item | Class |
|---|---|
| Runtime dependencies (`@anthropic-ai/sdk`, `bcryptjs`, `cookie-parser`, `dotenv`, `express`, `zod`; React, React-DOM) | FREE (open source) |
| Build tooling (Vite, ESLint) | FREE (dev-only) |
| Database (SQLite via `node:sqlite`) | FREE |
| AI provider (Anthropic API) | **PAID** per token; **no per-user cap; default model `claude-opus-5`** (F-07). Cost per action **NOT VERIFIED** (no key) |
| Email provider (Resend) | **UNKNOWN** — plan/limits/price not verified; reset volume is low (3 per email per 15 min) |
| Hosting | **UNKNOWN** (not chosen); needs a persistent disk for SQLite |
| Other infrastructure (Redis, queue, CDN) | none added; none required today |

No paid infrastructure is recommended. The concrete cost risk is uncapped AI usage.

---

## 20. Technical debt

| # | Item | Priority |
|---|---|---|
| P0 | none blocks *safe operation on a trusted machine* | — |
| P1 | F-01, F-02, F-03, F-04 cross-tenant/privacy authorization gaps · F-05 demo verification · F-13 owner self-demotion · F-18 chat cap · F-19 non-functional settings/reminders · F-20 demo data behaviour · F-21 session-expiry UX · F-24/F-25 keyboard & labels (Level A) · F-31 persistence/backup/migration plan · security headers (F-06) · throttling (F-07) | P1 |
| P2 | F-08 session details · F-09 phone lookup/enumeration (policy) · F-10/F-11/F-12/F-14 validation & edit rights · F-22 UTC "today" · F-26 contrast · F-27 long-string overflow · F-30 health/logging/startup checks · F-32 Node range · F-33 delete dead legacy pages · F-17 account-deletion content policy | P2 |
| P3 | F-15 stale goal progress · F-16 dangling `chosen_option_id` · F-28 initials markup · F-29 developer vocabulary · missing secondary indexes · web dev-dependency advisories (F-34) · per-tab polling pause · CSRF token (defence in depth) | P3 |

---

## 21. Security severity (confirmed, current state)

| Item | Severity |
|---|---|
| Demo-seeded family invite code (9,000 values, unthrottled join, chat readable) | **HIGH** |
| Bills `familyId` cross-family injection | MEDIUM |
| Chat reaction cross-family write | MEDIUM |
| Private tasks leak via feed/timeline/search/notifications | MEDIUM |
| Verification code returned in production | MEDIUM |
| Removed/left members can rejoin; codes never rotate | MEDIUM |
| Phone→name lookup and non-consensual family add | MEDIUM |
| Uncapped AI usage (when a key is configured) | MEDIUM |
| Owner self-demotion orphans family | MEDIUM (integrity) |
| Missing security headers · session expiry comparison/plaintext ids · assignee edit rights · leaver task access · parser error text · signup unthrottled | LOW |
| Delete-dialog XSS (Phase 8.3) | **fixed**; no remaining confirmed XSS |
| CRITICAL | none found |

---

## 22. Final test results (numbers)

| Suite | Result |
|---|---|
| Backend `npm test` | **135/135** |
| Lint | clean |
| Build | OK, 354.90 kB / 80.89 kB gzip |
| Backend probes (`audit-probes.cjs`) | 53 result lines: 8 OK, 39 FINDING, 6 INFO (each FINDING is a demonstrated behaviour; see catalogue) |
| Dynamic XSS sink run | **39/39** |
| Journey A + failure modes + responsive + axe (`audit-browser.mjs`) | 12/14: the 2 "FAIL" are real findings — F1 session-expiry UX (F-21) and R1 long-string overflow (F-27); axe: 7 rule groups violated |
| Keyboard probes | Family tabs 0/5 focusable; Decision rows 0 focusable; Tasks rows 0 focusable |
| Historical browser suites | reused (see §2); `verify-confirmdialog.mjs` is stale and was not run |
| Not run / not possible | live AI, live email, real devices, Firefox/Safari, screen readers, multi-instance, reverse proxy |

One test-harness note: the audit's first driver run failed to start its own server twice (a wait-loop timeout, not a product issue) and was re-run with a longer wait; all reported numbers are from complete runs.

---

## 23. Email final status

**PRODUCTION EMAIL: NOT VERIFIED.** Not broken. The Resend adapter and the whole reset flow are **IMPLEMENTED / MOCK VERIFIED** (13 provider tests, 34/34 browser on the dev outbox). No Resend account, verified sender domain, API key, or https production origin exists here; no real inbox test occurred. Required for verification is unchanged from Phase 8.3 §36.

---

## 24. Final product gap matrix

Owner = the discipline that would carry the fix.

| ID | Area | Status | Evidence | Severity | Required action | Can ship without fix? | Owner |
|---|---|---|---|---|---|---|---|
| F-01 | Bills / Family authz | Demonstrated | SEC-BILL-FAMILY | MEDIUM | membership check on `familyId` | No (public) / Yes (trusted household) | Backend |
| F-02 | Chat reactions | Demonstrated | SEC-CHAT-REACT | MEDIUM | scope message to family; cap emoji | No (public) | Backend |
| F-03 | Invite codes / demo code | Demonstrated | SEC-INVITE 1–6 | HIGH / MEDIUM | throttle join; rotate/revoke; normal demo codes | **No** | Backend |
| F-04 | Private-task leakage | Demonstrated | PRIV-TASK | MEDIUM | gate feed/notify/search on visibility | **No** | Backend |
| F-05 | Verification demo | Demonstrated | OTP-1/2 | MEDIUM | hide or implement | No (public) | Product + Backend |
| F-06 | Security headers | Demonstrated | HEADERS-1 | LOW | header middleware | Yes, then add | Backend |
| F-07 | Throttling / AI cost | Demonstrated / code | RATE-SIGNUP, OTP, code | MEDIUM(AI)/LOW | limiters; AI budget | AI: No when a key is set | Backend |
| F-08 | Session details | Demonstrated | SESSION-EXP-1 | LOW | ISO compare; hash ids; purge | Yes | Backend |
| F-09 | Phone lookup / enumeration / forced add | Demonstrated | PRIV-PHONE-1, ENUM-SIGNUP-1 | MEDIUM | acceptance flow; policy | No (public) | Product + Backend |
| F-10 | Task edit rights / PATCH validation | Demonstrated | AUTHZ-ASSIGNEE-1 | LOW | role allow-list; validators | Yes | Backend |
| F-11 | Leave/removal access | Demonstrated | LIFECYCLE-LEAVE-1 | LOW | clear assignments / membership check | Yes | Backend |
| F-12 | Parser message | Demonstrated | ERR-JSON-1 | LOW | fixed message | Yes | Backend |
| F-13 | Owner self-demotion | Demonstrated | INTEGRITY-OWNER | MEDIUM | refuse owner-row role change | **No** | Backend |
| F-14 | Input validation | Demonstrated | VALID-* | LOW (P1 robustness) | shared validators, length caps | Partly | Backend |
| F-15 | Goal progress edge | Demonstrated | VALID-GOAL-1 | P3 | recompute to 0 when empty | Yes | Backend |
| F-16 | Dangling chosen option | Code only | inspection | P3 | reset on option delete | Yes | Backend |
| F-17 | Account-deletion content policy | Demonstrated | LIFECYCLE-DEL | NEEDS PRODUCT DECISION | decide tombstone vs delete | Yes with disclosure | Product |
| F-18 | Chat 200-message cap | Demonstrated | probe3 | P1 functional | newest-N + `since` | **No** | Backend + Frontend |
| F-19 | AI switch / notification prefs / reminders inert | Demonstrated | PREFS-1/2, grep | P1 | enforce or remove controls | No (public) | Product + Backend |
| F-20 | Demo data | Demonstrated | DEMO-1/2/3 | P1 | isolate from real families; idempotent; full clear | No (public) | Product + Backend |
| F-21 | Session-expiry UX | Demonstrated | F1 screenshot | P1 UX | central 401 → sign-in | No (public) | Frontend |
| F-22 | UTC "today" | Code only | `dates.js` | P2 | per-user timezone | Yes locally | Backend + Frontend |
| F-23 | EcoLife isolation | Inspection | routes | QUESTIONABLE | product decision | Yes | Product |
| F-24 | Keyboard operability | Demonstrated | kbd probes | P1 (WCAG A) | focusable rows; tab semantics | **No** (accessibility) | Frontend |
| F-25 | Labels / control names | Demonstrated | axe | P1 (WCAG A) | `htmlFor`/ids; aria-labels | **No** (accessibility) | Frontend |
| F-26 | Contrast | Demonstrated | axe | P2 (AA) | adjust tokens (badges, dark primary) | Yes, then fix | Design + Frontend |
| F-27 | Long-string overflow | Demonstrated | audit-browser | P2 | wrapping rules | Yes | Frontend |
| F-28 | Initials markup | Demonstrated | screenshot | P3 | escape | Yes | Frontend |
| F-29 | Developer vocabulary | Inspection | UI copy | P3 | copy pass | Yes | Product |
| F-30 | Ops basics | Demonstrated | 404 /health | P2 | health, logging, env check, shutdown | Yes | Backend / Ops |
| F-31 | Persistence, backup, migrations | Inspection | schema/db | P1 (deployment) | plan + versioned migrations | No (public) | Ops + Backend |
| F-32 | Node range | Not verified | docs | P2 | confirm and pin | Yes | Backend |
| F-33 | Dead legacy pages | Demonstrated | router map | P2 | delete | Yes | Frontend |
| F-34 | Vite/esbuild dev advisories | Demonstrated | npm audit | P3 | upgrade tooling later | Yes | Frontend |
| F-35 | In-memory limiter topology | Documented | 8.3 | Deployment dependent | shared store only if multi-instance | Yes (single instance) | Ops |
| F-36 | Real email | Not verified | §23 | Deployment dependent | provider setup + inbox test | Yes, without email | Ops |
| F-37 | Prompt injection | Documented | Phase 7 | LOW | none proposed | Yes | — |
| — | XSS in reachable code | Verified none | 39/39 + audit | — | — | Yes | — |

---

## 25. Final release gate

| Category | Gate | Basis |
|---|---|---|
| Core functionality | **PASS WITH LIMITATIONS** | journeys work; chat cap, demo behaviour, inert settings |
| Authentication | **PASS WITH LIMITATIONS** | sound reset/session model; demo verification, unthrottled signup, expiry UX |
| Authorization | **BLOCKED** | F-01, F-02, F-03 demonstrated cross-tenant access/write |
| Security | **BLOCKED** | same; plus headers and throttling; no XSS, no injection, no CRITICAL |
| Data integrity | **PASS WITH LIMITATIONS** | FK-clean; owner self-demotion, validation gaps |
| Privacy | **BLOCKED** | F-04 breaks "private"; F-09; deletion policy undecided |
| UX | **PASS WITH LIMITATIONS** | coherent system; F-21 and copy |
| Accessibility | **BLOCKED** | WCAG Level A keyboard/label failures on core pages |
| Responsive | **PASS WITH LIMITATIONS** | standard content passes all widths; long unbroken strings overflow |
| Performance | **PASS** | no evidence of real cost (chat cap is a correctness bug, counted under core) |
| AI | **PASS WITH LIMITATIONS** | optional, validated, deterministic core; switch not enforced; no quotas; live path NOT VERIFIED |
| Deployment | **PASS WITH LIMITATIONS** | build/env/cookies verified; persistence, backups, migrations, proxy, TLS, health are deployment-dependent |
| Email | **PASS WITH LIMITATIONS** | IMPLEMENTED / MOCK VERIFIED; production NOT VERIFIED |
| Cost | **PASS WITH LIMITATIONS** | free stack; uncapped AI |

BLOCKING ISSUES (for **public** production): F-01, F-02, F-03, F-04, F-13, F-18, F-24, F-25.
IMPORTANT NON-BLOCKING: F-05, F-07, F-09, F-19, F-20, F-21, F-31, F-06, F-14 (F-05/F-19/F-20 become blocking if the product is advertised as having working verification, preferences or demo).
DEFERRED: delete family, admin promotion UI, undo payment, reminders engine, distributed rate limiting, email deliverability testing, live AI validation.
KNOWN LIMITATIONS: single instance, per-process limits, SQLite single-writer, UTC "today", English-only UI, no reminders, AI/email unverified live.

---

## 26. Correction to the Phase 8.3 report

Phase 8.3 §25 stated that the transfer flow was completed "keyboard-only". That was true from the moment the Members tab was open; the run opened the tab with the mouse. This audit shows the Family tab strip is **not** keyboard-operable (0/5 tabs focusable), so *Transfer ownership* and *Leave family* are not reachable by keyboard alone. The dialogs themselves (focus, trap, restore) are correct. 8.3 also described both ownership fields as always agreeing; F-13 shows an owner can make them disagree through the role endpoint.

---

## 27. Items not covered

Live AI and live email behaviour; real mobile devices, Firefox and Safari; screen readers; concurrency/load beyond the small probes; the ~102 sinks in unreachable legacy files (classified NOT REACHABLE, not traced); behaviour of an existing populated database under new migrations; timezone behaviour (F-22 from code only); Node 22.5–22.12 compatibility (F-32 from documentation).

---

## 28. FINAL WHOLE-PRODUCT AUDIT VERDICT

**1. PRODUCT STATE.** A coherent, working product for one person or a trusted household on a single machine, with a solid reset/recovery/family lifecycle, honest AI/email degradation, a consistent UI and a clean build (135/135 tests, lint clean, 0 runtime-dependency advisories). It is **not yet a safe public multi-tenant service**: cross-family authorization, a private-content leak and Level-A accessibility failures were demonstrated. The corrections are bounded and mostly small; none requires redesign or new features.

**2. BLOCKING ISSUES (public production).** F-01 bills→family injection · F-02 cross-family chat reactions · F-03 invite-code lifecycle and the 9,000-value demo code · F-04 private tasks leaking to the family · F-13 owner self-demotion · F-18 chat freezing at 200 messages · F-24 keyboard-inoperable tasks/bills/decisions/family tabs · F-25 unlabeled form controls and unnamed icon buttons.

**3. IMPORTANT NON-BLOCKING ISSUES.** F-05 verification demo · F-07 throttling and AI budget · F-09 phone lookup/forced add/enumeration · F-19 inert AI/notification settings and reminders · F-20 demo data behaviour · F-21 session-expiry UX · F-31 persistence/backup/migrations · F-06 security headers · F-14 validation · F-26 contrast · F-27 long-string overflow · F-10/F-11/F-08/F-12.

**4. VERIFIED SECURITY STATE.** Owner-scoped data and all family/chat/shopping endpoints enforce access for non-members and unauthenticated users (16/16 and 11/11 probes); SQL is parameterised; passwords and reset tokens are handled correctly; cookies are httpOnly/SameSite=Lax/Secure-in-production; secrets are server-side; **no confirmed XSS in reachable code** (39/39 dynamic, static sink census; the 8.3 delete-dialog XSS fixed and re-verified); 0 runtime advisories. Demonstrated weaknesses: F-01, F-02, F-03, F-04 and the MEDIUM/LOW items in §21. No CRITICAL finding.

**5. VERIFIED AUTH STATE.** Signup, login (timing-equalised), logout, password change, forgot/reset (hashed single-use tokens, session invalidation), account deletion and its owner guard all behave as designed. Weak edges: demo verification (F-05), same-day session expiry (F-08), unthrottled signup, no sign-out UX on expiry (F-21). Real email delivery: NOT PRODUCTION VERIFIED.

**6. VERIFIED FAMILY STATE.** Create, join, invite, transfer (atomic), leave and post-transfer deletion work and are tested. Gaps: unthrottled/never-rotating invite codes and rejoin after removal (F-03), owner self-demotion (F-13), chat cap (F-18), leaver access (F-11), keyboard reachability of the tab strip (F-24), non-consensual add and phone lookup (F-09).

**7. EMAIL STATUS.** PRODUCTION EMAIL: NOT VERIFIED (deployment dependent). Adapter and flow: IMPLEMENTED / MOCK VERIFIED.

**8. DATA/PRIVACY STATUS.** Referential integrity is clean (`foreign_key_check` empty). Account deletion cascades to a user's chat, comments and family-shared tasks — consistent with the schema, inconsistent across content types, and **NEEDS PRODUCT DECISION**. Private tasks leak titles/comments inside families (F-04, PRIVACY CONCERN). Third-party processors (Anthropic, Resend) contradict the "stays on this machine" tagline in a hosted deployment.

**9. DEPLOYMENT STATUS.** Build, env documentation and cookie flags VERIFIED. TLS, public origin, persistent storage, backups, migrations strategy, proxy/client-IP handling, multi-instance behaviour, health checks and Node version range are DEPLOYMENT DEPENDENT or NOT VERIFIED. Single instance only.

**10. TECHNICAL DEBT.** P0: none. P1: the blocking and important items above. P2: session details, UTC "today", contrast, overflow, ops basics, Node range, dead legacy code (~117 KB), deletion-content policy. P3: stale goal progress, dangling chosen option, initials markup, developer copy, secondary indexes, dev-tool advisories.

**11. REQUIRED ACTIONS BEFORE PUBLIC PRODUCTION.** (a) Close F-01/F-02/F-03/F-04/F-13 with server-side checks and tests; (b) fix chat to show the newest messages (F-18); (c) make list rows and the Family tabs keyboard-operable and associate labels/names (F-24/F-25); (d) decide and implement the fate of verification, AI/notification switches and demo data (F-05/F-19/F-20); (e) add a central sign-out-on-401 path (F-21); (f) throttle signup/join/AI and add a per-user AI budget (F-07); (g) add security headers (F-06); (h) choose hosting with persistent storage and define backup and migration handling (F-31); (i) run the real-inbox email test after provider setup; (j) decide the account-deletion content policy (F-17).

**12. SAFE DEFERMENTS.** Delete Family; invitation UI beyond the F-03 fix; admin promotion UI; undo payment; reminders engine (if the reminder field is removed or hidden); distributed rate limiting (single instance); timezone per user (single-region use); EcoLife integration; prompt-injection hardening; dev-tool advisories; dead-code removal; secondary indexes; live AI cost measurement until a key is configured.

**13. FINAL RECOMMENDATION.** Do not release publicly yet. The product is fit for local and trusted-household use now. Run one bounded hardening phase limited to the blocking list (no new features, no redesign) followed by a re-verification of the specific probes in `audit-evidence/`, then proceed to deployment setup and the real-inbox email test. The decision on scope and ordering belongs to the reviewer.

---

### Appendix — evidence files (`audit-evidence/`)
`audit-probes.cjs` / `audit-probes.out.txt` (53 backend probes) · `probe2.cjs` (private-notification leak) · `probe3.cjs` (chat cap, list scale) · `audit-xss.mjs` / `.log` (39 dynamic XSS checks) · `audit-browser.mjs` / `.log` (journey A, failure modes, responsive, axe) · `audit-a11y2.mjs` / `.log` (contrast details, clickable-not-focusable, labels) · `audit-kbd.mjs`, `audit-kbd2.mjs` (keyboard operability) · `screenshots/` (session expiry, backend down, 320 px, initials glitch). Scripts reference the audit machine's temporary paths and disposable databases.
