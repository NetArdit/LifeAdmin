# LifeAdmin

A personal and family life-management platform. Local-first, free to run, no
paid infrastructure required.

> "Tell LifeAdmin what is happening in your life. LifeAdmin helps organize
> what should happen next."

## Quick start

```bash
npm install
npm start
```

Then open **http://localhost:3001**.

The first start creates a local database in `data/pg/` (git-ignored). Nothing else has to be installed.

Optional: the AI assistant, DecisionFlow analysis, natural-language weekly planning and the BillSense/EcoLife
insights need a key. Copy `.env.example` to `.env` and set `GROQ_API_KEY` (free tier, used first when set) or
`ANTHROPIC_API_KEY`. Without one, the rest of the app works fully and those features show a clear
"AI not configured" state instead of faking a response.

```bash
cp .env.example .env
# edit .env and add GROQ_API_KEY=... or ANTHROPIC_API_KEY=...
npm start
```

### Try it with sample data

```bash
npm run seed
```

Creates a demo account (`demo@lifeadmin.local` / `demo1234`) pre-populated
with tasks, a family, bills, a decision, goals and eco logs. You can also
load/clear demo data for your own account from **Settings → Demo mode**.

## Stack

- **Frontend:** React 18 built with Vite (`web/`) into one bundle, `public/app/main.js`, loaded by a small
  vanilla shell (`public/js/app.js`: router, notifications, command palette). `npm install` builds it;
  `npm run build:web` builds it again after a change in `web/`.
- **Backend:** Node.js 22 + Express 5, CommonJS.
- **Database:** PostgreSQL. With `DATABASE_URL` set the application talks to that server (the hosted site uses
  Neon). Without it, development and the tests use PGlite, PostgreSQL compiled to run inside Node, stored in a
  folder: same SQL, no server to install. `src/db/index.js` is the one place that knows the difference.
- **AI:** Groq or Anthropic Claude (`src/lib/ai.js`), used only for the features that need language
  understanding. Dates, scheduling, priority ranking, financial totals and decision scoring are deterministic
  JavaScript.
- **Hosting:** written for Netlify (`netlify.toml`): the pages are files, the API is one function
  (`netlify/functions/api.js`), the reminders run from a scheduled function every 15 minutes.

## Project structure

```
server.js                 App entry point (local server; also what the Netlify function wraps)
src/
  db/                      Connection, schema.sql, demo data generator
  lib/                     Auth, validation, dates, priority and scheduler engines, AI gateway, mail,
                            reminders (planner and worker), notifications, Web Push, limits, backup
  middleware/               Auth guard, same-origin rule, error handling and transactions
  routes/                  One file per feature area (tasks, family, bills, ...)
web/src/                   React pages and components
public/                    What the browser gets: shell, built bundle, service worker, manifest, icons
netlify/functions/         api.js (the whole API), reminders.js (the clock of the reminders)
scripts/                   push-keys, backup, verify-worker-race
test/                      node --test suites; each starts the app on a database of its own
data/pg/                   The local database (git-ignored)
```

## Commands

```bash
npm start                               # the server, http://localhost:3001
npm run dev                             # the same, restarting on changes
npm test                                # the whole suite, one file at a time
npm run lint
npm run build:web                       # rebuild the React bundle
npm run seed                            # a demo account with sample data
npm run db:migrate                      # apply schema.sql to the server in DATABASE_URL (refuses without one)
npm run db:migrate -- --local           # the same for this machine's built-in database
npm run push:keys                       # make the Web Push key pair and the storage key
npm run db:backup -- backups/<name>.json
npm run db:restore -- backups/<name>.json
```

## Reminders and notifications

- Every task, bill, goal and milestone with a date gets its reminders planned as rows (`planned_reminders`) in
  the same transaction that saves it. Each person chooses the usual lead times, the hour for things with a date
  but no time, a time zone and quiet hours in Settings; a task or a bill can have its own lead time or none.
- A worker (`src/lib/reminderWorker.js`) delivers what is due. It is run by the scheduled function; several
  copies at once are safe (rows are claimed with a lease). A reminder that fell in quiet hours waits for their end.
- Every notification is a row in the bell first. If the person turned notifications on for a device, it is also
  pushed there (Web Push). The push carries no text of the task or message, only what kind of thing happened and
  where to open it. Circle members get one notification per chat message, task comment and new circle task,
  except the author; a circle can be muted for 1, 8 or 24 hours. Circle events arrive at once, at night too; a person
  can choose in Settings that in their quiet hours circles fill the bell without sounding a device.
- The bell row is also the record of the push that is owed (`push_status`): a push that was never attempted or
  failed in passing is tried again by the scheduled function, up to three times, and closed unsent once it is
  no longer news (30 minutes for a circle event). Delivery is at least once, not exactly once.
- Web Push needs `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` and `PUSH_STORE_KEY`
  (`npm run push:keys` prints a set). Without them the bell works and the device switch says it is unavailable.
  On an iPhone push works only after the site is added to the home screen.

## Backups

`npm run db:backup -- backups/2026-10-13.json` writes everything people entered into one JSON file, read in a
single transaction that sees one moment. It never writes over an existing file. `npm run db:restore -- <file>` puts a file into an
**empty** database, whole or not at all, and refuses a database that has rows.

- The file holds personal data in the clear, password hashes included. Keep it where the database secrets are
  kept. `backups/` is git-ignored.
- Left out on purpose: sessions, device subscriptions, one-time codes, reset links and the limit counters.
  After a restore everybody signs in again and turns device notifications on again.
- Both commands use the database the server would use: `DATABASE_URL` from `.env`, or the local one.
- A restore requires the same tables and columns as the version that made the backup, and says which differ.
  While it runs it locks the tables, so stop the application first or it will wait.
- Not verified on a PostgreSQL server yet, and not with a database of real size (it is held in memory).

## Notes

- Passwords are hashed with bcrypt. Sessions are server-side, stored in
  the database, referenced by an httpOnly cookie. Expired ones are removed by the reminders worker.
- Requests that change something are accepted only from the site's own address (`APP_BASE_URL`,
  `ALLOWED_ORIGINS`); the rule is one middleware for the whole API.
- Phone/email verification uses a real OTP generated and stored server-side,
  but since sending an actual SMS/email requires a paid external provider,
  the code is returned directly in the API response with `demoMode: true`
  instead of pretending it was delivered.
- AI calls always go through a small, feature-specific context builder —
  never the whole database — to control token cost and protect privacy.

## Password-reset email and deployment notes

- Password-reset email is sent through the provider-neutral `sendMail()` in `src/lib/mailer.js`. Two adapters:
  [Resend](https://resend.com) (`RESEND_API_KEY`) and any SMTP server that takes a login (`SMTP_HOST`,
  `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`). Both need `MAIL_FROM` on a domain the provider accepts and an https
  `APP_BASE_URL` (see `.env.example`). Without them, production sends nothing (the request still returns the
  same generic response). Keys are never sent to the browser.
- Rate limits (sign-in, forgot/reset password, OTP, invite codes, push) are counted in the database
  (`rate_limits`), so every running copy of the application shares one count and a restart forgets nothing.
  Whom a count is about is stored as a keyed hash, not as an address or an email. The limits per address still
  depend on the address the app sees: behind a reverse proxy that is the proxy's address unless Express
  `trust proxy` is set for that exact topology, and it is not set here.
- Deploying a version with schema changes: apply the schema to the hosted database first (`npm run db:migrate`
  with its `DATABASE_URL`), set any new variables on the host, then deploy.
- A family owner must transfer ownership (Family → Members → Make owner) before
  leaving the family or deleting their account. Deleting a family is not
  implemented.

### Family invite codes

- Codes are 12 random characters (60 bits). Wrong guesses are limited per user (10 per 15 minutes) and per client IP (30 per 15 minutes); behind a reverse proxy without `trust proxy` the IP budget is shared by everyone behind that proxy.
- The owner can create a new code at any time (Family → Overview → New invite code); the old code stops working immediately. Removing a registered member also replaces the code. Leaving a family on your own does not.
- Codes are never written to logs or to the activity feed.

### Who can see what after someone leaves a family

- The invite code is shown only to the family **owner** (Family → Overview). Members are told to ask the owner.
- When a member leaves or is removed, they immediately lose access to that family's tasks — reading, searching, editing, commenting, notifications, dashboard, timeline. If they rejoin, access returns. Private tasks they own stay theirs. The rule lives in one place: `src/lib/taskAccess.js`.
- Only a task's owner can change who can see it or who it is assigned to. If a task's owner has left the family, the family owner may delete that orphaned task (nothing else about it).
- At start-up any legacy 8-character invite code is replaced once by a 12-character code.
