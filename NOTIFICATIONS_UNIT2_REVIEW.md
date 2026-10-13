# Review: Notifications, Unit 1 fixes and Unit 2

**Decision: APPROVED WITH FIXES.** The reported Unit 1 fixes address the earlier blockers, and the worker’s current bell delivery is transactionally safe. The remaining fix is the known response-before-commit risk. Real PostgreSQL concurrency and the separate migration still need verification before deployment; nothing here authorizes either deployment or migration.

## A. Findings

### MEDIUM — a route can answer success before its transaction commits

[`txRoute`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/middleware/errorHandler.js:11>) commits only after the handler returns, but the handler calls `res.json()` first. This affects the task, bill, goal, and reminder-settings routes—for example, task edit at [`tasks.js:393–425`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/routes/tasks.js:393>) and settings at [`settings.js:96–99`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/routes/settings.js:96>). If `COMMIT` fails after the response was sent, the client may see success for a rolled-back change; the error handler may also be unable to send a 500 after headers have gone out.

This is a real correctness gap, not just a theoretical issue. Before treating these routes as production-ready, have the handler produce a response value, commit, and only then write the response—or use another pattern that guarantees success is reported only after commit.

### LOW — true PostgreSQL worker concurrency remains unverified

The worker’s claim uses `FOR UPDATE SKIP LOCKED` in [`reminderWorker.js:33–51`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/reminderWorker.js:33>). The supplied PGlite tests support the functional behavior but do not establish the race behavior with independent PostgreSQL connections. This is a verification gap, not a code defect established by this review.

### No finding — Unit 1 locking and atomicity look consistent

Replans now read under the item lock and reconcile within that transaction: [`reminders.js:298–347`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/reminders.js:298>). Tasks, bills, goals, and reminder settings use `txRoute`; circle removal and leaving wrap the membership change and `replanUser` in their existing transactions. Replan-user takes task, bill, and goal IDs in order.

The worker takes the item lock before the planned-reminder row lock at [`reminderWorker.js:93–103`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/reminderWorker.js:93>). Replan and delete paths also reach planned rows after changing or locking the owning item. The claim transaction locks planned rows but does not then acquire item locks, so it does not invert that order. `replanUser`’s orphan cleanup can delete planned rows before its item loop, but it targets rows whose source item is already missing; I found no item-to-row cycle from that path.

### No stale announcement found in the current worker

If the item change commits before `handle` acquires its lock, `wantedFor` reads the current item and cancels a now-unwanted claim. If the worker acquires the item lock first, the edit waits; the worker may finish its bell notification before the edit commits. That is a consistent ordering: the notification precedes the committed edit.

This is safe for the current database-only delivery. It must not be carried over as an exactly-once guarantee for external push. Sending to a push service inside the database transaction cannot roll back a push that the service already accepted.

### Retry and duplicate assessment

On an ordinary delivery error, the transaction rolls back, then the worker conditionally releases its still-owned claim as pending or failed in [`reminderWorker.js:105–115`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/reminderWorker.js:105>). If that release fails, the lease expires and a later claim can recover it. The token fence prevents a worker whose lease was taken over from finishing the newer worker’s row.

With the current `deliverToBell`, the bell insertion and status change commit together. A rollback leaves neither; a successful commit leaves one bell row. I found no current path that sends a bell twice or marks it sent without the bell insertion, except that a user preference can intentionally suppress the bell while the planned row is still marked sent.

For future push, the failure window is different: the provider may accept a push and the worker may fail before recording success, so a retry can send a duplicate. That is the external-delivery boundary documented in the research. Use a stable per-event ID/tag and retry policy; don’t claim mathematical exactly-once push.

### Unit 1 fixes

The changed code appears to address the prior review findings: real-date validation is in [`validate.js:24–36`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/validate.js:24>); the test database guard is evaluated when the database opens in [`db/index.js`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/db/index.js:112>); demo seed and clear replan in [`seed-demo.js:196–203`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/db/seed-demo.js:196>); and the guarded constraints are in [`db/index.js:148–163`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/db/index.js:148>). The routes named in the request use `checkDate` for their date fields.

## B. Rulings

**Response-before-commit:** Fix before production use of these transactional routes. The supplied failure test verifies rollback when planning fails, but it does not cover a commit failure after the handler has already written its response.

**Bell as this unit’s delivery:** Acceptable for the dry-run scope and safer than marking rows sent without recording anything. It is exactly once for the database bell under the transaction as implemented. The deviation from the requested no-send dry run is reasonable because the “delivery” stays inside the app and does not cross an external boundary. Push needs a separate durable delivery design.

**Circle delivery under the owner’s decisions:** Each circle message, circle-visible task comment, and new circle-visible task must create an individual notification candidate for every other active member. The author is excluded. Do not group or coalesce those events, and do not make them wait for the 15-minute reminder schedule. Commit the event and its delivery record, then attempt push immediately in the request or in host-supported work that is reliably allowed to finish. The 15-minute clock remains for dated reminders.

Per-message push means one push attempt per event per opted-in active subscription; fan-out means one event can cause several push requests. Chrome’s current announcement describes engagement-based site rate limits, calculated daily. For a site identified as sending high volume with little engagement, Chrome says it will limit Push API messages to a value no lower than 1,000 per minute, with excess requests receiving HTTP 429. That is not a simple universal quota for every LifeAdmin user, and it does not guarantee delivery below that rate. [Chrome’s rate-limit announcement](https://developer.chrome.com/blog/web-push-rate-limits?hl=en)

The honest promise is: **LifeAdmin records each accepted circle event and immediately attempts a separate, generic push to each other member’s opted-in active device. Push delivery and display remain best-effort; browsers, push services, operating systems, user settings, and rate limiting can delay, reject, or suppress it.** Keep the bell as the durable in-app history. Local abuse protection should prevent or reject abusive event creation rather than silently drop pushes for accepted events.

## C. Cheap true-parallel PostgreSQL verification

Use a **separate throwaway Neon branch or isolated database** in the existing free project, with its own connection string and no owner data. Point the test process only at that URL, confirm it before running anything, and run the migration only against that disposable database.

Then use at least two independent PostgreSQL connections (or two worker instances, each with its own pool) and synchronize concurrent `claimDue` calls against a batch of due rows. Assert that no row ID is returned to both runs, each claimed row has one current token, and an expired lease can be reclaimed while the old token cannot finish it. Repeat enough times to exercise contention. Close connections and delete the disposable branch/database afterward.

That verifies PostgreSQL locking and the worker path without touching the hosted database that the owner controls. It does **not** verify Netlify bundling/scheduling or the migration against the hosted schema.

## D. Approval

**APPROVED WITH FIXES.** Fix response-after-commit ordering before production use, and verify the locking behavior against real PostgreSQL on an isolated database. Hosted migration, Netlify deployment/scheduling, and Neon cost remain unverified and remain the owner’s decisions.

## E. Execution prompt for the next unit

> Implement the Web Push vertical slice for LifeAdmin. First read `NOTIFICATIONS_RESEARCH_AND_DESIGN.md`, the Unit 1 and Unit 2 review notes, and the current auth, settings, notification, DB migration, and frontend boot code.
>
> Include the owner’s settled decisions:
>
> - Every circle message, circle-visible task comment, and new circle-visible task is its own notification to every other active circle member; the author is excluded. Do not group messages or other circle events.
> - Circle event pushes must be attempted immediately after the event transaction commits, in the request or in reliable host-supported post-response work. They must not wait for the 15-minute reminder clock, which remains for dated reminders.
> - Capture the browser’s IANA time zone once when first available, save it to the account only if no zone is set, and allow the user to edit it in Settings. Do not overwrite a user-edited zone on later page loads.
> - Email is only an optional daily digest that the user enables; do not send per-event email.
>
> In this unit, build the browser push foundation: a web app manifest, service worker, authenticated and CSRF-protected subscribe/unsubscribe endpoints, subscription persistence, VAPID configuration, and a user-triggered test push to the current browser subscription. Make the browser permission request happen only after an explicit user action. Keep push payloads generic and small, and make click-through same-origin and allowlisted. Protect subscription endpoints and push secrets, avoid logging endpoint or key material, and handle invalid `404`/`410` subscriptions by deleting them. Add the one-time browser time-zone capture and editable Settings control.
>
> Design the subscription and delivery interfaces so the next circle unit can immediately fan out one durable push candidate per recipient per event without grouping. Do not add a push batching window or use the reminder scheduler for circle events. Account for the external-send retry boundary: the provider may accept a push before LifeAdmin records success, so use stable per-event identifiers where possible and describe delivery as best-effort, not exactly-once.
>
> Add focused tests for subscription ownership and lifecycle, auth/CSRF, time-zone first capture versus user edits, and the test-push path with a stubbed push sender. Provide browser verification steps for permission, subscription, service-worker display, unsubscribe, and test push. Do not deploy to Netlify or migrate the owner’s hosted database. Report changed files, migration steps for a disposable database, test results, and remaining real-browser/hosted verification.

### MEMORY UPDATE

Owner decisions recorded: individual immediate circle notifications to all other active members; no author notification; browser time zone captured once and editable; email only as an opt-in daily digest. Unit 2 is approved with fixes: move transactional HTTP responses after commit and verify `SKIP LOCKED` using independent connections on a disposable PostgreSQL database. Current bell delivery is transactionally safe; external push cannot be promised exactly once. No deployment or hosted migration was performed or authorized.