# Phase Hardening 1.5 — Research & Proposal (Gate A)

**Status: research and proposal only. No application code was modified** (verified: no file under `src/`, `public/`, `web/src/` or `server.js` is newer than the Hardening 1 report; lint still clean). Everything produced is evidence: probe scripts, a prototype and outputs in [audit-evidence/h15/](audit-evidence/h15/). All probes ran on disposable databases against the unmodified code.

Labels: **REAL BUG** · **SECURITY GAP** · **PRIVACY GAP** · **PRODUCT DECISION** · **THEORETICAL RISK** · **FALSE POSITIVE** · **ENVIRONMENT LIMITATION** · **DEFERRED DEBT** · **VERIFIED** (observed) · **IMPLEMENTED** (in code, not exercised).

---

## 1. Executive summary

The five residual items from Hardening 1 are not equally important, and the most serious residual privacy problem is **not** one of the five. Investigating them from the actual runtime turned up four things the plan did not anticipate:

1. **CHALLENGE TO CURRENT PLAN #1 — a removed or departed member keeps full access to family tasks.** Invite rotation on removal (Hardening 1) stops them *rejoining*, but every task they owned or were assigned in that family remains readable, searchable, on their dashboard, **editable, completable and commentable** — and their comments notify the remaining family. Probed: after the owner removed a member, they read the whole comment thread of an assigned family task, renamed and completed it, posted a comment that produced family notifications and a feed entry, and still see the family's tasks on their Dashboard and in Search (P1-1…P1-8). This is the actual content of "leave/remove semantics", and it makes invite policy cosmetic until fixed.
2. **CHALLENGE TO CURRENT PLAN #2 — the UI silently re-shares private tasks (REAL BUG, reopens F-04).** The task edit form preselects the task's family and derives `visibility` from that select. Editing *only the description* of a private task that carries a `family_id` **as its owner** flipped it to `family` and made it readable by another member (browser probe U1). The same state is what the UI itself creates when a user clears the family select on a shared task. So Hardening 1's privacy fix is bypassable by an ordinary edit.
3. **CHALLENGE TO CURRENT PLAN #3 — the rule "who can see a task" is copied into four places** (`tasks.js` list, `tasks.js` single-load, `dashboard.js`, `search.js`). Every leak found so far (F-04, F-11, P1) is a drift between those copies. The minimal correct fix is one shared predicate, not more per-route patches. I prototyped it: over randomised worlds it differs from today's rule **only** for former members (0 unexplained differences in 6 runs, 15–65 tasks each).
4. **CHALLENGE TO CURRENT PLAN #4 — the AI feature cannot work with a real API key (REAL BUG, out of scope, found incidentally).** The installed SDK's `betaZodOutputFormat` calls `z.toJSONSchema` on the root `zod` export, which exists only in zod 4; the project pins zod 3.25. The call throws *before any HTTP request* (verified against a local mock and by calling the SDK directly), and `callStructured` reports it as a generic "AI request failed". Every AI endpoint would fail with a valid key. Not fixed here; see §9.

Recommended contract (details §5–§6): the invite code is an **owner-controlled invitation** (visible to owner/admin only), legacy 8-character codes are **rotated once at start-up**, voluntary leave stays **owner-controlled** (no auto-rotation), family-scoped task access **requires current membership** through one shared predicate, historical notifications are **hidden by the same predicate at read time** (nothing deleted, reversible), and `visibility`/`assignedTo` become **owner-only to change** (comparing values, because the UI sends `visibility` on every edit) with a one-line form fix. No schema change, no new table, no dependency.

---

## 2. Investigation method and evidence

Traced UI → state → API → route → authorization → DB → side effects → read surfaces from the code, then executed: 35 backend probe lines (`h15-probes.cjs`, output `h15-probes.out.txt`), a browser probe of the real edit form (`h15-ui-probe.mjs`), a differential prototype of the proposed rule (`h15-prototype.cjs`), and a direct SDK call (`sdkdbg.cjs`). The assistant-context check used a harness stub of the provider-facing function only; the route still built its context exactly as in production.

Facts established from code (not inferred):
- **Invite code exposure:** returned by `mapFamily` in `GET /api/family`, `GET /api/family/:id`, `POST /api/family`, and the `POST /api/family/join` response — to *every* member; also inside `GET /api/settings/export` (`families f.*`). UI: shown on the Overview tab to everyone; the regenerate button is owner-only. Not in logs, activity, page source or any browser storage (grep of live code: `localStorage` is used only for the theme).
- **Who can invite today:** `POST /:id/members` (add by phone) and remove require owner/admin; **the code lets any member invite anyone** (P2-2/P2-3: a plain member's handed-over code admitted a stranger, HTTP 201).
- **Only `/join` consumes codes** (grep of `invite_code`): there is no second endpoint to bypass the throttle.
- **Task model:** `tasks.visibility ∈ {private, family}` (unvalidated on PATCH), `family_id` and `assigned_to` nullable; `private` + `family_id` exists for tasks assigned inside a family (API-only: the UI has **no assignee field**) and is *produced by the UI* whenever a family select is cleared on edit. Visibility rule is duplicated in 4 places (§1 item 3). The UI shows **Edit and Delete to every viewer** of a task (browser probe U2); the server makes delete owner-only, edit open.
- **Notifications** store only `(user_id, type, title, body, link, read_at, created_at)` — title/body are text snapshots and the only reference to a task is the string in `link` (`#/tasks/<id>`); no `task_id`/`family_id` column.
- **Throttle trust:** the limiter keys on `req.ip`; `X-Forwarded-For` is ignored (no `trust proxy`): 4 accounts × 10 failures, each request carrying a different spoofed header, were still stopped by the per-IP budget (P5-1).

---

## 3. Findings

| ID | Finding | Class | Evidence |
|---|---|---|---|
| H15-1 | Former member keeps read + write access to family tasks they own/are assigned (thread comments, edit, complete, comment→notifies family, search, dashboard, task list) | **REAL BUG / PRIVACY + SECURITY GAP** | P1-1…P1-7, P8-2 |
| H15-2 | Ordinary edit in the UI re-shares a private task that has a `family_id` | **REAL BUG / PRIVACY GAP** | U1 (browser) |
| H15-3 | Any viewer can change `visibility` of anyone's task (assignee: private→family exposes it; ordinary member: family→private hides the owner's task from everyone else *and from themself*); assignee can re-assign a private task to another member; `visibility` accepts any string | **SECURITY GAP** (F-10) | P3-1…P3-3, P3-6, U2 |
| H15-4 | Notification snapshots (title/body) about tasks the recipient can no longer open remain readable | **PRIVACY GAP** | P4-1, P1-8 |
| H15-5 | Chat-preview (and bill) notifications remain after removal; no family attribution stored | **PRIVACY GAP (lower)** / needs decision | P4-4 |
| H15-6 | Every member can read and forward the invite code; codes are also in the export file | **PRODUCT DECISION** (contract inconsistency) | P2-1…P2-3 |
| H15-7 | Legacy 8-hex codes (32 bits) remain valid until rotated | **THEORETICAL RISK** (quantified) | P6 |
| H15-8 | A voluntary leaver can rejoin with a code they hold | **PRODUCT DECISION** | P8-1 |
| H15-9 | Join throttle is per-process/in-memory | **ENVIRONMENT LIMITATION** | code, P5-1 |
| H15-10 | Assistant-context privacy unverified | **Now VERIFIED** (see §4-G) | P7 |
| H15-11 | Audit-evidence scripts broke lint | **TEST-SCRIPT ERROR — resolved** in Hardening 1 (evidence folders excluded) | lint clean now |
| H15-12 | AI features cannot run with a real key (zod 3 vs SDK helper needing zod 4) | **REAL BUG (out of scope)** | `sdkdbg.cjs`: `TypeError z.toJSONSchema is not a function`, no request sent |
| H15-13 | Departed owners' family tasks cannot be deleted by anyone else (delete is owner-only) | **DEFERRED DEBT / PRODUCT DECISION** | code (`DELETE /tasks/:id`) |

---

## 4. Assumptions challenged

### A. "Legacy 8-character invite codes should automatically be rotated"

Numbers first (P6): 2^32 = 4.29·10^9 values; the per-IP budget allows 2,880 failed guesses/day; with F live legacy families one guess hits *something* with probability F/2^32. F=100 → 0.0067 % per IP per day (~10,300 IPs for a coin-flip/day); F=10,000 → 0.67 % per IP per day (~104 IPs). A hit yields access to exactly one family. So this is a **theoretical risk that scales with the number of families**, negligible for a household deployment, not negligible for a hosted service. `X-Forwarded-For` spoofing does not help the attacker (P5-1); new accounts do not help within one IP (per-IP budget) but signup is unthrottled (F-07, deferred), so distributed attackers are limited only by IP count.

| Option | Security | UX | Migration risk | DB impact | Failure modes |
|---|---|---|---|---|---|
| **1. Rotate once at start-up** (any code not in the new 12-char format) | Removes the 32-bit class entirely | Pending, never-used invitations stop working once; existing members unaffected; owners see the new code | Low: one idempotent `UPDATE` selecting on format, no marker needed, same pattern as the DEMO repair already shipped | None (no schema change) | A restart never re-rotates (new codes match the format); outstanding invites break once (mitigated by logging the count) |
| 2. Invalidate, require owner to generate | Same | Worse: family has *no* code until the owner acts | **Needs `invite_code` to be nullable** — SQLite cannot relax `NOT NULL` in place, so a table rebuild of `families` | Table rebuild (risky) | Owner never acts → nobody can be invited; extra UI state |
| 3. Rotate on interaction | Leaves old codes valid for idle families | Unpredictable | Adds hooks in several routes | None | Codes for families nobody opens never rotate — the ones least likely to be watched |
| 4. Leave as is, document | Residual 32-bit class, throttled | None | None | None | See numbers above |

**Recommendation: Option 1**, with Option 4 as the acceptable fallback if you want zero start-up data changes (the risk is quantified above). Option 2's schema rebuild is exactly the "cleaner but not necessary" change to avoid. One Hardening-1 test (`legacy code left alone`) must flip.

### B. "Every family member seeing the invite code is acceptable"

What the code *is* in this product: **an invitation mechanism**, not a shared credential — it is consumed only by `/join`, it is regenerated only by the owner, and removal rotates it. The permission model already says who may invite: add-by-phone is owner/admin only. Showing the code to every member quietly grants every member that power (P2-2/P2-3), which contradicts the model. A member forwarding a code externally is therefore a **product-policy inconsistency, not a technical vulnerability**, and it is **partially avoidable** without a new roles system: expose the code to the same roles that may add members. It cannot be made impossible — a member can always tell someone the code verbally or add them via the owner — and the owner can rotate.

Options: (i) keep as is and document "members may invite"; (ii) **show/return the code only to owner/admin** (recommended); (iii) per-member invite tokens (new table; rejected — a generic permission/credential system the repository gives no evidence for). Evidence for (ii): role check helper already exists (`requireRole`); admin cannot be assigned from the UI, so in practice the owner. Cost: `mapFamily` becomes role-aware (list, single, create, join response), the export drops the field for non-privileged members, and the Overview card shows a short "ask the family owner for an invite code" note to members. Trade-off: members lose the ability to invite by code (they never had it by phone).

### C. "A member who leaves should lose the ability to rejoin with a code they hold"

| Model | Verdict |
|---|---|
| A. leave only revokes membership | Simple; leaver can return |
| B. leave revokes *that user's* use of the current code | Needs per-user credential tracking → new table |
| C. leave rotates the code | Every departure invalidates pending invitations; nobody wants "a member left → all outstanding invites die" |
| **D. owner-controlled rotation only (current for leave)** | Accidental leave is recoverable; owner keeps control; owner already sees "X left the family" in the feed and can rotate |
| E. ban list | New table; scope creep |

**Recommendation: keep D for voluntary leave; removal by the owner keeps rotating (already implemented).** The distinction is coherent: *leaving* is the member's decision; *removal* is the owner's, and the owner's intent is "they must not come back". A voluntary leaver holds no more than any member did. What actually matters after leaving is what they can still *reach* (H15-1), which invite policy does not address. Accidental leave being reversible is also a property of the read-time membership predicate proposed in §6-C: rejoining restores access to their own content automatically.

### D. "Historical notifications should be deleted"

Not needed and worse than the alternative. The architecture supports a **read-time rule**: the task id is recoverable from `link` for every historical row, so `GET /api/notifications` (and its unread count) can hide any row whose task the recipient cannot currently access. Verified by prototype: 0 wrongly hidden / 0 wrongly kept after correcting one bug class (SQL three-valued logic — the predicate must be wrapped in `COALESCE(...,0)` because a NULL `assigned_to` makes `NOT (…)` evaluate to NULL and *keeps* the row; 34–44 wrongly kept rows before the fix, 0 after), 0.2–0.5 ms per call. Properties: **nothing deleted** (auditability kept), **reversible** (rejoin or make the task family-visible again and the rows reappear), **retroactive** (covers rows written by every past version), no migration. Redaction was considered and rejected: it leaves "something you can't see" noise and still needs the same predicate. Rows for tasks that no longer exist are kept (the recipient was entitled to them).

Limit: only task-linked rows can be attributed. Chat-preview rows (`link '#/family/chat'`) and bill rows carry no family reference, so a former member's stale chat previews cannot be filtered without a new `family_id` column that could only be populated for future rows (H15-5). Recommended: **defer** and decide separately (§10 Q5).

### E. "Only task owners should be able to change visibility"

Inspecting the model: `visibility` (and `assignedTo`, which grants access) are **owner privacy properties**, because they decide who else sees the owner's content; everything else on a task (title, description, status, priority, due date, notes, comments) is **collaboration**, and the product deliberately lets any viewer edit it (Edit is shown to every viewer; only delete is owner-only). Two implementation traps found in the actual UI, which a naive "reject if the field is present" rule would hit:
- The edit form sends `visibility` on **every** save (derived from the family select). A presence check would make ordinary member edits fail with 403. The rule must **compare against the stored value** (the same approach used for bills in Hardening 1).
- The form preselects `existing.familyId` regardless of visibility, which is the re-share bug (H15-2). The form must preselect the family only when the task is actually `family`, and send `visibility` only when the owner changed it.

Server rule: `visibility` must be one of `private`/`family` (400 otherwise); a change of `visibility` or `assignedTo` by anyone other than the owner is 403; unchanged values are accepted. UI: for non-owners the family select is hidden (or disabled) and no `visibility` is sent. No roles framework.

---

## 5. Product contract (for review)

**Invite code**
- An invite code is the family's **invitation**, controlled by the owner. It is 12 random characters; nothing is derived from ids or dates.
- Only the **owner** can create a new code; the **owner and admins** can see it; ordinary members cannot.
- Creating a new code makes the old one stop working immediately. Removing a registered member also creates a new code.
- Wrong guesses are limited (10 per user, 30 per IP, per 15 minutes) and never reveal whether a family exists.
- A member who **leaves on their own** is simply no longer a member; they can return only with a code they still hold, which the owner can replace at any time.
- Codes issued before Hardening 1 (8 characters) are replaced once, at the first start after this change.

**Family task access**
- Anything a person **shared with a family stays with the family** when they leave or are removed; **they lose all access to it** (view, search, dashboard, edit, comment, notifications). If they rejoin, access returns.
- A person's **private tasks** (not shared with the family) stay theirs.
- A **private** task is visible to its **owner and assignee only**; the assignee needs to still be a member of the family the task lives in.

**Task privacy**
- Only the **owner** can change a task's visibility or assignee. Anyone who can see a task may still edit its content and comment.
- Editing a task never changes who can see it unless the owner deliberately changes the family selection.

**Notifications**
- A notification about a task is shown only while the recipient can open that task. Notifications are never deleted; they reappear if access returns.
- Chat and bill notifications received while a member are kept as history (open question Q5).

---

## 6. Proposed architecture (per scope area)

Format: Problem · Current · Invariant · Evidence · Proposal · Alternatives · Trade-offs · Migration · Data · UX · Cost · Tests · Rollback · Risks · Recommendation.

### 6-A. Invite-code security/lifecycle (legacy codes; A above)
- **Problem/Current:** 8-hex codes valid until rotated (`db/index.js` only repairs `DEMO####`). **Invariant:** no invite secret below the current strength survives a start-up. **Evidence:** P6. **Proposal:** extend the existing start-up hardening pass with `UPDATE families SET invite_code = <new> WHERE length(invite_code) <> 12` (one new code per row, uniqueness loop as today); log the *count* only. **Alternatives:** A-options 2/3/4. **Trade-offs/UX:** pending invitations break once. **Migration/Data:** data change on `families.invite_code` only; idempotent (new codes are 12 chars); no schema, no user content. **Cost:** none. **Tests:** planted legacy DB → all replaced, unique, strong; second start changes nothing; non-legacy untouched; flips the Hardening-1 "legacy left alone" assertion. **Rollback:** the old codes are unrecoverable by design; revert = stop calling the function (already-rotated codes stay). **Risks:** owners with an un-shared code see it change. **Recommendation:** implement (or, if unwanted, document Option 4 with the numbers in §4-A).

### 6-B. Invite-code visibility (B above)
- **Problem/Current:** every member reads and can forward the code; also in the export. **Invariant:** the code is disclosed only to the roles that may invite. **Proposal:** `mapFamily(f, members, viewerRole)`: `inviteCode` present only for `owner`/`admin`; applied to `GET /api/family`, `GET /:id`, `POST /` (owner), the `join` response (a fresh member gets none) and the export; Overview card hidden for members with an explanatory line. **Alternatives:** keep (document), per-member tokens (rejected). **Migration/Data:** none. **UX:** members see "Ask the family owner for an invite code"; owners unchanged. **Cost:** ~5 call sites + one React branch. **Tests:** owner/admin get it; member, removed member, other-family user never; export; join response. **Rollback:** revert the field filter. **Risks:** members who relied on sharing the code must ask the owner (intended). **Recommendation:** implement.

### 6-C. Leave / remove / rejoin — and what a former member can still reach
- **Problem/Current:** H15-1 (P1). **Invariant:** *access to family-scoped content requires current membership.* **Proposal:** introduce **one shared task-access predicate** (`src/lib/taskAccess.js`, SQL fragment + JS helper) used by `taskWhereClause`, `loadOwnedOrAssigned`, `dashboard.js`, `search.js` (tasks and comments), the notification filter, and the comment/notify paths:
  - accessible if **(visibility='family' AND viewer is a member of `family_id`)**, or **(viewer is owner AND (visibility<>'family' OR family_id IS NULL))**, or **(viewer is assignee AND visibility<>'family' AND (family_id IS NULL OR viewer is a member))**; the SQL form must be NULL-safe (`COALESCE(…,0)` when negated).
  - the rule "unexpected visibility values behave as private" (fail closed) carries over.
  - `assigned_to` is **not** cleared on leave/removal: the predicate makes it inert, and rejoining restores it. (Optional housekeeping if you prefer a clean "Assigned to" label.)
- **Evidence for feasibility:** `h15-prototype.cjs` — 6 randomised runs, 400 tasks each: old vs proposed rule differ **only** for former members of that family (0 unexplained); 0.2–0.5 ms.
- **Alternatives:** (i) detach a leaver's family tasks to private on leave (`family_id=NULL`) — moves data, irreversible for accidental leave, family loses tasks; (ii) clear `assigned_to` only — leaves owned-task access and the comment channel; (iii) do nothing — leaves the write channel. **Recommendation:** the predicate. **Migration/Data:** none. **UX:** a departed member simply no longer sees those tasks; none of the tasks change. **Cost:** replaces four copies with one (net less code). **Tests:** §8. **Rollback:** revert to the previous SQL. **Risks:** (1) a *family-visible task owned by a departed member becomes unmanageable by the family* (delete is owner-only) — H15-13, needs a decision (Q4); (2) callers that bypass the shared predicate re-introduce drift → a test that greps route files for `assigned_to = ?` outside the helper is cheap insurance.

### 6-D. Historical notifications (D above)
- **Proposal:** in `notifications.js`, filter `GET /` rows **and** the unread count with `NOT COALESCE(<no-access predicate on the linked task>, 0)` for rows whose `link` matches `#/tasks/<id>`; `POST /:id/read` unaffected. **Data:** unchanged (nothing deleted). **Migration:** none. **UX:** rows disappear from the panel when access is lost, return if it is regained. **Tests:** private→ hidden for recipients without access, visible for owner/assignee, reappears after rejoin/visibility restore, deleted task rows kept, unread count consistent, non-task rows untouched. **Rollback:** remove the filter. **Recommendation:** implement.

### 6-E. F-10 task visibility authorization (E above)
- **Proposal:** server: validate `visibility ∈ {private,family}` on PATCH (and POST); compare stored vs requested `visibility` and `assignedTo`; a change by a non-owner → 403; unchanged values pass. UI: `TaskFormFields` preselects the family only when `existing.visibility==='family'`; `TaskFormModal` sends `visibility`/`familyId` only for owners (and only when the select changed); non-owners don't see the family select. **Alternatives:** hide Edit from non-owners (rejects the collaboration model the UI already has); make assignee a co-owner of visibility (no evidence; UI has no assignee concept). **Migration/Data:** none; existing invalid `visibility` strings stay and behave as private (fail closed). **Tests:** owner can change; assignee/member cannot (403) yet can edit content and pass an unchanged `visibility`; invalid string → 400; reassign owner-only; UI edit of a private-with-family task keeps it private (browser); regression of member edit through the UI. **Rollback:** revert. **Risks:** any external client that sends a different `visibility` as a non-owner now gets 403 (only the app's own form exists).

---

## 7. Authorization matrix (based on supported actions)

Cell = **current (probed)** → **recommended**. A = ALLOW, D = DENY, N/A. Actors: Unauth · Owner · Assignee (of the task) · Ordinary member · Removed/former member (who owned or was assigned) · Other-family user.

| Action | Unauth | Owner | Assignee | Ordinary member | Former member | Other family |
|---|---|---|---|---|---|---|
| View a private task | D | A | A | D | **A → D** (P1-1) | D |
| Edit content of a private task | D | A | A | D | **A → D** | D |
| View / search / dashboard a family-visible task | D | A | A | A | **A → D** (P1-1..4) | D |
| Comment on a family-visible task | D | A | A | A | **A → D** (P1-5, notifies family) | D |
| **Change task visibility** | D | A | **A → D** (P3-1) | **A → D** (P3-2) | **A → D** | D |
| **Change assignee** | D | A | **A → D** (P3-3) | **A → D** | **A → D** | D |
| Delete a task | D | A | D | D | **A → D** (owner clause without membership) | D |
| View a notification about a task | D | A | A | A while task accessible | **A → D** (P1-8, P4-1) | D |
| Generate (auto) invite code at creation | N/A | A | N/A | N/A | N/A | N/A |
| **View invite code** | D | A | N/A | **A → D** (P2-1) | D | D |
| **Rotate invite code** | D | A | N/A | D | D | D |
| Join with a valid current code (throttled) | D | already member | — | already member | A (after voluntary leave) | A |
| Join with a stale/revoked code | D | D | D | D | D | D |
| Leave family | D | D (400: transfer first) | A | A | N/A | D |
| Remove a member | D | A | D | D | D | D |
| Rejoin after voluntary leave with a held, still-valid code | — | — | — | — | A → **A (keep)** | — |
| Rejoin after removal with the old code | — | — | — | — | D (already, code rotated) | — |

Cells whose current state was unclear are resolved above: *view invite code* (member → D), *rejoin after leave* (keep A), *former-member task access* (→ D).

---

## 8. Test strategy (designed before implementation)

Users: **A** (Family X owner), **B** (X member/assignee), **C** (Family Y), **D** (removed/former member), **E** (ordinary member). New file `test/hardening15-*.test.js`; extend, do not weaken, the Hardening-1 file.

- **Invite:** legacy 8-hex codes replaced at start-up in a real restarted process (planted DB; strong+unique; idempotent second start; non-legacy untouched); code visible in every response only to owner/admin (list, single, create, join response, export); member/D/C never; regenerate owner-only; old code fails generically; removal rotates; voluntary leave does not; throttle still holds (10 user / 30 IP, no refund on success); concurrent join+rotate ends in a consistent state (serialised — document, not a distributed claim).
- **Access predicate (differential):** for randomised worlds, list/get/patch/comment/search/dashboard/notifications must agree with a reference implementation of the contract; current members see exactly what they saw before (regression), former members see none of the family-scoped items, private tasks obey owner/assignee-with-membership; NULL assignee and NULL family cases; unknown visibility fails closed.
- **Former member (D):** cannot GET/PATCH/complete/comment/delete, does not appear in search/dashboard/list, cannot notify the family; rejoin restores their own tasks; nothing was deleted.
- **F-10:** owner changes visibility/assignee; assignee/member cannot (403) but can edit content; unchanged `visibility` in the payload passes; invalid value 400; UI edit of private-with-family stays private; UI edit as non-owner works and never changes visibility.
- **Notifications:** hidden when access lost/private, present for owner/assignee, reappear after regain, unread count matches, deleted-task rows kept, chat/bill rows untouched, `read` endpoints unchanged.
- **Assistant context:** with the provider function stubbed (no credentials needed): family member context excludes private tasks and other users' data (verified now, P7), and excludes family tasks after removal.
- **Browser (two families, four users):** the U1 scenario (owner edit must not re-share), member edit of a family task, invite code hidden from a member and shown to the owner, removed member's task pages/search/dashboard/notification panel empty, rejoin restores, responsive 320/375/414/768/1280 for the changed Overview note and task form.
- Do not treat HTTP 200 as authorization: every negative test asserts the absence of the data (title/body strings) in the payload.

---

## 9. Hidden related risks — classification

| # | Risk | Class | Decision |
|---|---|---|---|
| 1 | Former member read/write access to family tasks (H15-1) | REAL BUG | **MUST FIX NOW** |
| 2 | UI re-shares private task on ordinary edit (H15-2) | REAL BUG | **MUST FIX NOW** |
| 3 | Any viewer changes visibility/assignee; invalid visibility accepted (H15-3) | SECURITY GAP | **MUST FIX NOW** (F-10) |
| 4 | Notification snapshots for inaccessible tasks (H15-4) | PRIVACY GAP | **MUST FIX NOW** |
| 5 | Access rule duplicated in 4 places | DEFERRED DEBT that causes bugs | **MUST FIX NOW** (as the shared predicate — it *is* the fix for 1) |
| 6 | Chat/bill notification previews after removal (H15-5) | PRIVACY GAP (lower) | **SHOULD FIX / needs decision** — requires an attribution column for future rows; old rows cannot be attributed |
| 7 | Invite code visible to all members + in export (H15-6) | PRODUCT DECISION | **SHOULD FIX** (recommended) |
| 8 | Legacy 8-hex codes (H15-7) | THEORETICAL RISK | **SHOULD FIX** (one UPDATE) or accept with numbers |
| 9 | Orphaned family tasks of a departed owner cannot be deleted by anyone (H15-13) | PRODUCT DECISION | **DEFER** — decide who may manage (family owner?) |
| 10 | Timing side channel on code lookup | THEORETICAL RISK | **FALSE POSITIVE**: indexed equality behind network jitter, uniform errors, throttled |
| 11 | Throttle bypass through another endpoint | — | **FALSE POSITIVE**: only `/join` consumes codes |
| 12 | Throttle bypass via `X-Forwarded-For` | — | **FALSE POSITIVE** (P5-1: header ignored) |
| 13 | Rotation vs join race | — | **FALSE POSITIVE** for the supported single-process deployment (sequential SQLite access); multi-process NOT VERIFIED |
| 14 | Code in logs / activity / storage / page source | — | **FALSE POSITIVE** (searched) |
| 15 | Stale code in the client | — | **FALSE POSITIVE** (refetched, never persisted) |
| 16 | Signup unthrottled lets attackers add accounts | DEFERRED (F-07) | DEFER |
| 17 | Per-process throttle | ENVIRONMENT LIMITATION | DEFER; documented |
| 18 | Assistant context privacy | — | **VERIFIED** OK (P7-1…P7-5) |
| 19 | AI cannot run with a real key (H15-12) | REAL BUG (out of scope) | **CHALLENGE #4 — needs its own decision** |
| 20 | Search comments / dashboard for former members | covered by #1 | MUST FIX NOW (same predicate) |

**CHALLENGE #4 detail — AI.** `src/lib/ai.js` → `betaZodOutputFormat(schema)` (SDK 0.70) → `z.toJSONSchema(...)` on the root `zod` import; installed zod is 3.25 (root has no `toJSONSchema`; only `zod/v4` does). Evidence: direct SDK call throws `TypeError: z.toJSONSchema is not a function` with zero requests reaching the mock server. Consequence: with a valid key every AI feature (Assistant chat/plan/weekly review, DecisionFlow analysis, BillSense insights, EcoLife tips, milestone suggestions) returns "The AI request failed unexpectedly". The unit tests could not catch it (no key). Options for a *separate* phase: (a) bump `zod` to ^4 (dependency change; SDK peer range already allows it; schemas use only basic constructors), (b) keep zod 3, build the JSON schema with `zod/v4`'s `toJSONSchema` and validate the reply with `schema.parse` in `callStructured` (no dependency change, small), (c) hand-write JSON schemas. I recommend (b) or (a) after review; **not touched here.** Also: no live-provider verification is possible without a key, so any fix needs a mock-provider test.

---

## 10. Files likely to change (if approved), tests, migrations, risks

**Files (application):**
- new `src/lib/taskAccess.js`
- `src/routes/tasks.js` (use predicate; owner-only visibility/assignee compare; enum validation; comment/notify guard)
- `src/routes/dashboard.js`, `src/routes/search.js` (use predicate)
- `src/routes/notifications.js` (filter + unread count)
- `src/routes/family.js` (`mapFamily` viewer-role aware; join response), `src/routes/settings.js` (export drops `invite_code` for non-owner/admin)
- `src/db/index.js` (legacy-code rotation, extends the existing pass)
- `web/src/components/family/OverviewTab.jsx` (member note), `web/src/components/tasks/TaskFormFields.jsx` and `TaskFormModal.jsx` (preselect fix, send visibility only for owner-when-changed, hide family select for non-owners)
- tests: new `test/hardening15-*.test.js`; adjust the Hardening-1 legacy-code assertions.

**Migrations:** none to schema. One data update at start-up (legacy codes → strong codes), idempotent, transaction-safe, never repeated, no ownership changes, no content deletion. Notification/visibility rules are read-time.

**Risks:** (1) departed owner's tasks become unmanageable by the family until Q4 is decided; (2) members lose the code (intended); (3) pending old-code invitations break once (only if Option 1); (4) a NULL-logic mistake in the predicate leaks or hides rows — mitigated by the differential test and `COALESCE`; (5) UI changes are small but touch the task form used everywhere → full task regression.

**Rollback:** every change is code-only except the legacy-code rotation (irreversible by design); revert = redeploy the previous build.

**Deferred (unchanged):** F-05…F-09 and the rest of the audit list, chat/bill notification attribution (Q5), orphaned-task management (Q4), signup throttling, distributed limiter, AI fix (Q7), accessibility (next hardening).

---

## 11. Decisions requested from ChatGPT

- **Q1 Legacy codes:** Option 1 (rotate once at start-up, recommended) or Option 4 (leave, documented with the §4-A numbers)?
- **Q2 Invite-code visibility:** owner/admin only (recommended) or keep visible to all members with the policy documented?
- **Q3 Leave semantics:** confirm "voluntary leave never rotates; removal does" (recommended), or choose leave-rotates?
- **Q4 Former-member access + departed owner's tasks:** confirm the read-time membership predicate (recommended over detach-to-private). Who may delete or manage a family-visible task whose owner has left — the family owner, or defer?
- **Q5 Notifications:** approve hiding task-linked rows by the same predicate (recommended). For chat/bill previews: defer, or add a nullable `family_id` on `notifications` (populated for new rows only) so they can be filtered going forward? (One `ALTER TABLE ADD COLUMN`, non-destructive; old rows stay unattributed.)
- **Q6 F-10:** confirm owner-only for `visibility` **and** `assignedTo`, comparing values (not presence), with the form fix; non-owners keep content editing.
- **Q7 AI defect:** schedule a separate small phase now, and choose (a) zod 4, (b) `zod/v4` schema conversion without a dependency change, or (c) hand-written schemas?
- **Q8 Scope check:** the shared task-access predicate touches list, detail, dashboard, search, notifications and comments. If you want the smallest possible patch, the alternative is to add the membership condition to the existing four copies — same behaviour, more drift risk. I recommend the shared predicate.

---

## 12. Evidence appendix

`audit-evidence/h15/`: `h15-probes.cjs` + `h15-probes.out.txt` (35 lines: P1 former member, P2 code exposure, P3 F-10, P4 notifications, P5 throttle trust, P6 arithmetic, P7 assistant context, P8 leave/rejoin) · `h15-ui-probe.mjs` (browser: U1 re-share on ordinary edit, U2 member hides a family task and loses it, U3 member sees the code card) · `h15-prototype.cjs` (old-vs-proposed access rule and the notification filter; NULL-safety finding) · `sdkdbg.cjs`, `mockdbg.cjs` (AI defect).

Not verified in this research: live provider behaviour, multi-process races, other browsers; the prototype is a scratch script, not the implementation.

**Stopping here.** No application code was changed; no implementation, Hardening 2 or Phase 9 has started. Waiting for ChatGPT's decisions on §11.
