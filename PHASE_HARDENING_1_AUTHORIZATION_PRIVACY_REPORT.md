# Hardening 1 — Authorization, Privacy & Family Integrity

Evidence labels: **VERIFIED** (observed in this phase by a test, probe or real-browser run) · **IMPLEMENTED** (in code, not separately exercised) · **NOT VERIFIED** · **DEFERRED** · **BLOCKED**.

Scope was limited to F-01, F-02, F-03, F-04 and F-13 from `FINAL_WHOLE_PRODUCT_AUDIT.md`. Nothing else from that audit was touched (see §26). Evidence files: [hardening1-evidence/](hardening1-evidence/) plus the new test file [test/hardening1-authorization-privacy.test.js](test/hardening1-authorization-privacy.test.js).

---

## 1. Executive summary

All five mandated findings are closed on the server and verified three ways: 21 new backend tests (suite 135 → **156/156**), the original audit probes re-run against the fixed code (every previously demonstrated exploit now returns the protected result), and a 31-check real-browser run with three real users and two families. Focused regression across Family, Tasks, BillSense, Timeline, Search, Notifications, Chat and Settings/account deletion passed (all suites listed in §18); lint is clean, the build succeeds (355.90 kB / 81.08 kB gzip, +1.0 / +0.19 kB), no dependency changed, and the only schema change is a partial unique index.

Decisions I had to make (none required stopping, all are stated so they can be overruled): bills keep their family association fixed at creation; removing a *registered* member replaces the invite code; a private task is visible to its owner and assignee only; startup repairs existing weak/ownerless data non-destructively. Residual limitations are in §25.

---

## 2. Final-audit findings addressed

| ID | Finding | Result |
|---|---|---|
| F-01 | A non-member could attach bills to any family and write into its feed/notifications | Closed — VERIFIED |
| F-02 | Reactions to messages of other families; unbounded text; 500 on missing id | Closed — VERIFIED |
| F-03 | Unthrottled `/join`, non-rotating codes, removed members could rejoin, 9,000-value demo code | Closed — VERIFIED (with limitations, §25) |
| F-04 | "Private" tasks leaked via family feed, Timeline, search, comment notifications | Closed — VERIFIED; a fifth leaking surface (Dashboard family feed) was found and closed |
| F-13 | Owner could demote themself, leaving a family with no owner | Closed — VERIFIED |

---

## 3. Gate A — architecture findings (no code changed during this gate)

Trace per finding: frontend request → route → validation → authorization → DB → side effects → response.

| | Vulnerable path | Assumption that failed | Invariant required | Tables |
|---|---|---|---|---|
| F-01 | UI never sends `familyId` (no family field in `BillFormModal`); API `POST /api/bills` stored `b.familyId` untouched; `POST /:id/pay` then wrote `activity_log` + `notifications` for `bill.family_id` | "The client only sends its own family" | family association requires membership at creation; family side effects require *current* membership | `bills`, `family_members`, `activity_log`, `notifications` |
| F-02 | ChatTab has no reaction UI (API-only). `POST /api/chat/:familyId/messages/:messageId/react` checked membership of the URL family, then inserted `messageId` from the URL | "The message id belongs to the family in the URL" | message → family → membership | `messages`, `message_reactions` |
| F-03 | `POST /family` (8 hex chars, 32 bits); `POST /family/join` unthrottled; `DELETE /:id/members/:mid` removed the row only; no rotation route; `seed-demo.js` `'DEMO'+4 digits` | "Codes are secret enough and stay secret" | strong random secret; bounded guessing; revocable; removal must not be undoable with the old secret | `families.invite_code`, `family_members` |
| F-04 | `tasks.js` create/complete/comment called `logActivity`/`notifyFamily` on `family_id` alone; `search.js` comment query filtered on `family_id` alone; Timeline, family feed **and Dashboard** read `activity_log` by `family_id` | "A task with `family_id` is a family task" (the schema allows `visibility='private'` *with* a family, e.g. assigned tasks, or a family task later edited to private) | private ⇒ visible only to owner and assignee; no shared surface may carry its content | `tasks(visibility, family_id, assigned_to)`, `task_comments`, `activity_log(link)`, `notifications` |
| F-13 | `PATCH /:id/members/:mid` allowed `member`/`admin` on any row of the family, including the owner's | "Only non-owner rows get edited" | exactly one owner row, equal to `families.owner_id` | `family_members(role)`, `families.owner_id` |

Existing model facts established from schema/code: visibility is `tasks.visibility ∈ {private, family}` (unvalidated on PATCH — F-10, deferred); visible-to set is owner ∪ assignee ∪ (family members if `visibility='family'`) in `taskWhereClause`; ownership is stored twice and changed atomically only by `transfer-ownership`; the frontend edit form sets `visibility` to private when its family selector is cleared but the server keeps `family_id`. Existing tests extended: `family.test.js`, `family-ownership.test.js`, `security.test.js` (unchanged and still passing); new coverage lives in the new file.

**Stop-condition review:** no ambiguity that blocked implementation. The invite-removal semantics and the immutability of a bill's family are product choices; both are the conservative option and are listed for review (§25). The data changes needed are non-destructive (§24).

---

## 4. F-01 — root cause and fix

Root cause: unvalidated client `familyId`. Fix (`src/routes/bills.js`):
- **Create:** `familyId` omitted/`null` → personal bill (unchanged). Otherwise it must be a positive integer (400) and the requester must be a member (403 — the *same* 403 for a family that does not exist, so ids cannot be probed).
- **Edit:** a bill's family is fixed at creation. `PATCH` may repeat the current value but cannot attach, move or clear it (400). This is the intended behaviour I determined: there is no UI for it and no product need.
- **Pay:** activity and notifications go to the family only if the payer is *still* a member. Covers bills stored by the old bug and members who left.
- **Leave / removal:** the person's bills lose their `family_id` (in the same transaction as the membership delete).

**VERIFIED:** A→Family A 201; A→Family B 403; B→Family A 403; nonexistent family 403 (was 500); string/negative id 400; unauthenticated 401; PATCH attach/move/clear 400; B cannot touch A's bill (404); same-family payment still feeds the family; a legacy row with a foreign `family_id` writes nothing when paid. Browser: 403/403/201/400 and Family Beta's feed stayed clean.

## 5. F-02 — root cause and fix

Root cause: URL `messageId` trusted. Fix (`src/routes/chat.js`): membership of the URL family first (403), then `SELECT … FROM messages WHERE id=? AND family_id=?`; unknown id, non-numeric id, and a message of another family are the **same 404**. Reaction text is trimmed and limited to 32 characters (400). **VERIFIED:** same-family (author and another member) 201; B via Beta URL 404; B via Alpha URL 403; unauthenticated 401; removed member 403; nonexistent/`abc`/33-char emoji 404/404/400; only the two legitimate reaction rows exist; the existing reaction display is unchanged.

---

## 6. F-03 — root cause and fix (summary; details in §7–§9)

Lifecycle after this phase: **create** (12-char random code) → **display** (unchanged UI) → **join** (throttled, generic failure) → **owner regenerates** (new endpoint + button) or **owner removes a registered member** (code replaced automatically) → old code invalid → future joins need the new code. Nothing rotates on page load or read (tested).

## 7. Invite-code entropy and lifecycle

- New codes: 12 characters from a 32-symbol alphabet without `0/O/1/I` = **60 bits** from `crypto.randomBytes` (no modulo bias), uniqueness checked against the table (`src/lib/inviteCode.js`, `newUniqueInviteCode`). Not derived from ids, dates or names. **VERIFIED:** 40 consecutive codes matched the format and were unique.
- Owner rotation: `POST /api/family/:id/invite-code/regenerate` — **owner only** (admin, member, outsider 403; anonymous 401); returns the new code; the activity entry says the code *changed* and never contains it. UI: Overview tab → "New invite code" (owner only) → confirmation dialog ("The current code will stop working right away…") → toast → refreshed code. Cancel keeps the code (**VERIFIED** in browser).
- Removal: deleting a *registered* member replaces the code (response `inviteCodeRotated: true`; toast "Member removed. The invite code was changed."). Removing a phone-invited placeholder does not (they never held the code). A member who leaves on their own does **not** trigger rotation — voluntary leavers may return with a code they still hold (documented, tested; the owner can rotate at will).
- Legacy codes (8 hex characters, created before this phase) stay valid until rotated; they are protected by the throttle (§8). Codes are visible to every member (unchanged); see §25.

## 8. Invite throttling

`POST /api/family/join` uses the existing in-memory limiter (`src/lib/authLimits.js`): failures are counted **per user (10 / 15 min)** and **per client IP (30 / 15 min)**, checked *before* the code is looked up. A **success never resets** the counter (an attacker cannot interleave a known-good code to earn attempts). When limited the response is `429` + `Retry-After` and refuses even a correct code. Unknown, mistyped, over-long (>64) and revoked codes give one identical `400 "Invalid invite code."`; the 429 text reveals nothing about any family.

**VERIFIED:** 10 wrong guesses then the correct code → 429 and no membership; another user unaffected; 9 failures + a valid join + 2 more failures → the 11th total is 429 (no refund); 30 failures spread over 3 accounts from one address block a 4th account. Browser: throttled join shows "Too many attempts…" and Xavier stays in no family.

**Deployment assumptions (unchanged from 8.3):** limiter state is in memory per process and resets on restart; behind a reverse proxy without Express `trust proxy`, `req.ip` is the proxy address, so the IP budget is shared by everyone behind it (the per-user budget still applies per account); multi-instance would multiply the budgets. Not changed here.

## 9. Demo-data security

`seedDemoForUser` now uses the same generator (no `DEMO`+digits). **VERIFIED:** a demo-created family code matches the strong format and is not `DEMO…`. The original outsider-guess probe now reports "not joined". Existing databases: at start-up, only codes matching `DEMO` + four digits are replaced with random ones (§24). *Not changed (out of scope, F-20):* seeding still adds demo chat/tasks to a user's real family.

---

## 10. F-04 — root cause and fix

Root cause: shared surfaces keyed on `family_id` alone. Fix — two layers:

1. **Write-time** (`src/routes/tasks.js`, via `sharedFamilyIdForTask`): activity rows for a task carry `family_id` only if `visibility === 'family'` (create, complete, next occurrence, comment); `notifyFamily` only in that case.
2. **Read-time** (`HIDE_NON_FAMILY_TASK_ACTIVITY` in `src/lib/family.js`, applied to the family activity endpoint, the Dashboard family feed and the family branch of Timeline): a row whose `link` is `#/tasks/<id>` is hidden unless that task is currently `visibility = 'family'` — **fail closed** (any other value hides it). This also covers rows the old code wrote, and tasks switched to private later, without deleting anything.
3. **Comments:** on a family-visible task nothing changes (family notified). On a private task, only its **owner and assignee** (minus the commenter) are notified. Search: comments are searchable only on tasks the user can open (own, assigned, or family-visible in their family) — the same rule as task search.

## 11. Private-task propagation audit

| Surface | Before | After | Evidence |
|---|---|---|---|
| Family activity feed | title, completion | hidden | VERIFIED (test + browser) |
| **Dashboard family feed** (new finding) | title | hidden | VERIFIED (test + browser) |
| Timeline (family branch) | title | hidden; author still sees own rows via the user branch | VERIFIED |
| Search — tasks | already hidden | unchanged | VERIFIED |
| Search — comments | comment text leaked | hidden | VERIFIED |
| Notifications — comments | title + body to every member | only owner/assignee | VERIFIED (probe2 scenario in test) |
| Notifications — create/complete | already gated by visibility | unchanged | code |
| Task detail / list / comments API | owner ∪ assignee ∪ family-if-shared | unchanged | VERIFIED (404 for others) |
| Assistant context | own tasks + `visibility='family'` in own families | unchanged, no leak | **code inspection only** (AI needs a key; the context object is not observable without one) |
| Weekly review / Dashboard tasks / bills | owner-scoped or visibility-checked | unchanged | code |
| Existing comments and task privacy state | — | not deleted, not changed | VERIFIED (2 comments intact, still private) |

Cases covered: family-visible tasks keep every behaviour (feed, timeline, dashboard, search, notifications — VERIFIED); a task edited to private later disappears from feeds while its rows remain in the database; legacy rows with `family_id` on private tasks are hidden; unexpected visibility values fail closed; a private task with no family and another user's tasks never surface.

---

## 12. F-13 — root cause and fix

Root cause: the role endpoint updated any row. Fix (`PATCH /api/family/:id/members/:memberId`): the target must belong to this family (404 — also closes reaching another family's row), and **a row whose role is `owner` cannot be changed by anyone**, including the owner (400, message points to "Make owner"). Ordinary role changes for non-owners still work. The explicit transfer (unchanged from 8.3) is the only way ownership moves; nothing is auto-selected or auto-promoted.

## 13. Ownership invariant

*A family always has exactly one owner row, and it equals `families.owner_id`.*
- "At most one" is also enforced by the database: `CREATE UNIQUE INDEX idx_family_one_owner ON family_members(family_id) WHERE role='owner'`. **VERIFIED:** a direct second-owner write is rejected.
- "At least one" cannot be expressed as a constraint; it is enforced in the routes: owner row immutable via role endpoint, owner cannot be removed (existing), owner cannot leave (existing), transfer atomic (existing, re-verified). A sole owner cannot self-demote, leave, transfer or delete the account (**VERIFIED**).
- Existing data: a family already ownerless because of the old bug gets the role back for its **recorded** owner (`families.owner_id`) if that user is still a member; nobody else is ever promoted (**VERIFIED**, including the case where the recorded owner is not a member).

## 14. Transaction / rollback evidence

- Transfer with a trigger that aborts the last step, under the new unique index: HTTP 500, `families.owner_id`, the old owner row and the target row all unchanged — exactly one owner (**VERIFIED**).
- Removal and leave now run membership delete + bill detach in one transaction (`db.tx`).
- Conflicting operations: 4 rounds of four simultaneous requests (transfer to B, transfer to C, self-demote, leave): exactly one transfer wins each time; final state is one owner equal to `families.owner_id` (**VERIFIED**). Note: SQLite access is synchronous in one process, so "concurrent" requests are serialized; true multi-process contention was **NOT** exercised (single-instance product).
- `PRAGMA foreign_key_check` after the full flow: empty.

---

## 15. Authorization matrix (new tests; all VERIFIED)

| Scenario | Result |
|---|---|
| Bill: A→Family A / A→Family B / B→Family A / anonymous | 201 / 403 / 403 / 401 |
| Bill PATCH attach/move/clear (own bill) / other user's bill | 400 / 404 |
| Reaction: A→A msg / A2→A msg / B→A msg via B URL / via A URL / anonymous / removed member / missing | 201 / 201 / 404 / 403 / 401 / 403 / 404 |
| Invite: valid / lowercase / invalid / stale (revoked) / 11th attempt / anonymous | join / join / 400 / 400 (identical body) / 429 / 401 |
| Rotate: owner / admin / outsider / anonymous | 200 / 403 / 403 / 401 |
| Removed member + revoked code | 400, no access |
| Private task: owner / assignee / unrelated member / other family | 200 / 200 / 404 / 404 |
| Private task on feed, Timeline, Dashboard feed, search, notifications (unrelated member, other family) | nothing |
| Owner self-demotion (`member`, `admin`) / member or outsider touching owner row / anonymous / other family's row | 400 / 403 / 401 / 404 |
| Valid transfer | 200, one owner |
| Forced failure | 500 + rollback |
| Sole owner: demote / leave / transfer / delete account | 400 each |

## 16. Backend tests

`test/hardening1-authorization-privacy.test.js` — **21 tests, all pass**; total suite **156/156** (baseline 135). Groups: F-01 ×4, F-02 ×1, F-03 ×6 (format/uniqueness/demo; join+generic failure; throttling; rotation; lifecycle; a **real process restart** against a planted legacy database), F-04 ×4, F-13 ×4, plus the owner→transfer→leave→delete regression. **Before/after:** the original audit probe script re-run on the fixed code flipped every demonstrated FINDING for these five items to OK (`hardening1-evidence/audit-probes-after-h1.txt`); the only remaining "FINDING" in that list for this scope is `SEC-INVITE-2`, which probes the old audit's guessed route `/invite-code` (404 by design; the real route is `/invite-code/regenerate`, tested).

## 17. Browser tests

`verify-hardening1.mjs`, Edge, three real users (+ Alice/Bob's two families): **31/31 pass** (`h1-browser.log`). The 19 requested steps, with outcomes: Alpha/Beta created through the UI (strong codes) · cross-family bill 403/403/201/400, Beta's feed clean · cross-family reaction 404/403/201/404 · one wrong join shows "Invalid invite code."; after 10 wrong guesses even the correct code → 429, UI shows "Too many attempts…", Xavier in no family · rotation dialog states the consequence, Cancel keeps the code, confirm shows a different 12-char code · old code refused with the same message · Yara joins with the new code, owner removes her, toast "Member removed. The invite code was changed." · Yara cannot return with the code she used · private task: created as family task (Mila sees it), edited through the UI to private, commented and completed by the owner → Mila's Activity tab, Timeline, Dashboard feed, search palette (both queries) and notifications show nothing (owner's search still finds it) · owner self-demotion 400, Members tab still shows exactly one owner · transfer through the UI, one owner matching `ownerId`, former owner gets 403 on the owner row and on rotation · former owner leaves and deletes the account; Family Alpha survives with Mila as sole owner. Console shows only the deliberate 4xx/429 responses; 0 page errors.

## 18. Regression tests (real browser, hardened code, identical server)

Tasks 24/24 · BillSense 62/62 · Family 26/26 · 8.3 family lifecycle 26/26 · 8.3 password recovery 34/34 · Phase 5 (Goals/EcoLife/Timeline) 82/82 · Phase 6 96/96 · Phase 7 (Assistant) 107/107 · Settings 42/42 + 92/92 · tabs 51/51. Plus the full backend suite 156/156. **Two script adjustments, not product regressions:** `verify-family.mjs` asserted the old 8-hex code format (updated to the new format) and the recovery script read a hard-coded server-log path (re-run pointing at the current log). Nothing was excluded.

## 19. Security evidence

- Authorization always follows *authenticated user + requested resource + actual membership/ownership*; no client family id is trusted alone; failures are uniform (403/404) and reveal no membership or existence (nonexistent family = same 403 for bills; foreign message = same 404 as unknown).
- **Logging:** no `console.*` call touches an invite code, task content or comment; the only new server log lines are counts at start-up. A full browser run left **zero** 12-character code matches in the server log (`grep`), the activity feed stores only "changed the invite code", and a test asserts neither the old nor the new code appears in any `activity_log` row.
- No secrets, no keys, no new frontend configuration; the web bundle was re-scanned (no `RESEND_API_KEY`/provider URL).
- The new endpoint returns the code only to the owner (403 otherwise).

## 20. Data / privacy evidence

Private tasks and their comments no longer propagate to any shared surface (§11). Nothing was deleted or altered in user content. Family membership removal now also detaches the person's bills from the family. Invite secrets are rotated, never logged. See §25 for what remains (notification history, member-visible codes).

## 21. Responsive regression

`verify-h1-responsive.mjs` at 320 / 375 / 414 / 768 / 1280 px with a 90-character family name: Overview tab has no horizontal overflow; "New invite code" (32 px high) and the code stay inside the viewport; the rotation dialog and the join dialog fit with both buttons reachable — **15/15**; keyboard: the button focuses, Enter opens the dialog with focus on **Cancel**, Escape returns focus to the button — **2/2**. Screenshots in `hardening1-evidence/screenshots/`. The Family tab strip itself remains keyboard-inoperable (F-24, deferred); Overview is the default tab, so the new button is reachable without it.

## 22. Build / lint

Lint clean. Production build OK — `public/app/main.js` **355.90 kB (81.08 kB gzip)** (was 354.90 / 80.89). Backend **156/156**. One process note: the final-audit's `audit-evidence/` scripts I had added to the project broke `npm run lint` (133 errors) after the audit's "lint clean" statement; both evidence folders are now excluded in `eslint.config.js`.

## 23. Dependency changes

None. `package.json`, `web/package.json` and lockfiles untouched (only Node built-ins `crypto` used).

## 24. Database / migration impact

- Schema DDL: one **partial unique index** `idx_family_one_owner` (`IF NOT EXISTS`); no table/column change.
- Start-up pass (`src/db/index.js`), idempotent and wrapped so it can never stop the app from starting: (1) replaces only invite codes matching `DEMO` + 4 digits; (2) restores `role='owner'` for the *recorded* owner of a family that currently has no owner row, if they are still a member; (3) creates the index (skipped with a logged message if existing data already had two owners).
- **Existing-data impact:** owners of demo-seeded families see a new invite code; anyone holding the old `DEMO####` code can no longer use it. Families repaired by (2) regain their owner. No rows deleted, no user content changed.
- **Rollback risk:** dropping the index restores prior behaviour; replaced codes cannot be recovered (by design, they were the weakness). Verified on a planted legacy database in a separate process, three start-ups (idempotent). **Not exercised:** a large production database (none available).
- Read-time privacy filtering needed no migration; historical activity rows are untouched.

## 25. Remaining known limitations

1. **Notifications already delivered while a task was family-visible remain** (including its title) after it becomes private; only future comments/activity are suppressed. Left alone as history the recipient legitimately received — needs a product decision if it should be retracted.
2. **F-10 (deferred, related):** an assignee can still change a task's `visibility`/fields through `PATCH`, including making an owner's private task family-visible.
3. Invite codes are visible to every member and never expire; a member can leak one until the owner (or a removal) rotates it. Legacy 8-hex codes remain valid until rotated (32 bits, throttled). A member who *leaves* can rejoin with a code they hold.
4. Throttle is per-process and in-memory; shared IP budget behind a proxy; resets on restart; not distributed.
5. Removal-triggered rotation also invalidates a code the owner may have just shared with someone else; the owner must share the new one.
6. A bill's family association cannot be changed after creation (there is no UI for it).
7. Two-process/concurrent-instance ownership races **NOT VERIFIED**; the unique index guards "two owners", the routes guard "zero owners", direct database edits can still create zero.
8. Assistant-context privacy is by code inspection, not exercised (needs an AI key).
9. Chrome/Edge only; no Firefox/Safari, no real devices.

## 26. Deferred findings (untouched, as instructed)

F-05 verification demo · F-06 security headers · F-07 signup/AI throttling · F-08 session details · F-09 phone lookup/forced add · F-10 task edit rights and PATCH validation · F-11 leaver task access · F-12 parser message · F-14 validation · F-15…F-17 · F-18 chat cap · F-19 inert settings · F-20 demo data behaviour · F-21 session-expiry UX · F-22…F-25 (including the Level-A accessibility failures) · F-26…F-38. Not implemented and not started: Delete Family, admin roles/UI, reminders, notification preferences, AI budget, signup throttling, chat pagination, backups, distributed limiter, timezone system.

## 27. Evidence classification

| Claim | Class |
|---|---|
| F-01 cross-family bill injection closed | VERIFIED |
| F-02 cross-family reactions closed | VERIFIED |
| F-03 throttle, rotation, removal-revocation, strong codes, demo code | VERIFIED |
| F-03 legacy 8-hex codes safe against guessing | IMPLEMENTED (relies on throttle; not attacked) |
| F-04 all listed surfaces + Dashboard | VERIFIED |
| F-04 Assistant context | IMPLEMENTED (inspection) |
| F-13 owner integrity, one-owner index, repair of legacy ownerless data | VERIFIED |
| Rollback under forced failure | VERIFIED |
| Concurrency across processes | NOT VERIFIED |
| Regression: 156 backend, 11 browser suites, 31 + 17 new browser checks | VERIFIED |
| Real email, live AI, other browsers | NOT VERIFIED / out of scope |
| Everything in §26 | DEFERRED |

---

## 28. Final verdict

PHASE HARDENING 1 VERDICT: PASS WITH LIMITATIONS

F-01: PASS
F-02: PASS
F-03: PASS WITH LIMITATIONS (per-process throttle; members can see/share the code; legacy 8-hex codes valid until rotated)
F-04: PASS WITH LIMITATIONS (notification history remains; F-10 assignee edit rights deferred)
F-13: PASS

AUTHORIZATION: PASS

PRIVACY: LIMITATIONS

FAMILY INTEGRITY: PASS

REGRESSION: PASS

NEXT RECOMMENDATION: HARDENING 2
