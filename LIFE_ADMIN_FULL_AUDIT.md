# LifeAdmin — Full Engineering & Product Audit

**Date:** 2026-09-26
**Scope:** Full repository at `LifeAdmin-main/` (45 source files, ~7,400 LOC, no build step)
**Method:** Every source file was read in full (not sampled/excerpted). No code was changed, no packages installed, no migrations run. `node_modules/` is not installed and there is no `.git` in this checkout, so runtime behavior below is based on static reading of the code, not on executing it — this is called out explicitly wherever it matters.

**Legend used throughout:** `VERIFIED` = confirmed by reading the actual code path end-to-end · `OBSERVED` = seen directly in a file but effects not traced further · `INFERRED` = reasoned from code structure, not executed · `UNKNOWN` / `REQUIRES TESTING` = cannot be determined from static reading alone (needs `npm install && npm start`).

---

## 1. Executive Summary

LifeAdmin is a **real, working, single-tenant, local-first personal/family life-management web app** — not a prototype or a UI mockup. It has a genuine Express + SQLite backend, real bcrypt-hashed auth with server-side sessions, nine functioning feature areas, and an optional Claude-powered AI layer that degrades gracefully to "AI not configured" when no API key is present. The engineering discipline behind it is notably higher than the "vanilla JS, no framework" surface suggests: deterministic business logic (priority scoring, scheduling, decision math, bill recurrence) is consistently kept separate from the AI layer, SQL is parameterized everywhere, and user-generated content is consistently HTML-escaped on the frontend.

It is **not production-ready** in the conventional sense: there are zero automated tests, no CI, no linting configuration, no rate limiting, no security headers, and — critically — **one core documented feature (account deletion) is currently broken due to a frontend API bug** (Finding #1, §6). Several schema fields (`family_id` on bills and decisions) are wired into the database but never surfaced anywhere in the UI or queries — vestigial, unfinished feature seams that make the "family" story inconsistent between Tasks (fully implemented) and Bills/Decisions (schema-only).

The product identity is clear and specific: a calm, non-social, non-gamified personal operating system for one person and their household, with light Kosovo/Albania-market signals baked in (phone format `+383…`, bilingual English/Albanian AI prompts). This identity should be the anchor for every decision made before October 1 — see §22 for what must not be diluted.

---

## 2. Product Definition

### In plain language

LifeAdmin is built around one idea, stated in its own README: *"Tell LifeAdmin what is happening in your life. LifeAdmin helps organize what should happen next."* It is a single calm home for the administrative surface area of a person's (and their family's) life: tasks, recurring bills, big decisions, personal goals, sustainability habits, and shared family coordination — with an optional AI assistant that only ever sees the small slice of data relevant to what you asked it.

**Who it's for:** one primary user per account, optionally connected to one or more "families" (households) of other LifeAdmin users or phone-identified non-users. The phone-number-first identity model (`+383 44 123 456` examples throughout, family members "identified by phone, not name") and bilingual (English/Albanian) AI prompts indicate the primary target market is Kosovo/Albania or Albanian-speaking diaspora — this is a real, specific product decision, not an accident (`VERIFIED`, `src/lib/ai.js:127`, `src/routes/family.js` comments, seed data phone numbers).

**Core use case:** open the Dashboard once a day, see what actually needs attention today (not everything — a deterministically-scored subset), and act on it in one click (complete a task, mark a bill paid, review an overdue decision).

**What it explicitly is not:** a social network, a team project-management tool, a Notion-style blank canvas, or an AI chatbot wrapper. Every AI feature has a hard, visible fallback to fully-functional deterministic behavior when `ANTHROPIC_API_KEY` is unset — this is a genuine design principle carried consistently through the whole codebase (`VERIFIED` across all 7 AI capabilities in `src/lib/ai.js` and every page that calls them).

### User journey (VERIFIED, traced through code)

1. **Sign up** (email + Kosovo-style phone + password, min 8 chars) → session cookie set → land on Dashboard.
2. **Dashboard** aggregates open tasks, unpaid bills, and open decisions into four deterministic urgency buckets (`overdue`, `needs_attention`, `coming_soon`, `can_wait`) via `src/lib/priority.js`, plus goal progress and family activity feed.
3. From there the user fans out into **Tasks** (create/complete/comment/postpone), **Family** (create/join a household, shared tasks, chat, shopping list, activity log), **BillSense** (recurring bills, mark-paid rolls the due date forward automatically, optional AI spending insights), **DecisionFlow** (weighted pros/cons matrix with optional AI-suggested criteria and ratings — but the *math* is always local JS, never trusted to the AI), **EcoLife** (habit logging with optional AI tips), **Goals** (milestone checklists, progress % auto-derived from milestones done/total), **Timeline** (unified activity log), and **Assistant** (context-scoped chat + natural-language weekly planner that turns free text into a deterministic schedule via a real interval-placement algorithm, never AI-placed times).
4. **Settings** covers profile, password change, fake-but-honest OTP "verification" (explicitly documented as a demo stand-in for a real SMS/email provider), notification preferences, theme, AI opt-out, full JSON data export, and account deletion.

### What's stored where (VERIFIED)

- **Everything** lives in one local SQLite file (`data/lifeadmin.db`, WAL mode) — users, sessions, tasks, bills, decisions, goals, eco logs, family/chat/shopping data, AI conversation history. Nothing is stored client-side except the current theme choice (`localStorage['la-theme']`) and (implicitly) the session cookie.
- **Nothing about the user's actual life data ever leaves the machine** except when a feature explicitly calls the Claude API, and even then only a small, feature-scoped JSON context is sent (`VERIFIED`, every `ai.*` function in `src/lib/ai.js` takes a narrow, pre-built argument object, never a raw DB row set).
- **Dynamically calculated, never stored:** urgency bucket/score (`priority.js`), days-until-due, schedule conflicts, bill statistics, decision weighted scores/confidence, goal progress percentage.

---

## 3. Current User Flows (traced end-to-end)

| Flow | Path | Notes |
|---|---|---|
| Sign up → first task | `auth.js` → `POST /api/auth/signup` → session cookie → Dashboard shows onboarding card if no tasks/bills/families → "Load demo data" or manual add | `VERIFIED` |
| Complete a task from Dashboard | Click checkmark on a bucket row → `PATCH /api/tasks/:id {status:'completed'}` → re-mounts whole dashboard | `VERIFIED`; full page remount on every single-item action (see §11 performance) |
| Pay a bill | BillSense row → `POST /api/bills/:id/pay` → server computes next due date via `nextDueDate()` if recurring, else marks paid | `VERIFIED`, `src/routes/bills.js:162` |
| Create family + invite | Family tab (empty state) → `POST /api/family` → invite code generated (`crypto.randomBytes(4).toString('hex').toUpperCase()`) → add members **by phone number**, not name, not the invite code itself in the UI (the invite code is only shown for manual sharing; there's no accept-invite-by-code flow implemented — a member is added directly by whoever has owner/admin role) | `VERIFIED` — **the invite code is displayed but there is no route that consumes it** (no `POST /api/family/join` exists). It's effectively decorative right now. |
| Family chat | Polls `GET /api/chat/:familyId/messages` every 6s while the Chat tab is open; sends via `POST` | `VERIFIED`, not real-time (see §11) |
| DecisionFlow AI analysis | "Analyze with AI" → AI proposes criteria + pros/cons/risks/ratings → server merges into DB → **weighted score is always computed in `src/routes/decisions.js:scoreOptions()`, never by the AI** | `VERIFIED` — this separation is real and consistently enforced |
| Natural-language weekly plan | Assistant → "Plan my week" tab → free text → AI extracts structured activities/constraints → deterministic `src/lib/scheduler.js` places them into real free time (protects sleep/meals/decompression by default) → preview → "Add to tasks" creates real `tasks` rows | `VERIFIED` end-to-end, genuinely deterministic placement algorithm, not AI-guessed times |
| Delete account | Settings → Data → confirm dialog → `prompt()` for password → `api.del('/api/settings/account', {password})` | **BROKEN — see Finding #1, §6.2.** The password is silently dropped before the request is sent. |
| Export data | Settings → Data → downloads full JSON of everything the user owns | `VERIFIED`, works (`GET /api/settings/export`, browser `fetch` + blob download, correctly bypasses the `api` wrapper's JSON-only assumption) |

---

## 4. Complete Feature Inventory

For each feature: purpose, code location, strengths, weaknesses, and a **keep/improve/expand** call.

### 4.1 Dashboard
- **Purpose:** single "what matters right now" view.
- **Code:** `src/routes/dashboard.js`, `public/js/pages/dashboard.js`.
- **Strengths:** genuinely deterministic aggregation (no AI in the critical path), good bucket model, schedule-conflict surfacing.
- **Weaknesses:** completing a task from the dashboard re-fetches and re-renders the *entire* page (`mount(root, ctx)` called again) instead of patching one row — wasteful but not currently a measurable problem at personal-data scale. No way to dismiss/snooze a "needs attention" item without completing it.
- **Call:** `IMPROVE` (targeted re-render, snooze action) — `DO NOT` change the bucket model or the "no AI in the critical aggregation path" principle.

### 4.2 Tasks
- **Purpose:** core to-do management with recurrence, priority, family visibility, comments, postpone.
- **Code:** `src/routes/tasks.js` (355 lines, the largest route file), `public/js/pages/tasks.js`.
- **Strengths:** solid filtering (view/status/category/priority/search), clean visibility model (`private` vs `family`), comment thread with notifications.
- **Weaknesses:** **Recurrence is stored but never expanded into real occurrences** (Finding #2, §6.3) — setting a task to "daily" has no scheduling effect beyond being a label. `assignedTo` is accepted on task create/update with no check that the assignee is actually a member of the task's family (Finding #4, §6.5).
- **Call:** `MUST IMPROVE` (make recurrence real, or remove the picker if it's staying decorative — leaving a UI control that silently does nothing is worse than not having it).

### 4.3 Family
- **Purpose:** shared household coordination — members, chat, shopping list, activity feed.
- **Code:** `src/routes/family.js`, `src/routes/chat.js`, `public/js/pages/family.js`.
- **Strengths:** phone-based identity (supports inviting people who aren't registered yet — a genuinely good design decision for a family tool), role model (owner/admin/member) enforced server-side via `requireRole`.
- **Weaknesses:** the **invite code is generated and displayed but never consumable** — there is no join-by-code flow (Finding #3, §6.4). Chat polls every 6s (not real-time). No read receipts, no typing indicator, no message editing/deletion.
- **Call:** `MUST IMPROVE` (finish or remove the invite-code flow), `SHOULD IMPROVE` (chat latency).

### 4.4 BillSense
- **Purpose:** recurring-bill tracking with automatic due-date rollover and AI spending insights.
- **Code:** `src/routes/bills.js`, `public/js/pages/billsense.js`.
- **Strengths:** correct recurrence math (weekly/monthly/yearly rollover on payment), deterministic stats endpoint kept separate from the AI insights endpoint, clean category breakdown.
- **Weaknesses:** `family_id` is stored on every bill (accepted from `b.familyId` on create) but **is never used** — no route ever queries bills by family, and the create form has no family selector at all (Finding #5, §6.6). So "shared household bills" is schema-only, not a real feature today, despite the product clearly being family-oriented.
- **Call:** `SHOULD IMPROVE` (either implement family-shared bill visibility to match Tasks, or drop the unused column) — bill CRUD and recurrence itself: `DO NOT CHANGE`.

### 4.5 DecisionFlow
- **Purpose:** structured, weighted decision-making with optional AI-assisted option analysis.
- **Code:** `src/routes/decisions.js` (306 lines), `public/js/pages/decisionflow.js`.
- **Strengths:** this is the most philosophically well-executed feature in the app — the AI is explicitly scoped to *propose* structure (criteria, pros/cons/risks, 1–5 ratings) while the **weighted scoring, ranking, and confidence-band math is 100% local arithmetic** (`scoreOptions()`), with a documented "incomplete rating → neutral default (3), flagged as incomplete" fallback rule. Same `family_id`-unused pattern as Bills though (schema column present, never queried).
- **Weaknesses:** confidence bands (`gapPct > 15` = high, `>5` = medium, else low) are reasonable but arbitrary and undocumented to the end user — a user has no way to know *why* confidence is "medium." No family-shared decisions despite the schema supporting it.
- **Call:** `DO NOT CHANGE` the deterministic-math principle (it's a real differentiator) — `OPTIONAL` improve confidence-band transparency.

### 4.6 EcoLife
- **Purpose:** lightweight sustainability habit logging with AI tips.
- **Code:** `src/routes/ecolife.js`, `public/js/pages/ecolife.js`.
- **Strengths:** simple, honest scope — logs + 30-day rollup + optional tips, explicitly told (in the AI system prompt) not to fabricate scientific claims or statistics.
- **Weaknesses:** thinnest feature in the app; no goals/targets, no trend-over-time view (only a 30-day count, no history chart).
- **Call:** `OPTIONAL` to expand (see §9 new-feature ideas) — this is the feature most likely to feel like a "nice to have" rather than core to the product identity, so expansion should be modest and evidence-based (see §12).

### 4.7 Goals
- **Purpose:** long-term goal tracking via milestone checklists.
- **Code:** `src/routes/goals.js`, `public/js/pages/goals.js`.
- **Strengths:** progress is *derived*, never manually set (`recomputeProgress()` runs after every milestone toggle/add/delete, and auto-completes the goal at 100%) — a good, hard-to-corrupt invariant. AI milestone suggestion is a genuinely useful, low-risk AI use.
- **Weaknesses:** no reminders/check-ins for stalled goals beyond what the (AI-only) weekly review surfaces; a goal with zero milestones shows 0% forever with no other progress signal.
- **Call:** `SHOULD IMPROVE` (progress ideas in §12) — `DO NOT CHANGE` the derived-progress invariant.

### 4.8 Timeline
- **Purpose:** unified, read-only activity history across tasks/bills/decisions/goals/family.
- **Code:** `src/routes/timeline.js` (41 lines, simplest route), `public/js/pages/timeline.js`.
- **Strengths:** clean, does one thing.
- **Weaknesses:** no filtering by type, no search, capped at 150 rows with no pagination — old history silently becomes unreachable once a very active user exceeds it.
- **Call:** `SHOULD IMPROVE` (filtering + real pagination).

### 4.9 Assistant
- **Purpose:** context-scoped AI chat, natural-language weekly planning, weekly review ("what am I forgetting").
- **Code:** `src/routes/ai.js` (203 lines), `public/js/pages/assistant.js`.
- **Strengths:** the context-selection logic (`buildContext()`) is a genuinely good pattern — it keyword-matches the user's message (English *and* Albanian terms) to decide which slice of data to include, rather than always sending everything. Chat history is capped at the last 6 messages server-side to control token cost. The weekly planner's separation of AI-parses-intent vs. JS-places-time is the same discipline seen in DecisionFlow.
- **Weaknesses:** keyword-based context selection is a heuristic (regex on English/Albanian words) and will miss intent phrased differently — a user asking about bills in a way that doesn't match the regex gets no bill context and a worse answer, silently. Hardcoded model ID with no override (Finding #6, §6.7).
- **Call:** `SHOULD IMPROVE` (context selection robustness, model configurability) — `DO NOT CHANGE` the "AI never sees the whole database" principle.

### 4.10 Settings
- **Purpose:** account/profile/security/notification/appearance/AI/data management.
- **Code:** `src/routes/settings.js`, `public/js/pages/settings.js`.
- **Strengths:** honest, well-labeled fake-OTP flow (explicitly tells the user real SMS/email needs a paid provider — no deceptive "message sent!" claim). Full JSON export is real and complete for everything the user owns.
- **Weaknesses:** **account deletion is broken** (Finding #1). Verification codes have no attempt-rate-limiting (Finding #7, §6.8).
- **Call:** `MUST IMPROVE` (fix deletion, add OTP attempt limiting) — `DO NOT CHANGE` the honest-about-limitations framing of the demo OTP flow; that tone is a genuine trust-building asset worth preserving as the product matures.

---

## 5. Architecture Audit

### 5.1 Backend architecture — coherent and well-layered (`VERIFIED`)

```
server.js  (Express app, route mounting, static file serving)
  → src/middleware/  (attachUser, requireAuth, asyncRoute, errorHandler)
  → src/routes/*.js  (HTTP layer: parse request, validate, call db/lib, shape response)
  → src/lib/*.js     (business logic: auth, dates, priority scoring, scheduling, family
                       membership rules, notifications, AI gateway, validation)
  → src/db/index.js  (thin SQLite wrapper: run/get/all/tx + forward-migration guard)
```

This is a textbook thin-controller pattern with no ORM and no framework magic. Responsibilities are cleanly separated: no route file contains raw scoring/scheduling math (it's all imported from `lib/`), and no `lib/` file talks HTTP. There is no circular-dependency risk observed — the dependency graph is strictly `routes → lib → db`, one direction.

**Genuine architectural strength worth explicitly preserving:** the AI/deterministic-logic boundary. Every feature that could plausibly hand a calculation to an LLM (priority scoring, bill totals, decision weighting, schedule placement, recurrence math) instead uses the LLM only for the parts that require language understanding (parsing free text, generating pros/cons prose, suggesting reasonable defaults) and keeps every number/date/boolean computed in plain deterministic JS. This is called out in code comments referencing what appears to be an internal spec document ("spec §N") that is **not present in this repository** — worth asking about (see §23).

### 5.2 Frontend architecture — simple, consistent, but not scalable past current size

`public/js/app.js` is a hand-rolled hash-router SPA shell (~390 lines) that lazy-loads one ES module per page via dynamic `import()`. Each page module exports a `mount(root, ctx)` function and is responsible for its own full-innerHTML rendering and event wiring. There is no component framework, no virtual DOM, no reactive state system.

**This works today** because the app has ~9 pages of moderate complexity and the "re-render the whole section, then re-query and re-attach all listeners" pattern is applied consistently (avoiding the classic duplicate-listener bug that half-measures usually introduce). **It will not scale gracefully** past the current feature count: every new interactive element requires manually wiring `querySelectorAll` + `addEventListener` after every re-render, module-level mutable state (`let ctxRef, rootRef, activeTab` at the top of `family.js`, `settings.js`, `tasks.js`, `decisionflow.js`, etc.) is a real footgun for future contributors, and there is no way to compose or reuse UI fragments beyond copy-pasting template-literal HTML strings.

**Global/module-level state risk (OBSERVED, not yet triggered):** because filter state (`tasks.js: let filters = {...}`), active tab (`family.js`, `settings.js`, `assistant.js`), and chat poll timers are module-level `let` bindings rather than per-mount state, navigating away and back can leave stale state (e.g., `activeFamilyId` persists across a full page remount, which is *probably* intended, but `assistant.js`'s `let messages = []` is also module-level and is not cleared on navigation away — re-entering the page keeps old messages in memory until the AI is unconfigured branch is hit, which is harmless today only because there's a single account per session).

### 5.3 Data layer

- SQLite via Node's **built-in** `node:sqlite` (no native compilation, no `better-sqlite3`/`sqlite3` npm dependency) — genuinely good choice for the "no paid infra, works out of the box on Windows" goal stated in the README. Requires Node ≥22.5 (`VERIFIED` installed Node is v24.20.0, satisfies this).
- WAL journal mode enabled, foreign keys enabled.
- A lightweight forward-migration guard (`ensureColumn()`) exists for exactly one historical column addition (`decision_options.risks`) — this is a real but minimal migration story; there is no general migration framework, so every future schema change needs a hand-written `ensureColumn`/`ALTER TABLE` call added to `src/db/index.js`. This will not scale past a handful of changes without becoming error-prone.
- No connection pooling concerns (single-process, single-file SQLite) — appropriate for local-first single-user/small-family scale, not appropriate if this ever needs multi-instance deployment.

### 5.4 Coupling / duplication

- `src/lib/dates.js` and `public/js/format.js` both independently implement `formatDuration`/`fmtDuration` with identical logic — small, harmless duplication (client can't `require()` server code without a build step, so this is a structural consequence of the no-bundler decision, not carelessness).
- No circular dependencies observed.
- No dead/unused *files* found — but there is real **dead functionality**: `expandRecurrence()` in `src/lib/dates.js` is fully implemented, exported, and never imported/called anywhere in `src/routes/` (`VERIFIED` via full-repo grep — only match is its own definition file). This directly corroborates Finding #2.

---

## 6. Codebase Audit — Findings

Findings are ranked roughly by real-world impact. Each includes concrete evidence (file:line) and a failure scenario.

### 6.1 Summary table

| # | Finding | Severity | Confidence |
|---|---|---|---|
| 1 | Account deletion silently broken (password never sent) | **Critical** | CONFIRMED |
| 2 | Task recurrence is stored but never expanded into occurrences | High | CONFIRMED |
| 3 | Family invite code has no consuming/join flow | Medium | CONFIRMED |
| 4 | Task `assignedTo` not validated against family membership | Medium | CONFIRMED |
| 5 | `family_id` on bills/decisions is schema-only, no UI/query support | Medium | CONFIRMED |
| 6 | AI model ID hardcoded, not configurable | Low | CONFIRMED |
| 7 | No rate limiting anywhere (login, OTP, AI) | Medium (security) | CONFIRMED |
| 8 | No security headers / CSP / helmet | Low–Medium | CONFIRMED |
| 9 | Static assets served with `Cache-Control: no-cache` unconditionally, including hypothetical production | Low (perf) | CONFIRMED |
| 10 | Demo-data tagging uses a magic string in the `notes` column, not a dedicated flag | Low (data integrity) | CONFIRMED |
| 11 | Zero automated tests | High (maintainability/risk to migration) | CONFIRMED |

### 6.2 Finding #1 — Account deletion is broken (CRITICAL)

**Evidence:**
`public/js/api.js:50` — `del: (url) => request('DELETE', url)` — the `del` helper **does not accept or forward a body**.
`public/js/pages/settings.js:273` — `await ctxRef.api.del('/api/settings/account', { password });` — passes a second argument that `del()` silently ignores (it's just dropped; JS doesn't error on extra arguments).
`src/routes/settings.js:108-118` — server requires `verifyPassword(password || '', req.user.password_hash)`, and since no body is ever sent, `req.body` is `{}` (or possibly `undefined` depending on Express body-parser behavior with no `Content-Type`), so `password` is always falsy and the check always fails.

**Failure scenario:** any user who tries to delete their account via the UI enters their correct password, clicks confirm, and receives a "Password is incorrect" error every time, with no way to actually delete their account short of a raw `curl`/API call. This is a **documented feature (README §37 reference, GDPR-adjacent "right to delete" expectation for an app storing personal family data) that has never worked**, and it's the kind of bug that's easy to ship because a developer testing the *happy path visually* (modal opens, form works, confirm click closes it) would not notice the request itself is silently malformed unless they checked the network tab or server logs.

**Fix complexity:** trivial — either give `api.del` an optional body parameter (`del: (url, body) => request('DELETE', url, body)`) or switch the call site to use a body-carrying verb pattern. This should be an immediate P0 fix regardless of the larger October 1 plan (see §21).

### 6.3 Finding #2 — Task recurrence does nothing

**Evidence:** `src/db/schema.sql:72-73` defines `recurrence`/`recurrence_until` on `tasks`. `public/js/pages/tasks.js:212-217` lets the user pick daily/weekdays/weekly/monthly in the task form and saves it. `src/lib/dates.js:62-87` implements a correct, tested-looking `expandRecurrence()` function. **No route file ever calls it** — task creation stores the flag and stops; there is no cron/scheduler/on-read expansion that generates the next occurrence when a recurring task is completed, unlike Bills (`src/routes/bills.js:174-182`, which *does* correctly roll `due_date` forward via `nextDueDate()` on payment).

**Failure scenario:** a user sets "Study JavaScript" to recur daily, completes it once, and it simply disappears — no new instance appears tomorrow. The user has no way to know this without noticing the absence, which erodes trust in the "priority engine" that's supposed to be the product's core value.

**Recommendation:** either (a) implement the same "advance the due date on completion" pattern used for bills (simplest, matches existing UX), or (b) if recurrence is intentionally out of scope for now, remove the picker from the form so it doesn't promise something the product doesn't deliver. Silent no-ops are worse than absent features for user trust.

### 6.4 Finding #3 — Family invite code is decorative

**Evidence:** `src/routes/family.js:11-13,84` generates and returns `inviteCode`. `public/js/pages/family.js:147` displays it in the Overview tab with copy-adjacent text "Share this code so someone can join manually." **No route exists to redeem a code** (`VERIFIED` — full grep of `src/routes/family.js` shows only generation and display, no `POST /api/family/join` or similar). The *only* real way to add someone today is an existing owner/admin adding them by phone number.

**Recommendation:** either implement the join-by-code flow (a new user or existing user enters the code during/after signup to join the family) or remove the "share this code so someone can join manually" copy, since it currently promises a capability that doesn't exist.

### 6.5 Finding #4 — Unvalidated task assignment

**Evidence:** `src/routes/tasks.js:195-202` — `if (b.assignedTo && b.assignedTo !== req.user.id) { notifyUser(b.assignedTo, {...}) }` and the earlier INSERT accepts `b.assignedTo || null` with no check that the target user ID is a member of `familyId` (or even exists). `loadOwnedOrAssigned()` (line 209-218) later grants read access to `t.assigned_to === req.user.id` with no family-membership re-check either.

**Failure scenario:** a malicious or simply careless client (the check is missing server-side, so this isn't just a UI oversight) could set `assignedTo` to an arbitrary numeric user ID it doesn't share a family with. That user would then see the task title (and can comment on it) via the assigned-task visibility path, and would receive a notification — a narrow but real cross-tenant information leak (task titles + descriptions could contain sensitive personal content). Severity is moderate because it requires guessing valid, in-range user IDs (auto-increment integers, so sequential guessing is realistic) and existing DB permissions restrict wider damage.

**Recommendation:** validate `assignedTo` is a member of `familyId` (or has an existing relationship to the assigner) before accepting it, mirroring the `requireMembership` check already used elsewhere.

### 6.6 Finding #5 — Family sharing inconsistent across entity types

Tasks fully implement `visibility: private|family` sharing (`VERIFIED`, `src/routes/tasks.js` query building and `loadOwnedOrAssigned`). Bills and Decisions both have a `family_id` column, both accept `familyId` on create, but **neither route ever queries by family** — `bills.js` and `decisions.js` list/get endpoints are unconditionally `WHERE owner_id = ?`. The BillSense and DecisionFlow *create forms* don't even expose a family selector (`VERIFIED` by reading both page modules in full — no `family` reference in `billsense.js`, only `familyId` appears in the *schema/route*, not the UI). This means the "family" story is real for Tasks and Family itself, but silently absent for two of the other five core feature areas, despite the database modeling it as if it were supported.

**Recommendation:** this is a product-identity consistency question, not just a bug — decide explicitly whether Bills/Decisions should become family-shared (matching the household-coordination premise of the product) or whether they're intentionally personal-only, and either build it out or remove the vestigial column. Leaving it half-done is the worst option because it creates confusion for whoever picks up this codebase next.

### 6.7 Finding #6 — Hardcoded AI model, no override

`src/lib/ai.js:11` — `const MODEL = 'claude-opus-5';` with no environment variable fallback. If this specific model identifier is retired, every AI feature breaks with a raw API error surfaced through `friendlyAiError()` rather than a config problem the operator can fix without a code change and redeploy.

**Recommendation:** `const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5';` — a one-line, zero-risk fix.

### 6.8 Finding #7 — No rate limiting anywhere

No `express-rate-limit` or equivalent is installed or used (`VERIFIED`, `package.json` dependency list). Login (`/api/auth/login`), signup, OTP request/confirm, and every AI-calling endpoint are all unthrottled. Login brute-force is somewhat mitigated by bcrypt's cost factor (10 rounds — reasonable) but there is no account lockout or exponential backoff. OTP codes are 6-digit, 10-minute-lived, and confirmable an unlimited number of times (`src/routes/auth.js:125-148` has no attempt counter) — though note the OTP confirm endpoint *does* require an active authenticated session (`if (!req.user) return res.status(401)`), so this is not a pre-auth account-takeover vector, only a same-session nuisance/DoS-style risk.

**Recommendation:** add basic rate limiting on `/api/auth/*` and `/api/ai/*` before any non-local deployment. Low complexity, meaningful security improvement.

### 6.9 Finding #8 — No security headers

No `helmet` or manual header-setting for CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or HSTS (`VERIFIED`, `server.js` full read). For a purely local single-machine tool this matters less; it becomes a real gap the moment this is deployed anywhere reachable over a network.

### 6.10 Finding #9 — Cache-Control misconfiguration

`server.js:44` unconditionally sets `Cache-Control: no-cache` on all static assets regardless of `NODE_ENV`. This is a deliberate, documented dev-convenience choice (comment explicitly explains it), but it will also apply in a hypothetical production deployment, forcing a revalidation round-trip for every CSS/JS asset on every load — a real, if minor, performance cost that's currently invisible because the app has never been run in a "production" configuration in this checkout.

### 6.11 Finding #10 — Fragile demo-data tagging

`src/db/seed-demo.js:8,185-187` — demo-seeded tasks/bills are tagged by setting `notes = '[demo-seed]'`, and `clearDemoForUser` deletes rows matching that exact string. Any real task or bill a user creates with that exact text in its notes field would be silently deleted by "Clear demo data." Extremely low likelihood, but a dedicated `is_demo BOOLEAN` column would be the correct, non-fragile approach and costs almost nothing to add.

---

## 7. Frontend Code Audit (deeper detail)

- **State management:** module-level mutable `let` variables per page (see §5.2). No re-render diffing — every update replaces `innerHTML` wholesale for the affected section. This avoids stale-listener bugs (a real, common vanilla-JS pitfall) at the cost of layout thrash and lost focus/scroll state on every re-render (e.g., completing a task from the Dashboard rebuilds the entire page, so scroll position resets — `OBSERVED`, not yet measured).
- **Event listeners:** consistently re-attached after every re-render rather than delegated to a stable ancestor — functionally correct today, but means every new interactive row type requires new manual wiring code, and it's easy to forget to re-wire a listener after adding a new render path (a class of bug this architecture is structurally prone to, though none was found in the current code).
- **Async operations:** all `await`ed directly in event handlers, no debounce except the task search input and command palette (both correctly debounced at 220–250ms). No visible request cancellation — rapid page navigation before a fetch resolves could theoretically write into a since-unmounted page's DOM query (`document.getElementById(...)` would just return `null` and the subsequent line would throw, uncaught, in a few spots — e.g., `family.js` chat polling `load()` checks `if (!box) return` defensively, but not every async render function has this guard consistently applied). `INFERRED` low-frequency risk, not measured.
- **Memory leaks:** `setInterval` for notification polling (20s) and chat polling (6s) are both cleared appropriately on navigation (`clearInterval` before creating a new one) — `VERIFIED`, no leak found here. No `AbortController` usage anywhere, so in-flight fetches are never cancelled, only their *results* are sometimes ignored.
- **Form handling/validation:** client-side validation is minimal (mostly "is it non-empty," delegated to `required` HTML attributes and a few explicit checks); the *real* validation authority is consistently server-side (`ValidationError` with field-level messages, correctly surfaced back into the form via `showFieldErrors`). This is a reasonable, common pattern — server is source of truth, client just improves UX.
- **XSS:** `escapeHtml()` (from `components/toast.js`, imported into every page) is applied consistently to all user-generated string interpolations into `innerHTML` across all 10 page modules — task titles/descriptions/notes, comments, chat messages, bill names/notes, decision questions/options/pros/cons/risks, goal titles/descriptions, eco log actions, notification titles/bodies. This was checked exhaustively; no unescaped user-content injection point was found. **This is a genuine, verified strength**, not a gap.
- **Unsafe URLs:** internal links (`href="#/tasks/${id}"` etc.) are built from server-controlled IDs/link patterns, not raw user input, so there's no `javascript:`-URL injection surface found. Not a risk today; would become one if any feature ever let a user set an arbitrary link/URL field that's later used as an `href` without validation — worth keeping in mind for any "link a document/URL to a task" future feature.

---

## 8. CSS / UI Architecture Audit

- **Organization:** five files with clear responsibilities — `tokens.css` (design tokens/custom properties, light+dark), `base.css` (resets), `components.css` (reusable primitives: buttons, cards, badges, modal, toast), `layout.css` (shell/sidebar/topbar/responsive breakpoints), `pages.css` (page-specific styles). This is a sound, conventional structure with minimal duplication (`VERIFIED` by reading all five files in full).
- **Design tokens:** a genuinely considered palette (explicit comment: "deliberately avoids purple-glow 'AI-generated' aesthetics") with full light/dark parity via both `prefers-color-scheme` and an explicit `data-theme` override — real, working dark mode, not just a stub.
- **Responsiveness:** two breakpoints (`1024px` collapses sidebar→bottom nav, `640px` stacks grids to single column). Reasonably handled for the three device classes tested against in the CSS (`VERIFIED` structurally; **not visually verified in-browser** — see §10 Mobile Audit caveat below).
- **Accessibility gaps (OBSERVED, not exhaustively audited):** `aria-live="polite"` on `#app` is a nice touch. However: icon-only buttons mostly have `aria-label` (good), but modal focus-trapping is not implemented (Escape-to-close and backdrop-click-to-close both exist, but focus doesn't move into the modal on open nor return to the trigger on close — a real gap for keyboard/screen-reader users). No skip-to-content link. Color-only status indicators exist in a few places (priority badges rely partly on color plus text label, which is fine; the notification unread dot is color-only with no text alternative).
- **Layout stability:** no obvious CLS (cumulative layout shift) risks found — no images without dimensions, font loading uses `display=swap` (one Google Fonts family, Fraunces, for headings only — a real, if small, network dependency and third-party origin worth flagging given the "local-first" positioning; system fonts are used everywhere else).
- **Inconsistent spacing/typography:** not found — the token system is used consistently; no hardcoded pixel values were seen bypassing the spacing scale (`--sp-*`) in the files read, aside from a handful of deliberate one-off inline styles for icon sizing in modal/tooltip contexts, which is reasonable.

---

## 9. Data Model / Persistence Audit

### 9.1 Schema quality
The schema (`src/db/schema.sql`, 259 lines, 18 tables) is well-normalized, uses `INTEGER PRIMARY KEY AUTOINCREMENT` consistently, has appropriate `ON DELETE CASCADE`/`SET NULL` foreign key behavior (verified per-table — e.g., deleting a user cascades through sessions, tasks (owner), task_comments, bills, decisions, goals, eco_logs, family_members, ai_conversations, but `SET NULL`s `assigned_to`/`family_id` where a hard delete would be destructive to *other* users' data), and has targeted indexes on the columns actually queried by (`owner_id`, `family_id`, `due_date`, `status`, etc.).

### 9.2 Consistency risks
- **JSON-in-TEXT columns** (`notif_prefs`, `decision_options.pros/cons/risks/scores`, `decisions.recommendation`) are all read through a `safeJson()` helper that falls back gracefully on parse failure (`VERIFIED`, `src/lib/auth.js:72-79`) — a good defensive pattern, consistently applied.
- **No schema versioning table** — the `ensureColumn()` forward-migration guard (§5.3) works for the one case it currently handles but has no tracking of "which migrations have run," relying entirely on `PRAGMA table_info` introspection at every boot. This is fine at the current scale (one guarded column) and would need a real migration runner before it accumulates more than a handful of these.
- **No data validation at the DB layer beyond `NOT NULL`/`UNIQUE`/foreign keys** — e.g., nothing stops an `amount` of `-50` being written to `bills` at the SQL level (the route layer does check `b.amount <= 0` on create, but not consistently reinforced on the `PATCH` path — `VERIFIED`, `src/routes/bills.js:140-160` PATCH handler has no amount validation at all, only the POST handler does).

### 9.3 What happens under various conditions (traced, not executed)

| Scenario | What the code does |
|---|---|
| Storage unavailable (disk full/permission error) | `DatabaseSync` constructor or `fs.mkdirSync` would throw synchronously at boot (`src/db/index.js:8-11`) — the whole server fails to start with an unhandled exception printed to console. No graceful degraded mode. `INFERRED` from code structure, not tested. |
| API (AI) fails | Every AI call path returns `{ok:false, error:'...'}` rather than throwing, and every route/page checks `.ok` before proceeding — this is consistently and correctly handled everywhere AI is used. `VERIFIED`. |
| Invalid user input | Server-side `ValidationError` with per-field messages, HTTP 400, correctly rendered into the form. `VERIFIED`. |
| Browser refresh | Session cookie persists (30-day TTL), `GET /api/auth/me` re-hydrates state on boot — full state is server-derived, nothing depends on client memory surviving a refresh except the theme (which is also persisted server-side on the user record, with `localStorage` only used to avoid a flash-of-wrong-theme before first paint). `VERIFIED`, this is a robust pattern. |
| Browser restart | Same as refresh — cookie is `httpOnly`, persists 30 days, no different behavior. `VERIFIED`. |
| Mobile | CSS has responsive rules; **actual on-device/emulated behavior was not visually tested in this audit phase** (no code changes or browser session were run) — `REQUIRES TESTING`, see §10. |
| Missing/deleted data mid-session (e.g., another tab deletes a task you have open) | No optimistic-concurrency or "this was deleted" handling found — a stale detail modal would show 404 errors on subsequent actions (`res.status(404).json({error:'Task not found.'})`), surfaced as a toast, which is a reasonable-enough fallback but not a polished one. `INFERRED`. |

---

## 10. Mobile-First Audit

**Important caveat:** this phase did not run the application in a browser (no `npm install`/`npm start` was executed, per the "no code changes, no packages installed" constraint of this audit). The findings below are **structural/static** — derived from reading the CSS and HTML, not from viewport testing at 320/360/375/390/414px or on real devices. Anything claimed as a concrete visual bug here would need to be re-verified with the app actually running; this section should be treated as `INFERRED`/`REQUIRES TESTING`, not `MEASURED`.

**Structural observations that support reasonable confidence:**
- Sidebar correctly hides below 1024px in favor of a fixed bottom nav (`layout.css:116-128`), with `env(safe-area-inset-bottom)` padding — a detail that suggests real iOS-notch awareness, a good sign.
- `.page` padding drops from `--sp-6` to `--sp-4` below 640px, and grids (`grid-2`, `grid-3`) collapse to a single column — reasonable defaults.
- The command palette / search overlay uses fixed `inset:0` positioning and should work at small widths structurally, but its `width: min(560px, 92vw)` leaves only 8vw of margin — at 320px width that's ~26px total side margin, tight but workable.
- Modal panels (`modal-lg` = `min(760px, 94vw)`) will be full-bleed-ish on any phone, which is appropriate.
- The **chat and assistant windows use `calc(100vh - ...)` height formulas** (`pages.css:35,90`) which are a known source of mobile viewport bugs (iOS Safari's dynamic toolbar changes `100vh` mid-session) — this is a concrete, well-known class of bug that **cannot be ruled out without on-device testing** and is worth explicit QA attention before October 1.
- No explicit `<meta name="viewport">` issues — the tag present is correct and modern (`viewport-fit=cover` included, another notch-awareness signal).

**Recommendation:** before shipping any UI changes, run the app locally and actually test at the listed breakpoints (320–414px, tablet, desktop) in a real browser or device emulator — this audit cannot substitute for that, and the `100vh` chat/assistant height calculation in particular should be the first thing checked.

---

## 11. Performance Audit

Per the instructions, findings are separated into **MEASURED** (none — the app was never run), **INFERRED** (reasoned from code structure), and **POTENTIAL** (would only manifest at a scale the app hasn't been tested at).

### INFERRED
- **Full-page/full-section re-renders on every mutation.** Every single-item action (complete a task, toggle a milestone, mark a bill paid, add a shopping item) triggers a full re-fetch + full `innerHTML` rebuild of the containing section, sometimes the entire page (`mount(root, ctx)` called again from scratch — e.g., `dashboard.js:55`, `family.js` member/shopping actions). At the data volumes a personal/family app would realistically have (dozens to low hundreds of tasks/bills), this is very unlikely to be perceptible. It becomes a real problem only if list sizes grow much larger, or on materially slower hardware.
- **No debouncing on most interactive re-renders** except the two explicitly noted (task search, command palette). Rapid clicking (e.g., double-tapping "mark paid") could in principle fire duplicate requests since buttons aren't disabled during the in-flight request in most handlers (`billsense.js`'s pay handler, for instance, does not disable the button while awaiting).
- **No bundling/minification/tree-shaking.** Every page navigation triggers a dynamic `import()` of a fresh, unminified ES module, plus five separate CSS file requests and one Google Fonts stylesheet request on first load. For a local single-user app served from `localhost`, network latency is near-zero so this is very unlikely to matter in practice; it would matter if this were ever deployed over a real network to real users.
- **`Cache-Control: no-cache`** forces a conditional-GET round trip for every static asset on every load (Finding #9, §6.10) — real but small overhead, amplified only in a non-localhost deployment.

### POTENTIAL (would need real data volume to confirm)
- SQL queries are all indexed appropriately for current access patterns, but several (`dashboard.js`, `search.js`) run 3-6 separate queries per request rather than a single joined query — fine at low-hundreds-of-rows scale (SQLite on a warm page cache is extremely fast for this), could become a measurable bottleneck only at a scale far beyond what a personal/family tool would realistically reach.
- Client-side full-list rendering (no virtualization) for Tasks/Bills/Goals — fine for tens to low-hundreds of items, would degrade with very long-lived heavy usage (years of accumulated tasks with no archiving).

### Recommendation
None of the above are urgent. The architecture's "no bundler, no framework, full re-render" tradeoffs were clearly made deliberately for simplicity, and they're appropriate for the app's actual current scale. If/when a framework migration happens (§15-16), these problems are largely solved for free by adopting a reactive rendering model — this is a real argument in favor of migration timing, not an emergency in the current codebase.

---

## 12. Security & Privacy Audit

### What personal data is stored, and where
Full name, email, phone number (a real personal identifier used as the family-invite mechanism), password hash, theme/language prefs, all tasks/bills/decisions/goals/eco-logs/messages/comments content, family membership and activity history, AI conversation history. **All of it lives in one local SQLite file.** Nothing is synced to any remote service except the specific, minimal JSON payloads sent to Anthropic's API when an AI feature is actively invoked (`VERIFIED`, every AI call site — never a full-database dump, always a hand-built context object).

### Third parties / external services
1. **Anthropic API** (`@anthropic-ai/sdk`) — only called when `ANTHROPIC_API_KEY` is set and a user actively triggers an AI feature. Scoped context, documented behavior.
2. **Google Fonts** (`fonts.googleapis.com`/`fonts.gstatic.com`) — loaded on every page view unconditionally, regardless of whether AI is configured. This is a real, if minor, tension with the "local-first" positioning — a third-party network request happens on every single page load for a single font family, and Google's font CDN can theoretically log the requesting IP. Worth a conscious decision: self-host the one font file, or drop the custom serif entirely, to make the "local-first" claim fully true rather than "local-first except for one CDN font."

### Authentication/authorization
- Passwords: bcrypt, cost factor 10 — appropriate.
- Sessions: server-side, random 32-byte hex token, `httpOnly`, `sameSite:'lax'`, 30-day TTL, stored/queried against SQLite with expiry checked at every request (`getSessionUser` joins on `expires_at > datetime('now')`) — solid, conventional implementation, no obvious flaws found.
- No CSRF token — mitigated significantly by `sameSite:'lax'` (blocks cross-site state-changing `POST`/`PATCH`/`DELETE` from being sent with the cookie in the vast majority of browsers/scenarios) but not a complete substitute for a CSRF token if this is ever deployed publicly with more attack surface.
- Authorization checks are consistently applied per-resource (`owner_id = ?` / `requireMembership` / `requireRole` checks throughout) — no broad "any authenticated user can read any resource" pattern was found, aside from the narrow task-assignment gap (Finding #4).

### Injection / XSS / unsafe content
- SQL: parameterized everywhere, no string-concatenated queries found (`VERIFIED`, exhaustive read of all 15 route files).
- XSS: `escapeHtml()` applied consistently (§7) — verified strength.
- No `eval`, no `innerHTML` assignment of unsanitized remote content, no `dangerouslySetInnerHTML`-equivalent misuse found.

### Secrets
- `.env` is correctly gitignored. `.env.example` contains no real secrets, only placeholders. `ANTHROPIC_API_KEY` is read via `process.env` only, never logged, never sent to the client (`GET /api/config` only returns a boolean `aiConfigured`, never the key itself — `VERIFIED`).

### Legal/compliance note
This audit is not a legal review and makes no claim about GDPR/CCPA compliance. Given the app stores real personal data (names, phone numbers, potentially sensitive task/bill/decision content) for what appears to be an EU-adjacent (Kosovo/Albania) user base, **a human/legal review is recommended before any real-user deployment**, particularly around: the broken delete-account flow (currently a compliance-relevant bug, not just a UX one, if "right to erasure" applies), and whether the OTP-in-response-body "demo mode" behavior needs to be hard-disabled (not just documented) before any non-local deployment, since it currently returns a real verification code in the API response — appropriate for local demo use, **not appropriate if ever exposed over a network to other people**.

---

## 13. Dependency Audit

| Dependency | Version | Purpose | Used where | Verdict |
|---|---|---|---|---|
| `express` | ^5.1.0 | HTTP server/routing | `server.js`, all routes | Keep — current major version, actively maintained, appropriate choice |
| `@anthropic-ai/sdk` | ^0.70.0 | Claude API client, structured outputs (`betaZodOutputFormat`) | `src/lib/ai.js` only | Keep — cleanly isolated to one file, good encapsulation |
| `zod` | ^3.25.76 | Schema definition for AI structured outputs | `src/lib/ai.js` only | **Underutilized** — not used for any ordinary route/form validation (hand-rolled `isEmail`/`isPhone`/`isNonEmpty` instead, `src/lib/validate.js`). Since it's already a dependency, extending it to route validation would remove hand-rolled validation code for free (see §16). |
| `bcryptjs` | ^3.0.2 | Password hashing | `src/lib/auth.js` | Keep — pure-JS bcrypt, no native compilation needed, consistent with the "works out of the box on Windows" goal. Note: pure-JS bcrypt is somewhat slower than native `bcrypt`, but at cost factor 10 and single-user-scale login volume this is a non-issue. |
| `cookie-parser` | ^1.4.7 | Session cookie parsing | `server.js` | Keep — small, standard, no concerns |
| `dotenv` | ^17.0.0 | `.env` loading | `server.js` | Keep |
| `node:sqlite` (built-in) | Node ≥22.5 | Database | `src/db/index.js` | Keep — genuinely good choice, zero extra dependency, no native build step |

**Not installed / not used:** no ORM, no test framework, no linter, no bundler, no CSS preprocessor, no frontend framework, no logging library (uses raw `console.error`), no rate-limiter, no security-headers middleware. Every one of these absences is a deliberate simplicity tradeoff that mostly held up under this audit — the one place it clearly should change is testing (§6.11, §17).

**Dependency count is genuinely minimal** (6 runtime dependencies) — this is a real strength for maintainability and supply-chain risk surface, and should be weighed heavily against any framework migration that would multiply it by 10-50x.

---

## 14. UX Audit

| Friction point | Why it happens | How it could improve |
|---|---|---|
| Deleting an account always fails | Finding #1 (broken `api.del`) | Fix the bug (§21, P0) |
| Setting a task to "recur daily" silently does nothing after the first completion | Finding #2 | Implement real recurrence expansion, or remove the picker |
| "Share this code so someone can join" has no way to actually join | Finding #3 | Implement join-by-code, or change the copy to be accurate about the phone-only flow |
| Full-page reload feel on every small action (checking off a task from the dashboard) | Architectural choice (full re-render pattern, §5.2/§11) | Patch single rows in place instead of full remount, at least for the most common interactions (task complete, bill pay, milestone toggle) |
| No undo for destructive actions beyond a confirm dialog | `confirmDialog()` is the only safety net; no soft-delete/undo-snackbar pattern | Consider a brief "Undone" toast-with-undo for deletes, especially tasks/bills people might tap by mistake on mobile |
| Chat/notifications feel laggy in a "family" context | 6s/20s polling intervals, no real-time channel | See §15 migration notes — this is one of the stronger arguments for adding a lightweight real-time layer (SSE, not full WebSocket infrastructure, would likely be sufficient) |
| No way to search/filter Timeline | `timeline.js` has zero filter UI | Add type filter + search, matching the pattern already used in Tasks |
| Onboarding is a single card, easy to miss | `dashboard.js:76-87`, only shown when *all* of tasks/bills/families are empty | Reasonable as-is for a first pass; a short guided first-run (3 lightweight steps: add a task, try demo data, invite family) could reduce first-session drop-off, but this is a genuine `OPTIONAL`, not urgent |
| Modal focus is not trapped/restored | `components/modal.js` has no focus management beyond a document-level Escape listener | Add basic focus trap + return-focus-on-close for accessibility |

---

## 15. Migration Analysis (strategy only — nothing executed)

### What can be reused as-is
- **The entire backend is framework-agnostic and does not need to change** for a frontend migration. `server.js`, all of `src/routes/`, `src/lib/`, `src/db/` can be kept verbatim regardless of what frontend framework is chosen — this dramatically de-risks any migration, because the hardest-to-get-right part (deterministic business logic, AI gateway, auth, schema) is already stable and does not need to be rewritten.
- The design token system (`tokens.css`) and the visual language it encodes can be ported directly into any CSS-in-JS or utility-first approach, or kept as plain CSS custom properties (which work identically inside React/Vue/Svelte components) — no rewrite needed, just reference.
- The icon set (`components/icons.js`) is a plain data object of SVG paths — trivially portable to any framework as-is.

### What should be rewritten
- The page-module rendering pattern (`mount(root, ctx)` + manual `innerHTML` + manual listener wiring) is exactly what a component framework replaces — this is the actual "why migrate" payload. Every page (`dashboard.js` through `settings.js`, ~2,300 lines combined) would be rewritten as components, but the *logic* inside them (what data to fetch, what actions are available, what the empty/loading/error states say) transfers directly — it's a restructuring exercise, not a redesign of behavior.
- The hash-router in `app.js` would be replaced by the chosen framework's router.
- Module-level mutable state (`activeTab`, `filters`, etc.) becomes proper component state — this is a strict improvement with a framework, not a wash.

### What should be migrated carefully (data equivalence risk)
- The SQLite schema and all API contracts (`/api/*` request/response shapes) should be treated as **frozen** during a frontend-only migration — the backend doesn't need to move at all in the first pass. This is the single biggest de-risking decision available: a full framework migration can be done as **frontend-only**, calling the exact same existing API, with zero backend changes and zero data-migration risk.
- If a backend framework/database change is *also* wanted eventually (e.g., Postgres for multi-instance deployment), that should be a **separate, later phase**, done only after the frontend migration has stabilized — bundling both at once multiplies risk for no compounding benefit.

### How to avoid regressions
1. Before touching any code, **write down the exact current behavior of every feature** (this document is a first pass at that; a page-by-page manual click-through checklist should be produced once the app is actually run).
2. Migrate one page at a time, keeping the old vanilla-JS page mounted for everything not yet migrated (the hash-router can dispatch to either an old `mount()` or a new framework component per route during the transition — this is a standard strangler-fig pattern and fits this codebase's structure well since routing is already centralized in one file).
3. Fix Finding #1 (broken delete) and Finding #2 (fake recurrence) **before or independently of** any migration — these are correctness bugs, not migration-scope work, and fixing them first means the migration's "does it still work the same as before" checklist is checking against *correct* behavior, not baking in the bugs.
4. No automated tests exist today (§6.11) — writing even a thin layer of API-contract tests (hit every route with realistic input, assert response shape) before migrating the frontend would be the single highest-leverage risk-reduction step available, since the backend is staying stable and testable in isolation from any frontend rewrite.

---

## 16. Framework Comparison (recommendation, not a decision made for you)

The instructions ask specifically about React, Vite, Next.js, and other appropriate candidates, evaluated against **this app's actual requirements**, not popularity.

### What LifeAdmin actually needs from a frontend layer
- Multiple client-rendered pages behind auth, talking to an existing REST API — **not** content that needs SEO or server-rendering (it's a private, logged-in personal tool).
- No real-time collaboration requirements beyond the existing polling-based chat (which could be upgraded independently of the framework choice).
- A team of unknown future size — should optimize for **low ceremony and fast onboarding for a solo or very small team**, not for large-team conventions.
- Willingness to keep the "no build step" simplicity where it doesn't cost UX — a real constraint worth respecting, not dismissing.

### Candidates

**React + Vite (SPA, no SSR)**
- *Advantages:* huge ecosystem, matches the existing "client-rendered SPA talking to a REST API" shape almost exactly, Vite's dev server is fast and its build step is simple (a single `vite build` producing static assets Express can keep serving exactly as it does today — `express.static` doesn't need to change at all).
- *Disadvantages:* adds a build step and a fairly large `node_modules` tree where there is currently none; React's mental model (state, effects, re-renders) has a real learning curve if the next person maintaining this isn't already fluent in it.
- *Migration difficulty:* moderate — the strangler-fig approach (§15) works cleanly here because Vite can build to a `public/`-equivalent output directory that Express serves unchanged.
- *Fit:* **Good fit.** This is the most direct, lowest-risk upgrade path from where the app is today, and it solves the real problems identified in this audit (§5.2, §11) without taking on capabilities (SSR, server components, file-based routing conventions) the app doesn't need.

**Next.js**
- *Advantages:* if there were ever a desire for SEO-indexable public pages (marketing/landing page, public shared content) or server-side rendering for performance, Next.js would be the standard choice.
- *Disadvantages:* LifeAdmin is entirely behind auth — there is no page in this product that benefits from SSR or SEO. Adopting Next.js would mean taking on its routing conventions, its server/client component split, and its deployment assumptions (which often nudge toward Vercel-style hosting) for **zero actual benefit** to this specific app's requirements. This would be the "recommend a framework because it's popular" mistake the instructions explicitly warn against.
- *Fit:* **Poor fit for the app as it exists today.** Would only become relevant if the product roadmap grows a genuinely public-facing, SEO-relevant surface (e.g., a public landing/marketing page) — and even then, that page could be a single static file served alongside the existing app rather than justifying a framework switch for the whole product.

**Svelte/SvelteKit**
- *Advantages:* smaller runtime, arguably gentler learning curve than React, compiles away most of the framework overhead, very well suited to a small, calm, content-focused app like this one aesthetically.
- *Disadvantages:* smaller ecosystem/hiring pool than React; SvelteKit again brings SSR-oriented conventions this app doesn't need (same argument as Next.js, to a lesser degree — SvelteKit can run in pure SPA mode though).
- *Fit:* **Reasonable second choice**, genuinely worth considering if the team building this values a smaller mental model over ecosystem size — but React+Vite remains the safer default recommendation given how directly it maps onto the existing architecture.

**Staying vanilla JS, investing in the current pattern instead**
- *Advantages:* zero new dependencies, zero build step, zero framework lock-in, the absolute lowest risk option.
- *Disadvantages:* the structural problems identified in §5.2 (module-level mutable state, manual re-render/re-wire on every change, no component reuse) don't go away — they get slightly better with discipline (e.g., adopting a tiny signals/reactivity library like `@preact/signals-core` or hand-rolling a minimal reactive-state helper) but the app will keep paying a linearly-growing "manual wiring tax" as features are added.
- *Fit:* viable if the October 1 timeline and team size strongly favor zero migration risk over long-term maintainability — a legitimate, defensible choice, not a bad one, just a different tradeoff.

### Recommendation

**React + Vite, migrated frontend-only via the strangler-fig pattern in §15, with the existing Express + SQLite backend left untouched.** This is the option that most directly solves the actual problems this audit found (state management fragility, re-render cost, lack of component reuse) while respecting the app's real requirements (no SSR/SEO need, small team, existing REST API that shouldn't need to change) and while keeping the migration's blast radius contained to the frontend only. Next.js and SvelteKit are both reasonable technologies in general but are recommended against here specifically because neither offers this app a benefit that outweighs the convention/complexity they'd impose, which is exactly the "don't recommend it merely because it's popular/exists" standard requested in scope.

---

## 17. Target Architecture Proposal

Assuming the React + Vite recommendation is accepted (adjust trivially if a different framework is chosen — the shape below doesn't change much):

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18+ | Direct mapping from existing page-module structure; huge ecosystem for anything added later |
| Build tool | Vite | Fast dev server, simple production build, outputs static assets `express.static` already knows how to serve |
| Routing | React Router (client-side only, matching the existing hash-router's role) | Closest match to current behavior; no SSR needed so no need for a meta-framework router |
| Component architecture | One component tree per current "page module," broken into smaller components only where reuse is clear (e.g., a shared `<Modal>`, `<Toast>`, `<RowItem>`, `<EmptyState>` — directly modeled on the existing `components/` files, which already identify the right seams) | Avoids over-abstracting before real reuse patterns are proven; mirrors the audit's finding that the current component boundaries (icons/modal/toast/confirm) are already correctly chosen |
| State management | React's built-in `useState`/`useContext` — **no Redux/Zustand/etc. needed** at this app's complexity | The current "global `state` object" (`app.js`) is small (user, aiConfigured, families, notifications) and maps cleanly to a single `AuthContext`/`AppContext`; adding a heavier state library would be solving a problem this app doesn't have |
| Data layer | Keep the existing `api.js` fetch wrapper pattern, wrapped in a small set of custom hooks per resource (`useTasks()`, `useBills()`, etc.) using React Query **or** plain `useEffect` + local caching — React Query is worth the one added dependency here because it solves the "full re-render on every mutation" problem (§11) for free via cache invalidation | Directly addresses the biggest inferred performance/UX cost found in this audit |
| Persistence | **Unchanged** — SQLite via `node:sqlite`, same schema | No reason to touch a layer that audited cleanly; revisit only if multi-instance deployment is ever required |
| API layer | **Unchanged** — Express routes as-is | Backend is stable, tested-by-reading, and framework-agnostic; changing it in the same phase as the frontend migration would violate the risk-isolation principle from §15 |
| Validation | Extend existing `zod` usage (already a dependency, currently AI-only) to also validate route input bodies, replacing the hand-rolled `validate.js` checks with `zod` schemas — small, low-risk, removes duplicate logic | Zod is already proven in this codebase for the AI layer; extending it removes real (if minor) duplication (§13) |
| Error handling | Keep the existing `ValidationError`/`errorHandler` pattern server-side unchanged; frontend adds a React error boundary per route as the framework-native equivalent of the current `errorHtml()` fallback | Direct 1:1 mapping, no redesign needed |
| Testing | **New** — this is the biggest actual gap (§6.11). Recommend: Vitest for frontend component/unit tests, and a lightweight API-contract test suite (e.g., `supertest` against the existing Express routes) that can be written **before** any frontend migration starts, since it tests the stable backend | Directly closes the single largest maintainability risk found in this audit |
| Folder structure | `src/` (backend, unchanged) stays; add `web/` (new Vite+React app) during migration, with `public/` (old frontend) kept side-by-side until the strangler-fig cutover completes page-by-page, then removed | Matches the migration strategy in §15 |
| Environment config | Unchanged `.env`/`dotenv` pattern; add `ANTHROPIC_MODEL` env var (Finding #6 fix) as part of this phase since it's essentially free | Small, real improvement bundled into work already touching this area |

**Explicitly avoid:** microservices, GraphQL, a new database, server components, SSR, or any multi-service orchestration — none of these solve a problem this audit actually found, and every one of them would add real operational complexity to a tool whose core value proposition (per its own README) is *not requiring paid infrastructure*.

---

## 18. Feature Improvement Plan

### A. MUST IMPROVE
| Feature | Current behavior | Problem | Proposed improvement | User benefit | Complexity | Risk | Changes existing behavior? |
|---|---|---|---|---|---|---|---|
| Account deletion | Always fails | Finding #1 — password never sent | Fix `api.del` to accept/forward a body | Users can actually exercise a documented right | Trivial (1-line fix) | None | No — fixes broken behavior to match documented intent |
| Task recurrence | Silently a no-op after first completion | Finding #2 | Expand recurring tasks into real future occurrences on completion, mirroring bill rollover | Recurring routines actually work | Small–Medium | Low | Yes, intentionally — makes a broken promise real |
| Family invite code | Displayed, unusable | Finding #3 | Implement join-by-code endpoint + UI | Family onboarding actually works as described | Small–Medium | Low | Yes, intentionally |
| Task assignment validation | Unvalidated `assignedTo` | Finding #4 — narrow info-leak risk | Validate assignee is a family member server-side | Closes a real (if narrow) security gap | Trivial | None | No — tightens an oversight |

### B. SHOULD IMPROVE
| Feature | Current behavior | Problem | Proposed improvement | User benefit | Complexity | Risk | Changes existing behavior? |
|---|---|---|---|---|---|---|---|
| Bills/Decisions family sharing | `family_id` stored, never used | Finding #5 — inconsistent with Tasks | Implement family-shared visibility for bills/decisions, matching tasks' model | Household bill/decision coordination actually matches the product's family premise | Medium | Low–Medium (needs the same visibility-query pattern already proven in tasks.js) | Yes, expands existing (currently dead) capability |
| Dashboard/list re-renders | Full remount on every single action | Perf/UX cost, lost scroll position | Patch single rows/counts in place for common actions (complete task, pay bill, toggle milestone) | Snappier, less jarring interactions | Medium (more impactful, lower-risk if done during framework migration where it's near-free) | Low | Yes — pure improvement, same outcome |
| OTP rate limiting | Unlimited confirm attempts within session | Finding #7 (partial) | Add attempt counter + lockout after N tries | Reduces nuisance/DoS surface | Small | Low | No — additive safety |
| Timeline | No filter/search, capped at 150 | Old history unreachable | Add type filter, search, and real pagination | Timeline stays useful long-term | Small–Medium | Low | Additive |
| Assistant context selection | English/Albanian keyword regex | Misses intent phrased differently | Broaden matching or let the AI request more context in a second pass | More consistently useful assistant replies | Medium | Low | Additive, no regression risk if done as a fallback layer |

### C. OPTIONAL
- Confidence-band explanation text in DecisionFlow.
- Goal check-in reminders beyond the AI weekly review.
- EcoLife trend-over-time chart (beyond the current 30-day count).
- Guided first-run onboarding (beyond the current single card).
- Modal focus-trap/accessibility polish.
- Self-host the one Google Font, or drop it, for a fully "local-first" claim.

### D. DO NOT CHANGE
- The AI/deterministic-logic separation principle across every feature (priority scoring, scheduling, decision math, bill recurrence math) — this is the product's real engineering differentiator and should be treated as a hard constraint for every future feature, not just the existing ones.
- The graceful "AI not configured" degradation — every AI feature must keep working (minus the AI-specific enhancement) with no key set.
- The phone-number-first family identity model.
- The honest, non-deceptive framing of the demo OTP flow (explicitly telling the user what's real vs. simulated) — this tone should extend to any other simulated/limited feature added in the future.
- Derived-not-stored invariants (goal progress from milestones, urgency score from priority+due date) — these are correctness properties, not implementation details.
- The minimal-dependency philosophy — every new dependency should be justified against a real, found problem (as this audit tries to model), not added speculatively.

---

## 19. New Feature Opportunities

Evaluated strictly against "does this fit the existing Life Admin identity" — several plausible categories from the brief (integrations, automation, generic dashboards) are deliberately **excluded** below because they'd pull the product toward a generic SaaS-dashboard identity the brief explicitly rules out.

### Recommended (fits the existing premise directly)

**1. Real recurrence for tasks** (technically a fix, but also a feature in its own right — recurring routines/habits are core "life admin" territory: rent, medication, chores). *Data:* none new needed, schema already supports it. *Complexity:* Medium. *Now* (it's part of fixing an already-broken promise).

**2. Bill/decision family sharing** (§18-B). *Now or shortly after* — closes an identity inconsistency.

**3. Household maintenance/reminders** (e.g., "replace smoke detector batteries every 6 months," "car registration due," "passport renewal") — this is squarely "life admin" territory, distinct enough from Tasks (which are action-oriented and near-term) to justify being its own lightweight category, but could also reasonably just be **recurring tasks with a longer-horizon reminder** rather than a whole new entity — recommend implementing it as an extension of #1 rather than a new feature area, to avoid entity sprawl.

**4. Important-dates/anniversaries** (birthdays, anniversaries) with advance reminders — again, natural fit, and could reuse the existing task/reminder infrastructure rather than becoming a new top-level nav item. *Complexity:* Low if built on top of #1.

**5. Document/record shelf** (a simple, private place to note "where is X" — insurance policy number, passport expiry, warranty info) — this is a very natural "life admin" extension and distinct from tasks/goals. Needs care: even a lightweight metadata-only version (no file uploads) would add real value ("passport expires 2027-03-01, policy #X at Insurer Y") without the security complexity of file storage. *Complexity:* Medium. *Privacy:* this is the most sensitive category proposed — would need explicit consideration of whether it belongs in the same DB with the same encryption-at-rest posture as everything else (currently: none — SQLite file is unencrypted on disk, appropriate for a local-first tool where the OS/disk is the trust boundary, but worth being explicit that this category raises the stakes of that assumption). Recommend: **later**, after the P0/P1 fixes, and only with an explicit decision about at-rest protection for this specific data category.

**6. Backup/restore** (distinct from the existing export-to-JSON) — a one-click "back up my LifeAdmin" that produces a restorable snapshot, and a restore flow that consumes one. This directly serves the "local-first, no paid infra" identity (the tradeoff of local-first is the user is responsible for their own backups — the product should make that easy) far better than any cloud-sync feature would, without compromising the local-first premise. *Complexity:* Medium (export already exists; needs an import/restore counterpart plus schema-version compatibility checking). *Now-or-later:* strong candidate for before October 1, given how directly it reinforces the existing product promise.

### Explicitly not recommended right now
- **Integrations with external calendars/services** — real value, but pulls toward "generic productivity SaaS," adds OAuth/external-API complexity, and isn't necessary to make the existing feature set excellent. Revisit only after the P0/P1 list is done and the core is solid.
- **Notifications via push/SMS/email** — the app is explicit and honest that it doesn't do this today (demo-mode OTP framing). Adding real push would require a paid or self-hosted service, in tension with the "no paid infrastructure required" README promise. If ever added, it should be opt-in and clearly costed to the user, not silently assumed.
- **Any social/collaborative feature beyond the existing single-family model** (multi-family comparison, "communities," leaderboards, etc.) — explicitly out of scope per the brief, and not a natural extension of this product's calm, private identity.
- **Automation/workflow-builder features** — would move the product toward "Notion/Zapier-clone" territory the brief explicitly rules out.

---

## 20. Feature Matrix

| Feature | Current State | Keep | Improve | New/Expanded | Priority | Complexity | Reason |
|---|---|---|---|---|---|---|---|
| Dashboard aggregation | Working, deterministic | ✔ | Targeted re-render | — | P1 | S | Real UX cost, low risk fix |
| Tasks CRUD/comments | Working | ✔ | — | — | — | — | Solid as-is |
| Task recurrence | Broken (no-op) | — | ✔ Must | — | P0 | M | Finding #2 |
| Task family assignment validation | Missing check | — | ✔ Must | — | P0 | S | Finding #4 |
| Family core + members | Working | ✔ | — | — | — | — | Solid |
| Family invite-by-code | Non-functional | — | ✔ Must | — | P0 | M | Finding #3 |
| Family chat | Working, polling | ✔ | Latency | — | P2 | M | Not urgent |
| Shopping list | Working | ✔ | — | — | — | — | Solid |
| BillSense CRUD/recurrence | Working | ✔ | — | — | — | — | Solid |
| Bills family sharing | Schema-only | — | — | ✔ | P1 | M | Finding #5 |
| DecisionFlow math + AI split | Working, well-designed | ✔ | — | — | — | — | Core strength, protect |
| Decisions family sharing | Schema-only | — | — | ✔ | P2 | M | Same pattern as bills, lower urgency |
| EcoLife logging/tips | Working | ✔ | — | — | — | — | Solid, thin |
| Goals + derived progress | Working | ✔ | — | — | — | — | Solid invariant, protect |
| Timeline | Working, no filters | ✔ | Filters/pagination | — | P2 | S | Real but not urgent |
| Assistant chat + context selection | Working | ✔ | Context robustness | — | P2 | M | Real but not urgent |
| Weekly life planner (NL → schedule) | Working, genuinely deterministic placement | ✔ | — | — | — | — | Core strength, protect |
| Account deletion | **Broken** | — | ✔ Must | — | **P0** | XS | Finding #1, immediate |
| Data export | Working | ✔ | — | — | — | — | Solid |
| Backup/restore | Absent | — | — | ✔ | P1 | M | §19-6 |
| Recurring routines / reminders | Absent (subsumed by fixed task recurrence) | — | — | ✔ | P1 | M | §19-1/3/4 |
| Important dates | Absent | — | — | ✔ | P2 | S–M | §19-4 |
| Document/record shelf | Absent | — | — | ✔ | P3 | M | §19-5, privacy review first |
| Rate limiting | Absent | — | ✔ | — | P1 | S | Finding #7 |
| Security headers | Absent | — | ✔ | — | P2 | S | Finding #8 |
| AI model configurability | Hardcoded | — | ✔ | — | P1 | XS | Finding #6 |
| Automated tests | Absent | — | ✔ | — | **P0** | L | §6.11, blocks safe migration |

---

## 21. Risk Register

| Risk | Probability | Impact | Evidence | Mitigation |
|---|---|---|---|---|
| Migration introduces regressions with no way to detect them | High (no tests exist today) | High | §6.11, zero test files found repo-wide | Write API-contract tests before frontend migration starts (§15, §17) |
| Account deletion stays broken through a migration (nobody notices because it "looks fine" in the UI) | Medium — likely to be carried over if not explicitly flagged | High (compliance-relevant) | Finding #1, `VERIFIED` | Fix immediately, independent of migration timeline (§21 roadmap P0) |
| October 1 deadline pressure leads to skipping tests/security fixes in favor of visible features | Qualitative: high, given deadline-driven work | Medium–High | N/A (process risk, not code evidence) | Sequence the roadmap (§22) so P0 correctness/security fixes happen first, before any visible new feature work, so they can't be deprioritized under time pressure |
| Frontend migration scope creep (redesigning UI/UX at the same time as changing the framework) | Medium — common failure mode in "let's modernize" projects | High (extends timeline, multiplies risk) | N/A (process risk) | Explicit rule: migration phase changes *implementation*, not *behavior* or *visual design*, except where this audit specifically calls out a behavior bug to fix (§21) |
| Family/bill/decision sharing inconsistency confuses whoever picks up this codebase next | Medium | Medium | Finding #5, `VERIFIED` | Resolve explicitly (either build it out or remove the column) rather than leaving it ambiguous |
| Third-party Google Fonts dependency undermines the "local-first" claim if ever audited/scrutinized | Low probability of being *noticed*, but factually present | Low | `VERIFIED`, `index.html:9-11` | Self-host the one font file, or drop it — cheap fix, §18-C |
| No rate limiting becomes a real problem if the app is ever exposed beyond localhost | Low today (local-first, single-user), rises sharply if deployment model changes | Medium–High if it changes | Finding #7 | Add rate limiting as part of any deployment-model change, not necessarily before |
| SQLite single-file model blocks any future multi-instance/cloud deployment | Certain, if that's ever wanted | Depends entirely on whether multi-instance is ever a goal | Architectural, by design | Not a risk against the current stated goals (README explicitly wants "no paid infrastructure"); only becomes relevant if the product direction changes |

---

## 22. Final Verdict

### CURRENT PRODUCT
A real, working, honestly-scoped, local-first personal and family life-management app, covering tasks, bills, decisions, goals, sustainability habits, family coordination, and an optional AI layer that degrades gracefully. Its identity is specific and coherent: calm, private, non-social, non-gamified, phone-number-first for family identity, with clear Kosovo/Albania-market signals. This identity is a genuine asset and should anchor every decision made before October 1.

### CURRENT CODEBASE
**Good:** clean layered backend architecture, consistent and correctly-applied auth/authorization patterns, parameterized SQL throughout, consistent XSS escaping throughout, a genuinely well-executed AI/deterministic-logic separation that's rare to see this consistently applied, honest UX copy around simulated features (OTP), minimal and justified dependency footprint, a working (if architecturally aging) frontend with a real dark mode and reasonable responsive structure.

**Weak:** zero automated tests, no CI, no linting, one broken core feature (account deletion), one fully-decorative feature (task recurrence), one half-built feature (family invite-by-code), one inconsistently-implemented feature axis (family sharing on bills/decisions vs. tasks), no rate limiting or security headers, a frontend architecture (module-level mutable state, manual full re-renders) that has served the app well so far but won't scale gracefully to significantly more features.

### BIGGEST PROBLEMS
1. **Account deletion doesn't work** — a correctness bug in a feature with real user-trust and compliance implications.
2. **Zero test coverage** — the single biggest risk multiplier for the modernization work being planned; every change from here forward is unverifiable except by manual click-through.
3. **Two features that promise something the code doesn't deliver** (task recurrence, family invite codes) — these actively erode trust once a user notices.
4. **Frontend architecture debt** — not broken, but structurally approaching the point where every new feature costs more than the last one to add safely.

### BIGGEST OPPORTUNITIES
1. **A frontend-only migration** (React + Vite, strangler-fig, backend untouched) solves the architecture-debt problem with minimal risk, because the backend already audited as solid and stable.
2. **Fixing the three broken/half-built features** (deletion, recurrence, invite codes) is low-complexity, high-trust-payoff work that can happen in parallel with or before the migration.
3. **Backup/restore** is the single new feature that most directly reinforces the existing "local-first, no paid infrastructure" product promise rather than diluting it.
4. **Extending the existing, already-proven family-sharing pattern from Tasks to Bills/Decisions** closes a real product-identity inconsistency using an approach the codebase has already validated.

### RECOMMENDED TARGET STACK
React + Vite for the frontend (migrated incrementally, page by page, via strangler-fig, alongside the existing hash-router), Express + `node:sqlite` unchanged for the backend, `zod` extended from AI-only to general route validation, Vitest + `supertest` added for testing, React Query added for data-fetching/cache-invalidation (directly solves the full-re-render performance/UX cost found in §11/§14). No new backend framework, no new database, no SSR, no microservices — none of these solve a problem this audit actually found.

### WHAT MUST NOT CHANGE
- The deterministic-math-never-delegated-to-AI principle, applied everywhere it currently is.
- Graceful full-functionality-without-AI-key degradation.
- The phone-first family identity model.
- The calm, honest, non-deceptive product voice (including how simulated features are labeled).
- The minimal-dependency philosophy and the "no paid infrastructure required" promise.
- The core five-feature-area product shape (Tasks, Family, Bills, Decisions, Goals) plus Assistant/EcoLife/Timeline as supporting features — this is what "Life Admin" *is*, and no restructuring plan should collapse or genericize it into an undifferentiated "productivity dashboard."

### WHAT SHOULD CHANGE
- Fix the three broken/half-built features (P0, independent of migration timing).
- Add tests before or during the migration, not after.
- Migrate the frontend to a component framework, backend untouched, to resolve the identified architecture debt.
- Add rate limiting, security headers, and OTP attempt-limiting before any deployment beyond a single local machine.
- Resolve the bills/decisions family-sharing inconsistency in one direction or the other.
- Make the AI model configurable via environment variable.

### WHAT SHOULD NOT BE BUILT
- Any social/collaborative feature beyond the existing single-household family model.
- Calendar/external-service integrations, at least before October 1 — real value, wrong sequencing, adds complexity the current problem list doesn't need.
- A generic automation/workflow-builder layer.
- SSR, a meta-framework, GraphQL, or a new database — none of these address a problem this audit found; adopting any of them now would be optimizing for a scale and set of requirements this product doesn't have.
- A rebuilt "AI-first" experience — the product's real strength is the *opposite* of that: AI as a scoped, optional enhancement over a fully-functional deterministic core. Any redesign that makes AI load-bearing for basic functionality would be a regression of the product's actual identity.

### OCTOBER 1 TARGET
A realistic, strong version by October 1 should have: all three broken/half-built features fixed, a working automated test suite covering the existing API surface, the frontend migration underway or complete for the highest-traffic pages (Dashboard, Tasks, Family) via the strangler-fig approach with the rest following the same proven pattern, basic rate limiting and security headers in place, the bills/decisions family-sharing question resolved one way or the other, and one net-new feature that reinforces rather than dilutes the product identity — backup/restore is the strongest single candidate given the timeline. This is an ambitious but achievable scope if sequenced correctly (§21 gate below) — it is not realistic to also add several new feature categories (documents, important dates, integrations) in the same window without meaningfully raising regression risk on a codebase that currently has zero test coverage.

---

## 23. Questions / Unknowns Requiring Validation

These cannot be resolved by static reading alone and should be confirmed before or during implementation:

1. **Does the app actually run correctly today?** `npm install && npm start` was never executed in this audit (per the "no packages installed" constraint). Node v24.20.0 is installed and satisfies the `>=22.5.0` engine requirement, but `node:sqlite` behavior, Express 5's newer async-error-handling semantics, and the AI SDK's beta `messages.parse` API should all be smoke-tested before relying on any of this audit's `VERIFIED` code-reading claims as guarantees of runtime behavior. `REQUIRES TESTING`.
2. **What is the "spec §N" document referenced throughout the code comments** (e.g., "spec §8, §28", "spec §41 idea")? This repository does not contain it. If it exists elsewhere, it likely contains valuable original-intent context (feature rationale, explicit non-goals) that would sharpen several judgment calls in this report (especially §19's "fits vs. doesn't fit" calls). **Recommend locating and reviewing it before finalizing the roadmap.**
3. **Is there a hosting/deployment target in mind at all**, or is "local-first, runs on one machine" the permanent intended shape? This materially changes the urgency of §6.8/§6.9/§12's rate-limiting and security-header findings — they're low-urgency for a genuinely local-only tool and higher-urgency the moment any network exposure is planned.
4. **Confirm the intended scope of "family" for Bills/Decisions** (Finding #5) — was this a planned-but-unshipped feature, or an intentional decision to keep bills/decisions personal-only? This audit cannot infer intent from code alone.
5. **Mobile behavior at the specified breakpoints (320–414px, tablet)** — flagged throughout as `REQUIRES TESTING`; this audit's mobile findings are structural only, not visually verified.
6. **Team size/composition for the October 1 work** — directly affects whether the React+Vite recommendation's migration timeline (§15) is realistic, and whether writing a test suite first (this audit's strongest single recommendation) is achievable within the window alongside everything else.

---

## IMPLEMENTATION GATE

**No code changes were made in this audit phase**, per instructions.

### What must be confirmed before implementation starts
- Answers to §23, questions 2 (the referenced spec document) and 3 (deployment target) in particular — both materially change prioritization elsewhere in this report.
- Explicit sign-off on the Finding #5 direction (build out family-sharing for bills/decisions, or intentionally drop the unused columns).
- Explicit sign-off on the React + Vite recommendation (§16) vs. staying vanilla-JS-with-discipline — both are defensible; this is a judgment call for the person who owns the October 1 deadline and the team executing it, not one this audit should make unilaterally.

### What architectural decisions are ready (no further debate needed, per this audit's analysis)
- Backend stays as-is (Express + `node:sqlite`) regardless of frontend decision.
- Any frontend migration should be frontend-only, incremental, strangler-fig, with the API contract frozen.
- Fix Findings #1, #4, #6 (delete-account, task-assignment validation, hardcoded model) — all are small, low-risk, unambiguous correctness fixes with no design decision attached.
- Add an automated test suite for the existing API surface before or alongside any migration work.

### What should be the FIRST implementation phase
1. Fix Finding #1 (account deletion) — trivial, high-trust-impact, zero dependencies on any other decision.
2. Fix Finding #4 (task-assignment validation) and Finding #6 (AI model env var) — same category, bundle with #1.
3. Stand up a minimal API-contract test suite against the existing, unchanged backend.
4. Only then begin the frontend migration, page by page, starting with Dashboard (highest-traffic, and the page whose full-re-render cost is most visible per this audit).

### What should NOT be touched until later
- The SQLite schema/database technology (no evidence-based reason to change it yet).
- Bills/Decisions family-sharing (Finding #5) — resolve the *decision* first (see "must be confirmed" above), implement after the P0 fixes and test suite exist.
- Any of the §19 new-feature proposals, backup/restore included — valuable, but sequenced after correctness fixes and test coverage, not before.
- Rate limiting / security headers — genuinely lower urgency for a local-only tool; revisit the moment any deployment-model question in §23 is answered differently.

**No code changes were made in this phase. This document is the complete deliverable for the audit phase and should serve as the source of truth for planning the next phase.**
