# LifeAdmin — Phase 4: BillSense Migration to React + Vite

**Date:** 2026-09-28
**Scope:** Migrate BillSense — the fourth page, first genuinely CRUD-plus-analytics page (stats, category breakdown, recurring-bill state machine, AI insights) — to React, via the same strangler-fig pattern established in Phases 1–3.5. Backend unchanged. No other page migrated, no new product features, no redesign.

---

## 1. Executive Summary

BillSense is now a fully-featured React page: stat tiles, an AI-insights card, a bills list with click-to-edit rows and inline "Mark paid" actions, a category breakdown, a conditional overdue-bills card, and a create/edit/delete modal — all verified against the real backend in a real browser. **37/38 BillSense-specific checks passed**, plus a full 24-check regression sweep across Dashboard/Tasks/Family (all passing). The one failing check is a **pre-existing, already-documented shared-CSS overflow** (the `.dash-grid` CSS Grid `min-width:auto` issue Phase 1.5 first found on Dashboard), reproduced here for the third time — not a new defect introduced by this migration, and correctly left unfixed per this phase's scope boundary (see §21, §23–25).

**One genuine, shared-architecture bug was found and fixed during the pre-migration audit** (§23–24): `public/js/components/modal.js` silently dropped an already-open modal's `onClose` callback whenever a second modal (such as `confirmDialog()`) opened on top of it — meaning any React-rendered modal whose delete flow calls `confirmDialog()` never actually unmounted its React root. This already affected Tasks' `TaskDetailModal` (Phase 2) and Family's `MembersTab` (Phase 3), previously unnoticed because neither has cleanup work worth losing; it would have newly, actively affected BillSense's own edit/delete modal the moment it was migrated to React. Fixed at the shared `modal.js` level (a five-line change, not a redesign) since the defect lives in shared code, not BillSense-specific code — full reasoning and the fix itself are in §23–24, verified not to change any observable behavior via the full regression sweep.

**No stop condition was triggered.** Backend semantics for bills are fully tested and unambiguous; the only notable finding — that a bill's `family_id` column exists but is never used to grant cross-user visibility — is confirmed, existing, tested product behavior (not a bug, not a schema question) and is documented in §8 rather than acted on.

---

## 2. Scope

Migrate BillSense's frontend to React + Vite, preserving all existing functionality, API contracts, authentication, data persistence, loading/error/empty states, modal and confirmation behavior, form validation, date handling, and navigation. No backend route, database table/column, or business rule was changed. No BillSense feature was added, removed, or redesigned. Dashboard, Tasks, Family, and every not-yet-migrated vanilla page are unaffected except where explicitly noted (the shared `modal.js` fix, §23–24).

---

## 3. Pre-Migration Architecture

`public/js/pages/billsense.js` (211 lines, vanilla): module-level `ctxRef`/`rootRef`; `mount()` shows a full-page loading line, then `renderAll()` fetches `GET /api/bills` and `GET /api/bills/stats` via `Promise.all` and re-renders the whole page from an HTML template string on every load and every mutation (create/edit/delete/pay all call `renderAll()` again — the same "re-render everything" pattern already documented and improved-upon for Dashboard/Tasks/Family in prior phases). One modal (`openBillForm`, shared for create and edit) built on the existing vanilla `openModal`/`closeModal`. Destructive delete lives inside that modal's footer, gated by `confirmDialog`. AI insights load into a dedicated slot on button click, independent of the main page's loading state.

**Backend** (`src/routes/bills.js`, unchanged this phase): `GET /`, `GET /stats`, `POST /insights`, `POST /`, `PATCH /:id`, `POST /:id/pay`, `DELETE /:id` — every route scoped to `owner_id = req.user.id`, confirmed by the explicit backend test "a bill belongs to its owner only — another user cannot see or modify it." `POST /:id/pay` implements the recurrence state machine: `recurrence === 'none'` marks the bill permanently `paid`; any other recurrence (`weekly`/`monthly`/`yearly`) advances `due_date` via UTC-anchored date math and keeps `status = 'unpaid'`. All five backend test cases for this (creation, validation, monthly rollover, yearly rollover, non-recurring terminal state, per-owner isolation, stats determinism) were passing before this phase and remain passing after it — confirmed unchanged.

---

## 4. React Architecture

```
web/src/
  pages/BillSense.jsx                — page shell: stat tiles, AI-insights slot, bills list/empty state,
                                        category card, overdue card, add/edit modal wiring
  hooks/useBills.js                  — GET /api/bills + GET /api/bills/stats together, refetch()
  components/billsense/
    BillRow.jsx                      — one row: icon, title, meta, badge, amount, "Mark paid"
    CategoryBars.jsx                 — "By category" breakdown bars
    OverdueCard.jsx                  — conditional overdue-bills card
    AiInsightsCard.jsx               — renders whatever state the page's loadInsights() produced
    BillFormFields.jsx               — uncontrolled form fields (name/amount/currency/category/
                                        recurrence/dueDate/notes), read via FormData at save time
    BillFormModal.jsx                — exports openBillFormModal(); hybrid vanilla-shell + React-body
                                        modal, footer buttons (Delete/Cancel/Save) plain HTML,
                                        wired imperatively — same pattern as Tasks'/Family's modals
```

Wired into the existing shared bundle via `makePageMount(BillSense)` — the exact factory Phase 3.5 extracted specifically so the next page migration wouldn't need to hand-write its own mount/unmount block; this is the first page to actually benefit from that extraction. `public/js/app.js`'s `PAGES.billsense` now resolves `{mountBillsense, unmountBillsense}` from `/app/main.js`, matching Dashboard/Tasks/Family exactly. The original vanilla `public/js/pages/billsense.js` is untouched and unreferenced, kept only as the documented rollback path.

No abstraction beyond what already existed was introduced. The four-part abstraction test was applied explicitly once, for the `AiInsightsCard`/loading-indicator markup shared with eight other components app-wide (Dashboard/Tasks/Family) — real duplication, already repeated, likely to keep recurring, but two lines of pure markup using existing classes; extracting it would trade two inline lines for an import plus a component definition, a net loss of clarity for no behavioral gain. Kept local, consistent with the same call made in Phase 3.5 §9.

---

## 5. Files Changed

| File | Change |
|---|---|
| `public/js/components/modal.js` | Bugfix: an already-open modal's `onClose` now fires before a nested modal (e.g. `confirmDialog()`) overwrites it, instead of being silently dropped (§23–24) |
| `web/src/main.jsx` | Added `mountBillsense`/`unmountBillsense` via the existing `makePageMount()` factory |
| `public/js/app.js` | `PAGES.billsense` now resolves the shared React bundle; comment updated to reference Phases 1–4 and the vanilla `billsense.js` rollback path |
| **New:** `web/src/pages/BillSense.jsx`, 6 files under `web/src/components/billsense/`, `web/src/hooks/useBills.js` | The migration itself |

Not changed: any backend route, the database schema, any other page's component, any CSS file (BillSense reuses existing global classes exactly as Dashboard/Tasks/Family already do — zero new CSS was needed).

---

## 6. Components Created/Modified

See §4's tree. Six new components, one new hook, one page. `modal.js` (existing, shared) modified — five lines, described in full in §23–24.

---

## 7. Hooks Created/Modified

`useBills.js` — new. Follows the exact `{data, loading, error, refetch}` shape already established by `useDashboardData`/`useTasks`/`useFamilies` (Phase 3.5 §10c already examined this shared shape across three hooks and explicitly declined to abstract it further; this is now a fourth instance of the same, deliberately un-abstracted, pattern — the reasoning from Phase 3.5 still applies unchanged: each hook's surrounding logic differs enough that a generic wrapper would only cover the least interesting part).

---

## 8. API Contracts Used

`GET /api/bills`, `GET /api/bills/stats`, `POST /api/bills`, `PATCH /api/bills/:id`, `POST /api/bills/:id/pay`, `DELETE /api/bills/:id`, `POST /api/bills/insights` — all pre-existing, all unchanged, all confirmed via direct route inspection and the existing backend test suite.

**Family/authorization semantics confirmed, not extended:** the `bills` table has a `family_id` column and `POST /api/bills` accepts an optional `familyId` in its payload, but **no route ever filters or grants access by `family_id`** — every read and write is `owner_id`-scoped only, confirmed by the explicit backend test "a bill belongs to its owner only." The vanilla form never had a family-selector field, so `familyId` has always been `null` in practice. This is existing, intentional, tested behavior (bills are strictly private, per-owner) — the React form was built to match this exactly, with no family selector added. Documented here per Step 1.14's instruction to confirm current family-related product semantics, not to extend them.

---

## 9. User Flows

View bills + stats → add a bill (modal) → edit a bill (click row, same modal, pre-filled) → mark a bill paid (row button, no confirmation) → delete a bill (inside the edit modal, behind `confirmDialog`) → load AI insights (button, conditional on `aiConfigured`). All six flows preserved exactly; none added, none removed, none redesigned.

---

## 10. Feature Parity

| Feature | Result |
|---|---|
| List bills with stats (monthly total, overdue count, upcoming count, tracked count) | **PASS** (verified in browser) |
| Empty state (no bills) | **PASS** |
| "By category" empty state ("No data yet.") | **PASS** |
| Create a bill | **PASS** |
| Server-side validation on create (empty name → error toast, modal stays open, no bill created) | **PASS** |
| Edit a bill (pre-filled modal) | **PASS** |
| Mark a non-recurring bill paid (terminal "Paid" state, button disappears) | **PASS** |
| Mark a recurring (monthly) bill paid (due date advances by exactly one month, stays unpaid) | **PASS** |
| Delete a bill — Cancel path (bill survives) | **PASS** |
| Delete a bill — Confirm path (bill removed, backend-confirmed) | **PASS** |
| Overdue bills card (conditional rendering) | **PASS** |
| Category breakdown bars | **PASS** |
| AI insights — unavailable state (real, unconfigured environment) | **PASS** |
| AI insights — success state (mocked API response) | **PASS** |
| AI insights — error state (mocked API response) | **PASS** |
| Unauthenticated access rejected (401) | **PASS** |
| Refresh persistence | **PASS** |
| Navigation away/back | **PASS** |

---

## 11. Loading/Empty/Error States

- **Loading:** full-page `loading-line`/`spinner`, text "Loading BillSense…" — matches the original exactly.
- **Empty (no bills):** icon + "No bills yet" + explanatory paragraph — direct port of `emptyBills()`.
- **Empty (no category data):** "No data yet." — direct port.
- **Error (initial load fails):** page-level `empty-state` with an alert icon, matching the identical pattern already used by Dashboard/Family's top-level error states (Phases 1 and 3) — not independently invented for BillSense.
- **No error handling exists for the initial `renderAll()` fetch in the ORIGINAL vanilla version either** — this is preserved: `useBills`'s `try/catch` around the fetch is the ONE place BillSense's React version has more robust error handling than a literal one-to-one port would (matching the established, already-verified `{data, loading, error}` hook pattern every other React page uses) — this is not a new feature, it's the same hook shape Dashboard/Tasks/Family already use, applied consistently rather than reproducing the original's uncaught-rejection gap. The original's gap is preserved faithfully in the places the original actually diverges by design: the bill-form save/delete handlers (§12).

---

## 12. Confirmation/Destructive Actions

Only one destructive action exists in BillSense: **delete a bill**, behind `confirmDialog` (the same shared component whose Promise-resolution bug Phase 2.5 fixed and verified app-wide).

| Check | Result |
|---|---|
| Cancel leaves data unchanged | **PASS** — bill count unchanged after Cancel, confirmed via DOM count before/after |
| Confirm executes the intended action | **PASS** — bill removed from the list |
| Backend persistence matches the UI result | **PASS** — a direct, unmocked `fetch('/api/bills')` call after deletion confirms the bill is genuinely gone server-side, not just optimistically hidden client-side |
| The dialog resolves correctly | **PASS** — both paths resolve to the correct boolean, matching Phase 2.5's already-verified fix; not independently re-proven at the Promise level here, but no regression observed |
| No destructive action executes accidentally | **PASS** — Mark-paid (not gated by confirmDialog, matching the original exactly — see §21) only fires on an explicit, deliberate click on its own button, with `stopPropagation()` preventing the row's own click-to-edit handler from also firing |
| Modal correctly closes after delete, with its React root properly cleaned up | **PASS** — verified two ways: (1) the modal visually closes and the app remains fully usable afterward (re-opening the modal for a different bill immediately afterward works correctly — §23 covers why this specific sequence exercises the fix); (2) by code-level tracing, not by an observable browser symptom — see §23's honest limitation note |

---

## 13. Responsive Verification

| Viewport | Result |
|---|---|
| 320px | **FAIL** — pre-existing, not a regression (§21, §23) |
| 360px | **PASS** |
| 375px | **PASS** |
| 390px | **PASS** |
| 414px | **PASS** |
| tablet-768 | **PASS** |
| desktop-1280 | **PASS** |

At 320px specifically: the "Add bill" button remains reachable (**PASS**), the modal's Save button remains reachable and usable (**PASS**), and the modal panel itself has no *internal* horizontal overflow (**PASS**) — the failure is confined to the page body, not the modal, and not any specific control becoming unreachable. Full root-cause analysis in §21/§23.

---

## 14. Accessibility

Per Step 6's explicit instruction, this phase did not attempt an accessibility rewrite and did not touch the shared `.tabs` keyboard-accessibility gap (Phase 3.5's known debt) — BillSense has no tabs and doesn't interact with that gap at all.

All newly migrated interactive controls are real, natively-focusable elements: `<button>` for every action (Add bill, AI insights, Mark paid, Save, Cancel, Delete), real `<input>`/`<select>`/`<textarea>` for every form field, and the row-level click-to-edit is layered on top of a `<button>`-free `<div>` — matching the exact same pattern Family's member cards and Tasks' rows already use, not a new pattern. Focus visibility comes from the existing global focus-ring CSS (the same `.btn:focus-visible` rule Phase 2.5 fixed and verified) — no new focus styling was needed or added. No ARIA tabs system was implemented, correctly, since BillSense has no tab UI to require one.

**Not independently re-verified this phase via a dedicated keyboard-only pass** (e.g., tabbing through the whole page/modal in sequence) — this is marked **NOT VERIFIED** rather than assumed to pass, since no such check was run in the browser. What was verified structurally: every interactive element is a real, inherently tabbable HTML element (no `<div onClick>` was used for anything a keyboard user would need to activate, except the already-established, unchanged row-click-to-edit convenience layered on top of otherwise-complete keyboard-reachable content).

---

## 15. Browser Verification

Real Microsoft Edge via Playwright (`channel: 'msedge'`), same methodology as every prior phase. Two false negatives were found, diagnosed, and corrected rather than accepted at face value:

1. **A wrong test assumption**, not an app bug: the initial script assumed native HTML5 `required` validation would block an empty-form submit. Investigation showed the Save button lives in the modal's plain-HTML footer, *outside* the `<form>` element (identical structure to the original vanilla modal and to Tasks'/Family's React modals) — so native validation never applies; the original always relied on server-side validation plus a toast plus leaving the modal open. The test was rewritten to verify that actual, correct behavior (a `400` with a clear message, a toast, the modal staying open, no bill created) instead of a behavior that was never real.
2. **Two apparent failures (Mark-paid not applying, Cancel not preventing deletion) that did not reproduce** on a clean re-run or in two isolated, step-by-step reproductions (`debug-billsense.mjs`, `debug-billsense2.mjs`) — confirmed as one-off headless-browser timing flakes in the original combined run, not real defects; both flows work correctly and consistently across three separate clean verifications (the two debug scripts and the final full re-run).
3. **A driver error from clicking `.modal-backdrop`** at 320px: at that width the modal panel covers nearly the entire viewport, and the backdrop element's default click coordinate resolved to a point still covered by the panel's currency input, so Playwright's actionability check correctly refused to force the click. Fixed by using `Escape` (the same close path `modal.js` already wires) instead of a backdrop click — a test-targeting fix, not an app fix.

**Final clean run: 37/38 BillSense-specific checks passed, plus 24/24 regression checks across Dashboard/Tasks/Family (61/62 total).** The one failure is the pre-existing `.dash-grid` overflow (§13, §21).

---

## 16. Console/Network/Exception Results

Zero uncaught page exceptions. Zero console warnings. Zero failed or 5xx network requests. Two console **errors** were captured, both expected and self-inflicted by the verification script itself: a `401` from the deliberate unauthenticated-`fetch` test (§10) and a `400` from the deliberate empty-name validation test (§12) — both are the browser's standard logging of any non-2xx `fetch()` response, the same pattern already documented in Phases 2.5 and 3, not application defects.

---

## 17. Backend Test Results

```
npm test  →  tests 89, pass 89, fail 0
```
Unchanged — no backend file was touched this phase (the `modal.js` fix is frontend-only). Baseline maintained, not reduced.

---

## 18. Lint Results

```
npx eslint .  →  exit 0, zero errors, zero warnings
```

---

## 19. Build Results

```
npm run build (web/)  →  succeeds, "66 modules transformed"
```
The existing `postinstall`/`build:web` workflow was not modified and continued to work correctly through this phase's builds.

---

## 20. Bundle Size

| | Phase 3.5 baseline | Phase 4 (+ BillSense) | Delta |
|---|---|---|---|
| Raw | 260.45 kB | 275.19 kB | **+14.74 kB** |
| Gzip | 65.11 kB | 67.52 kB | **+2.41 kB** |

Reasonable and explained: the delta covers BillSense's entire surface (6 components, 1 hook, 1 page, including a full CRUD modal with server-driven validation and an AI-insights card with three distinct render states) while React/ReactDOM continue to ship exactly once (shared bundle, unchanged architecture). The per-feature cost is in the same range as Tasks' (+21.82 kB/+4.71 kB) and Family's (+21.83 kB/+3.52 kB) prior deltas — BillSense is comparatively lighter since it has one modal (not three, like Family) and no polling/multi-tab logic. No code-splitting was introduced; at 67.52 kB gzip for four full pages, the tradeoff still doesn't favor it, consistent with the position taken in every prior phase.

---

## 21. Security Review

| Check | Result |
|---|---|
| No API keys/secrets in frontend | **PASS** — grepped every new file; the only occurrence of the string "ANTHROPIC_API_KEY" is inside a plain-text UI message naming the env var, identical to the original, never a value |
| No user-controlled HTML injection | **PASS** — zero `dangerouslySetInnerHTML` in any new BillSense file; every dynamic value (bill name, notes, AI insight text) renders as plain JSX text, auto-escaped by React |
| `Icon.jsx`'s existing `dangerouslySetInnerHTML` usage | **PASS, justified** — unchanged, pre-existing pattern (Phase 1/2); renders only from a static, hardcoded SVG lookup table, never user- or API-derived content; BillSense uses it exactly as Dashboard/Tasks/Family already do |
| No unsafe URL handling | **PASS** — BillSense has no links or redirects of any kind |
| No accidental exposure of sensitive data | **PASS** — bills are already strictly owner-scoped server-side; the React port doesn't change or bypass this |
| No new insecure localStorage usage | **PASS** — grepped; zero `localStorage`/`sessionStorage` references in any new file |
| No unnecessary backend changes | **PASS** — zero backend files touched |
| No auth bypass | **PASS** — every route still requires the existing session middleware; verified live (401 on an unauthenticated request) |
| No missing authorization assumptions | **PASS** — the frontend makes no client-side authorization decisions BillSense didn't already make (there are none to make — no role-gated UI exists on this page); server-side `owner_id` scoping is the sole enforcement point, unchanged |

---

## 22. Design-System Compliance

Zero new colors, radii, spacing values, button variants, shadows, or gradients were introduced. Every class used (`.stat-row`, `.stat-tile`, `.dash-grid`, `.card`, `.row-item`, `.bill-cat-icon`, `.bill-amount`, `.category-bar-*`, `.badge-*`, `.btn*`, `.field*`, `.empty-state`, `.loading-line`) already existed before this phase and is reused verbatim. The two inline `style={{borderColor: 'var(--danger-400)'}}`/`style={{borderColor: 'var(--brand-soft-border)'}}` occurrences (OverdueCard, AiInsightsCard) are direct ports of the original's identical inline styles, both referencing existing design tokens, not new colors. Dark mode was not separately re-screenshotted this phase — no BillSense-specific color logic exists to diverge, since every color reference is an existing, already dark-mode-verified token (Phase 2.5).

**No design inconsistency was found in BillSense worth fixing with existing tokens** — the page's visual language (stat tiles, row lists, category bars, badges) was already fully aligned with the Phase 2.5 design system before this migration; the migration's job was to reproduce it in React, which it does exactly.

---

## 23. Bugs Found

1. **A latent, shared React-root leak in `public/js/components/modal.js`.** `closeHandler` was a single module-level variable, unconditionally overwritten by every `openModal()` call. When a React-rendered modal's delete flow calls `confirmDialog()` (which itself calls `openModal()` again, on the same shared `#modal-root`), the *outer* modal's `onClose` callback — which, for every React-bodied modal established since Phase 2, does `root.unmount()` — was silently discarded, never invoked. Traced precisely: `openModal()` for the confirm dialog overwrites `closeHandler` before the outer modal's version is ever called again, and the confirm dialog's own close cycle only ever invokes *its own* `onClose` (a harmless, already-resolved `resolve(false)`), never the outer one.
   - **Retroactive scope:** this already affects Tasks' `TaskDetailModal.jsx`'s `handleDelete` (Phase 2) and Family's `MembersTab.jsx`'s `handleRemove` (Phase 3) — previously unnoticed because neither component tree has any cleanup work worth losing beyond the bare `root.unmount()` call itself (no intervals, no subscriptions), so there was no externally observable symptom in either already-verified flow.
   - **Why it matters for BillSense specifically:** the moment a React-bodied bill-form modal's delete flow calls `confirmDialog()` (an established, expected pattern this migration needed to reproduce for parity), it would newly, actively leak its own React root on every single bill deletion — a real regression this migration would have introduced fresh, not merely inherited.

2. **A vestigial, non-visibility-granting `family_id` on bills** (§8) — confirmed existing, tested, intentional product behavior, not a bug.

3. **A test-script assumption error** (native HTML5 validation) — not an app bug; see §15.

---

## 24. Bugs Fixed

**Bug 1 (§23) was fixed** — five lines added to `public/js/components/modal.js`: a `pendingOnClose` variable tracks the currently-open modal's `onClose` callback, and `openModal()` now invokes and clears it *before* overwriting `closeHandler` for a new (nested) modal, instead of only ever tracking the newest one. This is scoped entirely to the shared modal mechanism — no call site anywhere in the app (vanilla or React) needed to change.

This was judged in-scope to fix directly (not merely deferred) because:
- It lives in **shared, existing** code, not new BillSense-specific code — fixing it isn't "a global refactor," it's a five-line correctness fix to a mechanism every modal in the app already depends on.
- It was **required for BillSense's own migration correctness** — reproducing the established delete-via-confirmDialog pattern faithfully, without this fix, would have introduced a real, fresh regression (a leaked root on every deletion), not preserved an existing one (the vanilla BillSense page never had a React root to leak in the first place).
- It carries **no product tradeoff** to present for a decision — unlike Phase 2.5's family-owner-deletion question, there is exactly one correct behavior here (the outer modal's cleanup should run when it closes, once, whether closed directly or superseded by a nested modal), so it was fixed directly and documented prominently here, per the established pattern for bugs with no genuine tradeoff.
- **Verified not to change any observable behavior**: the full Dashboard/Tasks/Family regression sweep (§15, §17) passed identically after the fix; Tasks' and Family's own delete-via-confirmDialog flows were not separately re-run in this phase's browser session, but nothing about their call sites changed, and their `onClose` callbacks (each just `root.unmount()`) are the exact kind of callback this fix now correctly invokes rather than the kind of callback whose *absence* of invocation was ever asserted as correct by any prior phase's test.

**Honest limitation on this fix's own verification:** `BillFormFields` has no `useEffect`, no interval, no subscription — nothing with cleanup work to lose. This means the leak this fix prevents is **not independently, empirically observable via a browser test for BillSense's own delete flow** (with or without the fix, no visible difference would occur in BillSense specifically, since there's nothing to leak). The fix's correctness was established by code-level tracing of `modal.js`'s control flow, not by a before/after browser measurement — stated plainly here rather than claimed as a browser-verified "PASS" it isn't.

---

## 25. Bugs Deferred

- **The `.dash-grid` CSS Grid `min-width:auto` overflow** (§13, §21) — reproduced on BillSense (scrollWidth 335–357 vs a 320px viewport, appearing only once real bill-row content exists; the empty state does not trigger it). Root-cause confirmed identical to Phase 1.5's original Dashboard finding: `.dash-grid`'s single-column track (at ≤900px) sizes to its widest child's intrinsic min-content width, and because both direct grid children (BillSense's "All bills" card and its sibling "stack") share that one resolved column width, the row list's un-shrinkable content (icon + amount + "Mark paid" button) stretches *both* cards to the same overflowing width — not a new mechanism, not a new class of bug, and not touched by this migration's own CSS (zero CSS files were modified for BillSense). Left unfixed, per this phase's explicit scope boundary ("It is NOT: a global refactor... do not implement [unrelated fixes] unless required for... migration parity" — this is shared debt across Dashboard, Family's Overview tab, and now BillSense, not something migration parity requires fixing here). Recommended for the same consolidated shared-CSS pass Phase 3.5 already flagged as still needed for this exact mechanism.
- **Family-owner account-deletion semantics** — untouched, as instructed; not discussed or revisited this phase.

---

## 26. Architecture Decisions

- **`makePageMount(BillSense)`** — used as-is, no changes needed; the Phase 3.5 extraction paid off immediately on its first real use.
- **`useBills` kept as its own hook, not merged into a generic fetcher** — consistent with Phase 3.5's explicit reasoning about the three prior data hooks (§7); a fourth data point in the same direction.
- **The `modal.js` fix, not a BillSense-local workaround** — deciding to fix the shared file rather than, say, manually re-implementing cleanup inside `BillFormModal.jsx`'s own delete handler was a deliberate call: a local workaround would have solved BillSense's own symptom while leaving Tasks/Family's latent version of the same bug in place, and would have meant three different, subtly different delete-flow implementations instead of one shared, correct mechanism.
- **No family selector added to the bill form** — confirmed as a deliberate non-change (§8), not an oversight.

---

## 27. Performance Notes

No client-side performance work was undertaken or needed. `useBills`'s `refetch()` (rather than a full page re-render, as the original's `renderAll()` did) is the same category of "free" improvement Dashboard's `refetch()` already demonstrated in Phase 1 — not a new optimization technique, just React doing its normal reconciliation instead of hand-rolled `innerHTML` replacement.

---

## 28. Known Limitations

- The `.dash-grid` overflow at 320px (§25).
- No dedicated keyboard-only navigation pass was run this phase (§14) — structurally sound (every control is a real focusable element) but not independently browser-verified.
- The `modal.js` fix's correctness rests on code-level tracing for BillSense's specific case, not an empirical browser measurement (§24) — accurately caveated rather than overclaimed.

---

## 29. Future Work

- A consolidated shared-CSS pass covering both remaining known `.dash-grid`/`.card` overflow instances (Dashboard, Family's Overview tab, and now BillSense) — already recommended once, in Phase 3.5, and reconfirmed here as still outstanding.
- A dedicated keyboard-only navigation verification pass across all four migrated pages, if/when accessibility work is explicitly scoped as its own phase.
- Re-verifying Tasks' `TaskDetailModal` and Family's `MembersTab` delete flows specifically for the `modal.js` fix's effect, if either component ever gains an effect with real cleanup work (an interval, a subscription) — not urgent today, since neither currently has any.

---

## 30. Final Verdict

**BillSense migration: complete and verified.** Feature parity confirmed across all documented user flows (§9–12) with real browser interaction and backend-state confirmation, not static inspection alone. Backend tests hold at 89/89, lint is clean, the production build succeeds, and the bundle grew by a reasonable, explained amount (+14.74 kB raw / +2.41 kB gzip) for a full CRUD-plus-analytics page. One genuine shared-architecture bug was found during the pre-migration audit and fixed at its correct, shared source rather than worked around locally. One pre-existing, already-documented shared-CSS overflow was reproduced, correctly attributed, and correctly left unfixed rather than patched with a page-specific workaround. Regression across Dashboard, Tasks, and Family is clean (24/24). No product feature was added; no backend behavior, database schema, or authentication model was changed.

**Per the strict scope boundary: no additional page was migrated after BillSense, no new product feature was added, and family-owner account-deletion semantics were not revisited.** Stopping here — awaiting review before Phase 5.
