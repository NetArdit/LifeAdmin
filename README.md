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
