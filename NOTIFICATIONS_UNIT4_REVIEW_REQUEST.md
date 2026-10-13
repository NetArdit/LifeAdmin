You are Codex, principal engineer and reviewer on LifeAdmin, working with Claude (the execution lead). Read-only; do not change files; do not open any `.env*` file (`.env.example` is not a secret and may be read). Read NOTIFICATIONS_RESEARCH_AND_DESIGN.md and NOTIFICATIONS_UNIT3_REVIEW.md (yours), then the code named below. The work is committed locally on branch postgres-netlify; what you reviewed last was commit 04d62d4, compare with `git diff 04d62d4..HEAD`. The owner's standing instruction: work as engineers, not coders who stop when it runs.

REVIEW REQUEST: UNIT 4 (push for every notification, quiet hours, mute, a reminder of its own per item) AND THREE PIECES OF HOUSEKEEPING (limits counted in the database, backup and restore, the README)

Nothing was deployed, the hosted database was not migrated, no variable was set on the host, and no real push service was called. The owner has said: no Netlify deploy until they say so.

THE OWNER'S DECISIONS ON YOUR FOUR QUESTIONS (binding)
1. One notification per chat message to every member of the circle except the sender. Never grouped.
2. The author is not notified of what they did themselves; everybody else in the circle is, at once, for a comment, for something added, for a message.
3. The browser's time zone is taken the first time and can be changed.
4. Email only as a daily digest that a person turns on. NOT BUILT in this unit.

1. UNIT 4: WHAT WAS BUILT
- src/lib/afterCommit.js: `afterCommit(fn)` and `withAfterCommit(change, onError)` on AsyncLocalStorage. Work registered inside a request or a worker step runs only after its transaction committed; if the change fails, nothing registered runs. `txRoute` (src/middleware/errorHandler.js) and the worker's `handle` (src/lib/reminderWorker.js) open the scope.
- src/lib/notify.js, rewritten: `notifyUser` writes the bell row inside the caller's transaction and registers the push for after the commit. The outcome is recorded on the row, `notifications.push_status`: sent, none (no device), failed, muted. A push failure never fails the request. The kind of sentence shown on the device comes from a fixed map (PUSH_KIND); the payload stays `{k,u,g}` with the tag `n-<notification id>`, so nothing of a task or a message leaves the server.
- Circle events: every chat message, every comment on a circle-visible task, every new circle-visible task notify every other active member at once, one notification each, the author excluded.
- Mute: `family_members.muted_until`; GET, POST and DELETE /api/family/:id/mute with hours 1, 8 or 24. A muted member still gets the bell row; the push is skipped and recorded as muted.
- Quiet hours (src/lib/reminders.js): `quietOn`, `quietStart`, `quietEnd` in the person's reminder settings, on by default 22:00 to 08:00 in their zone. `afterQuietHours` moves a planned reminder to the end of the quiet period. They apply to dated reminders only, not to circle events. RULE ON THAT: the owner asked that circle events arrive at once; is a message at 03:00 that makes a phone sound acceptable as the default, or should quiet hours silence circle pushes too (bell row kept) with a switch?
- A reminder of its own per item: tasks, bills and goals accept `reminder: { mode: 'default' | 'none' | 'custom', minutesBefore }` with the fixed list of lead times; the planner honours it.
- The worker's `housekeeping()` deletes expired sessions (and with them, by the foreign key, their device subscriptions).
- Interface: web/src/components/ReminderSelect.jsx in the task and bill forms, web/src/components/family/MuteCircle.jsx in the chat tab, quiet-hours controls in web/src/components/settings/DeviceNotifications.jsx.

2. LIMITS COUNTED IN THE DATABASE
- Why: the limits (failed sign-ins, forgot and reset password, one-time codes, wrong invite codes, push test and subscribe) were counted in the memory of one process. On Netlify the API is a function that runs as many short-lived copies, so each copy counted for itself and forgot at every cold start.
- src/lib/ratelimit.js: table `rate_limits (bucket, key_hash, hits, expires_at)`, primary key (bucket, key_hash). `consume` is ONE statement, an upsert that starts a new window when the old one ended and otherwise adds one, RETURNING hits. `isLimited`, `reset`, `resetAll`, `retryAfterSeconds`. Whom a row is about is an HMAC-SHA-256 of the limiter's name and the key, keyed by RATE_LIMIT_SECRET, else PUSH_STORE_KEY, else a constant in the code. One time in fifty `consume` deletes ended windows.
- Every limiter has a name (src/lib/authLimits.js; `pushTest` and `pushSubscribe` in src/routes/push.js). Every call site awaits (src/routes/auth.js, family.js, push.js).
- KNOWN AND NOT CHANGED: the check (`isLimited`) and the count (`consume`) are two statements, as they were two calls before, so tries at the same instant can each pass the check before any is counted; the window is fixed, not sliding; the limits per address see whatever address the application sees, and `trust proxy` is not set. The counting runs outside the request's transaction where there is none and inside it where the route is a `txRoute`. CHECK THAT LAST POINT IN PARTICULAR: a failed sign-in that is counted inside a transaction which then rolls back would not be counted at all.

3. BACKUP AND RESTORE
- src/lib/backup.js, scripts/backup.cjs, `npm run db:backup -- <file>`, `npm run db:restore -- <file>`.
- A backup is every table except sessions, push_subscriptions, otp_codes, password_reset_tokens and rate_limits, read in one transaction, written as one JSON file; the command refuses to write over an existing file. The file holds personal data and password hashes in the clear; `backups/` is git-ignored and the command says so.
- A restore checks the file's shape and that its table names are plain identifiers known to this database, refuses a database in which any backed-up table has a row, inserts in the order of the foreign keys with `json_populate_recordset`, and sets every id sequence after the highest id, all in one transaction.
- KNOWN: table names are interpolated into SQL (after the identifier pattern and the comparison with the database's own list); the whole database is held in memory; a restore expects the same schema version; nothing schedules a backup and nothing takes one from the hosted database yet (that needs the owner).

4. README.md no longer describes SQLite: stack, structure, commands, reminders and notifications, backups, limits, the order of a deploy.

5. EVIDENCE
- The whole suite (npm test) with the limits counted in the database: 316 of 316, exit 0. That run was started before the two new test files existed.
- test/backup.test.js, run on its own afterwards: 5 of 5. It makes a backup of a database with two people, a circle, a task, a comment, a bill and a message, restores it with the command in a process of its own into an empty database, reads the rows back, checks that a new row gets an id after the restored ones, that a second restore is refused, and that the backup command does not write over a file.
- test/ratelimit.test.js, run on its own afterwards: 6 of 6. Two limiter objects with one name share a count; 20 tries at once are counted as 20; a window that ended starts again; the table holds a 64-character hash and neither the email nor the address.
- npx eslint . : 0 problems. The configuration did not cover scripts/, netlify/ and public/sw.js before; it does now, and two unused imports in a test were removed (after the 316 run; that file was not run again).
- All of it on PGlite.
- NOT VERIFIED, and I will not claim it: anything in a real browser or on a phone (permission, a real push service, the notification, the click, mute and quiet hours as a person sees them); the limits and the backup on a PostgreSQL server (PGlite only); a backup of the size of a real database; the scheduled function on the host; the new interface pieces opened in a browser.

6. WHAT I ASK
A. Findings by severity with file and line. In particular: after-commit work (can a push be sent for something that did not commit, or lost for something that did; what an exception in a registered function does); the mute and quiet-hours rules; the limiter (the upsert under concurrency, counting inside a rolled-back transaction, the fallback constant as HMAC key, growth of the table, the cost of an extra statement on every sign-in when the database is far away); the backup (what must not be in the file and is, what must be and is not; restore order and sequences; identity or generated columns that `json_populate_recordset` would mishandle; the interpolated names).
B. The ruling asked in section 1 on quiet hours and circle events.
C. APPROVED, APPROVED WITH FIXES or NOT APPROVED, separately for unit 4, the limits and the backup.
D. What is still missing before the first deploy, in order, and what the owner must do themselves.
E. The execution prompt for the next unit: the daily email digest as an opt-in, and whatever you rank above it.
End with MEMORY UPDATE.
