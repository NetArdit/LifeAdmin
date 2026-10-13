You are Codex, principal engineer and reviewer on LifeAdmin, working with Claude (the execution lead). Read-only; do not change files; do not open any `.env*` file (`.env.example` may be read). Read NOTIFICATIONS_UNIT4_REVIEW.md (yours), then `git diff ee083d2..HEAD` on branch postgres-netlify (two local commits: 1fd52de and c86f8a4).

REVIEW REQUEST: THE FIXES FROM YOUR UNIT 4 REVIEW, INCLUDING THE DURABLE PUSH RECORD YOU RANKED AS THE NEXT UNIT

Nothing was deployed, the hosted database was not migrated, no real push service was called. The owner's "no deploy until I say so" stands.

THE OWNER'S DECISION ON YOUR QUIET-HOURS RULING (binding)
You ruled: silence circle pushes during quiet hours by default, with a switch. The owner answered: make it the user's choice. So the default stays the owner's earlier rule (a circle is told at once, at night too) and "keep my circles quiet in these hours too" is a switch a person turns on (`quietCircles`, default false). When it is on, your ruling applies as you wrote it: the bell row is kept, the push is not sent, and it is not sent in the morning either.

1. HIGH, pushes lost after commit and failures interrupting fan-out
- The bell row is the delivery record. `notifications` gained `family_id`, `push_kind`, `push_attempts`, `push_retry_at`; `push_status` is written as 'pending' in the same INSERT as the bell row whenever this server can push. So what is owed is committed with the event.
- `deliverPush(id)` (src/lib/notify.js) takes the row with ONE statement (`UPDATE ... SET push_attempts = push_attempts + 1, push_retry_at = now + 2 minutes WHERE id = ? AND push_status = 'pending' AND (push_retry_at IS NULL OR push_retry_at <= now) RETURNING ...`), so the attempt after the commit and the clock cannot both send it. Then, at the send boundary: is the person still a member of the circle ('left'), is the circle muted ('muted'), quiet circles ('quiet'), else send. Sent on any device: 'sent'. No device: 'none'. Failed: stays 'pending' until the third attempt, then 'failed'.
- `retryPushes()` runs from the scheduled function (netlify/functions/reminders.js): closes as 'expired' what is no longer news (30 minutes for a circle event, 6 hours otherwise), then tries up to 25 owed rows.
- I did NOT build a table of per-device outcomes. One row per notification and person; when one device was reached and another failed, the row is 'sent' and the failed device is not retried, because a retry would ring the device that already has it. RULE ON THAT: is a per-device record needed before first use, or is this the right cut for now?
- src/lib/afterCommit.js: outside a scope the work still runs at once, but a failure is reported and goes no further; inside a scope a throwing `onError` no longer escapes.
- The chat message route and the task comment route are now `txRoute`: the event, the activity row and every bell row are stored together or not at all. Other routes that notify from `asyncRoute` (bill paid, family invitations, task update) are unchanged: each bell row is durable by itself, but the event and its bell rows are not one transaction there.
- Task visibility is NOT rechecked at the send boundary (membership is). The payload carries no content, and opening the link goes through the normal access check.

2. MEDIUM, limiter
- The HMAC key falls back to DATABASE_URL before the constant, so a hosted deployment never hashes with a value that a copy of the database reveals; .env.example says to set RATE_LIMIT_SECRET.
- The worker's housekeeping deletes ended windows on every run (every 15 minutes), besides the one-in-fifty sweep.
- NOT CHANGED: the check and the count remain two statements (a burst of concurrent wrong passwords can each pass the check). Say whether you want it closed now, and how you would do it without counting successful sign-ins against the person.

3. MEDIUM, backup
- REPEATABLE READ, READ ONLY as the first statement of the export's transaction.
- Format 2: the file carries `shape` (every backed-up table's column names, sorted). A restore requires exactly the tables and columns this version keeps and names the tables that differ.
- A restore takes `LOCK TABLE ... IN ACCESS EXCLUSIVE MODE` on all of them before the emptiness check.
- The file is created with the 'wx' flag. The sequence name goes to `setval` as a `regclass` parameter.

4. `npm run db:migrate` is now scripts/migrate.cjs: without DATABASE_URL and without `--local` it refuses; with both it refuses.

5. EVIDENCE
- npm test after these changes: 331 tests, 329 passed, 2 failed, both being one assertion (the scheduled function's answer has a new key, `pushes`). That test was corrected (commit c86f8a4) and its file run again: 14 of 14. The whole suite was NOT run again after that one-line test change.
- New tests in test/notify-push.test.js: retry after a failure sends once; three attempts then 'failed'; a 40-minute-old circle push is closed 'expired'; a row that was never attempted is sent by the clock; two attempts at once send one; somebody who left is not told; quiet circles on and off at 02:30 local time with a fixed clock. test/backup.test.js: a backup of another shape is refused by name; the schema command refuses without a target. test/reminders.test.js: the new preference.
- npx eslint . : 0 problems. The web bundle builds.
- All on PGlite. NOT VERIFIED: a PostgreSQL server (in particular LOCK TABLE and REPEATABLE READ through the pool, and the claim statement under real concurrency), any browser or phone, the scheduled function on the host.

6. WHAT I ASK
A. Findings by severity with file and line, on the claim statement, the retry and expiry rules, the txRoute conversion (anything in those two handlers that must not be inside a transaction), the backup changes.
B. The rulings asked in sections 1 and 2.
C. APPROVED, APPROVED WITH FIXES or NOT APPROVED.
D. The execution prompt for the next unit (the opt-in daily email digest, unless something ranks above it).
End with MEMORY UPDATE.
