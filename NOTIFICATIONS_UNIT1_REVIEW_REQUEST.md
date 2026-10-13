You are Codex, principal engineer and reviewer on LifeAdmin, working with Claude (the execution lead). Read-only; do not change files; do not open any `.env*` file. Read NOTIFICATIONS_RESEARCH_AND_DESIGN.md (your own design), then the working tree's changes (`git diff` and the new files). The owner's standing instruction: work as engineers, not coders who stop when it runs.

REVIEW REQUEST: NOTIFICATIONS, UNIT 1 (reminder foundation)

Nothing was deployed: the owner decides every deploy. Nothing is sent yet: no push, no scheduler.

WHAT WAS BUILT
- src/lib/reminders.js (new): the clock (wallAt, wallToUtc, remindAt, using Intl with an IANA zone; whole days are taken off the calendar and the rest off the clock; an hour that does not exist or happens twice gives the later moment), the person's defaults and zone (prefsOf, zoneOf, parsePrefs; fallback zone Europe/Belgrade or DEFAULT_TIMEZONE), an item's own choice (parseReminder, reminderOf: default | none | custom with one of eight offsets), what is wanted for a task, a bill, a goal with its milestones, and reconcile(), which makes the pending rows of an item equal to what is wanted inside one transaction; replanTask, replanBill, replanGoal, replanUser, forget, forgetGoal.
- src/db/schema.sql and src/db/index.js: users.timezone, users.reminder_prefs, reminder_mode on tasks, bills and goals (and reminder_minutes_before on bills and goals), the table planned_reminders with UNIQUE (user_id, source_type, source_id, occurrence_key, rule_key) and the indexes (status, scheduled_at) and (source_type, source_id, status). The ALTER statements run where the schema runs today (not when DB_SKIP_SCHEMA=1), so the hosted database gets them from `npm run db:migrate`, which the owner has not been asked to run yet.
- Routes: tasks (create, edit, postpone, delete, the next occurrence of a repeating task), bills (create, edit, pay with roll-over, delete), goals (create, edit, delete, and every milestone change through recomputeProgress), the assistant's weekly plan, the demo data, leaving a circle and being removed from it, and GET/PATCH /api/settings/reminders.
- test/reminders.test.js: 17 tests.

DECISIONS I TOOK THAT DIFFER FROM, OR ADD TO, YOUR DESIGN: RULE ON EACH
1. replan*() runs after the change it follows, not in the same transaction (the routes are not transactional today and wrapping each was a larger change than this unit). The planner is idempotent, and I intend the worker of unit 2 to read the item again and check access before it sends. Is that acceptable, or must the routes become transactional first?
2. A reminder whose moment is already past when the item is written is not planned (a task created at 10:00 and due today gets no 09:00 reminder). A pending row that falls into the past because the person changed zone or time of day keeps pending and is moved.
3. Rows that were sent, or are claimed, are never touched by the planner: editing an item away and back does not send again. An offset changed after sending is a new rule key and can send again.
4. Who is reminded of a task: its owner and its assignee, each only while canAccessTask says so, each in their own zone and with their own defaults. Not the whole circle. A bill: its owner only, also when the bill is shared with a circle. A goal: its owner.
5. A goal's own date is announced only when none of its milestones has a date; otherwise each open dated milestone is. Milestones follow the person's default and have no choice of their own.
6. The per-item choice is `reminder: { mode, minutesBefore }`; the old `reminderMinutesBefore` on tasks is still read (a number becomes custom and must be one of the eight offsets; null becomes default). Existing rows with a number become custom by an UPDATE that can only match once.
7. Quiet hours, the digest and repeating reminder patterns (every day at, chosen weekdays, a day of the month) are not in this unit.
8. No interface yet for the zone, the defaults or the per-item choice: the API is there. I intend to send the browser's zone once when users.timezone is NULL, in the unit that brings the settings screen. Should that move earlier?

AN INCIDENT WHILE TESTING, TOLD AS IT WAS
My first version of the test loaded src/lib/reminders (and so src/db) before startApp() had set LIFEADMIN_DB_PATH, so that file's run wrote 13 test accounts into the developer's local PGlite database (data/pg), which was empty. The hosted database was not reachable: the local .env has no DATABASE_URL (counted, not printed). I removed the rows, fixed the order and added a comment in the test. Is there a guard worth adding in src/db or test/helpers.js so that this cannot happen silently again (for example refusing to open the default path when NODE_ENV=test)?

EVIDENCE
- node --test test/reminders.test.js: 17 of 17 pass on PGlite.
- The whole suite (npm test, PGlite): 270 of 270 pass, exit 0.
- NOT VERIFIED: PostgreSQL on Neon (only PGlite ran); the migration on the hosted database; anything in a browser; performance of replanUser for a person with many items.

WHAT I ASK
A. Findings by severity (CRITICAL, HIGH, MEDIUM, LOW) with file and line: correctness of the clock (zones, change of clocks, date-only items), of reconcile (races between two replans of the same item, the unique key, revival of cancelled rows), places that change an item and do not replan (look for what I missed), validation, and anything that would make unit 2 (the worker with leases) harder.
B. Your ruling on decisions 1 to 8 and on the guard.
C. APPROVED, APPROVED WITH FIXES (list them) or NOT APPROVED.
D. The execution prompt for unit 2.
End with MEMORY UPDATE.
