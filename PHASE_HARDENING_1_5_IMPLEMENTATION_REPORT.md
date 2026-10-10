# Hardening 1.5 — Implementation Report
### Residual privacy, family membership & task authorization

Evidence labels: **VERIFIED** (observed in this phase) · **IMPLEMENTED** (in code, not separately exercised) · **NOT VERIFIED** · **DEFERRED**. Finding classes: REAL BUG · SECURITY GAP · PRIVACY GAP · PRODUCT DECISION · TEST-SCRIPT ERROR · ENVIRONMENT LIMITATION · DEFERRED FINDING.

Evidence files: [audit-evidence/h15-impl/](audit-evidence/h15-impl/) (browser run, mutation check, before/after probes), new tests [test/task-access-predicate.test.js](test/task-access-predicate.test.js) and [test/hardening15-authorization.test.js](test/hardening15-authorization.test.js).

---

## 1. Approved scope (as implemented)

Former-member task access · private-task privacy on edit · one canonical task-access predicate · owner-only visibility/assignee · read-time filtering of task-linked notifications · legacy 8-character invite-code migration · owner-only invite code · leave vs remove semantics · a narrow family-owner capability for orphaned tasks. Not touched: AI/Zod, chat/bill notification attribution, throttling infrastructure, headers, accessibility, chat pagination, reminders, Delete Family, new roles, dependencies.

## 2. Research findings that led to implementation

From Gate A: (1) a removed member kept read **and write** access to family tasks (`P1`), (2) the edit form silently re-shared private tasks (`U1`), (3) the visibility rule was duplicated in four places, (4) notification snapshots survived loss of access, (5) any viewer could change visibility/assignee, (6) invite code visible to every member, (7) legacy 8-hex codes. All are addressed below.

## 3. Changes made

| Area | Change |
|---|---|
| **Canonical rule** | new `src/lib/taskAccess.js` (`canAccessTask`, `taskAccessSql`, orphan helpers); new `src/lib/linkedTaskFilter.js` (read-time policy for history rows) |
| Tasks | `tasks.js`: list/detail/patch/postpone/comments/delete use the rule; owner-only `visibility`/`assignedTo` judged by *change*; visibility enum; family fixed once set; orphan delete for the family owner; comment notifications only to recipients who can currently open the task |
| Other read paths | `dashboard.js`, `search.js` (tasks + comments), `timeline.js`, family feed (`family.js`), `notifications.js` (rows **and** unread count), settings export, assistant context (`ai.js`) |
| Invite code | `family.js`: `mapFamily(f, members, viewerId)` returns `inviteCode` **only** to the family owner; used by list, single, create, join and transfer responses; export strips it for non-owners |
| Migration | `db/index.js`: every `length(invite_code) = 8` is replaced once, in one transaction |
| UI | `TaskFormFields/TaskFormModal`: family select preselected only when the task is actually family-visible, sends visibility only if the owner changed it, hidden for non-owners; `OverviewTab`: members see an explanation instead of the code |

## 4. Authorization model

`canAccessTask(user, task)` — **current** authorization:
- **Family-scoped** task (`visibility='family'` and `family_id` set): accessible to every *current member* of that family and to nobody else. Owning or being assigned is not enough.
- **Anything else** (private, unknown visibility values, family-without-family — fail closed): the **owner** always; the **assignee** only while still a member of the task's family (or if it has no family).
- The SQL form is NULL-safe: wrapped in `COALESCE(…,0)`, so NULL assignee/family can never make `NOT access` NULL. Guarded by a written contract test, a JS/SQL equivalence test, a complement test (`accessible + not-accessible = total`) and a 300-task randomised differential against an independent reference implementation (300 random tasks × 5 users = 1,500 checks, each in both JS and SQL form, all agree).
- **Mutations:** content edits, completion, comments, postpone → anyone who can currently access; **visibility and assignee → task owner only**, compared against stored values, so an unchanged value in the payload is accepted; deletion → task owner, plus the family owner **only** for an orphaned family task.
- **Backend authoritative:** every route loads the task and asks the rule; a task the requester may not access and a task that does not exist give the same 404.

## 5. Privacy model

Private tasks (and anything unexpected) are visible to owner and (member-)assignee only. History rows (notifications, activity) that link to a task are **hidden at read time** when the reader cannot currently access it; **never deleted**, they reappear if access returns. Family feed/Dashboard feed additionally keep the Hardening 1 surface rule (private-task rows never appear on shared surfaces). Timeline/feed filtering applies the reader's own access even to the reader's own past activity (a former member no longer sees titles of family tasks they used to share).

## 6. Invite-code lifecycle

Owner creates/rotates (owner-only, unchanged). **Only the owner receives the code** (list, single, create, join response, transfer response, export; an admin — see §21 — and members do not). Voluntary leave: no rotation; rejoin with a valid current code. Owner removal: rotation (unchanged from Hardening 1). Legacy 8-character codes: replaced once at start-up. Throttling unchanged (10/user, 30/IP per 15 min; in-memory).

## 7. Task visibility behaviour

Owner edits of any ordinary field never change visibility (the fixed form sends nothing about visibility unless the owner changed the Family select; the server also accepts an echoed unchanged value). Owner may intentionally share/unshare (sharing needs a family the owner currently belongs to; a personal task can be shared with `visibility:'family'` + `familyId`; a task can never be moved to a different family — 400). Assignee/member/former member/other-family/anonymous changing visibility or assignee: 403/404/404/401, nothing changes in the database.

## 8. Former-member behaviour

Immediately on leave or removal (VERIFIED for both): task list/detail, comments thread, search (titles, descriptions, comments), Dashboard, Timeline, notifications (rows and unread count), export, assistant context, and every mutation (update, complete, comment, assign, visibility, postpone, delete) are closed — by direct id as well. No new family activity or notification can be generated from them. The person keeps their own private tasks. Rejoining restores access. What they shared stays with the family (visible/editable by current members); the family owner may delete an orphaned task.

## 9. Historical notification behaviour

Task-linked notifications are shown only while the recipient can access the task; count consistent; nothing deleted (DB rows counted before/after); rows reappear when the task is shared again or the person rejoins. Non-task rows (chat, bills, family) untouched — **chat/bill attribution is DEFERRED as instructed**. Rows for a task that no longer exists, or a malformed task link, are kept safely.

## 10. Database / migration changes

**No schema change.** One start-up data update: `families.invite_code` where `length = 8` → new 12-character code, single transaction, uniqueness checked, idempotent (the new format never matches), never touches 12-character codes, members, ownership, tasks or content, logs only the count. **VERIFIED** with a real process restart: hex and `DEMO####` codes replaced; a 12-character code unchanged; families/members/ownership/tasks/messages snapshot identical before vs after; old codes → 400, new code joins; two further restarts change nothing; no duplicate codes. Rollback: old codes are unrecoverable by design (that is the point).

## 11. Backend tests

Suite **175/175** (was 156). New: `task-access-predicate.test.js` — 9 tests (contract matrix for A owner / B member / C former / D other family / E none across 13 task shapes incl. NULL cases; JS≡SQL; NULL-safety complement; unsafe-input rejection; access changes with membership and visibility in both directions; orphan capability; linked-row filter; randomised differential). `hardening15-authorization.test.js` — 10 tests: the former-member matrix run **twice** (voluntary leave and owner removal), F-10, private-stays-private, notifications, owner-only invite code, leave/remove/rejoin credentials, assistant context (provider stubbed), legacy migration. The Hardening 1 suite is intact; one assertion there was **changed on purpose** (see §21, TEST-SIDE/SCOPE note).

**Mutation check (`mutation-results.txt`) — the tests catch the original defects.** Re-introducing each defect made the relevant tests fail: NULL-unsafe predicate (M1), owner/assignee access without membership (M2), visibility change by any viewer (M3), assignee change by any viewer (M4), unfiltered notifications (M5), code returned to members (M6), legacy codes not rotated (M7), presence-based visibility check that breaks ordinary member edits (M8), orphan delete open to any member (M9): **9 of 9 caught**, files restored after each.

## 12. Browser tests

`verify-h15.mjs` (Edge, users Olga owner / Mark member / Lena assigned member who leaves / Dana other family, plus Zed, Rita): **30/30**. Requested journeys 1–14 all executed through the UI: owner creates a family-visible task → member sees it → owner makes it private through the edit form → member loses list access, direct access 404 with no data, remembered task link shows nothing, Dashboard/Timeline/search (task and comment)/notification panel empty → the owner's edit form opens on "Private (only me)" and an edit of title+description leaves it **private** (this was the bug) → owner intentionally shares again, Mark reads it again, old notifications reappear → an ordinary member edits content through the UI (no Family select offered, visibility unchanged) → Lena leaves through the UI and every direct read/update/complete/comment/assign/visibility/delete on the task id returns 404 with the database unchanged; her Tasks, Dashboard, Timeline, Search and notification panel show nothing → owner and Mark keep access, Dana none → the invite code is shown only to the owner (member sees the explanation; the member's API responses never contain it) → after rotation the old code is refused in the Join dialog → owner removes Mark: toast says the code changed, he loses the task at once and cannot use the code he had.

Two test-script corrections (TEST-SCRIPT ERRORs, not product): the notification panel was read before the polled list refreshed (added a reload); the search result page echoes the query text "No results for "SURPRISE"", which my leak-regex matched (removed that surface from the regex; the "No results" check remains).

## 13. Multi-user / multi-family security probes

Gate A probe script re-run on the implemented code: **P1-1…P1-6 now OK** (former member: read 404, no thread, empty list/dashboard/search, comment 404 and no family notification, edit/complete 404, title unchanged), **P3-1…P3-3 OK** (assignee/member visibility & assignee changes 403, nothing changed), **P4-1 OK**, **P7 OK**, **P8-2 OK**. Hardening 1 probe script also re-run: cross-family bill/reaction, invite throttle, ownership and private-task probes all still OK. Rows that still report something are explained in §19.

## 14. Regression

Real-browser suites on the implemented code: Tasks 24/24 · BillSense 62/62 · Family 26/26 · 8.3 family lifecycle 26/26 · recovery 34/34 · Phase 5 (Goals/EcoLife/Timeline) 82/82 · Phase 6 96/96 · Phase 7 (Assistant) 107/107 · Settings 42/42 + 92/92 · tabs 51/51 · **Hardening 1 browser 31/31** · **Hardening 1 responsive/keyboard 17/17**. No script was weakened; the recovery script's log path was re-pointed as in earlier phases.

## 15. Lint — clean. 16. Build — OK, `public/app/main.js` **356.42 kB (81.25 kB gzip)** (Hardening 1: 355.90 / 81.08). Responsive/keyboard for changed UI: owner edit form with Family select, member edit form without it, and the member's invite-code note all fit at **320 / 375 / 414 / 1280 px** with no horizontal overflow (browser run, four assertions).

## 17. Dependency changes — none (`package.json`, `web/package.json`, lockfiles untouched; no secrets in `public/` or `web/src`).

## 18. Files changed

`src/lib/taskAccess.js` (new) · `src/lib/linkedTaskFilter.js` (new) · `src/routes/tasks.js` · `src/routes/dashboard.js` · `src/routes/search.js` · `src/routes/timeline.js` · `src/routes/notifications.js` · `src/routes/family.js` · `src/routes/settings.js` · `src/routes/ai.js` · `src/db/index.js` · `web/src/components/tasks/TaskFormFields.jsx` · `web/src/components/tasks/TaskFormModal.jsx` · `web/src/components/family/OverviewTab.jsx` · `public/app/main.js` (build output) · `README.md` · tests: `test/task-access-predicate.test.js` (new), `test/hardening15-authorization.test.js` (new), `test/hardening1-authorization-privacy.test.js` (one test updated).

---

## 19. Every original limitation — status

| # | Limitation | Status | Before → after (exploit / observed) |
|---|---|---|---|
| 1 | Legacy 8-character invite codes valid until rotated | **CLOSED** | any 8-char code guessable in 32 bits → replaced once at start-up; old codes 400, new join; restart no-op (VERIFIED, real process restart) |
| 2 | Every member could see/share the invite code | **CLOSED** (owner-only; see §21 on admin) | member list/single/export/join responses carried it (P2-1) → absent everywhere for non-owners; UI note; member cannot rotate (VERIFIED, test + browser) |
| 3 | A member who leaves can rejoin with a code they hold | **MITIGATED — unchanged by approved design** | leaver rejoins with the current code (P8-1, still true and intended); they no longer keep any resource access while out, and removal rotates the code |
| 4 | Historical notifications exposed titles after a task became private / access lost | **CLOSED** for task-linked rows (VERIFIED). Chat/bill previews for former members: **DEFERRED** (approved) | `P4-1`/`P1-8` showed snapshot text → rows hidden and uncounted; owner/assignee keep theirs; reversible; nothing deleted |
| 5 | F-10: assignee/member could change visibility/assignee | **CLOSED** | `P3-1…3`: 200 and data exposed/hidden → 403 and database unchanged (VERIFIED); echoed unchanged values still 200 |
| 6 | Join throttling in-memory / per-process | **STILL OPEN — ENVIRONMENT LIMITATION** | unchanged; documented; not distributed |
| 7 | Assistant-context privacy by inspection only | **CLOSED** for context building (provider stubbed, VERIFIED: private/other users'/former-member tasks absent). The provider call itself remains blocked by the deferred **AI INTEGRATION DEFECT** | P7-1…5 and the new test |
| 8 | Evidence scripts broke lint | **CLOSED** (Hardening 1) | lint clean now |
| + | Former member kept read/write (Gate A H15-1) | **CLOSED** | see §8 |
| + | UI re-shared private tasks on any edit (H15-2) | **CLOSED** | owner edit of title+description left visibility `private` (browser 5a/5b) |
| + | Rule duplicated in four places (H15-3) | **CLOSED** | single module; mutation M2 shows the tests notice drift |
| + | Departed owner's family tasks undeletable (H15-13) | **MITIGATED** | family owner may delete the orphaned task; nothing else is granted (§21) |

Per-finding evidence quality: exploit path before (Gate A probes/browser), expected after, observed after, and the test that proves it are listed in §8–§13 and `h15-probes-after.txt`; classes: H15-1/H15-2 REAL BUG, F-10 SECURITY GAP, notification snapshots PRIVACY GAP, invite visibility PRODUCT DECISION, legacy codes SECURITY GAP (theoretical, quantified).

## 20. Remaining limitations

1. Chat and bill notification previews (no family reference stored) remain visible to a former member — DEFERRED per approval.
2. A family-visible task whose owner left can be edited/completed/commented by current members and **deleted only by the family owner**; nobody can change its visibility or assignee (the owner is gone). Deliberately not widened.
3. A task's family can never be changed after creation (400); only visibility within that family.
4. Aggregate counts in the assistant/weekly-review context (`openCounts`, weekly numbers) still count tasks a person owns in a family they left — numbers only, no titles.
5. The notification panel and Family feed poll (20 s / 6 s), so a client can display a hidden row until its next poll; the server stops returning it immediately.
6. Join throttle: in-memory, per process, shared per-IP budget behind a proxy (unchanged).
7. Members who *already saw* a code before this change could have kept a copy; the owner can rotate at any time (legacy codes are already replaced).
8. Multi-process races and other browsers **NOT VERIFIED**; the live AI provider path cannot run (§21).

## 21. Deferred findings, deviations and decisions to note

- **AI INTEGRATION DEFECT — DEFERRED (not touched):** the SDK's `betaZodOutputFormat` needs zod 4; the project pins zod 3; the call fails before any provider request. Untouched, no dependency change.
- **Admin role — reported as instructed:** an `admin` role **does exist** in the repository with established semantics: an admin may add and remove family members (`requireRole(['owner','admin'])`), cannot rotate the code, transfer ownership or change roles, and can currently be assigned only through the API (the UI has no control for it). The approved rule says the invite code is an *owner*-controlled credential, so I implemented **owner-only** visibility, the more restrictive reading; admins receive no code (tested). If admins should see it, it is a one-condition change in `mapFamily`/export and one line in the UI — I did not invent that, and I did not change any admin semantics.
- **Deviation A (necessary consequence of the approved rule):** the Hardening 1 legacy-code test had asserted that an 8-character non-DEMO code is *left alone*; the approved migration rotates all 8-character codes, so that test was **updated** (and its 12-character fixtures kept untouched). Not a weakening of application behaviour.
- **Deviation B (extension in the same spirit):** a task can no longer be moved to a different family and visibility must be one of `private|family` — mirrors the bill rule from Hardening 1 and removes the last path by which an edit could attach a task to a family it did not belong to.
- **Deviation C (other existing read paths, per "any other existing… read path"):** settings export and assistant context now use the rule; the Timeline hides even the *reader's own* past rows about family tasks they can no longer access.
- Deferred and untouched: chat/bill notification family attribution, F-05…F-09 (other than what is listed), F-11 is now subsumed by this work, AI phase, accessibility (F-24/F-25), session-expiry UX, security headers, signup/AI throttling, chat pagination, reminders, Delete Family, distributed limiter.
- **Probe-label note (TEST-SCRIPT precision, not product):** in `h15-probes-after.txt` line `P1-5` reports "feed shows: true" because that probe checks for *any* "commented" row from the earlier legitimate comment by another member; the former member's own comment returned 404 and produced no row (also asserted by row counts in the backend test).

## 22. Final verdict

**PHASE HARDENING 1.5 VERDICT: PASS WITH LIMITATIONS**

- Former-member access: **CLOSED** — VERIFIED for voluntary leave and owner removal, by direct-API and UI, on data not status codes.
- Private-task privacy on edit: **CLOSED** — REAL BUG fixed in form and server; VERIFIED in a real browser.
- Canonical predicate: **IMPLEMENTED and VERIFIED** (contract, NULL, differential, mutation-checked).
- Owner-only visibility/assignee: **CLOSED**.
- Task-linked notification privacy: **CLOSED**; chat/bill previews **DEFERRED**.
- Invite code: owner-only and legacy migration **CLOSED**; throttle per-process **STILL OPEN (environment)**.
- Regression: 175/175 backend; 11 browser suites + Hardening 1 (31/31, 17/17) all pass; lint clean; build OK; no dependency change.

Limitations preventing a plain PASS are the deferred chat/bill preview attribution, the per-process throttle, the orphaned-task ambiguity (delete-only), and the untestable live AI/multi-process/other-browser paths.

Stopping here as instructed: no Hardening 2, no Phase 9, no AI phase, no broad audit.
