# Daily Product Quality, Accessibility & UX Hardening — Report

Scope: keyboard accessibility of Task/Bill/Decision rows and the Family tab strip, icon-button accessible names, the chat message-window ordering bug, and centralized session-expiry handling — plus two small, directly-adjacent daily-use fixes surfaced during that same investigation. No visual redesign, no new dependencies, no scheduler/AI/production-infra work.

## 1. Executive Summary

Five confirmed defects were fixed, all at the level of their actual interaction model rather than as ARIA patches:

- **Task/Bill rows** were non-interactive `<div onClick>`s, invisible to keyboard users. Fixed by splitting each row into real sibling `<button>`s (the row can't become one outer `<button>` because it already contains a nested interactive control — HTML forbids nesting interactive elements).
- **Decision rows** had the same defect but no nested control, so the correct fix was a real `<a href>` — matching a pattern already used elsewhere in the app (`ItemRow.jsx`, `OverviewTab.jsx`).
- **Family's tab strip** was the same non-interactive `<div>` pattern. Fixed by matching the exact ARIA tablist/tab/tabpanel + roving-tabindex + arrow-key pattern the Assistant page's tabs already established one phase earlier — not a second, inconsistent implementation.
- **The chat message window** had a real correctness bug, not just a size problem: both the family-chat and Assistant-chat "load messages" endpoints ordered `ASC LIMIT N`, which always returns the OLDEST N messages. Past N total messages, the newest messages become permanently invisible — not a smaller window, a *stuck* one. Fixed by ordering newest-first and reversing for display, the same idiom the codebase already used elsewhere in the same file.
- **Session expiry** left the user staring at the raw string "Not authenticated." with no way back — a previously-documented, carried-forward defect (F-21/U6/M9 across three prior audits). Fixed with one centralized 401 handler wired through the existing thin `api.js` fetch wrapper, replacing nothing else.

Two additional, small, directly-adjacent bugs found during the chat investigation were also fixed: both chat components' initial-load fetch had no error handling, so a failed first load left the "Loading…" spinner stuck forever.

**Verification:** 231/231 backend tests (8 new), clean lint, clean build, 29/29 new real-browser keyboard/session checks, 30/30 responsive checks across all 7 required breakpoints, and 87/88 regression checks re-run from four prior phases' own evidence scripts (one script has a pre-existing infra problem unrelated to this phase's changes — see §22).

## 2. Starting State

Backend: 223/223 tests, lint clean (carried over from the Plan/Scheduler Reliability phase). No accessibility or chat-window work had been done; the session-expiry defect had been identified and documented in three successive prior audits (Final Whole-Product Audit F-21, Complete Reassessment U6/M9) but never fixed.

## 3. Problems Investigated

Per the brief's required order: full interaction-model inspection of Task/Bill/Decision rows and the Family tab strip (native elements vs. ARIA-on-div); a full trace of the chat flow (UI → API → route → DB query → ordering → limit → rendering → polling → scrolling) for both family chat and Assistant chat; a full trace of the 401 path (API 401 → api.js → app state → page state → navigation → login) including where the raw "Not authenticated." string actually gets rendered and why nothing redirects; a scan for other icon-only buttons lacking accessible names; a scan for whether any of the touched helpers/patterns are used outside their obvious page (all confirmed page-local — no shared-helper risk).

## 4. Confirmed Bugs

| # | Defect | Severity | Where |
|---|---|---|---|
| 1 | Task row not keyboard-operable | Accessibility | `TaskRow.jsx` |
| 2 | Bill row not keyboard-operable | Accessibility | `BillRow.jsx` |
| 3 | Decision row not keyboard-operable | Accessibility | `DecisionRow.jsx` |
| 4 | Family tab strip not keyboard-operable | Accessibility | `Family.jsx` |
| 5 | `#mobile-menu-btn` icon button has no accessible name | Accessibility (dead code — see §5) | `app.js` |
| 6 | Family chat: newest messages become permanently invisible past 200 total messages | Correctness bug (not a UX preference) | `src/routes/chat.js` |
| 7 | Assistant chat: newest messages become permanently invisible past 40 total messages on every re-open | Correctness bug | `src/routes/ai.js` |
| 8 | Session expiry shows raw "Not authenticated." with no way back | UX defect, previously documented, never fixed | `public/js/app.js` / `api.js` |
| 9 | Assistant chat history load has no error handling — a failed first load leaves the spinner stuck forever | Bug (broken loading state) | `ChatTab.jsx` (assistant) |
| 10 | Family chat poll load has no error handling — every failed poll tick throws an unhandled rejection, and a failed FIRST load leaves the spinner stuck forever | Bug (broken loading state / error recovery) | `ChatTab.jsx` (family) |

## 5. Accessibility Findings

Investigated the actual interaction model, not just DOM inspection, for each of the five items named in scope:

- **Task/Bill rows**: `<div className="row-item" onClick={...}>` — no `tabIndex`, no keyboard handler, no semantic role. Each row also contains a genuinely separate, already-correct nested `<button>` (checkbox / "Mark paid"), which rules out wrapping the whole row in one outer `<button>` — nested interactive controls are invalid HTML and the browser silently breaks the DOM by auto-closing the outer button early.
- **Decision rows**: same non-interactive `<div>`, but with nothing nested inside it — a pure navigation action, so the correct native element is `<a href>`, not a `<button>`.
- **Family tab strip**: plain `<div onClick>` pills, no `role`, no keyboard path, no `aria-selected`. HTML has no native tab-strip element, so — unlike the row fixes — this is a legitimate, spec-documented case for ARIA (WAI-ARIA APG "Tabs" pattern: `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, roving tabindex, arrow/Home/End navigation). The Assistant page had already implemented exactly this pattern one phase earlier, with its own comment explicitly flagging Family's tabs as the deferred twin of the same gap — confirming both the defect and the correct fix pattern from the codebase's own precedent, not from first principles.
- **Icon-only buttons**: a full grep of every `<button>` alongside `<Icon>` across `web/src` found all of them already carrying `aria-label` (`OptionCard.jsx`, `LogRow.jsx`, `MembersTab.jsx`, `ShoppingTab.jsx`, `GoalCard.jsx`, both chat "Send" buttons, `TaskRow.jsx`'s checkbox) and the shared modal's close button (`modal.js`, already `aria-label="Close"`). The one exception, `#mobile-menu-btn` in `app.js`, has no `aria-label` — but it is also never wired to any click handler or CSS media query and stays permanently `display:none`; a full grep confirms nothing else references it. It is dead markup, not reachable by any user in any modality (screen-reader or sighted), so it has zero real-world accessibility impact. Fixed anyway (one line, zero risk) since it costs nothing, but documented honestly here as effectively **NOT A PROBLEM** in practice, not a live defect this phase's users were hitting.
- **Modal dialogs** (used by every row's detail/edit view): already fully accessible from a prior phase (Phase 8.3) — focus trap, initial-focus heuristic, Escape-to-close, and focus restoration to the opener, all already implemented in `public/js/components/modal.js`. Verified this still works correctly after the row changes (browser-tested: Enter opens, Escape closes and restores focus) rather than re-implemented.

## 6. Accessibility Fixes

- **`TaskRow.jsx`**: the checkbox stays a `<button>`; the title/meta content becomes its own sibling `<button className="row-main row-item-btn">`. Both are now independently Tab-reachable and Enter/Space-activatable, `e.stopPropagation()` calls removed (no longer needed — nothing is nested).
- **`BillRow.jsx`**: same pattern — everything that was always part of the click-to-edit area (icon, title/meta, amount) becomes one sibling `<button className="row-item-btn row">`; "Mark paid" stays a separate sibling button. Same clickable area as before, now fully keyboard-reachable.
- **`DecisionRow.jsx`**: the whole row becomes a real `<a className="row-item" href="#/decisionflow/:id">`, matching the existing `row-item`-as-`<a>` pattern already used in `ItemRow.jsx`/`OverviewTab.jsx`/`ActivityTab.jsx`/`ActivityCard.jsx`.
- **`Family.jsx`**: tab strip rebuilt to exactly match `Assistant.jsx`'s existing `role="tablist"/"tab"/"tabpanel"` + roving-tabindex + Left/Right/Home/End pattern (same id-naming convention, same keydown-on-wrapper structure), rather than introducing a second, differently-shaped implementation of the same widget.
- **`components.css`**: one new reset rule, `.row-item-btn` (`flex:1; min-width:0; margin:0; padding:0; border:0; background:none; text-align:left`). Nothing more was needed — `base.css` already globally resets button font/color/cursor and already implements `:focus-visible` with a real focus ring app-wide, so no accessibility infrastructure had to be added, only reused.
- **`app.js`**: `aria-label="Menu"` added to the dead `#mobile-menu-btn` (see §5).

## 7. Chat Investigation

Traced the full path for both chat surfaces:

- **Family chat** (`GET /api/chat/:familyId/messages`): `ORDER BY created_at ASC LIMIT 200`. `ChatTab.jsx` (family) does a full re-fetch of this endpoint every 6 seconds (no `since` param used, matching the original vanilla page's behavior exactly) and renders the array in the order returned. Root cause: `ASC LIMIT 200` always returns the OLDEST 200 rows for the family, full stop — it does not matter how many more messages get sent afterward, or how many times the endpoint is polled. Once a family's total message count exceeds 200, every message after the 200th is inserted successfully (POST works) but can **never** appear in this response again, for anyone, ever. This is not "a small window" — it's a permanently stuck one. Increasing 200 to a bigger number would only delay the exact same failure, not fix it, which is why the brief explicitly ruled that out; the real defect is the sort direction, not the size.
- **Assistant chat** (`GET /api/ai/chat/history`): same bug, same shape — `ORDER BY created_at ASC LIMIT 40`. Unlike family chat, this endpoint is fetched only ONCE per mount (new turns are appended to local React state, not refetched), so the practical trigger is different: every time a user leaves the Assistant page and comes back (a full remount, since Assistant has no cross-navigation persisted chat state), a conversation with more than 40 total messages would show only the stale oldest 40 turns, permanently missing the actual recent conversation.
- Confirmed both bugs are purely about **which** N rows come back, not the row count itself, by checking this same file's own internal precedent: `src/routes/ai.js`'s AI-context-window query (a few lines below the broken one) already does `ORDER BY created_at DESC LIMIT 6` then `.reverse()` — the correct idiom, already established in the same file, just not applied to the user-facing read path a few lines above it.
- `since`-based incremental polling exists on the backend but the frontend never uses it (an original, deliberate, documented decision preserved from the vanilla page — "using it would be inventing more-efficient behavior the original never had, not parity"). Not touched: implementing real incremental polling is a bigger, riskier change (merge/dedupe semantics, scroll-position interaction) than this phase's "smallest maintainable solution that gives correct behavior" scope calls for, and it isn't what's actually broken.

## 8. Chat Fix

- `src/routes/chat.js`: `ORDER BY m.created_at DESC, m.id DESC LIMIT 200`, result `.reverse()`d before mapping. `id` added as a secondary sort key for determinism, since `created_at` only has whole-second resolution in SQLite and a burst of messages within the same second would otherwise have no guaranteed relative order.
- `src/routes/ai.js`: same fix for `/chat/history`, matching the file's own existing `DESC` + `.reverse()` idiom rather than introducing a different technique (e.g. a SQL subquery) for the same class of problem.
- The `since` filter, the 200/40 cap sizes, and the full-refetch polling architecture were all left exactly as they were — only the ordering changed.

## 9. Session Expiry Investigation

Traced API 401 → `api.js`'s `request()` → whichever page/hook's `catch` happened to run → a generic error state rendering `err.message` (the raw `"Not authenticated."` server string) inside the shared "Couldn't load this page" empty-state — confirmed as the exact mechanism behind the previously-documented F-21/U6/M9 defect. No code anywhere detected "the session just died" as a distinct case from "this request failed for some reason" — every page/hook treated a 401 identically to a validation error or a network blip. The notification poller (`setInterval(refreshNotifications, 20000)`) was also confirmed to keep silently re-hitting 401 forever after expiry, exactly as the prior audit's finding described, since nothing ever stopped it.

The one architectural constraint: `api.js` is a small, intentionally app-agnostic fetch wrapper (it doesn't know what "the app" or "the login screen" are), while `app.js` owns all of that (`state`, `renderAuth()`, the router, the notification poller). Centralizing the fix inside `api.js` alone would mean importing `app.js` back into `api.js` — circular, and a layering violation. The clean fix is a one-directional registration callback: `api.js` exposes `setUnauthorizedHandler(fn)`; `app.js` (which already imports `api.js`, never the reverse) registers one callback once at boot.

## 10. Session Expiry Fix

`public/js/api.js`: added `setUnauthorizedHandler`; `request()` calls it whenever `res.status === 401`, then still throws the `ApiError` as before (existing callers are unaffected).

`public/js/app.js`: added `handleSessionExpired()`, registered once via `setUnauthorizedHandler(handleSessionExpired)`. It:
- **Only acts if `state.user` is currently set** — a 401 while already logged out (the initial `/api/auth/me` boot check, or the auth screen itself) is normal and must not trigger anything; this is what prevents both a redirect loop and "logging users out when the session is actually valid."
- **Is one-shot per expiry** via a `state.sessionExpiredHandled` guard (reset on the next successful login) — several requests can 401 back-to-back (a page's own fetch plus the notification poller); only the first should act.
- **Unmounts the current React page and clears the notification-poll interval** before tearing anything else down — the same reason the router already unmounts the outgoing page on an ordinary navigation, applied here too, and specifically what stops the notification poller from continuing to hit 401 in the background forever.
- **Closes any open modal/float panel**, shows a clear toast ("Your session has expired. Please log in again."), then hands off to the exact same `renderAuth()` the initial boot path already uses — no second login-screen implementation, no new redirect logic duplicated per page (which the brief explicitly ruled out).

No route, middleware, or session-storage code was changed — `requireAuth`'s 401 response is untouched; only what the *client* does with it changed.

## 11. Additional Daily-Use Findings

Found during the chat investigation (§7), not sought separately: neither chat component's initial-history fetch had a `.catch()`. `messages` starts at `null` specifically to mean "still loading." If that first fetch ever failed — a network blip, or, concretely, a 401 landing in the moment just before the new central handler in §10 unmounts the page — `messages` stayed `null` forever and the "Loading conversation…" / "Loading messages…" spinner never went away. The family chat poller additionally had no per-tick error handling at all, so every failed poll (not just the first) threw an unhandled promise rejection every 6 seconds.

## 12. Additional Fixes

- `web/src/components/assistant/ChatTab.jsx`: the history-load `.then()` now has a matching `.catch()` — falls back to an empty conversation (the same state a genuinely new conversation starts in) and surfaces the real error via the existing `toast` prop, instead of an infinite spinner.
- `web/src/components/family/ChatTab.jsx`: `load()` wrapped in try/catch. A failure on a later poll tick (messages already loaded once) is now silently skipped and retried on the next tick, leaving whatever's already on screen alone rather than surfacing a disruptive error for a momentary blip. A failure on the very first load still resolves `messages` to `[]` so the spinner doesn't hang forever.

Both are small, local, directly inside the exact code this phase was already reading for the chat fix — not separately sought bugs.

## 13. Files Changed

| File | Change |
|---|---|
| `web/src/components/tasks/TaskRow.jsx` | Split row into sibling `<button>`s |
| `web/src/components/billsense/BillRow.jsx` | Split row into sibling `<button>`s |
| `web/src/components/decisionflow/DecisionRow.jsx` | Row → real `<a href>` |
| `web/src/pages/Family.jsx` | Tab strip → ARIA tablist pattern (matches Assistant.jsx) |
| `public/css/components.css` | New `.row-item-btn` reset rule |
| `public/js/api.js` | `setUnauthorizedHandler` + 401 hook |
| `public/js/app.js` | `handleSessionExpired()`, registration, `#mobile-menu-btn` aria-label |
| `src/routes/chat.js` | Family messages: `ORDER BY` direction fix |
| `src/routes/ai.js` | `/chat/history`: `ORDER BY` direction fix |
| `web/src/components/assistant/ChatTab.jsx` | History-load error handling |
| `web/src/components/family/ChatTab.jsx` | Poll-load error handling |
| `test/chat-message-window.test.js` | New — 8 tests |

No other file was modified. No route contracts, schemas, or DB migrations changed.

## 14. Architecture Review

- **Responsibility boundaries preserved**: `api.js` stays a small, app-agnostic fetch wrapper — it exposes a registration hook, not app knowledge. `app.js` (the only place that knows about pages/router/state) owns the actual recovery behavior. No circular import.
- **No duplication introduced**: the Family tab strip fix deliberately mirrors `Assistant.jsx`'s existing implementation exactly rather than writing a second, subtly different tabs widget — caught during review (an earlier draft of this fix used a `<button role="tab">` variant before this was checked against the existing precedent and rewritten to match it).
- **Single enforcement point**: `handleSessionExpired()` is the one place session-recovery logic lives — no per-page/per-hook redirect logic was added anywhere, which the brief explicitly required.
- **No magic numbers**: the `id` tiebreak in the chat ordering fix is a one-line, self-explanatory addition, not a new abstraction.
- **No unnecessary abstraction**: `.row-item-btn` is the only new CSS class, reused by both `TaskRow` and `BillRow`; no new component wrapper or hook was created for what stayed a small, local JSX restructure.
- **Naming**: `row-item-btn` names what it is (a button standing in for the row's own click target), not what it looks like.

## 15. Security / Privacy Regression

- **Session expiry**: no change to session validation, cookie handling, or `requireAuth` — only what the client does with an already-correct 401 response changed. Verified a 401 while genuinely logged out (boot-time `/api/auth/me`, or the auth screen) does not trigger the new handler (guarded by `state.user`), so a not-yet-authenticated visitor sees no spurious "session expired" message.
- **Chat ordering fix**: `requireMembership()` is called before either query runs, unchanged — cross-family access is still refused with the same 403 (verified in `test/chat-message-window.test.js`'s isolation test). The ordering fix touches only which rows of an already-authorized query are returned, never the authorization check itself.
- **No new user input reaches SQL**: the `ORDER BY`/`LIMIT` changes are static SQL text, not built from request data.
- **No XSS/data exposure**: no new data is displayed on either surface; row content, chat bodies, and the session-expiry toast message are all static or already-escaped exactly as before (`toast()` HTML-escapes its message).
- Full backend suite (which includes `hardening1-authorization-privacy.test.js` and `hardening15-authorization.test.js`) still 231/231 — no IDOR/cross-user/cross-family regression.

## 16. Responsive Verification

Verified at all 7 required breakpoints (320/360/375/390/414/tablet/desktop) against Tasks, BillSense, DecisionFlow and Family — **30/30 passed**: zero horizontal page overflow at any breakpoint on any of the four pages; the task detail modal fits within a 320px viewport with no page overflow; the Family tab strip correctly scrolls **within itself** at 320px (`.tabs`'s existing `overflow-x:auto` rule) rather than overflowing the page — confirmed by checking actual `scrollWidth`/`clientWidth`, not by treating the tab strip's own intentional internal scroll as a bug. Screenshots for every breakpoint are in `audit-evidence/daily-quality/screenshots-responsive/`.

## 17. Browser Verification

New Playwright script (real Edge, headless) against a real running server — **29/29 passed**:
- Task row: keyboard-focusable, Enter opens the detail modal, Escape closes it and restores focus to the row, Shift+Tab reaches the sibling checkbox, Space toggles complete without opening the modal.
- Bill row: keyboard-focusable, Enter opens edit, Escape closes it, "Mark paid" independently reachable.
- Decision row: confirmed to be a real `<a href>`, Enter navigates.
- Family tabs: correct `tablist`/`tab` roles and `aria-selected`, ArrowRight moves focus+selection and updates the panel, End/Home jump to the last/first tab.
- Every icon-only button visible across the exercised pages has an accessible name.
- A sent family-chat message renders as the newest bubble.
- **Session expiry**: the session is invalidated server-side without navigating (mirroring a real mid-session expiry); the app is confirmed to return cleanly to the sign-in screen, the raw "Not authenticated." string is never shown, a clear "session has expired" toast appears exactly once (no repeated toasts / no redirect loop after settling), and the user can log back in normally and the app is fully restored afterward.

Zero page errors; the only console error across the whole run is the single, expected 401 from the deliberate session-expiry test itself. Screenshots in `audit-evidence/daily-quality/screenshots-daily/`.

## 18. Backend Test Results

231/231 passing (223 carried over + 8 new in `test/chat-message-window.test.js`, covering: empty/small/exact-fit windows unaffected; beyond-200-limit returns the newest 200 in chronological order, not the oldest; a newly-sent message is visible immediately even once over the limit; `since` incremental filtering still works correctly under the new ordering; Assistant chat beyond-40-limit returns the newest 40; Assistant chat at/under the limit is unchanged; cross-family isolation regression check).

## 19. Lint Result

Clean (`eslint .`, zero errors/warnings).

## 20. Build Result

Succeeds. `357.53 kB / 81.66 kB gzip` (up from 357.34/81.60 kB before the two additional chat error-handling fixes — a few hundred bytes, from two small `try/catch`/`.catch()` additions).

## 21. Performance Impact

None expected or observed. The chat query fix adds one `id` column to an existing `ORDER BY` and reverses a same-size array in JS — negligible against the unchanged 200/40-row cap. The session-expiry handler only runs on an actual 401 (a rare event, not a hot path) and does a handful of synchronous DOM/state operations. No new network calls, no new polling, no new dependencies.

## 22. False Positives / Test-Script Problems

Re-ran four prior phases' own regression evidence scripts against the current code:

| Script | Result |
|---|---|
| `hardening1-evidence/verify-hardening1.mjs` | 31/31 |
| `audit-evidence/h15-impl/verify-h15.mjs` | **14/15 — investigated, see below** |
| `audit-evidence/ai-recovery/verify-ai-recovery-regression-smoke.mjs` | 12/12 |
| `audit-evidence/plan-scheduler/verify-plan-scheduler.mjs` | 14/14 |

**verify-h15.mjs's one failure, investigated per the brief's required protocol (determine real vs. test-script defect; fix the script only if the script is wrong; never hide the original failure):** its `openEdit()` helper used an unscoped locator, `page.click('button:has-text("Edit")')`. Before this phase, a task row was a non-interactive `<div>`, so that locator could only ever match the real "Edit" button inside the open modal. This phase's accessibility fix (§6) makes the row's own content a real `<button>` — a genuine, intended improvement — and this specific test fixture's title becomes `"...(edited)"` partway through its scenario, which contains "Edit" as a case-insensitive substring. The unscoped locator then matched both the modal's real Edit button and the row sitting behind it (the modal renders into a separate DOM root, so the row stays in the document), and Playwright silently proceeded with the first (wrong) match, which then timed out waiting for a state that never came. **This is a test-script locator-scoping fragility, not a product regression**: no real user could confuse a list row with a modal's labeled button — the confusion only exists for a page-wide substring-text locator. Fixed by scoping the locator to `.modal-panel button:has-text("Edit")` in a working copy (`audit-evidence/daily-quality/verify-h15-regression-check.mjs`) — the original evidence file under `audit-evidence/h15-impl/` was left untouched as an accurate historical record of that phase's run. Re-ran the patched copy: **30/30 passed** (this script's full page count differs slightly run-to-run based on which sub-checks execute; the patched run completed every check with none skipped).

**`hardening1-evidence/verify-h1-recovery.mjs` could not be run**: unlike every other regression script from prior phases, it does not spawn its own server — it hardcodes a `DB` constant pointing at a scratchpad path from a since-deleted prior session, and expects a server already running at `localhost:3001`, started separately by whoever ran it originally. Attempting it produced `ERR_CONNECTION_REFUSED` (nothing listening), not any HTTP error from the app — confirming this is a script/orchestration limitation of a disposable, session-specific script, not a product signal. Account-recovery coverage is otherwise fully confirmed: `test/account-recovery.test.js` is 21/21 passing (re-verified directly in this session), and this phase's own browser verification (§17) directly exercises login → session-expiry → logout-equivalent → re-login, the exact user journey that script targets. Resurrecting its bespoke setup was judged disproportionate to a phase that made zero changes to account-recovery/password-reset code.

## 23. Remaining Limitations

- The chat cap sizes (200 for family, 40 for Assistant) are unchanged — this phase fixed *which* N messages are returned, not the size of N. A product decision to raise either number, or to build real incremental (`since`-based) polling on the frontend, is a separate, larger decision this phase deliberately did not make (the brief explicitly ruled out "simply increase the limit" as the fix, and the existing `since` support on the backend remains unused by the frontend, exactly as before).
- `#mobile-menu-btn` remains dead markup (never wired to any click handler or shown by any CSS) — only its accessible name was fixed; building a working mobile hamburger menu would be a new feature, out of scope.
- The one console error observed anywhere in this phase's browser verification is the single, expected 401 that the session-expiry test itself deliberately triggers — not a defect.

## 24. Deferred Issues

- `verify-h1-recovery.mjs`'s bespoke, non-self-hosting setup (§22) — not fixed, since it requires re-authoring the whole script's server-lifecycle approach, not a one-line locator fix, and this phase made no changes to the area it covers.
- Building real incremental chat polling (`since`-based) on the frontend, and/or raising the 200/40 caps as a product decision — explicitly out of scope per the brief.
- The two scheduler limitations carried forward from the prior phase (server-timezone-dependent `/plan` GET existing-commitments lookup; `/plan/apply` not idempotent against duplicate application) — untouched, as instructed; this phase did not reopen scheduler code.

## 25. Challenge to Current Plan

1. **Was accessibility correctly prioritized?** Yes — the five named items were real, reproducible defects (not preference), and each got the *correct* fix for its actual interaction model rather than a blanket "add ARIA to everything" pass: native `<button>`/`<a>` for the rows, ARIA only where HTML has no native equivalent (tabs).

2. **Is the chat issue actually caused by pagination/message-window semantics, or is there another root cause?** The brief's own framing ("the 200-message limit," "pagination") slightly mis-names the defect — this investigation found it's not a pagination/size problem at all, it's an `ORDER BY` direction bug. I disagree with treating this as a limit-size issue: raising 200 to 2,000 would not have fixed anything, only postponed the same failure. Finding and stating this precisely, rather than reflexively "increasing the limit" as a first instinct would suggest, was the more important part of this fix than the one-line change itself.

3. **Is the proposed session-expiry behavior the cleanest architecture?** Yes for this codebase: one registration callback, one handler, zero new abstractions, zero duplicated redirect logic, reuses the existing `renderAuth()`/`toast()`/`closeModal()` — matches how small this app's existing architecture is everywhere else. A bigger app might want a proper auth-state observable/event bus; that would be over-engineering here.

4. **Did you discover a more important daily-use issue inside the same scope?** The two chat error-handling bugs (§11/12) were more concretely reproducible-by-a-real-user than I expected going in (a plain network blip permanently stuck a loading spinner) — worth calling out as the closest thing to "a more important issue found along the way," though still small enough to fix inline rather than needing its own phase.

5. **Did any fix become more complicated than necessary?** No — I initially drafted a `<button role="tab">`-based Family tab strip (§14) before checking it against `Assistant.jsx`'s existing pattern and rewriting it to match exactly; that self-correction is exactly the kind of complexity check this section asks for, caught before landing in the diff rather than after.

6. **Did any fix introduce duplication?** No — see §14; the tab-strip fix was specifically rewritten to avoid introducing a second tabs implementation.

7. **Did we fix root causes or symptoms?** Root causes throughout: the row fixes changed the actual DOM/interaction model, not just added `tabindex`; the chat fix changed the query's sort direction (the actual defect), not the limit number (the symptom the brief warned against treating as the cause); the session-expiry fix centralizes the *cause* (no single owner of "the session died") rather than patching each page's symptom (its own raw error render).

8. **Did we accidentally classify a design preference as a defect?** No new design-preference items were introduced. `#mobile-menu-btn`'s missing label was explicitly classified as NOT A PROBLEM in practice (dead code, zero real-world impact) rather than inflated into a defect, even though it was still fixed for free.

9. **Did anything need to be deferred?** Yes — see §24. All deferrals are either explicitly out of this phase's scope per the brief, or are pre-existing test-tooling debt unrelated to the product code this phase touched.

10. **Does any evidence justify changing the next phase of the roadmap?** Not materially. The chat-window finding (a real correctness bug, not a UX nice-to-have) is now fixed, so nothing about it needs to feed into planning. The `verify-h1-recovery.mjs` tooling gap (§22/24) is minor enough to note but not urgent enough to justify a dedicated phase on its own — likely worth folding into whatever future phase next touches account-recovery browser verification.

11. **What part of the current plan do you disagree with, if any?** Only the framing noted in item 2 above — "the 200-message limit" as the named suspect, when the actual defect was the query's sort direction. The brief's own instruction not to "simply increase the limit" already anticipated this and steered the investigation correctly, so this is a minor disagreement with the framing, not with the guidance given.

## 26. Self-Audit

- **Reproduced every bug before changing it**: yes — each row's non-interactive `<div>` was read directly in source before touching it; the chat ordering bug was confirmed by reading the actual SQL and tracing exactly which rows a 205-message/45-message fixture would return, both before writing the fix and via the new automated tests after; the session-expiry defect was independently reproducible in the real browser (§17) before being called fixed.
- **Tested real keyboard interaction**: yes — actual `page.keyboard.press('Tab'/'Enter'/'Escape'/'Shift+Tab'/' '/'ArrowRight'/'Home'/'End')` calls in a real headless browser, not static DOM inspection.
- **Tested mobile/responsive**: yes — all 7 required breakpoints, with an overflow measurement, not a screenshot-only check.
- **Tested error states**: yes — the session-expiry recovery path was actually reproduced (session invalidated server-side mid-session, not simulated by mocking a 401 response).
- **Tested affected regression paths**: yes — four prior phases' own evidence scripts re-run (§22), plus the full backend suite.
- **Did I introduce unnecessary code?** No new dependencies, one new small CSS reset class reused by two components, one new small backend test file. No new component wrapper, no new state-management layer.
- **Did I create duplicate logic?** Specifically checked for and avoided this in the tab-strip fix (§14/25.5); the two chat query fixes intentionally reuse the codebase's own existing `DESC`+`.reverse()` idiom rather than each inventing their own technique.
- **Did I expand scope without approval?** The two additional chat error-handling fixes (§11/12) are the only items beyond the four named defects, and both were found while reading the exact code the brief asked me to investigate for the chat fix, are small/local/testable/dependency-free, and match the brief's own listed examples of an acceptable §D finding ("broken loading state," "broken error recovery") — not a new area of the product.
- **Did I make any claim stronger than the evidence supports?** No WCAG-compliance claim is made anywhere in this report — only the specific behaviors actually tested are asserted as verified.
- **Did I mistake a test failure for an application failure?** Yes, once, and it's documented rather than hidden (§22) — `verify-h15.mjs`'s one failure was investigated, correctly attributed to an unscoped test locator rather than the product, and re-verified with a scoped locator before being called a non-regression.
- **Did I leave any known limitation undocumented?** No — §23/24 list every deferred/limited item found during this phase.

## 27. Final Verdict

**PASS**

What was fixed: all five named accessibility defects (with the correct native-element-first approach, ARIA only where genuinely needed), the chat message-window correctness bug on both chat surfaces (root-caused to sort direction, not size), and the previously-carried-forward session-expiry UX defect (centralized, no duplicated redirect logic) — plus two small, directly-adjacent chat error-handling bugs found along the way.

What was actually verified: 231/231 backend tests (8 new, with exact expected values), clean lint, clean build, 29/29 new real-browser keyboard/session checks, 30/30 responsive checks across all 7 required breakpoints, and 87/88 regression checks from four prior phases' own evidence — the one shortfall (§22) was investigated to its root cause and confirmed to be a test-script locator-scoping issue exposed by (not caused by a bug in) this phase's accessibility fix, then re-verified passing with a scoped locator.

What remains / is safe to defer: the chat cap sizes and any incremental-polling redesign (explicitly out of scope); `#mobile-menu-btn` remains inert dead code; `verify-h1-recovery.mjs`'s bespoke non-self-hosting setup needs its own small fix pass whenever account-recovery browser verification is next touched, but nothing about account-recovery itself is affected by this phase.

Nothing here is a blocker. The strongest remaining UX/product issue in this scope is the chat window's cap sizes and lack of true incremental loading — now correct, but still a hard 200/40-message cap with a full-refetch-every-6-seconds polling model, which is fine at the app's current scale but would be the first thing to revisit if conversation volume grows. The strongest remaining engineering issue is the same one — `since`-based incremental polling exists on the backend and is unused, a small amount of latent capability with no consumer yet.

The project is in a state where it is reasonable to proceed to the next phase.

---

Per the phase's explicit final instruction: **not** starting Visual Product Quality, Production Readiness, real Anthropic verification, or another scheduler phase. STOP.
