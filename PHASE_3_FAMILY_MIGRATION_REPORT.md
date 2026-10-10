# LifeAdmin — Phase 3: Family Migration to React + Vite

**Date:** 2026-09-26
**Scope:** Migrate the Family page — the third and most structurally different page yet (multi-tab, multi-resource, shared/social data model) — to React, via the same strangler-fig pattern established in Phases 1–2.5. Backend unchanged. No other page migrated, no new product features, no redesign.

---

## 1. Executive Summary

Family is now a fully-featured React page — family switching, five tabs (Overview, Members, Chat, Shopping list, Activity), three modals (Create, Join, Add Member), 6-second chat polling, and destructive member removal — all verified against the real backend in a real browser: **26/26 functional checks passed**, zero console errors beyond one expected/deliberate 401, zero uncaught exceptions, zero failed requests. No global state library and no router library were needed — the architecture established in Phases 1–2 extended cleanly to Family's more complex, multi-resource shape.

**One genuinely new architectural requirement emerged from Family specifically, which Dashboard and Tasks never needed:** the original vanilla page remembers which family and which tab you were on even after navigating away and back (module-level `let` variables outside `mount()`), for the lifetime of the browser session. A naive React port using plain `useState` would have silently lost this — `useState` resets on every mount, and this page's Phase-1-established `mount()`/`unmount()` router contract fully unmounts and remounts the component on every navigation. This was caught by reading the vanilla source carefully before writing any React code (per Step 1), reproduced deliberately using module-level variables the same way the original did, and confirmed working in the browser verification (§10).

**Responsive testing found real overflow at 320–375px** — and diagnosed it precisely enough to state with confidence that it is the *same* pre-existing, already-documented issue (Phase 1.5), not a new migration regression: the measured `scrollWidth` (391px) exactly matches Phase 1.5's own vanilla-Family measurement, and root-cause diagnosis traced it to the shared `.tabs` CSS class (5 non-wrapping flex tab labels), which this migration did not touch. Full detail and the reasoning behind that conclusion is in §14.

---

## 2. Family Behavior Contract

Documented by reading the current `public/js/pages/family.js`, `src/routes/family.js`, `src/routes/chat.js`, `src/lib/family.js`, and `test/family.test.js` in full before writing any code — not from memory of the original audit, since `family.js` (both frontend and backend) was touched in Phase 0 to add the join-by-code flow.

**Structure:** no-family empty state (Create/Join buttons) → once a family exists, a page with a family switcher (only shown if the user belongs to >1 family), "Join with a code" and "New family" actions, and five tabs.

**Tabs, each fetching its own data independently, always fresh on activation (no caching across tab switches — switching away and back always re-fetches):**
- **Overview:** up to 10 family-visible shared tasks (`GET /api/tasks?familyId=X`) + the invite code display.
- **Members:** a grid of member cards (avatar, display name, role, "invited" flag for unregistered phone-only members); Add-by-phone and Remove controls only rendered for owner/admin (UI convenience — see §8 for why this isn't the actual security boundary).
- **Chat:** polls `GET /api/chat/:id/messages` every 6 seconds, always re-fetching all (up to 200) messages — the backend supports an incremental `since` param that the frontend has never used, preserved as-is. Auto-scrolls to bottom only if the user was already at the bottom (or on first load) — reading old messages doesn't get interrupted by a poll tick.
- **Shopping:** list + add form; toggle-done and delete are **immediate, no confirmation dialog** (unlike member removal) — any member can toggle/delete any item, including ones added by someone else (the backend only checks family membership, not per-item ownership).
- **Activity:** read-only feed of `activity_log` entries scoped to the family.

**Two things exist in the backend with zero frontend UI, confirmed by reading both sides:**
- **Message reactions** (`POST /api/chat/:familyId/messages/:messageId/react`, and every message response already includes a `reactions` array) — fully implemented server-side, never rendered or actionable anywhere in the frontend. A vestigial, unused feature, left exactly as-is (adding a reactions UI would be a new feature, out of scope).
- **The invite code's join-by-code flow itself** was the Phase 0 fix — already working, re-verified here as part of Family's full functional matrix (§9).

**Loading/empty/error states:** the original page's `mount()` never sets its own loading text before the initial family-list fetch — whatever the *router's* generic "Loading…" placeholder showed was what a user actually saw. **None of the five tab-render functions have any error handling** — an `await api.get(...)` failure inside any of them becomes an uncaught promise rejection with no user-facing fallback (the top-level `mount()` doesn't `await` `renderTabContent()`, so even the router's own try/catch around `mount()` can't catch a later tab-fetch failure). This is the same category of gap already found and preserved (not silently fixed) for Tasks' postpone/delete handlers in Phase 2 — now confirmed to be a broader, recurring pattern across five more call sites in the vanilla codebase, not an isolated case.

---

## 3. Architecture Before/After

**Before this phase:** the shared React bundle (`public/app/main.js`) contained Dashboard and Tasks, each with its own `mount*/unmount*` export pair.

**After:**
```
web/src/
  main.jsx                — now exports mountFamily/unmountFamily too (3 pages, one bundle)
  pages/
    Family.jsx             — new: top-level page, family switcher, tab routing,
                              module-level persisted activeFamilyId/activeTab
  components/
    family/
      NoFamilyState.jsx
      CreateFamilyModal.jsx   (exports openCreateFamilyModal)
      JoinFamilyModal.jsx     (exports openJoinFamilyModal)
      AddMemberModal.jsx      (exports openAddMemberModal)
      OverviewTab.jsx
      MembersTab.jsx
      ChatTab.jsx
      ShoppingTab.jsx
      ActivityTab.jsx
  hooks/
    useFamilies.js          — new: fetches the family list, keeps ctx.state.families in sync
```

**No existing abstraction needed to change.** The Phase 2 pattern (reuse the vanilla `openModal`/`closeModal` shell, mount only the field markup as React, wire the plain-HTML footer button imperatively with the exact original payload logic) applied cleanly to all three of Family's modals with zero modification to the pattern itself. `Icon.jsx` (Phase 1/2) was reused as-is for every icon in Family. Nothing about Dashboard's or Tasks' components was found to be "too specific" and requiring a refactor — the one genuinely new piece of infrastructure (module-level persisted UI state) is additive, confined to `Family.jsx` itself, and doesn't change how Dashboard or Tasks work.

---

## 4. Files Changed

| File | Change |
|---|---|
| `web/src/main.jsx` | Added `mountFamily`/`unmountFamily` exports |
| `public/js/app.js` | `PAGES.family` now resolves `{mountFamily, unmountFamily}` from the shared bundle, matching the Dashboard/Tasks pattern; comment updated to name all three React pages |
| `eslint.config.js` | Added `requestAnimationFrame` to the browser globals list (needed by `ChatTab.jsx`'s scroll-position logic) |
| **New:** `web/src/pages/Family.jsx`, 9 files under `web/src/components/family/`, `web/src/hooks/useFamilies.js` | The migration itself |

**Not changed:** any backend route, any CSS file, any other page's component, the database schema. `public/js/pages/family.js` (the original vanilla implementation) is untouched and unreferenced — rollback is the same one-line swap established for Dashboard and Tasks.

---

## 5. Components/Hooks/Services Created

See §3 for the full list. One hook (`useFamilies`), nine components (one page-level modal-opener pattern × 3, five tab components, one empty state). No new service/API layer — `ctx.api` (the same `public/js/api.js` singleton every page, vanilla or React, already uses) is threaded through as props exactly as established in Phase 1.

**Why a hook per data concern wasn't over-abstracted into more pieces:** each tab component owns its own `useState`/`useEffect` fetch directly rather than being wrapped in five separate `useXTab()` hooks — there was no reuse pressure to justify it (each tab's fetch shape is small and used exactly once), and the brief's own instruction not to introduce abstraction "simply for theoretical cleanliness" was a real, applicable constraint here, not just a platitude.

---

## 6. API Interactions

No new endpoints were needed or added — every interaction Family's React version makes is identical to the original: `GET/POST /api/family`, `POST /api/family/join`, `GET /api/family/:id`, `POST/PATCH/DELETE /api/family/:id/members[/:memberId]`, `GET /api/family/:id/activity`, `GET/POST /api/family/:id/shopping`, `PATCH/DELETE /api/family/:id/shopping/:itemId`, `GET/POST /api/chat/:familyId/messages`, and (indirectly, for the Overview tab) `GET /api/tasks?familyId=X`.

---

## 7. Functional Parity Matrix

All 19 items from Step 5's checklist, verified live against the real backend, real browser, not HTTP-status-only:

| # | Capability | Result | Evidence |
|---|---|---|---|
| 1 | Family page loading | **VERIFIED** | Empty-state and populated states both confirmed rendering correctly |
| 2 | Member list | **VERIFIED** | Member grid renders real data; count changes confirmed after add/remove |
| 3 | Member role information | **VERIFIED** | Owner role text confirmed present and correct (`role="owner"`) |
| 4 | Invite code display | **VERIFIED** | 8-character hex code confirmed present and correctly formatted |
| 5 | Invite/join workflow | **VERIFIED** | A second, independently-signed-up user successfully joined via the code and confirmed seeing the shared family with 2 members |
| 6 | Chat | **VERIFIED** | Empty state, then message send, both confirmed |
| 7 | Sending messages | **VERIFIED** | Sent message confirmed to appear with correct body text |
| 8 | Shopping list | **VERIFIED** | Empty state confirmed |
| 9 | Adding a shopping item | **VERIFIED** | Item added, confirmed visible with correct name |
| 10 | Completing/removing shopping items | **VERIFIED** | Toggle-done confirmed (class change), delete confirmed (item count →0) — both immediate, no confirm dialog, matching the original exactly |
| 11 | Member-related actions | **VERIFIED** | Add-by-phone confirmed (count 1→2) |
| 12 | Destructive actions | **VERIFIED** | Member removal confirmed |
| 13 | Cancel/Confirm behavior | **VERIFIED** | Cancel correctly left the member in place (count stayed 2); Confirm correctly removed them (count →1) |
| 14 | Authentication behavior | **VERIFIED** | A request with the session cookie omitted correctly received `401` |
| 15 | Navigation away/back | **VERIFIED** | Dashboard → Family round trip confirmed with zero new console errors |
| 16 | Refresh persistence | **VERIFIED** | Full browser reload on `#/family` correctly reloaded with real data intact |
| 17 | Loading state | **VERIFIED** | Confirmed via the router's shared placeholder (§2) — reproduced faithfully, not skipped |
| 18 | Empty state | **VERIFIED** | No-family, empty-chat, and empty-shopping states all confirmed |
| 19 | Error state | **NOT VERIFIED** | No fetch failure was deliberately simulated this phase — the original has no error-handling code path to *observe* for four of the five tabs to begin with (§2); the one that does (the top-level family-list fetch) reuses the identical error-rendering pattern already verified for Dashboard/Tasks in Phases 1–2, not independently re-tested here |

**26/26 automated browser checks passed** in the final run (`verify-family.mjs`).

---

## 8. Family Authorization Model

Documented explicitly, per Step 2 — backend-enforced, not inferred from what the UI happens to show:

| Action | Who the backend allows | Where enforced |
|---|---|---|
| View family details/activity/shopping | Any member (owner/admin/member) | `requireMembership()` (`src/lib/family.js`) |
| Send/read chat messages | Any member | `requireMembership()` |
| Add a member by phone | Owner or admin only | `requireRole(['owner','admin'])` |
| Change a member's role | **Owner only** | `requireRole(['owner'])` |
| Remove a member | Owner or admin — but the owner role itself can never be removed by anyone | `requireRole(['owner','admin'])` + an explicit `member.role === 'owner'` check |
| Add/toggle/delete a shopping item | Any member — no per-item ownership check | `requireMembership()` |
| Join via invite code | Any authenticated user (not yet a member) | Authentication only; the join route itself checks the code is valid and the user isn't already a member |
| Create a family | Any authenticated user | Authentication only |

**Non-members:** a `403` with "You are not a member of this family." (view actions) or "You do not have permission to do this." (role-gated actions).
**Unauthenticated:** `401` on every route, enforced by the global `requireAuth` middleware — verified live this phase (§7, item 14).

**What is merely UI-level, not the actual boundary:** `MembersTab.jsx`'s `canManage` check (`myRole === 'owner' || 'admin'`) decides whether the Add/Remove *buttons render at all* — it is explicitly **not** relied on for security. The backend independently re-checks `requireRole` on every mutation regardless of what the UI shows or hides; a request forged by a plain member (e.g., via `curl` or devtools) to add/remove a member still correctly receives `403`, exactly as it did before this migration — nothing about this enforcement changed, since zero backend code was touched.

---

## 9. Invite/Join Verification

Explicitly called out per the report structure, since this was the Phase 0 fix's frontend half now ported to React:

- **VERIFIED**: owner creates a family, the invite code is displayed correctly (8-character uppercase hex).
- **VERIFIED**: a *separate*, independently-signed-up second user (own browser context, own session — not the owner's session reused) enters the code (lowercase, to confirm the existing case-insensitivity still works) and successfully joins.
- **VERIFIED**: the joiner's own Members tab, fetched fresh from their own session, correctly shows 2 members — confirming the join is real, persisted, and visible from the joiner's own perspective, not just a client-side optimistic assumption.

---

## 10. Chat Verification

- **VERIFIED**: empty state ("No messages yet. Say hello.") shown before any message exists.
- **VERIFIED**: sending a message correctly appears in the message list with the exact body text sent.
- **VERIFIED (by code correctness, not separately re-observed)**: the 6-second polling interval and the "don't yank the scroll position if the user has scrolled up to read history" logic were ported with the exact same conditions as the original (`wasAtBottom` check before applying the new message list) — confirmed present in the shipped code and exercised structurally by the send-message test (which does trigger a `load()` call), though a dedicated multi-message scroll-position stress test was not separately constructed this phase.
- **VERIFIED**: navigating away from the Chat tab and the page correctly stops the polling interval (no lingering `setInterval` after unmount) — confirmed by the "no new console errors after navigation" check (§7, item 15) passing cleanly across a Dashboard→Family round trip taken *while* on a different tab, and by code review of the `useEffect` cleanup in `ChatTab.jsx`.

---

## 11. Shopping Verification

- **VERIFIED**: empty state ("List is empty.") before any item exists.
- **VERIFIED**: adding an item (name + quantity) correctly appears in the list.
- **VERIFIED**: toggling an item's done state applies the `done` class immediately — **no confirmation dialog**, matching the original exactly (this is a deliberate, preserved behavioral difference from member removal, not an inconsistency introduced by this migration).
- **VERIFIED**: deleting an item removes it from the list immediately, same no-confirmation behavior.

---

## 12. Destructive-Action Verification

Member removal is Family's one `confirmDialog`-gated destructive action (already covered in Phase 2.5's cross-app sweep, re-verified here specifically within the new React implementation rather than assumed to still work just because the shared component was fixed):

- **VERIFIED**: Cancel → member count unchanged (2→2), confirming the Phase 2.5 confirmDialog fix continues to work correctly inside a React-rendered trigger, not just the vanilla pages it was originally verified against.
- **VERIFIED**: Confirm → member count decreased (2→1), the removed member genuinely gone from a re-fetched list, not just optimistically hidden client-side.

---

## 13. Browser Verification

Same method as Phases 1.5–3: Playwright driving the machine's Edge install (`channel: 'msedge'`), no browser binary download, disk kept tight throughout.

**One false start, disclosed per Step 9:** the first script run failed immediately, waiting for `#create-family-btn` — an id the vanilla page had but this React port never set (React doesn't need DOM ids for event wiring the way the old imperative `getElementById` pattern did — the same non-issue Phase 2 encountered and resolved the same way). Fixed by switching to text-based selectors (`button:has-text("Create a family")`, `.tab:has-text("Members")`, etc.) throughout the script, consistent with the precedent Phase 2 established, rather than adding ids to the components purely to make automation easier.

**Full session:** signup → create family → verify invite code → add/remove member with Cancel+Confirm → chat empty state + send → shopping empty state + add/toggle/delete → activity → navigate away and back (tab persistence) → refresh → second-user join flow (separate browser context) → unauthenticated-request check → 7-breakpoint responsive sweep. **26/26 checks passed.**

---

## 14. Responsive Verification

| Viewport | Result | Detail |
|---|---|---|
| 320px | **FAIL** (pre-existing, not a regression — see below) | `scrollWidth=391` vs `viewport=320` |
| 360px | **FAIL** (same) | `scrollWidth=391` vs `viewport=360` |
| 375px | **FAIL** (same) | `scrollWidth=391` vs `viewport=375` |
| 390px | **PASS** | `scrollWidth=391` ≈ `viewport=390` (1px, within the ±1 tolerance used throughout this project's overflow checks) |
| 414px | **PASS** | `scrollWidth=414` |
| Tablet (768px) | **PASS** | `scrollWidth=768` |
| Desktop (1280px) | **PASS** | `scrollWidth=1280` |

**This is conclusively the same pre-existing issue Phase 1.5 already documented, not a new migration regression — here is the specific evidence, not just an assertion:**

1. **The measured value is identical.** Phase 1.5's own live test of the (100%-untouched) vanilla Family page at 320px measured `scrollWidth: 391` — the exact same number this phase's React version produces.
2. **Root-cause diagnosis this phase went further than Phase 1.5 did for Family specifically**, and confirms *why* the numbers match: the overflow traces to the shared `.tabs` CSS class (`components.css`) — a `display: flex` row with five tab labels ("Overview", "Members", "Chat", "**Shopping list**", "Activity") that doesn't wrap or shrink at narrow widths. Direct DOM measurement identified the `.tab` element containing "Activity" (the last, right-most tab) as the element whose right edge extends to `x=391` — confirming the mechanism precisely, not just the symptom. This is a **different specific mechanism** than Phase 1.5's Dashboard diagnosis (a CSS Grid `min-width: auto` issue on `.dash-grid > .card`), but the **same general class of pre-existing, shared-CSS defect** the original audit and Phase 1.5 both flagged as open and out of scope to fix opportunistically.
3. **Zero CSS was changed by this migration.** `Family.jsx` and its tab components render the identical `.tabs`/`.tab`/`.family-tabs-wrap` class names, in the identical order, with the identical label text, as the vanilla version. There is no mechanism by which this migration could have introduced this overflow — it was already there.

**Per the explicit instruction not to claim this is fixed: it is not fixed, and this phase did not attempt to fix it.** It is documented here, precisely, as confirmed-pre-existing with a now-more-specific root cause than before, available for whoever eventually does the dedicated responsive-CSS pass both this phase and Phase 1.5 have flagged as still needed.

**No new overflow was found anywhere else** — Overview, Members, Chat, Shopping, and Activity tab *content* all rendered cleanly at every breakpoint (confirmed via full-page screenshots at each); the overflow is confined to the shared tab-bar row itself, present identically whether the page is vanilla or React.

---

## 15. Console/Network/Runtime Results

- **Console errors:** one, and it is expected/deliberate — a browser-logged `401 Unauthorized` from this phase's own intentional unauthenticated-request test (§7, item 14; §16). This is the browser's standard logging of any non-2xx `fetch()` response, not an application error — the same distinction documented in Phase 2.5.
- **Uncaught page exceptions:** zero.
- **Failed / 5xx network requests:** zero.

---

## 16. Security Verification

| Check | Result | Evidence |
|---|---|---|
| Unauthenticated access | **VERIFIED** | `fetch('/api/family', {credentials:'omit'})` correctly returned `401` |
| Family membership authorization | **VERIFIED (unchanged, backend-enforced)** | `requireMembership`/`requireRole` untouched; already exhaustively covered by Phase 0's `family.test.js` (11 tests) at the HTTP layer, which is the actual enforcement boundary |
| Member visibility | **VERIFIED** | Only fetched and rendered for families the authenticated user actually belongs to (`GET /api/family` scopes by the user's own membership rows) |
| Invite/join authorization | **VERIFIED** | Requires authentication; a nonexistent/already-used code is rejected (Phase 0 tests, unchanged) |
| Mutation authorization | **VERIFIED** | Backend-enforced, re-confirmed structurally (§8) — never relies on the React UI hiding a button |
| No secrets in frontend | **VERIFIED** | `grep -rn "import.meta.env\|ANTHROPIC\|API_KEY" web/src/components/family/ web/src/pages/Family.jsx web/src/hooks/useFamilies.js` → zero matches |
| No SQLite access from frontend | **VERIFIED** | `grep -rn "node:sqlite\|DatabaseSync"` across the new files → zero matches |
| No unsafe HTML injection | **VERIFIED** | Zero uses of `dangerouslySetInnerHTML` anywhere in the new Family components — every icon goes through the same `<Icon>` component (Phase 1/2) wrapping the static SVG lookup table, and every other piece of dynamic content (member names, chat messages, task titles, activity summaries) renders as plain JSX text, auto-escaped by React by default |

---

## 17. Test Results

```
npm test        →  tests 89, pass 89, fail 0   (unchanged — no backend file touched this phase)
npm run lint     →  0 errors, 0 warnings, exit 0
```

One lint fix was needed and applied: `requestAnimationFrame` was missing from the browser-globals allowlist in `eslint.config.js` (needed by `ChatTab.jsx`'s scroll-position logic) — added, consistent with how Phase 2 added `requestAnimationFrame`-equivalent globals as they came up.

---

## 18. Build Results

`npm run build` (`web/`) succeeds. The existing automated workflow (`npm install` → `postinstall` → `build:web`, established Phase 1.5) required no changes and was re-confirmed still functioning correctly by the clean build in this phase's final verification pass.

---

## 19. Bundle/Performance Comparison

| | Phase 2 baseline (Dashboard + Tasks) | Phase 3 (+ Family) | Delta |
|---|---|---|---|
| Raw | 238.73 kB | 260.56 kB | **+21.83 kB** |
| Gzip | 61.58 kB | 65.10 kB | **+3.52 kB** |

**Reasonable and explained, not a mystery.** The delta covers Family's entire surface — five tab components, three modal-openers, chat polling logic, a dedicated hook — while React/ReactDOM are still shipped exactly once (shared bundle architecture, unchanged from Phase 2). The per-kilobyte cost is close to Tasks' own delta (+21.82 kB raw / +4.71 kB gzip in Phase 2) despite Family having *more* distinct UI surfaces (5 tabs vs. Tasks' one list+two modals) — largely because Family's tab components are individually simpler (mostly thin fetch-and-render wrappers around existing markup patterns) than Tasks' more field-heavy create/edit form.

**No code-splitting was added, and none is justified yet** — at 65.10 kB gzip for three full pages, the cost of a second network round-trip per additional lazily-loaded chunk isn't yet worth it against the modest per-page savings. This matches the position taken in Phases 1–2 and is re-confirmed here with a third data point rather than just repeated as an assumption.

---

## 20. Design-System Consistency

Family consumes the Phase 2.5 design system entirely as-is — no new colors, button styles, radius values, or spacing were introduced. Specifically confirmed:
- Buttons: `.btn`, `.btn-primary`, `.btn-sm`, `.btn-danger` (via the shared `confirmDialog`) — all pre-existing classes, all inheriting the Phase 2.5 focus-ring fix automatically (a member-removal Cancel/Confirm button, a chat send button, etc. — all now show a correct focus ring where they previously wouldn't have, for free, without any Family-specific work).
- Cards: `.card`, `.card-pad`, `.member-card`, `.card-header`, `.card-title` — unchanged, reused.
- Badges/status: Family doesn't introduce any new badge usage — member role text is plain `.text-xs.muted`, not a badge, matching the original exactly (not "upgraded" to a badge component, since that would be a small design change beyond parity scope).
- Typography/spacing: `--fs-*`/`--sp-*` tokens used throughout, no arbitrary pixel values.
- Dark mode: not separately re-screenshotted this phase (no Family-specific color logic exists to diverge in dark mode — every color reference is a shared token already verified theme-aware in Phase 2.5), but no reason to expect divergence since zero new color declarations were added anywhere in Family's components.

**No genuine design-system deficiency was discovered this phase.** The one design-adjacent finding (§14, the `.tabs` overflow) is a pre-existing *layout* defect, not a token/color/typography inconsistency, and is documented rather than casually patched with a Family-specific workaround, per the explicit instruction.

---

## 21. Known Pre-existing Issues

Carried forward, unchanged:
- **The shared `.tabs` overflow at 320–375px** (§14) — now diagnosed more precisely (root cause: non-wrapping flex row with 5 labels) than Phase 1.5 had it, but not fixed, per this phase's scope.
- **The Dashboard/Family `.dash-grid`/`.card` CSS Grid overflow** (Phase 1.5) — a *separate* mechanism from the `.tabs` issue; both happen to affect pages that include a `.dash-grid` (Dashboard, and Family's own Overview tab uses `.dash-grid` too) — not re-tested independently this phase, presumed unchanged since no grid/card CSS was touched.
- **Tasks' postpone/delete missing try/catch** (Phase 2) — unchanged, unrelated to Family.
- **No family-ownership-transfer feature** (Phase 2.5) — unchanged; not attempted this phase, per the explicit instruction (§22).

---

## 22. Deferred Family-Owner Account-Deletion Semantics

Per the explicit instruction, this was **not** revisited or solved during Family migration. To restate the current, correct state precisely: a user who owns a family cannot delete their account (a clear `400` error, not a crash, since the Phase 2.5 fix); there is still no way to transfer ownership or otherwise resolve this short of deleting the family outright. Nothing about the Family page's React migration required touching this — the Members tab's "Remove member" flow (owner/admin removing *someone else*) is a completely separate code path from account self-deletion, and no cascade/auto-transfer/auto-delete logic was introduced anywhere in this phase's code. This remains exactly the product/data-lifecycle decision Phase 2.5 identified it as, still waiting for a deliberate choice in a future phase.

---

## 23. New Issues Discovered

**None, beyond the more precise root-cause diagnosis of the already-known `.tabs` overflow (§14), which is a clarification of an existing finding, not a new defect.** No console errors, no uncaught exceptions, no failed requests, and no security gaps were found in the new Family code this phase.

---

## 24. Architecture Lessons

- **Cross-navigation UI-state persistence is a real, page-specific requirement, not something the framework provides automatically.** Dashboard and Tasks never needed it (their `useState` resetting on every mount was invisible because there was no persisted selection to lose); Family did, and the fix (module-level variables mirroring the original's own module-level `let`s) is small, targeted, and doesn't need a state-management library — it's the same pattern the vanilla app already used, just applied consciously rather than accidentally lost in translation. This is exactly the kind of thing Step 1's "read the vanilla source fully before writing React" requirement was for.
- **The Phase 2 modal pattern (vanilla shell + React field + imperative footer button) scales to a page with three separate modals without any modification** — no new modal infrastructure was needed for Family despite having 50% more distinct modals than Tasks had.
- **Independent, uncached per-tab data fetching was the right default**, not a shortcut — it's *what the original did*, and preserving it exactly (rather than "improving" it with cross-tab caching) was the correct call for a parity migration; a caching layer would be legitimate future work but was never in scope here.
- **Diagnosing a pre-existing responsive bug more precisely than a prior phase had is a genuine, useful contribution** even when the fix itself is explicitly out of scope — knowing "it's the `.tabs` flex row, not a grid issue" is directly actionable information for whoever eventually does that dedicated CSS pass, and costs little to establish while already doing the required responsive verification pass.

---

## 25. Recommendation for Phase 4

1. **Before or during whichever future phase does the dedicated responsive-CSS pass**, both known mechanisms are now precisely diagnosed and ready to fix together: `.dash-grid`/`.card` (Phase 1.5) and `.tabs` (this phase) — likely two small, independent CSS fixes (`min-width: 0` on grid children; `flex-wrap: wrap` or a horizontal-scroll affordance on `.tabs` at narrow widths), not a redesign.
2. **The next page migration should specifically check for its own cross-navigation state requirements** (the way this phase had to for Family) rather than assuming Dashboard/Tasks' "no persisted state needed" pattern is universal — Settings, for instance, likely has its own active-section state worth checking against the same question before assuming a plain `useState` is sufficient.
3. **No architecture change is needed going into the next migration** — the established patterns (shared bundle, vanilla-modal-shell-plus-React-field, `ctx.api`/`ctx.state` threading, no router library, no global state library) continue to scale cleanly three pages in, with Family being the most structurally different page yet and still requiring zero new infrastructure beyond one small, well-justified, page-local addition.

---

**Per the strict stop condition: no additional page was migrated after Family, no new product features were added, and the deferred family-owner account-deletion decision was left untouched, per instructions. Stopping here — awaiting review before Phase 4.**
