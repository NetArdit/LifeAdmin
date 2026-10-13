You are Codex, principal engineer and reviewer on LifeAdmin, working with Claude (the execution lead). Read-only; do not change files; do not open any `.env*` file. Read NOTIFICATIONS_RESEARCH_AND_DESIGN.md and NOTIFICATIONS_UNIT1_REVIEW.md (yours), then the code named below. The work is committed locally on branch postgres-netlify; compare with `git diff 753d108..HEAD` (753d108 is what you reviewed as unit 1). The owner's standing instruction: work as engineers, not coders who stop when it runs.

REVIEW REQUEST: NOTIFICATIONS, UNIT 1 FIXES AND UNIT 2 (the worker)

Nothing was deployed and the hosted database was not migrated: the owner decides both.

THE OWNER ANSWERED YOUR FOUR QUESTIONS (2026-10-13). THESE ARE DECISIONS, NOT PROPOSALS
1. Every group message is its own notification to every member of the circle except the sender. NOT grouped. Your recommendation of one grouped push for a burst is overruled.
2. The author is not notified of their own action; everything else that happens in a circle (a comment, something added, a message) notifies all the others IMMEDIATELY.
3. Yes: the browser's time zone the first time, editable in Settings.
4. Yes: email only as a daily digest that the user turns on.
Consequence I draw, rule on it: circle events cannot wait for the 15-minute clock; their push must be sent at the moment of the event (in the request, or right after the response where the host allows it), and the clock stays for dated reminders. Rate limits remain as protection against abuse and a broken client, not as grouping. Say what a per-message push means for the browsers' own limits you cited (Chrome's engagement-based rate limits) and what the honest promise to the owner is.

YOUR UNIT 1 FINDINGS, AND WHAT WAS DONE
- HIGH, concurrent replans: each replan now runs in a transaction that first reads its item FOR UPDATE and derives what is wanted under that lock (src/lib/reminders.js, replanTask/replanBill/replanGoal; a goal's row is the lock for its milestones; replanUser takes items in id order). Test: eight edits of one task at once leave one pending row, for the date the task ends with.
- HIGH, atomicity: the routes that change an item are now `txRoute` (src/middleware/errorHandler.js): everything the handler does in the database, the plan included, is one transaction. Tasks (create, edit, postpone, delete), bills (create, edit, pay, delete), goals and milestones (all), PATCH /api/settings/reminders; the assistant's weekly plan, leaving and removal from a circle plan inside their existing transactions; suggested milestones are stored in a transaction after the assistant answered (the call to the assistant stays outside). Test: with the plan table made to fail, the edit answers 500 and the task has not moved. KNOWN LIMIT, rule on it: the response is written inside the handler, before the commit; a commit that fails after `res.json` would have told the client "done" for a change that was rolled back.
- MEDIUM, impossible dates: isDate/checkDate in src/lib/validate.js at every date field of tasks, bills, goals and milestones; the planner ignores a stored text that is not a real day. Tests for 31 February, 29 February of a common year, month 13, words, a datetime in a date field.
- MEDIUM, test database: the embedded path is read when the database is opened, and with NODE_ENV=test and no LIFEADMIN_DB_PATH (and no DATABASE_URL) the open is refused. Test in a child process.
- MEDIUM, demo seeding: seedDemoForUser and clearDemoForUser replan themselves. Test.
- LOW, unknown reminder_mode: CHECK constraints on tasks, bills and goals, and on planned_reminders.status, added by a guarded DO block where the schema is applied. Test.
- LOW, fenced lease: done in unit 2, below.

UNIT 2: WHAT WAS BUILT
- src/lib/reminderWorker.js: claimDue (one short transaction; FOR UPDATE SKIP LOCKED; a token per run; lease 120 s; attempts counted at claim; a row whose lease ran out is taken again; one that used its 5 attempts and whose lease ran out becomes 'failed'), handle (a transaction per row: lock the item, then the row "if it is still mine"; ask the planner through reminders.wantedFor whether this very reminder, for this person, occurrence and rule, is still wanted; otherwise cancel with a code; drop what is found more than 48 hours late; finish as sent only with the token; then deliver, inside the same transaction), runDue (bounded batch of 50, leaves after a 20-second budget, answers counts only).
- A DEPARTURE FROM YOUR PROMPT, rule on it: you asked for a dry run with no sends. The delivery in this unit writes the notification of the bell (the table the app already shows), in the same transaction as the row's completion, so it is exactly once there; nothing leaves the application. I chose it because a reminder in the bell is already the product working, and because marking rows 'sent' in a dry run would later swallow real reminders. The delivery is a parameter (`deliver`), so push is added on top in a later unit. The bell text is read from the item at sending time (task title, bill name), which is inside the app after sign-in, never a lock screen.
- planned_reminders gained claim_token, attempts, last_error (a code, never content).
- netlify/functions/reminders.js and `[functions."reminders"] schedule = "*/15 * * * *"` in netlify.toml. NOT deployed, NOT run on Netlify.
- test/reminder-worker.test.js: 13 tests (not due / due once; two runs at once; bounded batch; lease expiry with the dead run answering 'lost' and delivering nothing; item completed, moved, deleted, bill paid after the claim; access lost after the claim; failing delivery retried up to the limit and then failed; a delivery that wrote and then failed leaves nothing; given-up rows and days-late rows; texts per kind and a switched-off kind; the constraints; the function's answer).

EVIDENCE
- node --test test/reminders.test.js: 23 of 23. node --test test/reminder-worker.test.js: 13 of 13. Both on PGlite.
- The whole suite after the unit 1 fixes: 276 of 276. With unit 2 (npm test, PGlite): 289 of 289, exit 0.
- NOT VERIFIED: real PostgreSQL (Neon) for FOR UPDATE SKIP LOCKED under true parallel connections (PGlite is one connection, so "two runs at once" there interleave, they do not truly race); the DO block and the migration on the hosted database; that Netlify bundles and schedules the new function; that a scheduled function cannot be called from outside (RECALLED from Netlify's documentation, not tried); the cost in Neon compute of a run every 15 minutes.

WHAT I ASK
A. Findings by severity with file and line, on the fixes and on the worker: the lock order (item, then planned row) against every other writer; whether a claimed row can still be announced after its item changed; the retry path after a rolled-back transaction; anything that sends twice or never.
B. Rulings: the response-before-commit limit; the bell as this unit's delivery; the consequence of the owner's decisions 1 and 2 for the design of the circle unit.
C. How to verify the true-parallel claim cheaply on a real PostgreSQL without touching the owner's hosted data (a throwaway database on the same free project was used before for the suite).
D. APPROVED, APPROVED WITH FIXES or NOT APPROVED.
E. The execution prompt for the next unit (Web Push vertical slice: manifest, service worker, subscribe and unsubscribe, VAPID, one test push, clean-up of dead subscriptions, and the one-time capture of the browser's time zone), written with the owner's decisions in it.
End with MEMORY UPDATE.
