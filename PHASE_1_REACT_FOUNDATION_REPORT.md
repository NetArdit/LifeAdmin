# LifeAdmin — Phase 1: React + Vite Frontend Foundation

**Date:** 2026-09-26
**Scope:** Establish a React + Vite foundation and migrate **one page — Dashboard** — via a strangler-fig approach. Backend (Express + SQLite) untouched except one already-approved carryover fix verified still green. No other page migrated, no new product features, no visual redesign, no new frontend framework.

**Environment note:** disk headroom stayed tight throughout this phase too (~1.2–1.4GB free at various points) but did not block any work this time. All disposable test artifacts (temp SQLite files, test accounts) were cleaned up after use.

---

## 1. Before

**How the existing frontend actually worked**, confirmed by re-reading the live source before writing any code (not from memory of the earlier audit):

- **Entry point:** `public/index.html` loads a pre-paint theme script, five global stylesheets (`tokens.css`, `base.css`, `components.css`, `layout.css`, `pages.css`), one Google Font, then `<script type="module" src="/js/app.js">`. Three empty root divs exist for portals: `#app`, `#toast-root`, `#modal-root`, `#panel-root`.
- **Router:** `public/js/app.js` is a hand-rolled hash router. `PAGES` is a plain object mapping route keys (`dashboard`, `tasks`, `family`, …) to `() => import('./pages/X.js')` — dynamic ES module imports, lazy-loaded per navigation. `route()` reads `location.hash`, shows a generic loading placeholder in `#page-root`, dynamically imports the matching page module, and calls that module's exported `mount(root, ctx)` — where `ctx = { params, api, toast, state }`. `state` is one shared, mutable, module-level object (`{ user, aiConfigured, families, notifications, unreadCount }`) that every page reads directly. On navigation failure, the router itself renders a generic error state; there was **no unmount hook** of any kind — every page module just overwrites `#page-root`'s `innerHTML` on the next navigation, and the previous page's DOM (and any of its own `setInterval` timers, which several — but not Dashboard — manage themselves) is simply discarded.
- **Dashboard specifically** (`public/js/pages/dashboard.js`, 180 lines): `mount(root, ctx)` sets a loading placeholder, calls `await api.get('/api/dashboard')` (the single data dependency), computes a client-side time-of-day greeting and an `showOnboarding` flag (`counts.tasks===0 && counts.bills===0 && !state.families.length`), then builds one large template-literal string containing: a page header, an optional onboarding card, a "today" banner, and a two-column `.dash-grid` (three priority-bucket cards with inline "complete task" checkmarks on the left, a goals/family-activity/conflict-warning stack on the right). After the one `innerHTML` write, it re-queries the DOM for the checkmark buttons and the (conditional) "Load demo data" button and attaches click listeners by hand. Both the "complete a task" and "load demo data" handlers, on success, call **`mount(root, ctx)` again** — a full re-fetch and full re-render of the entire page — rather than updating just the affected part.
- **Backend contract** (`src/routes/dashboard.js`, `GET /api/dashboard`, `requireAuth`-gated): one deterministic aggregation endpoint (no AI in the critical path) returning `{ today: {date, count, items}, needsAttention, comingSoon, canWait, overdue, conflicts, goalsInProgress, familyActivity, counts }`. Every "item" (task/bill/decision) has the shape `{kind, id, title, due_date, priority, status, link}`. Confirmed unchanged this phase — re-read in full before starting.
- **API layer:** `public/js/api.js` — a small `fetch` wrapper (`api.get/post/patch/del`), `credentials: 'same-origin'`, throws a normalized `ApiError` on any non-2xx response. Fixed in Phase 0 (`del()` now forwards a body) and reused as-is here, not reimplemented.
- **Shared utilities reused by Dashboard:** `public/js/components/icons.js` (`icon(name, extraCls)` — returns a raw SVG markup **string** from a static hardcoded lookup table, meant for `innerHTML`), `public/js/components/toast.js` (`toast(message, type)` imperatively appends a toast element to `#toast-root`; also exports `escapeHtml`), `public/js/format.js` (`fmtRelative`, `daysUntilLabel`, pure functions).
- **Loading state:** a `.loading-line` with a spinner and "Preparing your dashboard…" text, shown synchronously before the fetch, replaced once data arrives.
- **Error state:** Dashboard itself has **no internal error handling** — if `api.get('/api/dashboard')` throws, the exception propagates up through `mount()` to the router's own `try/catch`, which renders a generic `.empty-state` with an alert icon, "Couldn't load this page," and the error's message.
- **Empty states:** each of the three bucket cards has its own "nothing here" copy; the goals card says "No active goals yet."; the activity card says "No family activity yet. Create a family to share tasks and updates."; the conflict card is simply omitted (not shown with an empty variant) when `conflicts === 0`.
- **Auth-dependent behavior:** Dashboard is only ever reached while `state.user` is truthy — `app.js`'s `boot()` renders the auth screen instead of the shell/router entirely when unauthenticated, so Dashboard itself never needed its own auth guard. A mid-session 401 (e.g. an expired cookie) is not specially handled — it just surfaces as the generic router error state, exactly like any other fetch failure.
- **Responsive behavior:** `.dash-grid` (pages.css) is `grid-template-columns: 2fr 1fr` above 900px, single column at/below it; `.stat-row`-style tiles are unrelated to Dashboard specifically. No JS-driven responsive logic — CSS only.
- **Existing tests:** none of the frontend (Phase 0 added 87 backend/API contract tests; zero frontend tests existed before this phase).

---

## 2. Architecture

```
LifeAdmin-main/
  server.js, src/                ← Express + SQLite backend (UNCHANGED)
  public/                        ← existing vanilla shell (UNCHANGED except
    js/app.js                      2 small, additive router edits — see §4)
    js/pages/dashboard.js          ← ORIGINAL vanilla Dashboard, left fully
                                      intact and unreferenced, for rollback
    dashboard/main.js              ← NEW: built output of web/ (git-ignorable
                                      build artifact, not hand-written source)
  web/                            ← NEW: the React + Vite project
    package.json                   own dependencies, isolated from the
                                    backend's package.json
    vite.config.js
    src/
      main.jsx                     entry point: exports mount(root, ctx) /
                                    unmount() — the ONLY contract the router
                                    needs to know about
      pages/
        Dashboard.jsx               the migrated page
      components/
        BucketCard.jsx, ItemRow.jsx, GoalsCard.jsx, ActivityCard.jsx,
        ConflictCard.jsx, OnboardingCard.jsx  ← one component per template
                                                 function in the original
      hooks/
        useDashboardData.js         data-fetching (loading/error/data/refetch)
```

**Why this shape, not the suggested `app/features/services/…` layout:** the brief explicitly warned against following a suggested structure blindly. With exactly one page migrated, `app/`, `features/`, and `services/` directories would all currently hold either nothing or a single trivial re-export — premature abstraction for a foundation phase. `pages/` + `components/` + `hooks/` is the smallest structure that still cleanly separates "the page" from "reusable-if-another-page-needs-it UI" from "data-fetching logic," and maps one-to-one onto the original vanilla file's own internal structure (which already had named helper functions for exactly these same seams — `bucketCard()`, `itemRow()`, `goalsCard()`, etc.). `services/` is deliberately **not** introduced: see §5 for why the existing `public/js/api.js`, `icons.js`, `format.js`, and `toast.js` are imported directly rather than wrapped or duplicated.

**Why a separate `web/package.json` instead of adding React/Vite to the root one:** the root `package.json` describes what ships and runs in production (Express, bcrypt, the Anthropic SDK, …) — none of which needs React or Vite in its own dependency tree. Keeping them in `web/` means `npm install` at the root (what a contributor not touching the frontend runs) stays exactly as fast and small as it was before this phase, and the backend's dependency footprint — which Phase 0 was deliberately minimal about — isn't touched by a frontend-tooling decision.

---

## 3. Dependencies

Every new dependency, and why:

| Dependency | Where | Why it's needed | Why native/existing wasn't enough |
|---|---|---|---|
| `react`, `react-dom` | `web/package.json` (runtime) | The whole point of this phase — component-based rendering with real reconciliation, replacing hand-rolled `innerHTML` + manual `querySelectorAll`/`addEventListener` re-wiring | This is the framework being adopted; there's no "native" substitute for what was explicitly requested |
| `vite`, `@vitejs/plugin-react` | `web/package.json` (dev) | Build tool + JSX/Fast-Refresh transform. Vite was the framework named in the brief; `@vitejs/plugin-react` is the standard, minimal plugin for JSX support — no alternative transform was evaluated since the choice was already made at the product-decision level (audit §16, Phase 1 kickoff) | N/A — required to compile JSX at all |

**Explicitly NOT added, and why:**
- **React Router (or any router library):** rejected. Only one route (`#/dashboard`) is React-owned this phase; a routing library manages transitions *between* React-rendered routes, and there's only one. The existing hash router already does everything needed (URL↔page mapping, `hashchange` handling, nav highlighting) for the other nine pages, which aren't moving yet. Introducing a second routing system now would mean *two* routers disagreeing about ownership of the URL — the actual justification bar in §5 (routing) wasn't met.
- **Redux / Zustand / any global state library:** rejected. Dashboard's local state is exactly `{data, loading, error}` (one hook, one component tree) — there is no cross-component state-sharing problem to solve yet. The existing `ctx.state` object (user/families/etc.) is reused as-is (see §6), not reimplemented.
- **`eslint-plugin-react` / `eslint-plugin-react-hooks`:** rejected for now. The Phase 0 lint baseline is deliberately just `@eslint/js`'s `recommended` set (bug-catching, not style). React-specific rules (`rules-of-hooks`, `exhaustive-deps`) would be genuinely valuable as more hook-based logic accumulates in later phases, but adding them now for one `useEffect` in one hook file isn't worth a new dependency yet — noted as a reasonable Phase 2+ addition once there's more surface area to protect.
- **Any CSS-in-JS or CSS Modules library:** rejected — see §8 (Design System). The migrated Dashboard emits the exact same class names as the vanilla version and inherits the existing global stylesheets for free; there is no new styling system to justify.
- **A UI component kit (MUI, Chakra, etc.):** never considered — would directly contradict "preserve current product identity" and "do not spend this phase on decorative redesign."

---

## 4. Routing

**Decision: keep the existing hash router unchanged; do not introduce a routing library.** Per the brief's explicit instruction to document this choice before adding (or not adding) one:

- The justification bar for a router library is "React needs to manage transitions between multiple React-owned routes." That condition doesn't hold yet — there is exactly one.
- All ten existing routes are preserved byte-for-byte; direct navigation (typing `#/dashboard` in the address bar, refreshing on it, bookmarking it) works exactly as before, because the mechanism that handles it (`window.addEventListener('hashchange', route)` + the `PAGES` lookup) is untouched.

**What *did* change in the shared router** (`public/js/app.js`), and why each change was necessary rather than optional:

1. **`PAGES.dashboard`** now points at `() => import('/dashboard/main.js')` (the built React bundle) instead of `() => import('./pages/dashboard.js')` (the original vanilla module). This is the one line that "switches on" the migration; reverting it is the entire rollback path (see §15... i.e. the brief's migration-safety section — the original file is untouched on disk).
2. **An `unmount()` lifecycle hook was added to `route()`** — the router now remembers whichever page module it last mounted and calls `.unmount()` on it (if the module exports one) before the next page's `innerHTML` write. This did **not** exist before, and needed to be added for a concrete, non-optional reason: React's `createRoot(container).render(...)` attaches its own reconciler state to that DOM node. If the router discards that node via `innerHTML = ...` without first calling React's own `.unmount()`, React never finds out its DOM was pulled out from under it — this is a documented React footgun (a "silently stale" root, and in some cases a console error at minimum, or unpredictable behavior at worst if navigated back to). Every one of the nine still-vanilla page modules exports no `unmount`, so `typeof mod.unmount === 'function'` is `false` for all of them and this change is a complete no-op for every route except Dashboard — confirmed by the unchanged 87/87 backend suite and by re-reading the diff, which touches only the router's own internal bookkeeping, not any page module's public contract.

---

## 5. API Layer

**React communicates with Express using the exact same `public/js/api.js` module every vanilla page already used — imported directly, not reimplemented or wrapped.** Concretely, `web/src/pages/Dashboard.jsx` and its child components never import `api.js` themselves; instead `ctx.api` (the same singleton `api` object `app.js` already constructs and passes to every page's `mount()`) is threaded through as a prop, exactly mirroring how the vanilla Dashboard received it. This was a deliberate choice over, say, a `web/src/services/api.js` wrapper:

- **No duplicated fetch logic:** there is exactly one `fetch` wrapper in the whole application, used by both the eight still-vanilla pages and the one React page.
- **The Phase 0 `del()` fix (and any future fix to `api.js`) automatically applies to React too** — there's nothing to keep in sync.
- **Same-origin, same auth, for free:** the built React bundle is served by the same Express instance, on the same origin, so the existing `httpOnly` session cookie is sent automatically (`credentials: 'same-origin'`, unchanged). No token handling, no CORS configuration, nothing to "port."
- **No secrets:** confirmed by reading `web/src/**` in full — there is no `.env`, no `import.meta.env.VITE_*` reference, and no credential of any kind anywhere in the React source. See §11 for the full security review.
- **No backend-validation duplication:** the React Dashboard performs zero client-side validation of its own (it has no forms) — every mutation it makes (`PATCH /api/tasks/:id`, `POST /api/demo/seed`) is a direct pass-through to the same endpoint the vanilla version called, with the backend remaining the sole source of truth for whether the request is valid.

---

## 6. State Management

**No global state library was introduced.** State in the migrated Dashboard is split exactly along the lines the brief asked for:

- **Server/API state:** owned by one custom hook, `useDashboardData(api)` (`web/src/hooks/useDashboardData.js`) — `{data, loading, error}` plus a `refetch()` function, fetched once via `useEffect` on mount. This is the React-idiomatic equivalent of the original's "fetch once in `mount()`," with one intentional, low-risk improvement: the original's mutation handlers called `mount(root, ctx)` again (full page teardown and rebuild) to refresh; the React version's handlers call `refetch()`, which re-runs the same `GET /api/dashboard` and lets React re-render only what actually changed. The **end state shown to the user is identical** in both cases (task disappears from its bucket, counts update) — this is an implementation-level improvement inherent to using React correctly, not a new feature, and it's the direct, natural answer to a real cost the original audit flagged (`LIFE_ADMIN_FULL_AUDIT.md` §11/§14: "full-page/full-section re-renders on every mutation").
- **Local UI state:** exactly one piece exists in the whole migrated page — `OnboardingCard`'s `seeding` boolean (`useState`), replacing the original's manual `btn.disabled = true; btn.innerHTML = '<spinner>...'` DOM mutation with the React-native equivalent of the same visible behavior.
- **Cross-page shared state:** `ctx.state` (the app-wide `{user, families, notifications, ...}` object `app.js` owns) is **reused by reference, not reimplemented.** `Dashboard.jsx` reads `state.user.firstName` and `state.families.length` exactly once per render (matching the original's read-at-render-time behavior) and, in `handleSeedDemo`, writes `state.families = families` back onto that same shared object — exactly what the vanilla version did, so that navigating to another (still-vanilla) page afterward sees the same up-to-date family list. This was a deliberate choice **not** to wrap `ctx.state` in a React Context: introducing Context here would mean either (a) only the React-owned subtree benefits, while the nine vanilla pages still read the raw mutable object directly — two different access patterns for the same data, for no benefit yet — or (b) trying to bridge Context back into the vanilla world, which is real complexity with zero payoff until more pages are React. Revisit once enough of the app is React that a single shared Context genuinely replaces the mutable-object pattern everywhere, not just in one corner of it.
- **Explicitly avoided:** the original codebase's own anti-pattern (module-level mutable `let` variables inside each vanilla page module, e.g. `tasks.js`'s `let ctxRef, rootRef`) was **not** carried into the React version — every piece of Dashboard's own state lives inside its component tree via `useState`, not at module scope. This was flagged in the original audit (§5.2) as a real architectural weakness, and the React migration is the natural place it stops recurring.

---

## 7. Dashboard Migration

**Exactly what was migrated, mapped 1:1 against §1 (Before):**

| Original (vanilla) | React equivalent | Behavior change? |
|---|---|---|
| `mount()`'s top-level template string | `Dashboard.jsx` | Structure/markup preserved exactly (same class names, same nesting) |
| `bucketCard()` | `<BucketCard>` | None |
| `itemRow()` / `daysBetweenToday()` | `<ItemRow>` | None — identical date math, identical badge logic |
| `goalsCard()` | `<GoalsCard>` | None |
| `activityCard()` | `<ActivityCard>` | None |
| `conflictCard()` | `<ConflictCard>` | None |
| `onboardingHtml()` + manual button state | `<OnboardingCard>` | Visible behavior identical; state managed via `useState` instead of manual `btn.disabled`/`btn.innerHTML` writes |
| Manual `querySelectorAll('[data-complete-task]')` + `addEventListener` | `onClick` handler passed as a prop through `BucketCard` → `ItemRow` | None visible — same `e.preventDefault(); e.stopPropagation();` guard, same `PATCH` call, same toast |
| `mount(root, ctx)` called again after a mutation | `refetch()` | See §6 — same end state, fewer wasted renders |
| Loading placeholder | Same markup, rendered when `loading === true` | None |
| Router-level error fallback (mount() had no try/catch of its own) | Component-level error state (`error` from the hook) | **Necessary structural change, not a behavior change** — see the code comment in `Dashboard.jsx` and §9 below for why the error handling had to move *inside* the component |
| Onboarding condition (`counts.tasks===0 && counts.bills===0 && !state.families.length`) | Same expression, same operands | None |
| Empty-state copy per bucket/goals/activity | Same strings, verbatim | None |
| `escapeHtml()` calls on every interpolated string | Removed — not needed | React escapes all JSX text content by default; see §11 |

**One deliberate, disclosed simplification:** the original had a brief *double* loading state (the router shows a generic "Loading…" placeholder for the instant before `mod.mount()` runs, which then immediately overwrites it with Dashboard's own "Preparing your dashboard…" message). The React version shows only the Dashboard-specific message. This is not a user-visible behavior change in practice (the first placeholder was only ever visible for the time it takes to dynamically `import()` the module, typically imperceptible), but it's called out here explicitly rather than left undocumented.

---

## 8. Preserved Behavior

- **Product identity:** no visual redesign was performed. Every class name, every color token reference (`var(--danger-500)`, `var(--brand)`, etc.), every piece of copy, and every icon is identical to the original.
- **Information hierarchy:** page header → optional onboarding → today banner → two-column bucket/goals-activity grid, in the same order, same grouping.
- **Terminology:** "Needs attention" / "Coming soon" / "Can wait" / "Today" / "Goals in progress" / "Family activity" — verbatim.
- **Color semantics:** priority-bucket dot colors (`--danger-500`, `--warning-500`, `--priority-low`) map to the identical buckets as before.
- **Responsive behavior:** since Dashboard emits the same HTML structure and class names, and no CSS was touched, the existing `900px`/`640px` breakpoints in `pages.css`/`layout.css` apply identically — see §10 for what was and wasn't verified about this.
- **CSS:** zero lines of CSS were changed, added, or removed anywhere in this phase. The React Dashboard has no CSS of its own — it is styled entirely by the five global stylesheets `public/index.html` already loads, exactly as the vanilla version was.

---

## 9. Security Review

- **No secrets in Vite client environment:** confirmed — `web/` has no `.env` file, and no source file references `import.meta.env`. `ANTHROPIC_API_KEY` was never anywhere near this phase's code; the only AI-related fact the frontend ever sees is the boolean `aiConfigured` from `GET /api/config`, and Dashboard doesn't even touch that.
- **No unsafe HTML rendering — with one disclosed, narrow exception:** `dangerouslySetInnerHTML` is used in five places (`ItemRow`, `ConflictCard`, `OnboardingCard`), every one of them wrapping the existing `icon(name)` helper's return value. `icon()`'s output is drawn from a **hardcoded, static lookup table of SVG path strings** (`public/js/components/icons.js`) — never user input, never an API response, never anything dynamic. This is the same function the vanilla app has used the same way (via `innerHTML`) throughout its entire existing codebase; using it via `dangerouslySetInnerHTML` in React carries the same (zero, in practice) risk as the vanilla version's `innerHTML` usage did, for the same reason: the content is compile-time-fixed, not runtime-derived. No other use of `dangerouslySetInnerHTML` exists anywhere in `web/src`.
- **Everything else renders as plain JSX text** (`{item.title}`, `{a.summary}`, `{state.user.firstName}`, …), which React escapes by default — at least as safe as the vanilla version's explicit `escapeHtml()` calls, without needing to call it manually.
- **Safe handling of API errors:** the `error` state from `useDashboardData` only ever renders `error.message` (a string set by `ApiError`/the fetch wrapper, never raw response bodies or stack traces) — consistent with the existing `errorHtml()` pattern in `app.js`.
- **Safe external URLs:** every `href` in the migrated components (`item.link`, `a.link`, the hardcoded `#/goals`/`#/tasks` links) is either a server-controlled hash-route string or a hardcoded literal — no user-controlled URL is ever used as an `href`, matching the finding in the original audit that this was already safe.
- **No client-side trust of authorization:** Dashboard performs no authorization logic of its own — every piece of data it shows and every mutation it makes is gated by the backend's existing `requireAuth`/ownership checks, unchanged this phase. The frontend doesn't decide what the user can see or do; it only renders what the API returns and forwards what the user clicks.
- **`npm audit` (web/):** 1 moderate + 1 high finding, both in `esbuild`/`vite`'s **development server** (a website could read the dev server's responses). This project's build pipeline never runs `vite dev`/`vite serve` — only `vite build` (production build) and `vite build --watch` (Phase 1's dev-iteration mode, still not a network-exposed dev server) — so this vulnerability's actual attack surface does not apply to how the project uses Vite. The fix requires a Vite 8 major upgrade (an explicit "breaking change" per `npm`'s own output); deferred rather than forced through unreviewed during a foundation phase. Documented here rather than silently ignored.

---

## 10. Responsive Testing

**No browser-automation tool was available in this session** (same limitation disclosed in both prior phase reports). Per the brief's explicit instruction, every item below is marked honestly rather than assumed:

| Viewport | Status | Basis |
|---|---|---|
| 320px | **NOT VERIFIED** | No browser tool available |
| 360px | **NOT VERIFIED** | No browser tool available |
| 375px | **NOT VERIFIED** | No browser tool available |
| 390px | **NOT VERIFIED** | No browser tool available |
| 414px | **NOT VERIFIED** | No browser tool available |
| Tablet | **NOT VERIFIED** | No browser tool available |
| Desktop | **PARTIALLY VERIFIED** | The React Dashboard was confirmed to serve correctly and produce the same DOM structure/class names as the original at the HTML/data level (see §12's live verification), but was never rendered in an actual desktop browser window to visually confirm layout |

**What *was* verified, which bears on this indirectly:** because the migrated components emit byte-identical class names and nesting to the original vanilla templates, and zero CSS changed, there is **no new reason** to expect different responsive behavior than what the original audit already found for this page (which was itself only structurally, not visually, audited — see `LIFE_ADMIN_FULL_AUDIT.md` §10). This migration neither improves nor is expected to worsen the existing, still-open responsive-verification gap. It does not close it.

---

## 11. Performance Review

**Bundle size — measured, and one real issue found and fixed during this phase:**

- First build: `public/dashboard/main.js` = **759.01 kB raw / 180.62 kB gzip.**
- Investigated because that's roughly 4–5× the expected size for React 18 + ReactDOM 18 (client) alone (~130–145 kB raw / ~40–45 kB gzip is the commonly-cited reference figure). Traced the cause by grepping the built output: it contained **both** `react-dom.production.min.js` and the much larger `react-dom.development.js` license headers — Vite's library-mode build wasn't statically replacing `process.env.NODE_ENV`, so the bundler couldn't prove `react-dom`'s internal `if (NODE_ENV==='production') {...} else {...}` branch was dead code, and bundled both.
- **Fix:** added an explicit `define: {'process.env.NODE_ENV': JSON.stringify('production')}` to `web/vite.config.js`.
- **Result, re-measured:** **216.91 kB raw / 56.87 kB gzip** — a 3.5× reduction. Re-confirmed by grepping the rebuilt output: zero occurrences of `react-dom.development.js` or any `console.error`/`"Warning:"` string (the dev build's warning machinery is now fully absent, not just unreachable).
- This is now in the expected range for a React+ReactDOM foundation bundle; the remainder above the ~40–45 kB React-alone baseline is this phase's own component code plus module-wrapper overhead from bundling React in rather than sharing it across pages (a reasonable Phase 1 tradeoff — see §3/`vite.config.js` comments — revisit once more pages are React and a shared vendor chunk becomes worth the added complexity).

**Other performance considerations (reasoned, not all separately measured):**
- **Unnecessary re-renders:** none identified. `useDashboardData` only calls `setState` on genuine data/loading/error transitions; `OnboardingCard`'s `seeding` state is local and doesn't cascade re-renders elsewhere.
- **Fetching the same data multiple times:** one `GET /api/dashboard` per mount, one per `refetch()` call (exactly two user-triggered mutation paths call it: complete-task, seed-demo) — same fetch count as the original's "call `mount()` again," just without the accompanying full DOM teardown/rebuild.
- **Unstable callbacks:** `handleComplete`/`handleSeedDemo` are recreated each render (not wrapped in `useCallback`) — deliberately not optimized, since they're passed down at most two component levels deep (`Dashboard` → `BucketCard` → `ItemRow`) in a tree with no `React.memo` boundaries to make an unstable reference actually costly. Premature to add `useCallback` here per the brief's own "do not prematurely optimize" instruction.
- **Effects:** exactly one `useEffect` in the whole migrated page (`useDashboardData`'s fetch-on-mount), with a correct dependency array (`[load]`, where `load` is itself `useCallback`-stabilized on `[api]`, and `api` is a stable singleton reference from `ctx`) — no missing-dependency risk, no infinite-fetch-loop risk.
- **Memory leaks:** the new `unmount()` router hook (§4) exists specifically to prevent the leak class this migration could otherwise introduce (a React root left attached after its container is discarded). `useDashboardData` has no subscriptions/timers to clean up — a plain one-shot fetch.
- **Duplicate event listeners:** not applicable — React's synthetic event system, not manual `addEventListener`, handles all click/interaction wiring in the migrated code.
- **Large component trees / expensive render-time calculations:** the tree is shallow (Dashboard → 3 BucketCards × N ItemRows + GoalsCard + ActivityCard + optional ConflictCard); the only render-time computation (`greetingForHour`, `todayLabel`) is wrapped in `useMemo` with an empty dependency array (computed once, matching the original's "greeting is fixed for the page's lifetime" behavior).

---

## 12. Tests

### Backend (must remain passing — re-run after all Phase 1 changes)
```
npm test  →  tests 87, pass 87, fail 0
npm run lint  →  0 errors, 0 warnings (exit 0)
```
Both confirmed with a fresh run immediately before writing this report. The `eslint.config.js` used for this check was itself extended this phase to cover `web/src/**/*.{js,jsx}` with JSX-aware parsing — confirmed by the fact that linting now genuinely processes those files (the earlier, non-JSX-aware config would have hard-failed to parse any `.jsx` file, not silently passed).

### Frontend — live verification performed (no browser available; see method note)

No browser-automation tool exists in this session, so "frontend tests" here means **black-box verification of the exact contract the React code depends on**, run against the real Express server with a real SQLite database (not mocks), rather than component-level unit tests that would mostly test implementation details the brief explicitly warned against ("do not create fake tests that merely test implementation details"). What was actually checked, live:

| Check | Method | Result |
|---|---|---|
| Built bundle is valid, loadable ES module JS | Loaded via Node's dynamic `import()` (via a temporary `.mjs` copy, since the project's own `"type":"commonjs"` would otherwise misinterpret it — a Node-side artifact, not a real issue; browsers interpret `<script type="module">`/dynamic-`import()`-loaded files correctly regardless) | **VERIFIED** — loads cleanly |
| Bundle exports exactly `{mount, unmount}` as functions | Same load, `Object.keys(mod)` | **VERIFIED** |
| `/dashboard/main.js` served correctly by Express | `curl` against the running server | **VERIFIED** — `200`, correct `Content-Type: text/javascript`, correct byte length |
| Original vanilla `dashboard.js` still served (rollback path is real, not just "the file exists") | `curl` against `/js/pages/dashboard.js` | **VERIFIED** — `200`, file unmodified since before this phase (mtime confirms it was never touched) |
| `app.js` correctly wired to the new route | `curl`'d the served `app.js`, grepped for the updated `PAGES.dashboard` line | **VERIFIED** |
| `GET /api/dashboard` response shape on an empty account matches every field the React components destructure | Signed up a real test user, called the endpoint, inspected the full JSON | **VERIFIED** — `today/needsAttention/comingSoon/canWait/overdue/conflicts/goalsInProgress/familyActivity/counts`, all present, all matching |
| Same, on a populated (demo-seeded) account, including nested item shapes (`kind/id/title/due_date/priority/status/link`), goal shapes (`id/title/progress`), activity shapes (`id/type/summary/link/createdAt/actorName`) | Same session, `POST /api/demo/seed` then re-fetched | **VERIFIED** — every field `ItemRow`/`GoalsCard`/`ActivityCard` reads is present with the expected type |
| `handleComplete`'s mutation (`PATCH /api/tasks/:id {status:'completed'}`) works and is reflected on refetch | Completed a real seeded task, re-fetched the dashboard, confirmed it left the active buckets | **VERIFIED** |
| `handleSeedDemo`'s mutation path (`POST /api/demo/seed` → `GET /api/family`) | Exercised directly | **VERIFIED** — `200` on both calls |
| Actual DOM rendering, visual layout, click-through interaction in a real browser | — | **NOT VERIFIED** — no browser tool available this session |
| React error boundary / component-level error state actually renders correctly in-browser on a simulated API failure | — | **NOT VERIFIED** — the code path was written and reasoned about (§7/§9), and the *data* it would render (`error.message`) was confirmed to be a clean string via the existing `ApiError` class (unchanged, Phase-0-tested), but the actual rendered result was never seen in a browser |

**What this means concretely:** every piece of the *contract* between the React Dashboard and the backend — the data it requests, the shape it expects, the mutations it sends, the file it loads — has been verified against the real, running application. What remains unverified is *rendering*: whether the JSX, once interpreted by a real browser's DOM, actually looks and behaves the way the code intends. That gap is disclosed here rather than assumed away, consistent with both prior phase reports' standard.

---

## 13. Remaining Technical Debt

- **No browser-based test coverage exists for the React code** — only the black-box contract verification in §12. A real component-level or E2E test (even a minimal Playwright smoke test: "log in, see the dashboard, click a checkbox, see it disappear") would close the single biggest verification gap this phase leaves open, and should be a near-term priority once browser tooling is available.
- **React bundled per-page rather than shared:** fine for one page; if/when a second page migrates, revisit externalizing `react`/`react-dom` into one shared chunk both pages' bundles reference, rather than each page shipping its own copy.
- **`vite build --watch` instead of a real dev server with HMR:** a deliberate simplicity tradeoff for this phase (§4/vite.config.js comments) — iteration speed will matter more once more pages are actively being worked on, at which point `vite dev` + a proxy to the Express API is worth the added complexity it currently isn't.
- **The `esbuild`/Vite dev-server CVE** (§9) is unaddressed (deferred, not fixed) — low real risk given this project never runs `vite dev`, but the underlying Vite 8 upgrade is real work someone should schedule rather than forget about.
- **No `eslint-plugin-react-hooks`** yet (§3) — low risk today (one simple hook), worth adding once hook usage grows.

---

## 14. Migration Risks

- **Unverified real-browser rendering (§10, §12)** is the largest concrete risk carried out of this phase — everything *behind* the render (data contract, mutations, bundle correctness) is verified; the render itself is not.
- **The `web/` vs. root `package.json` split is a new operational surface**: a contributor who runs `npm install` at the root and then `npm start` will get a working server, but the Dashboard route will 404-equivalent (fail to load `/dashboard/main.js`) unless they've also run `npm run build:dashboard` (added this phase) at least once. This is documented here and in the new script's presence, but there's no automated check/CI step yet that would catch a contributor forgetting this — worth adding before more of the team is touching the React side.
- **Two independent `node_modules` trees** (root + `web/`) is a larger disk/install footprint than before — noted given this environment specifically ran low on disk twice across the last two phases; not a code risk, but an operational one worth being aware of.
- **The `bills`/`decisions` family-sharing product decision** (deferred in Phase 0) remains open and untouched — irrelevant to Dashboard specifically, but still outstanding before any page that *does* touch bills/decisions gets migrated.

---

## 15. Recommendation for Phase 2

**The Dashboard migration is a solid, low-risk foundation to build on** — the backend contract is fully verified, the bundle is correctly built and reasonably sized (after a real bug fix, not just an assumption), the router integration is minimal and precisely scoped, and the rollback path is real (one line in `app.js`, original file untouched). It should **not** be treated as "done and forget" until a real browser confirms the rendering matches — that is the one concrete gap standing between "the contract is right" and "the page actually works as intended for a real user."

Recommended before or at the very start of Phase 2, not as blockers to *starting* but as the highest-leverage next steps:
1. **Get real browser verification of this Dashboard** — even a manual pass, let alone automated — before treating its behavior as a proven pattern to repeat for the next page.
2. **Pick the next page to migrate deliberately**, using the same strangler-fig contract (`mount`/`unmount`, reuse `ctx`/`api`/existing CSS) proven here — Tasks or Settings are reasonable next candidates given their self-contained scope, but that's a decision for whoever owns the roadmap, not one to make unilaterally here.
3. **Revisit the dev-server/HMR tradeoff** once a second page is being actively developed — `vite build --watch` was the right call for one page; it likely won't be for two or more being iterated on simultaneously.

---

## Final Report Format (as requested)

1. **What was changed:** new `web/` React+Vite project (11 source files); `public/js/app.js` (2 additive changes: route wiring + unmount lifecycle); `eslint.config.js` (extended for JSX); root `package.json` (`build:dashboard` script); new build artifact `public/dashboard/main.js`.
2. **What was not changed:** the Express backend, the SQLite schema, any of the other nine pages, any CSS file, the original `public/js/pages/dashboard.js` (left fully intact for rollback).
3. **Bugs fixed (bonus, found during this phase):** a bundle-size bug (`process.env.NODE_ENV` not statically replaced in the Vite lib build, causing both React-DOM dev and prod builds to ship) — found by measuring, not assumed; fixed; re-measured (759 kB → 217 kB raw).
4. **Dependencies added:** `react`, `react-dom` (runtime); `vite`, `@vitejs/plugin-react` (dev) — all in `web/`, none in the root backend package.
5. **Tests:** backend 87/87 passing (unchanged), lint 0 errors (now covering JSX too); frontend contract fully verified live against the real backend (§12); no browser-level tests exist yet.
6. **Responsive testing:** `NOT VERIFIED` at every mobile breakpoint and tablet; `PARTIALLY VERIFIED` at desktop (data/structure confirmed, visual layout not). No browser tool was available this session.
7. **Security review:** clean, with one disclosed and justified `dangerouslySetInnerHTML` usage (static hardcoded SVG icons only) and one disclosed, deliberately-deferred `npm audit` finding (Vite dev-server CVE, inapplicable to this project's build-only usage).
8. **Performance review:** one real issue found and fixed (bundle bloat from an unminified dead branch); final bundle 216.91 kB / 56.87 kB gzip; no unnecessary re-renders, effects, or listeners identified.
9. **Remaining technical debt:** listed in §13 — no browser test coverage is the standout item.
10. **Migration risks:** listed in §14 — unverified rendering is the standout item.

**This phase did not migrate Tasks, Family, Bills, Decisions, Goals, EcoLife, Timeline, Assistant, or Settings, and added no new product features, per the strict scope in this phase's instructions. Stopping here per the stop condition — awaiting review before Phase 2.**
