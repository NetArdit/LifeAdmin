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

Optional: to enable the AI assistant, DecisionFlow analysis, natural-language
weekly planning, and BillSense/EcoLife insights, copy `.env.example` to
`.env` and set `ANTHROPIC_API_KEY`. Without it, the rest of the app works
fully — AI-powered features show a clear "AI not configured" state instead
of faking a response.

```bash
cp .env.example .env
# edit .env and add ANTHROPIC_API_KEY=sk-ant-...
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

- **Frontend:** vanilla HTML/CSS/JS, no build step, no framework. A small
  hash-router SPA shell (`public/js/app.js`) loads page modules on demand.
- **Backend:** Node.js + Express.
- **Database:** SQLite via Node's built-in `node:sqlite` module (no native
  compilation, works out of the box on Windows).
- **AI:** Anthropic Claude (`@anthropic-ai/sdk`), used only for the specific
  features that genuinely need language understanding — everything else
  (dates, scheduling, priority ranking, financial totals, decision scoring)
  is deterministic JavaScript.

## Project structure

```
server.js                 App entry point
src/
  db/                      SQLite connection, schema, demo data generator
  lib/                     Auth, validation, dates, priority engine,
                            scheduler engine, AI gateway, family helpers
  middleware/               Auth guard, centralized error handling
  routes/                  One file per feature area (tasks, family, bills, ...)
public/
  index.html
  css/                     Design tokens, base, components, layout, pages
  js/
    app.js                 Shell, router, notifications, command palette
    pages/                 One module per screen
    components/            Icons, toast, modal, confirm dialog
data/                       SQLite database file (gitignored)
```

## Notes

- Passwords are hashed with bcrypt. Sessions are server-side, stored in
  SQLite, referenced by an httpOnly cookie.
- Phone/email verification uses a real OTP generated and stored server-side,
  but since sending an actual SMS/email requires a paid external provider,
  the code is returned directly in the API response with `demoMode: true`
  instead of pretending it was delivered.
- AI calls always go through a small, feature-specific context builder —
  never the whole database — to control token cost and protect privacy.

## Password-reset email and deployment notes

- Password-reset email is sent through the provider-neutral `sendMail()` in
  `src/lib/mailer.js`; the only provider adapter is [Resend](https://resend.com).
  It works only with a Resend account, a sending domain verified there, and the
  server-side variables `RESEND_API_KEY`, `MAIL_FROM` and an https `APP_BASE_URL`
  (see `.env.example`). Without them, production sends nothing (the request
  still returns the same generic response). Keys are never sent to the browser.
- Rate limits (login, forgot/reset password, OTP) are kept in memory, per
  process. That is adequate for **one instance reached directly**. Behind a
  reverse proxy the app sees the proxy's address as the client IP unless
  Express `trust proxy` is set for that exact topology, and with more than one
  instance each keeps separate counters. Neither is configured here.
- A family owner must transfer ownership (Family → Members → Make owner) before
  leaving the family or deleting their account. Deleting a family is not
  implemented.

### Family invite codes

- Codes are 12 random characters (60 bits). Wrong guesses are limited per user (10 per 15 minutes) and per client IP (30 per 15 minutes); the limiter is in-memory and per process, and behind a reverse proxy without `trust proxy` the IP budget is shared by everyone behind that proxy.
- The owner can create a new code at any time (Family → Overview → New invite code); the old code stops working immediately. Removing a registered member also replaces the code. Leaving a family on your own does not.
- Codes are never written to logs or to the activity feed.

### Who can see what after someone leaves a family

- The invite code is shown only to the family **owner** (Family → Overview). Members are told to ask the owner.
- When a member leaves or is removed, they immediately lose access to that family's tasks — reading, searching, editing, commenting, notifications, dashboard, timeline. If they rejoin, access returns. Private tasks they own stay theirs. The rule lives in one place: `src/lib/taskAccess.js`.
- Only a task's owner can change who can see it or who it is assigned to. If a task's owner has left the family, the family owner may delete that orphaned task (nothing else about it).
- At start-up any legacy 8-character invite code is replaced once by a 12-character code.
