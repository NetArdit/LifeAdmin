# LifeAdmin — Phase 3.5: Shared UI Hardening + React Foundation Review

**Date:** 2026-09-28
**Scope:** Fix the shared `.tabs` horizontal-overflow bug (pre-existing, first observed on vanilla pages, reproduced identically in Phase 3's React Family migration), verify the fix across every consumer, and perform a lightweight architecture review of the three React pages migrated so far. No new page migrated. No backend change. No product feature added.

---

## 1. `.tabs` Root-Cause Analysis

`.tabs`/`.tab` are defined once, in `public/css/components.css`, and shared by every consumer regardless of whether it's vanilla or React:

```css
.tabs { display: flex; gap: var(--sp-1); border-bottom: 1px solid var(--surface-border); }
.tab {
  padding: var(--sp-2) var(--sp-3); font-size: var(--fs-sm); font-weight: 600; color: var(--text-tertiary);
  border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color var(--transition-fast);
}
```

**The defect:** `.tabs` is a plain `display:flex` row with no `overflow` declaration and no `flex-shrink`/`white-space` control on its children. A flex row with no `overflow-x` set doesn't clip or scroll when its children's combined intrinsic width exceeds the container — it simply grows the row (and, transitively, the whole page) wider than the viewport. Flex items also default to `flex-shrink: 1` with `min-width: auto`, so the browser's overflow-avoidance behavior for narrow viewports was inconsistent: sometimes shrinking a label's box below its text's natural width (letting it wrap awkwardly), sometimes not shrinking enough to prevent the page itself from growing. Family's five tab labels ("Overview", "Members", "Chat", "Shopping list", "Activity") were the first React consumer wide enough, combined with the container's true available width at 320–375px, to expose this: the row's summed content width came out to 391–396px against a 320–375px viewport, and the *entire document* (not just the tab row) grew to match, which is what both Phase 1.5 (vanilla) and Phase 3 (React) measured as page-level `scrollWidth` overflow.

**Every consumer of `.tabs`, confirmed by reading each source file directly (not assumed from memory):**

| Consumer | Type | Tab count / labels | Status |
|---|---|---|---|
| `web/src/pages/Family.jsx` | React (live) | 5: Overview, Members, Chat, Shopping list, Activity | Live, migrated Phase 3 |
| `public/js/pages/assistant.js` | Vanilla (live) | 2: Chat, Plan my week | Live |
| `public/js/pages/family.js` | Vanilla (**dead code**) | Same 5 as React Family | Unreferenced since Phase 3 — kept on disk only as the documented rollback path (`public/js/app.js`'s `PAGES.family` no longer imports it); not reachable through the running app |

No other page (`public/js/pages/{billsense,decisionflow,ecolife,goals,settings,timeline}.js`, `web/src/components/tasks/**`, `web/src/pages/{Dashboard,Tasks}.jsx`) uses the `.tabs`/`.tab` classes — confirmed by grepping every page module and every React component for the class names.

**Intended behavior:** a horizontal row of mutually-exclusive view switches, one always visually marked `.active` via a bottom border + brand color, click-to-switch (React: `setActiveTab`; vanilla: a `data-tab` attribute read by a delegated click listener that re-invokes `mount()`).

**Accessibility, as it already existed, before this phase touched anything:** every `.tab` is a plain `<div>` with a click handler — no `role="tab"`/`role="tablist"`, no `aria-selected`, no `tabindex`, and no keydown handler, in *either* the vanilla or the React version. This is a genuine, pre-existing gap, not something Phase 1–3 introduced and not something this phase was scoped to fix (Part A's mandate was the overflow bug specifically); it is carried forward unchanged and called out explicitly in §7 rather than silently left unmentioned.

---

## 2. Chosen Responsive Solution

**Contained horizontal scroll**, scoped to the `.tabs` row itself:

```css
.tabs {
  display: flex; gap: var(--sp-1); border-bottom: 1px solid var(--surface-border);
  overflow-x: auto; -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain;
}
.tab {
  padding: var(--sp-2) var(--sp-3); font-size: var(--fs-sm); font-weight: 600; color: var(--text-tertiary);
  border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color var(--transition-fast);
  flex-shrink: 0; white-space: nowrap;
}
.tab.active { color: var(--brand-strong); border-color: var(--brand); }
.tab:hover { color: var(--text-primary); }
```

Three changes, each doing a specific job:
- `overflow-x: auto` — turns page-level overflow into row-scoped, contained overflow. This is **not** `overflow-x: hidden`; nothing is clipped or hidden from the user, every tab is still reachable, just via a scroll gesture instead of always being simultaneously visible.
- `flex-shrink: 0; white-space: nowrap` on `.tab` — without this, flex's default shrink behavior would still squeeze/wrap labels before the row got a chance to overflow-scroll; this guarantees every label keeps its natural, readable width and the row scrolls as a whole instead.
- `-webkit-overflow-scrolling: touch; overscroll-behavior-x: contain` — momentum scrolling on iOS Safari, and containment so dragging the tab row to its end doesn't rubber-band or chain into scrolling the page behind it.

## 3. Why This Solution Was Selected

Three alternatives were considered and rejected:

- **Wrapping** (`flex-wrap: wrap`) would push tabs onto a second row at narrow widths. Rejected: a tab bar's whole visual grammar is "these are alternatives, pick one" — a single row communicates that; two rows reads as two different groups of controls and is a layout change to the tab bar's meaning, not just its width.
- **Compact spacing/sizing** (shrinking padding/font-size at narrow breakpoints) was calculated and rejected on the numbers: Family's five labels plus padding total roughly 396px of intrinsic content width; getting that under even 375px would require shrinking text small enough to hurt legibility and touch-target size, for a fix that would still break again the moment a family's invite flow or a future tab gets a slightly longer label. It treats the symptom at one specific content length rather than the structural cause.
- **Hiding overflow** (`overflow-x: hidden`) was explicitly ruled out per the brief — it would make the Shopping list and Activity tabs permanently unreachable at 320–375px, which is a functional regression disguised as a visual fix.

**Horizontal scroll was selected because it is already this app's established idiom for "content that can exceed its container scrolls within a bounded region,"** not a new pattern invented for this fix. `base.css` already defines a single, app-wide thin scrollbar (`* { scrollbar-width: thin; scrollbar-color: ...; } *::-webkit-scrollbar {...}`), and `.modal-panel`, `.sidebar-nav`, `.chat-messages`, `.assistant-messages`, and `.command-results` all already scroll internally with it — just on the vertical axis. Applying the identical mechanism on the horizontal axis to `.tabs` required zero new visual design (the scrollbar look was already defined and themed for both light/dark), stays instantly recognizable as "this app's scroll style," and needed no new colors, radii, or components — directly satisfying Part C's design-consistency requirement. For a personal/family app with a small, fixed tab set (never more than five today), a contained scroll is also proportionate: it doesn't overbuild for a problem five tab labels create, and it degrades gracefully if a sixth tab is ever added.

---

## 4. Every `.tabs` Consumer

Restated from §1 for the report's required structure: `web/src/pages/Family.jsx` (React, live), `public/js/pages/assistant.js` (vanilla, live), `public/js/pages/family.js` (vanilla, dead code/rollback-only — inherits the identical CSS fix automatically since it references the same classes, but is not reachable through the running router and so was not separately exercised through it).

---

## 5. Before/After Responsive Measurements

**Before (measured in Phase 3, vanilla measured in Phase 1.5):**

| Viewport | Family — before |
|---|---|
| 320px | Page `scrollWidth=391` vs `viewport=320` — **overflow** |
| 360px | Page `scrollWidth=391` vs `viewport=360` — **overflow** |
| 375px | Page `scrollWidth=391` vs `viewport=375` — **overflow** |
| 390px+ | No overflow |

**After (measured this phase, `verify-tabs.mjs`, real Edge browser):**

| Viewport | Family — page-level | Family — `.tabs` bar itself |
|---|---|---|
| 320px | `scrollWidth=320` = `viewport` — **no overflow** | bar `scrollWidth=396` vs `clientWidth=288` — internally scrollable, `overflow-x:auto` |
| 360px | `scrollWidth=360` = `viewport` — **no overflow** | bar `scrollWidth=396` vs `clientWidth=328` — internally scrollable |
| 375px | `scrollWidth=375` = `viewport` — **no overflow** | bar `scrollWidth=396` vs `clientWidth=343` — internally scrollable |
| 390px | `scrollWidth=390` = `viewport` — no overflow | bar fits with 8px to spare, not yet scrollable |
| 414px | `scrollWidth=414` = `viewport` — no overflow | bar fits |
| tablet-768 | `scrollWidth=768` = `viewport` — no overflow | bar `scrollWidth=720` = `clientWidth=720` — fits exactly |
| desktop-1280 | `scrollWidth=1280` = `viewport` — no overflow | bar fits with room to spare |

The page-level overflow present at 320/360/375px is **gone** — the exact same document-width measurement that previously exceeded the viewport by 71px (at 320px) now matches it exactly, at every one of the seven required breakpoints. The row's own intrinsic content width (396px) hasn't shrunk — the five labels are exactly as wide as before — but that width is now contained *inside* the scrollable tab bar instead of pushing the whole page wider.

**Assistant (2 short tabs) — before and after are identical**, because its combined label width never exceeded any tested viewport (`bar scrollWidth == clientWidth` at all seven breakpoints, from 320px to 1280px) — confirming the fix is inert where it isn't needed and doesn't alter Assistant's appearance or behavior at all.

---

## 6. Browser Verification

Real Microsoft Edge via Playwright (`channel: 'msedge'`), same methodology as Phases 1.5–3 — no synthetic/JSDOM measurements, no headless-Chromium substitute binary.

**One test-script issue found and corrected, disclosed per the established methodology:** the first run of the Assistant section timed out waiting for `.tabs .tab`, because Assistant's real route is gated behind `ANTHROPIC_API_KEY` (not configured in this dev environment) and shows an "unavailable" card instead of tabs. Rather than editing server environment/secrets to force it on, the app's single `GET /api/config` call (the one thing `public/js/app.js`'s `boot()` uses to set `state.aiConfigured`) was intercepted with Playwright's `page.route()` to return `aiConfigured: true`, letting the **real** Assistant page module render through the **real** router and produce its **real** `.tabs` markup — a mock of one config response, not a fabricated test double for the component itself. The first attempt registered the route too late (after `boot()` had already fetched the real, unmocked value at initial page load); moving the `page.route()` call before the first navigation fixed it. **A second, separate flake** (one `mouse.wheel` check reporting `scrollLeft=0`) was independently reproduced in isolation with a dedicated debug script, confirmed to be a timing artifact of the previous assertion in the same run rather than a real defect (the wheel event's `deltaX` demonstrably reaches the element and moves `scrollLeft` — proven twice, including in a clean standalone script), and did not recur on a clean re-run.

**Final clean run: 51/51 checks passed.** Covering, per breakpoint (320/360/375/390/414/tablet-768/desktop-1280) for both Family and Assistant: page-level overflow status, the `.tabs` bar's own scroll metrics; plus, at 320px specifically for Family: all 5 tabs present in the DOM, the bar scrolling via `scrollLeft` (proving it's `auto`, not `hidden`), the previously-unreachable "Activity" tab reachable and clickable after scrolling, the active tab remaining visually distinct after the CSS change, a wheel/touch-style scroll gesture moving the bar, and confirmation that tabs still have no `tabindex` (unchanged, not a new regression — see §7). Plus a full Dashboard/Tasks/Family responsive + navigation regression sweep (§ below) and an Assistant tab-click functional check ("Plan my week" becomes active on click). Zero console errors, zero uncaught page exceptions, zero failed or 5xx network requests across the entire run.

---

## 7. Accessibility Verification

| Check | Result |
|---|---|
| No unwanted horizontal page overflow | **VERIFIED** — confirmed at all 7 breakpoints, both Family and Assistant |
| Tabs remain reachable | **VERIFIED** — every tab (including ones scrolled out of the initial view) is reachable via scroll + click; confirmed by scrolling to and clicking the previously-inaccessible "Activity" tab at 320px |
| Active tab remains visually clear | **VERIFIED** — `.tab.active`'s `color`/`border-bottom-color` computed styles confirmed present and unchanged after the CSS edit |
| Keyboard focus remains visible | **PARTIALLY VERIFIED** — tabs have **no keyboard focusability at all**, and this was true before this phase and remains true after it (confirmed: no `tabindex`, no `role`, no keydown handler, in either the vanilla or React markup, before or after this fix). Nothing regressed, because there was no keyboard path to regress. This is flagged as a genuine, pre-existing accessibility gap in §17, not fixed here — adding a real `role="tablist"`/roving-`tabindex`/arrow-key implementation is a deliberate accessibility feature addition, out of scope for a bug-fix phase whose mandate was the overflow specifically, and is recommended as real future work rather than folded in unannounced |
| Touch interaction remains usable | **VERIFIED** — a wheel/drag-style horizontal scroll gesture correctly moves the tab bar's `scrollLeft` (confirmed both via direct `mouse.wheel` dispatch and via the standalone reproduction in `debug-wheel.mjs`); `-webkit-overflow-scrolling: touch` is set for real iOS momentum scrolling (not separately verifiable on this Windows/Edge test rig, but the property is present and is the standard, well-documented mechanism for it) |
| No content accidentally clipped | **VERIFIED** — `flex-shrink:0`/`white-space:nowrap` confirmed no label is squeezed or wrapped; all 5 Family tab labels read exactly as before |
| No regression to existing behavior | **VERIFIED** — tab click-to-switch, active-tab styling, and Assistant's unaffected appearance all confirmed unchanged |

---

## 8. React Foundation Review

Three pages in (Dashboard, Tasks, Family), a lightweight pass over shared components, hooks, API/state patterns, modal/tab patterns, and build scripts — looking for genuine duplication or architectural problems, not refactoring opportunities for their own sake.

**No case was found for Redux/Zustand/another state library, another router, a UI framework, or a design-system package.** `ctx.state` (a plain mutable object owned by `public/js/app.js`) plus React's own `useState`/hooks continue to handle every state need across all three pages, including Family's more complex multi-tab, multi-resource shape and its one genuinely new requirement (cross-navigation UI-state persistence, handled with a plain module-level variable — see §9). Nothing encountered in this review suggests the current architecture is straining; no new dependency was installed.

---

## 9. Shared-Component Findings

**No new shared component was created**, but the review examined every place the same *shape* of code appears across pages to check whether one was overdue:

- **Loading indicators** (`<div className="loading-line"><span className="spinner" /> {message}</div>`): appears **9 times** across `Dashboard.jsx`, `Tasks.jsx`, `Family.jsx`, and five components under `components/family/` and `components/tasks/`. Considered and **not extracted**: it's two lines of pure markup with zero logic, already using existing shared CSS classes (`loading-line`, `spinner`); replacing it with a one-line `<LoadingLine label="..."/>` import would trade two inline lines for one line plus a new file to open to understand what's rendered — a wash, not a win. Documented here as identified duplication rather than silently left unnoticed.

---

## 10. Duplication Findings

Two genuine, load-bearing duplication patterns were found and evaluated against the brief's four-part justification test (behavior genuinely shared; reduces meaningful duplication; remains understandable; doesn't create excessive coupling):

**a) `main.jsx`'s three mount/unmount pairs — extracted this phase.** `mountDashboard`/`unmountDashboard`, `mountTasks`/`unmountTasks`, and `mountFamily`/`unmountFamily` were three byte-for-byte identical 10-line blocks (`let xRoot = null; export function mountX(container, ctx) { xRoot = createRoot(container); xRoot.render(createElement(X, {ctx})); } export function unmountX() { if (xRoot) { xRoot.unmount(); xRoot = null; } }`), differing only in which component and variable name. This passed all four criteria cleanly and unambiguously: the createRoot/render/unmount lifecycle is *exactly* the same operation every time (not just similar-looking), each of the seven still-unmigrated pages will need this exact same block copy-pasted again if it isn't factored out now, the resulting `makePageMount(Component)` factory is a three-line function anyone can read in ten seconds, and it introduces no coupling — it has no knowledge of any specific page. Extracted to a small `makePageMount()` helper in `main.jsx` (see §12); rebuilt and reverified (bundle size unchanged within noise: 260.56 kB → 260.45 kB raw, 65.10 kB → 65.11 kB gzip; lint clean; browser regression sweep in §6 confirms no behavioral change).

**b) The "mount a React root inside the vanilla modal shell, unmount it on close" scaffold — found, but deliberately *not* extracted.** `CreateFamilyModal.jsx`, `JoinFamilyModal.jsx`, `AddMemberModal.jsx`, `TaskFormModal.jsx`, and `TaskDetailModal.jsx` (5 files) all repeat: `let root = null;` at the top, then inside `onMount`, `root = createRoot(modalRoot.querySelector(SELECTOR)); root.render(...)`, then identically in every single one, `onClose: () => { if (root) { root.unmount(); root = null; } }`. The `onClose` fragment in particular is 100% identical across all five files with zero variation. This is a closer call than (a): the shared fragment is real and correctness-sensitive (a forgotten unmount would leak a React root), but the surrounding `onMount` logic — the mount selector, the rendered element and its props, and the save-button wiring that follows — is genuinely different in every file and would remain bespoke either way, meaning a helper would only ever save the identical 4-line `onClose` plus the `let root = null` declaration: roughly 15 total lines removed across 5 files, at the cost of a new shared file and an import added to each. Weighed against this project's repeated, explicit "don't abstract for a few lines of boilerplate similarity" standard — and given this exact pattern has now gone through Phases 1, 2, and 3 without ever causing a bug — the call made here is **not to extract it now**. The threshold at which it would become worth doing: a sixth modal added, a real defect traced to a forgotten unmount, or `eslint-plugin-react-hooks` (or an equivalent lint rule) starting to flag the pattern.

**c) The three data-fetching hooks' `{data, loading, error}` + `setLoading(true); setError(null); try {...} catch { setError(err) } finally { setLoading(false) }` scaffold** (`useDashboardData.js`, `useTasks.js`, `useFamilies.js`) — considered and **not extracted**, for a different reason than (b): here the code *wrapping* the shared 8-line scaffold is substantively different in each hook (`useTasks` layers on filter-params building and a 250ms search debounce; `useFamilies` layers on syncing `ctx.state.families` for other pages to read; `useDashboardData` has neither). A generic `useAsyncData()` helper would only ever wrap the smallest, least interesting part of each hook while leaving the actual complexity untouched in three separate call sites anyway — the kind of abstraction that reduces a line count on paper without reducing real cognitive load, which the brief's third criterion ("remains understandable") explicitly weighs against.

---

## 11. Architecture Recommendations

1. **No abstraction beyond the `makePageMount()` extraction (§10a) is recommended right now.** The two other duplication candidates (§10b, §10c) are genuine findings worth revisiting, not ignoring — but neither clears the bar today, and forcing them through would trade a small, real amount of duplication for a larger, real amount of indirection.
2. **Watch the modal-lifecycle pattern (§10b) as page count grows.** If BillSense, DecisionFlow, Goals, or Settings each add one more React-rendered modal in a future phase, revisit the extraction then — six-plus occurrences of an identical, correctness-sensitive fragment is a different calculus than five.
3. **No router library, no state library, no UI framework, and no design-system package are needed.** Nothing in this review found evidence the current architecture — `ctx.state`/`ctx.api` threading, one shared bundle, hash-based routing via `public/js/app.js`'s `PAGES` map, per-page `mount()`/`unmount()` contracts — is straining under three migrated pages, including Family's materially higher complexity. Extend the same architecture to the next migration.

---

## 12. Files Changed

| File | Change |
|---|---|
| `public/css/components.css` | `.tabs`/`.tab` rules updated: added `overflow-x: auto`, `-webkit-overflow-scrolling: touch`, `overscroll-behavior-x: contain` to `.tabs`; added `flex-shrink: 0`, `white-space: nowrap` to `.tab` (§2) |
| `web/src/main.jsx` | Three duplicated mount/unmount blocks collapsed into a `makePageMount(Component)` factory (§10a); zero behavioral change |

No backend file, no other CSS file, and no other React component was touched.

---

## 13. Tests

```
npm test  →  tests 89, pass 89, fail 0
```
Unchanged — no backend file was touched this phase, and this reconfirms the baseline still holds after the `main.jsx` refactor and CSS change (neither of which the backend test suite exercises, but re-run anyway per Part E's explicit instruction).

---

## 14. Lint

```
npx eslint .  →  exit 0, zero errors, zero warnings
```
Re-run after the `main.jsx` refactor; clean.

---

## 15. Build

```
npm run build (web/)  →  succeeds, "58 modules transformed", built in ~1.5–6s
```
The existing `postinstall`/`build:web` workflow (`npm --prefix web install && npm --prefix web run build`, wired to the root `package.json`'s `postinstall` hook) was not modified and is confirmed still correct — the build ran successfully via the same `npm run build` entry point Phases 1–3 used, with no new dependency added anywhere in this phase.

---

## 16. Bundle Comparison

| | Phase 3 baseline | Phase 3.5 (after `.tabs` fix + `main.jsx` refactor) | Delta |
|---|---|---|---|
| Raw | 260.56 kB | 260.45 kB | **−0.11 kB** |
| Gzip | 65.10 kB | 65.11 kB | **+0.01 kB** (noise) |

The CSS fix itself contributes **zero** bundle change — `public/css/components.css` is not processed by Vite (the established architecture reuses existing global stylesheets rather than bundling CSS; see Phase 1's `vite.config.js` notes). The tiny raw-size decrease comes entirely from `main.jsx`'s `makePageMount()` refactor removing a few duplicated lines; the 0.01 kB gzip difference is within normal compression noise for a change this size, not a meaningful regression.

---

## 17. Known Remaining Issues

- **Tabs have no keyboard accessibility** (§7): no `tabindex`, `role`, or keydown handling, in either the vanilla or React implementation, before or after this phase. Pre-existing, unchanged, not silently patched — flagged as real, worthwhile future work (a `role="tablist"`/`role="tab"`/`aria-selected` + roving-`tabindex` + arrow-key implementation) rather than folded into this bug-fix phase unannounced.
- **The Dashboard/Family `.dash-grid`/`.card` CSS Grid overflow issue** (Phase 1.5) is a *separate* mechanism from `.tabs` and was not in this phase's scope — not re-tested this phase, presumed unchanged since no grid/card CSS was touched.
- **`public/js/pages/family.js`** (vanilla, dead code) still exists on disk purely as the documented rollback path; it was not executed or separately re-verified this phase (not reachable through the live router), though it inherits the identical CSS fix automatically since it shares the same class names.
- **The modal-lifecycle and data-hook duplication findings** (§10b, §10c) remain in the codebase by deliberate decision, not oversight — see §11 for the conditions under which they'd be worth revisiting.
- **Family-owner account-deletion semantics** remain exactly as Phase 2.5 left them (blocked with a clear error) — untouched, per this phase's explicit scope boundary.

---

## 18. Recommendation for Phase 4

1. **The `.tabs` fix is real, verified, and ready to carry into the next page migration** — any future page adding its own tab set (Settings' sections, for instance, if it ever adopts this same `.tabs` component rather than its current structure) inherits the fix automatically, for free, with no extra work.
2. **No architectural change is needed before the next migration.** The three-page review found the existing patterns (shared bundle, `ctx.state`/`ctx.api` threading, hybrid modal shell, per-page hooks) scaling correctly; the one concrete improvement identified (`makePageMount()`) has already been applied and directly benefits every future page migration by removing one more block of boilerplate they'd otherwise have had to copy.
3. **Before starting the next page migration, read this report's §10b/§10c** as a reminder of where the duplication threshold currently sits, so the same judgment (not "twice means abstract," but "does this actually meet all four criteria") gets applied consistently rather than re-derived from scratch.

---

**Per the strict scope boundary: no page was migrated this phase, no product feature was added, no backend behavior changed, and family-owner account-deletion semantics were not revisited. Stopping here — awaiting review before Phase 4.**
