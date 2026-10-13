# Unit 1 review

**The checked-out tree has no working-tree changes:** `git status --short` and `git diff` were empty. I read the design and the implementation present in the checkout, including the new reminder module and tests. I did not open any `.env*` files or change files. The reported PGlite results are evidence supplied with the request; I did not rerun tests.

## Findings

### HIGH — Concurrent replans can leave two pending reminders for one item

In [reminders.js](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/reminders.js:275), each `replan*()` reads the item and computes `wanted` **before** entering `reconcile()`’s transaction. Two replans can therefore reconcile snapshots from different item versions. If the newer replan runs first and an older one runs afterward, the older one can revive a cancelled row for the prior date while the newer row remains pending. The unique key prevents duplicate rows for one key; it does not ensure only one current occurrence is pending.

Serialize replans by item, and read the item and derive `wanted` under that serialization. Add a concurrency regression test. Do not rely on the worker alone to clean up duplicate pending plans.

### HIGH — Mutation and replanning are not atomic

The item write and its `replan*()` call are separate. If replanning fails after an item change, a stale reminder remains—or a new item may have no planned row. A worker-side reread can prevent some stale sends, but cannot recover a reminder that was never planned unless the worker also has a repair path.

Decision 1 is **not acceptable as a durable correctness guarantee**. Since the database transaction helper propagates through nested DB calls, the item mutation and its replan/forget operation should share a transaction. If that is deliberately deferred, Unit 2 needs an explicit, bounded repair mechanism and must not assume the planned table is always complete.

### MEDIUM — Date validation allows impossible calendar dates

The planner checks date shape with `DATE_RE`, then `wallToUtc()` feeds the components to `Date.UTC()`, which normalizes impossible dates. For example, a date such as `2026-02-31` can be scheduled as a date in March while retaining the February occurrence key. See [reminders.js](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/reminders.js:74) and its date checks at [line 159](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/reminders.js:159). The relevant create/update routes accept non-empty strings, not validated calendar dates—for example [bills.js](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/routes/bills.js:150).

Validate real calendar dates at the API boundary and defensively in the planner. Add invalid leap-day and month-end cases.

### MEDIUM — Test database selection can silently capture the developer’s PGlite path

`DB_PATH` is fixed when [db/index.js](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/db/index.js:20) is first required. `startApp()` sets `LIFEADMIN_DB_PATH` later in [helpers.js](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/test/helpers.js:19). If a test imports `src/db` first, that later assignment does not update the captured path. The incident is a real failure mode.

Add a fail-closed guard before opening the database: in test mode, refuse the default developer path when no disposable `LIFEADMIN_DB_PATH` was selected. Prefer choosing the path when opening rather than capturing it at module load. Keep the ordering comment in the test as an additional safeguard.

### MEDIUM — Standalone demo seeding does not plan reminders

The `/api/demo/seed` route calls `replanUser()`, but the `npm run seed` CLI path calls `seedDemoForUser()` directly at [seed-demo.js](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/db/seed-demo.js:220). Seeded rows can therefore lack planned reminders. Either have the seed operation replan itself or explicitly cover the CLI path.

### LOW — Invalid reminder mode falls back silently

`reminderOf()` treats any unknown stored `reminder_mode` as `default` at [reminders.js](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/reminders.js:142). API inputs are validated, so this is mainly a data-integrity concern. Consider database constraints or making planner handling of corrupt rows observable rather than silently changing their meaning.

### LOW — Unit 2 needs fenced lease completion

The schema has `claimed_until`, but no claim token or generation: [schema.sql](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/db/schema.sql:284). Unit 2 should use a lease token/generation or equivalent conditional completion so a worker whose lease expired cannot overwrite a newer claimant’s result. Add attempt/error fields as needed for bounded retry and operational visibility. The unique index and `(status, scheduled_at)` index are otherwise a reasonable base.

## Rulings on decisions 1–8

1. **Replanning after the write:** Not acceptable without qualification. Make the item mutation and replan/forget atomic, or add a defined repair path before the worker relies on the plan table.
2. **Already-past reminders:** Acceptable for newly written items. Keeping an existing pending row when a zone or time change moves it into the past is a coherent policy, but document that it may be sent immediately.
3. **Never touching sent or claimed rows:** Sent rows must remain immutable. Claimed rows require the Unit 2 worker to reread and validate the current item, recipient access, occurrence and rule before sending, then use fenced lease completion. Editing after claim must not permit a stale send.
4. **Task owner and assignee only; bill/goal owner only:** Accept. Rechecking current access at send time is required.
5. **Goal date only when no milestones have dates:** Accept; that matches the stated rule. Completed dated milestones still count as dated milestones, which is consistent with “none has a date.”
6. **Per-item choice and legacy task field:** Accept. Legacy migration is idempotent as described. Keep validation aligned with the eight allowed offsets.
7. **Deferring quiet hours, digest and repeat patterns:** Accept for Unit 1.
8. **No zone/default/item-choice interface:** Accept for the foundation, but set the browser’s IANA zone before reminders are sent to users. The Belgrade fallback is useful for unset accounts, not a safe substitute for a user in another zone. The UI/one-time zone capture can precede actual delivery; Unit 2 dry-run can proceed without it.

## Guard ruling

Yes: add the database guard. It directly addresses the test incident, and the ordering comment alone cannot protect another test that imports the database first.

## Decision

**APPROVED WITH FIXES.** Close the HIGH and MEDIUM findings above before treating the foundation as reliable input to a sending worker. Neon migration/browser verification remains outstanding per the evidence supplied; nothing here authorizes deployment or migration.

## Execution prompt for Unit 2

> Implement Unit 2 of the LifeAdmin notification plan. First close the Unit 1 review blockers: serialize replanning per item and prevent stale snapshots from producing multiple pending occurrences; make item mutation plus planning/cancellation atomic (or implement and document a durable repair path); validate real calendar dates; add a fail-closed test database path guard; and ensure standalone demo seeding replans reminders. Add focused regression tests for those fixes.
>
> Then implement the due worker as a bounded, lease-based dry-run only. Follow `NOTIFICATIONS_RESEARCH_AND_DESIGN.md`: query due rows through the planned-reminder index; claim batches transactionally with PostgreSQL `FOR UPDATE SKIP LOCKED`; perform no external sends; reread each claimed item and verify it still exists, is eligible, matches the claimed occurrence/rule, and is visible to the recipient; cancel stale work. Use fenced lease completion so an expired worker cannot overwrite a newer claim. Record attempts and outcomes with bounded retry behavior, and expose safe operational counts/errors without logging personal content.
>
> Keep the worker idempotent under overlapping runs and simulated crashes. Test claim overlap, lease expiry, stale item/access rejection, retry limits, and failure between claim and completion on the existing PGlite setup. Do not add push sending, subscriptions, service worker, email, or deploy/migrate to the hosted database. Report the files changed, test evidence, remaining Neon/PostgreSQL verification, and any migration required for worker fields.

## MEMORY UPDATE

Unit 1 review: checked-out git tree was clean; no `.env*` files opened and no files changed. Approval is **with fixes**: concurrent replans can revive stale occurrences; writes and replans are not atomic; invalid calendar dates normalize silently; the test DB path can be captured before the helper sets its disposable path; and standalone demo seeding skips replanning. Unit 2 must reread and revalidate claimed reminders, use fenced lease completion, and remain dry-run only until separately authorized.