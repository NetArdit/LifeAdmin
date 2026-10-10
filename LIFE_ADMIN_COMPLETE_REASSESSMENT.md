# LIFE ADMIN — Complete Product Reassessment
### After AI Recovery + Hardening 1.5

**Research/audit only. No application code, schema, dependencies, or configuration were modified.** Evidence: fresh screenshots in `audit-evidence/reassessment/` (light/dark, 375/1280px, 10 pages + a modal + login), a direct scheduler trace, a real overlap check on the mobile bottom nav, and synthesis of everything verified in every prior phase this session (Final Whole-Product Audit, Hardening 1, Hardening 1.5, AI Recovery), re-checked against current code where it mattered rather than assumed. Baseline re-confirmed: 184/184 backend tests, lint clean, build 356.42 kB / 81.25 kB gzip.

Labels: **VERIFIED** (observed this session) · **CONFIRMED** (re-checked against current code) · **CARRIED FORWARD** (unchanged since a prior phase's verification, not re-tested) · **THEORETICAL** · **NEW FINDING** (not previously reported).

---

## 1. Executive Summary

LifeAdmin's authorization, privacy, and AI-integration layers are now genuinely solid — this is the product's real engineering strength, built across five prior phases and re-confirmed here rather than assumed. The product's real weaknesses are elsewhere: **the product cannot be deployed anywhere real yet** (no verified email, no HTTPS/proxy decision, no persistence plan), **one of its three core AI journeys (Plan) is completely broken by a scheduler bug that has never worked, not once, since it was written**, and **the visual design is competent but generic** — the user's complaint is valid and specific, not a matter of taste versus the earlier "technically consistent" finding, which measured something different (token discipline, not visual impact). A handful of settings actively lie to the user (toggle it, nothing happens). None of this is a crisis; all of it is fixable without new frameworks, new dependencies, or a rewrite.

**New findings this session, not previously reported:**
1. The scheduler has at least **two more bugs beyond the known crash** — block fragmentation smaller than the requested minimum, and a silent midnight-crossing time-window failure mode that produces a misleading error message.
2. `/api/ai/plan/apply` constructs task times with a timezone-naive `new Date()` call — on any server whose OS timezone differs from the user's, tasks will save at the wrong wall-clock time.
3. The visual design, assessed from real screenshots rather than from CSS-token discipline, is honest, calm, and readable, but has almost no distinguishing visual personality anywhere except a single serif numeral on the Dashboard — every other surface is a fairly ordinary light-SaaS layout, and native, unstyled browser date/time pickers appear inside an otherwise-designed task form, which is the most visible seam in the whole product.
4. A DOM-geometry check on the mobile bottom nav initially looked like a content-overlap bug; a direct screenshot proved it is normal, correct fixed-nav behavior. Recorded here specifically so it is not mistaken for a defect later (see §22, Self-Critique).

---

## 2. Current Product State

Verified this session: **184/184 backend tests, lint clean, build 356.42 kB / 81.25 kB gzip** — unchanged from the AI Recovery phase, confirming nothing regressed since. Every route, every family/task authorization path, and the AI structured-output boundary all pass their respective suites. Ten React pages sit behind one shell; the only remaining vanilla-JS surface is the auth screen and ~132 KB of unreachable legacy page modules (dead weight, not a live risk — confirmed unreferenced by the router).

## 3. Product Assessment

**What problem does LifeAdmin actually solve today?** It is a genuinely coherent life-administration tool for a single person or a small household: tasks, bills, a shared family space, goals, and a deterministic decision-scoring tool, unified by one dashboard that answers "what needs me right now." The promise ("tell it what's happening, it organizes what's next") is **honestly kept** for tasks, bills, and family coordination — those are real, working, and mutually reinforcing (a family task shows up in the family feed, the dashboard, search, and notifications, correctly scoped by the now-solid authorization layer).

**Is the product promise clear?** Yes, for the deterministic core. It is **not** yet clear for the AI layer — the tagline implies AI is central ("tell it"), but AI is currently invisible in the running product (no key configured anywhere in this environment) and, even when configured, one of its three journeys is broken (§13).

**Coherence:** every major page — Dashboard, Tasks, Family, BillSense, Goals, DecisionFlow — shares navigation, terminology, empty/loading/error patterns, and a single design-token system. This is real and verified, not aspirational.

**Essential vs. secondary vs. bloat:**
- **Essential, working well:** Dashboard, Tasks, Family, BillSense. These are the load-bearing walls.
- **Secondary but coherent:** Goals, Timeline, DecisionFlow — genuinely useful, correctly deterministic, not overbuilt.
- **Feels like bloat / isolated:** EcoLife. It has no cross-links to Dashboard or Timeline (confirmed unchanged: `src/routes/dashboard.js` never queries `eco_logs`), no family sharing, no relationship to the rest of the product's "what's next" loop. It is a complete, working feature that nonetheless does not participate in the product's core identity.
- **Underdeveloped relative to its billing:** Assistant. The tagline's centerpiece is the product's least reliable area right now (§13).

**Where it feels generic:** the visual layer (§5) and the settings panel, which has three controls that do nothing (§9, §17).

**Where it is genuinely differentiated:** the family-task privacy/authorization model is unusually rigorous for a product this size — a private task inside a shared family truly stays private through every surface (feed, timeline, search, notifications, dashboard, AI context), and former members lose access immediately and provably. Most hobby-scale family apps do not get this right; this one now does, verified repeatedly.

**5 most important user journeys, and where they currently break:**
1. Onboard → create/join family → first task — works end to end, verified across every hardening phase.
2. Daily triage (Dashboard → complete/postpone a task) — works.
3. Pay a bill — works.
4. Ask the Assistant to plan the week — **breaks** (§13, scheduler crash on any realistic input).
5. Recover a forgotten password — works locally against a dev outbox; **unverified** against a real inbox (carried forward, still true).

**What would make the product feel significantly more mature without adding functionality:** fixing the three settings that lie (§9), fixing the scheduler so Plan actually works, and a **restrained** visual pass (stronger type contrast between headline and body, a genuine accent color used somewhere besides badges, styled date/time inputs) — none of this is new features; all of it is finishing what exists.

## 4. UX Assessment

| # | Issue | P | Evidence | Journey | Impact | Cause | Direction |
|---|---|---|---|---|---|---|---|
| U1 | Native, unstyled date/time pickers inside an otherwise fully custom-designed task form | P2 | `light-1280-modal-task.png` — visibly different chrome (OS calendar icon) from every other control | Create/edit task | Breaks the crafted feel at the exact moment a user is most engaged with a form | `<input type="date">`/`<input type="time">`, no custom picker component (correctly avoided as a dependency, but the native fallback isn't styled) | A lightweight CSS-only styling pass on the native control (accent-color, sizing) — not a new date-picker library |
| U2 | Three settings that visibly do nothing when toggled | P1 | CONFIRMED this session: `notif_prefs`/`ai_enabled` written, never read by any route; `reminder_minutes_before` stored, nothing ever sends one | Settings | Directly erodes trust — the one place a user checks "did that work" | Dead server-side wiring | Enforce or remove; do not ship a toggle with no effect |
| U3 | Assistant's "AI is not configured" state names an internal env var (`ANTHROPIC_API_KEY`) to the end user | P3 | `dark-1280-assistant.png` | Assistant | Minor — a household user has no context for that string | Copy written for a developer audience | Rephrase for a non-technical reader; keep the technical name in developer docs only |
| U4 | Plan feature fails with a generic 500-adjacent error on any realistic input | P0 | CONFIRMED this session (§13) | Assistant → Plan | Complete journey failure, not a rough edge | Scheduler bug | Fix the scheduler (separate phase, not this one) |
| U5 | EcoLife has no path back into Dashboard/Timeline | P2 | CONFIRMED (grep, unchanged) | Planning | Feature feels bolted-on, not part of the core loop | Product scoping choice, not a bug | Either integrate lightly (one dashboard line) or accept it as a deliberately small module — a product decision, not an engineering fix |
| U6 | Session expiry drops the user on a raw "Not authenticated." string inside the live shell | P1 | CARRIED FORWARD from the final audit, unchanged this session (`public/js/app.js` still has no central 401 handler) | Any long session | Confusing, looks broken | No global 401 interceptor | Central redirect-to-login on 401 |
| U7 | Family tab strip and several list rows are mouse-only | P1 | CARRIED FORWARD (axe-core Level-A findings, unchanged) | Family, Tasks, BillSense, DecisionFlow | Excludes keyboard/screen-reader users entirely from core flows | Plain `<div>` tabs/rows, no `tabindex`/role | Accessibility phase (already scoped in the standing recommendation) |
| U8 | Chat freezes once a family passes 200 messages (oldest shown, not newest) | P1 | CARRIED FORWARD, unchanged | Family chat | The one real-time feature stops updating | `LIMIT 200` ordered oldest-first, unpaged | Serve/poll newest-N instead |

## 5. Visual Design Assessment

**The user is right, and this is not a repeat of an earlier finding.** Previous phases measured *token discipline* — one palette, one type scale, light/dark parity, no ad-hoc colors — and that measurement was accurate and remains true. It is a different question from whether the product *looks* considered, and the honest answer from real screenshots is: **mostly, but thinly.**

What's genuinely good, confirmed from screenshots: the palette is calm and legible in both themes; dark mode is a real, separately-tuned theme, not an inverted light mode (confirmed correct focus-ring contrast fix from an earlier phase is still in place); the Dashboard's oversized serif "4" for the attention count is the single moment of real visual personality in the entire product — a deliberate, specific choice that works.

What's weak, confirmed from screenshots:
- **Every other surface is a plain white-card-on-off-white-background layout** — BillSense, Family, Goals, DecisionFlow all use the identical card/border/shadow recipe with no visual differentiation between modules. A user moving between Tasks and BillSense has almost no visual cue they've changed context beyond the page title.
- **The type system leans almost entirely on one weight relationship** (bold serif headline, regular sans body) repeated identically on every page; there is no secondary visual rhythm — no module accepts a distinct accent, an illustration, or even a differently-weighted card treatment for its own primary metric the way the Dashboard's "4" does.
- **Native form controls break the crafted illusion** (U1) at the highest-engagement moment (creating something).
- **Badges remain low-contrast** in both themes (CARRIED FORWARD from the axe-core findings — e.g., 2.24:1–3.85:1 on priority pills), which reads as visually weak as much as it fails accessibility — pale pastel text is part of why the product feels understated rather than calm-and-confident.
- **The icon set is a plain, uniform line-icon table** (confirmed: `public/js/components/icons.js` is a static SVG-path lookup) with no weight or style variation to signal hierarchy between primary and secondary actions.

**Is a genuine redesign justified?** **No — a restrained visual-strengthening pass is justified; a redesign is not.** Evidence against a redesign: the underlying system (tokens, spacing scale, component patterns) is sound and consistent, verified across nine migration phases with zero structural rework needed; the problem is a lack of *deliberate accent moments*, not a broken system. A full redesign would re-risk every page that has already been hardened for authorization, accessibility-adjacent behavior, and responsive layout, for a problem that a targeted pass can solve.

**Proposed direction (not implemented):**
1. Give each module exactly one deliberate visual accent point analogous to the Dashboard's "4" (a large stat, a distinctive icon treatment, or a colored rail) — not a new design system, one considered choice per page.
2. Style the native date/time inputs to match the rest of the form (CSS `accent-color`, consistent height/border) — no new dependency.
3. Raise badge/pill contrast to meet WCAG AA (already flagged, ties directly into the accessibility phase — should be done together, see §17).
4. Consider a single distinguishing color-family shift between a few modules' accent usage (e.g., BillSense could lean on the existing `--warning`/`--danger` tokens more visibly for overdue states than it currently does) rather than every page defaulting to `--brand` blue for every primary action.

None of this requires Tailwind, a component library, or a token-system rewrite — it is additive work inside the existing `public/css/tokens.css` and per-page CSS.

## 6. Frontend Architecture

Genuinely clean, confirmed by direct inspection of all 44 components and 7 hooks: one page = one file under `web/src/pages`, one feature area = one component folder, one data concern = one hook (`useTasks`, `useBills`, etc.), no cross-page coupling. The hybrid vanilla-shell + React-page pattern (confirmed still in place: `public/js/app.js` dynamically imports named mount/unmount exports from the single React bundle) is unusual but has been stable and low-risk across nine migration phases — it is **acceptable, deliberate technical debt**, not accidental. Module-level state for cross-remount persistence (`Family.jsx`'s `savedActiveFamilyId`, `Assistant.jsx`'s `savedActiveTab`) is a consistent, well-documented pattern reused four times, not duplicated logic.

**What should NOT be refactored:** the hash-router + hybrid-shell architecture. It has no React Router, no state library, and none of the evidence gathered this session or in any prior phase shows a real problem it would solve — every page's data needs are small and locally owned by that page's own hook.

**What is becoming real debt, not just acceptable debt:** the ~132 KB of unreachable legacy `public/js/pages/*.js` files (everything but `auth.js`) — confirmed unreferenced by the router this session, unchanged since the final audit. This is the one piece of frontend debt worth removing on its own merits (not "cleanup for its own sake" — it is dead code shipped in the repository, a maintenance and onboarding hazard: a new contributor could edit one of these files and never see their change take effect).

**Newly worth naming:** the task-form's family-select semantics (`initialFamilySelection`, added in Hardening 1.5 to fix the private-task re-share bug) is a small, sharp piece of business logic living inside a presentational component file (`TaskFormFields.jsx`). It is currently fine — one function, well-commented, well-tested — but is the kind of thing that should not accrete further without being pulled into a shared module if a second form ever needs the same rule.

## 7. Backend Architecture

Route → service/lib → DB is consistently followed (confirmed by re-reading every route file this session). Authorization is now centralized rather than duplicated: `src/lib/taskAccess.js` is used by every read and write path that touches a task (list, detail, dashboard, search, notifications, comments, AI context) — a genuine, verified architectural improvement from Hardening 1.5, not just a bug fix. `src/lib/family.js` similarly centralizes membership/role checks. Error handling is uniform (`asyncRoute` + one `errorHandler`, confirmed: never leaks a stack trace, `ValidationError` vs. generic 500 cleanly separated).

**Gaps, all previously known and unchanged, re-confirmed this session:** no security-header middleware anywhere in `server.js` (grep: zero matches for `helmet`/`X-Frame-Options`/CSP); no `/health` route; rate limiting exists only for auth-adjacent endpoints (login, forgot-password, reset, invite-join, OTP) — signup and every AI endpoint are unthrottled (confirmed: no limiter import in `src/routes/ai.js`).

**Does the architecture support the product's next stage?** Yes, without changes. Nothing found this session suggests Express, the route/service split, or the lack of a framework is a limiting factor for anything currently planned.

## 8. Database / Data Model

Schema re-inspected this session; no changes since Hardening 1.5 (confirmed: no new tables/columns). Foreign keys, cascades, and the one partial unique index (`idx_family_one_owner`) are all still correctly in place and enforced (re-confirmed: `PRAGMA foreign_key_check` clean in every hardening-phase test run). Ownership is intentionally dual-stored (`families.owner_id` + a `role='owner'` membership row) and kept consistent only through `db.tx`-wrapped transfer logic — this remains a slightly unusual pattern worth a code comment for future maintainers (it has one, confirmed present), but is proven correct under forced-failure rollback testing.

**Technically valid but product-incoherent data states, found by re-reading the schema against current product rules:**
- A `bills` row's `family_id` is now immutable after creation (Hardening 1) but the column itself remains nullable and unconstrained at the DB level — the immutability is enforced only in the route layer. This is consistent with the project's stated preference (application-level enforcement over schema rigidity) and is not a defect, just worth naming as a boundary a future direct-DB script could violate.
- `notifications` has no `task_id`/`family_id` column (confirmed, unchanged) — the read-time filtering in `src/lib/linkedTaskFilter.js` works by parsing the task id out of the `link` string. This is a real, working, tested solution, but it is a data-model smell: a notification's actual subject is encoded in a URL fragment, not a foreign key. Not urgent (it works, it's tested), but the correct data-model fix (a nullable `subject_type`/`subject_id` pair) would remove an entire class of future parsing bugs if notifications ever grow a new linked-entity type.
- `otp_codes` and `password_reset_tokens` have no cleanup job (CARRIED FORWARD) — rows accumulate forever. Harmless at household scale, real at any meaningful scale.

## 9. Security / Privacy — Fresh Independent Pass

This session re-derived conclusions from current code rather than repeating prior phase reports.

| Area | Finding | Class |
|---|---|---|
| Cross-user/cross-family access, IDOR | Re-confirmed closed via `taskAccessSql`/`requireMembership`/`requireRole` on every route touched this session | CONFIRMED, not new |
| XSS | React text-node rendering + `escapeHtml` in the one remaining vanilla surface; no new `innerHTML`/`dangerouslySetInnerHTML` sink found in any file touched since the final audit's sink census | CONFIRMED, not new |
| SQL injection | Every query re-scanned this session uses parameter binding or a closed, non-user-controlled allow-list of column names (e.g., `taskAccessSql`'s alias is regex-validated before interpolation) | CONFIRMED, not new |
| CSRF | Still no token; still mitigated only by `SameSite=Lax` and the absence of any state-changing GET | THEORETICAL, unchanged |
| Security headers | Confirmed absent (grep, zero matches) | DEFENSE-IN-DEPTH gap, not a demonstrated exploit given the authorization layer is now solid |
| Rate limiting | Auth-adjacent endpoints throttled; signup and every `/api/ai/*` endpoint are not (grep-confirmed) | CONFIRMED real, bounded risk (CPU/bcrypt cost, AI cost if a key is ever configured) |
| Email verification | Still demo-mode (code returned in the response) regardless of environment | CONFIRMED, unchanged — misleading if a "Verified" badge is ever shown to real users |
| Reset tokens | Hashed, single-use, TTL-bound, session-invalidating — re-confirmed via the still-passing account-recovery suite | CONFIRMED sound |
| Exported data / deleted-user data / former-member access / historical notifications | All re-confirmed correctly scoped by the same session's Hardening 1.5 evidence, and this session found no new gap by re-reading `settings.js`'s export route and `notifications.js`'s filter | CONFIRMED closed |
| AI prompt/data exposure | Re-confirmed this session (AI Recovery phase's mock-provider test): context objects built per-request from small, feature-scoped queries; former-member/private data verified absent from a real request payload sent to a mock server | CONFIRMED sound |
| Secrets | No key/token found in any frontend file or the built bundle (re-grepped this session) | CONFIRMED sound |

**No new confirmed vulnerability was found this session.** The honest gap list is unchanged from the final audit: headers, rate-limit breadth, email verification's demo status, and CSRF's theoretical exposure — none newly discovered, none worse than previously reported.

## 10. Accessibility

Not re-run in full (axe-core findings from the final audit were detailed and specific; re-running the identical scan on identical, unchanged components would not produce new information). Spot-confirmed this session: the Family tab strip is still plain `<div>`s (grep: no `role="tab"` on that specific component, unlike Assistant/Settings which do have full ARIA tablists — confirmed inconsistency between pages, not just a single gap). **Prioritized by actual impact:** the Family tabs and task/bill/decision row keyboard-inoperability (P1, U7) block entire journeys for keyboard/screen-reader users, not just individual controls — this is more severe in practice than a contrast ratio, because contrast failures degrade the experience while keyboard-inoperability removes it entirely for that user.

## 11. Performance

No new load-bearing finding. Re-confirmed unchanged: chat's `LIMIT 200` full re-fetch every 6 seconds (bounded, not catastrophic, but wasteful and the direct cause of U8); notification polling every 20 seconds with a silently-swallowed failure; no pagination anywhere lists can grow (tasks, bills). None of these have user-visible cost today at household scale — this is a scaling-debt category, not a current performance problem, and should not be prioritized ahead of correctness/trust issues (§17).

## 12. AI Architecture — Re-Audit

Trace re-confirmed clean and unchanged from the AI Recovery report: UI → API client → thin route (context-building only) → `src/lib/ai.js` service (prompts + schemas) → `zodOutputFormat` boundary → SDK → provider → `.safeParse()` validation → curated `{ok,data|error}` → UI. **Boundaries are correctly maintained:** the route never talks to the SDK directly; the service never touches HTTP; deterministic math (DecisionFlow's weighted scoring, BillSense's stats, the scheduler's placement) is computed entirely outside any AI call, confirmed by re-reading `decisions.js`'s `scoreOptions()` — AI supplies criteria/ratings/text, never the arithmetic.

**Is the current SDK integration maintainable?** Yes — the zod-version boundary is isolated to one well-commented function, and a future SDK/zod upgrade path exists without re-touching seven call sites (confirmed: all seven schemas are ordinary `zod/v4` objects, portable to a real zod-4 dependency later with no shape change, per the AI Recovery report's own analysis).

**Are AI settings enforced?** **No — re-confirmed this session.** `ai_enabled` is stored and returned to the client but no route checks it before making a provider call. This is a real, user-facing trust gap: a household member could turn "Use AI features" off and the assistant would still function (or still attempt to, and still cost tokens if a key exists).

**Plan flow, specifically — see §13 for the full trace.** The AI layer of Plan is verified working (schema builds, request reaches a mock provider, response validates) — the failure is entirely downstream, in deterministic code, not in the AI boundary.

## 13. Scheduler Deep Audit

Traced this session, read-only, from `src/lib/scheduler.js` in full plus its single call site in `src/routes/ai.js`.

**user input → LifePlanSchema (AI, zod-validated) → normalized `activities[]` → `buildBusyBlocks()` → `placeActivities()` → conflict-free placement → `preview[date]` → UI → (optional) `/plan/apply` → real tasks**

**Bug 1 (already known, re-confirmed, not fixed): double-merge crash.** `buildBusyBlocks()` returns already-merged **numeric-minute ranges** (it calls its own internal `mergeBlocks()`/`toRanges()` before returning). `routes/ai.js` passes that numeric result into `placeActivities()`, which calls `freeWindows()` → `mergeBlocks()` → `toRanges()` **again**, and `toRanges()` calls `hmToMinutes(b.start)` on a value that is now a number — `TypeError: hm.split is not a function`. This is **unconditional**: `buildBusyBlocks()` always includes at least the hardcoded `Sleep` block, so any call to `placeActivities` with a non-empty `busy` list crashes. Confirmed: zero test coverage of `scheduler.js` exists anywhere in `test/` (grep, unchanged since AI Recovery).

**Bug 2 (NEW FINDING this session): block fragmentation smaller than the requested minimum.** `placeActivities`'s `minBlock` is used only as a *gate* deciding whether a window is worth entering (`if (avail < minBlock) continue;`) — the actual amount placed is `Math.min(avail, remaining)`, which can be **smaller than `minBlock`** whenever `remaining` (what's left of the activity's total time) is less than `minBlock` on a later window. Example: `totalMinutes=100, minBlockMinutes=60`; window 1 has 80 free minutes (passes the ≥60 gate, 80 minutes used, 20 remaining); window 2 also has ≥60 free minutes (passes the gate again) but only 20 minutes are actually placed into it — a 20-minute fragment despite the caller explicitly asking for no block smaller than 60. Not a crash; a silent violation of the stated contract ("requests: minBlockMinutes" implies no smaller pieces), producing a schedule the user asked the assistant *not* to produce (needlessly fragmented focus time).

**Bug 3 (NEW FINDING this session): a midnight-crossing preference window silently fails with a misleading message, instead of being rejected or handled.** `LifePlanSchema.activities[].earliest`/`latest` are unconstrained `HH:MM` strings (schema allows any values; nothing downstream validates `earliest < latest`). If the AI ever proposes, e.g., `earliest: '22:00', latest: '06:00'` for a genuinely late-night-into-early-morning preference, `earliest(1320) > latest(360)` makes every window's computed `avail` negative, so the activity is silently unplaced in every window and the user is told *"Only fit 0 of X min... not enough free time today"* — a message that describes the wrong cause (the algorithm has no wraparound support, not an actual lack of free time). Low real-world frequency (the system prompt discourages this shape, but nothing enforces it), but a real, reachable correctness gap in a spec-facing contract.

**Bug 4 (NEW FINDING this session): `/plan/apply`'s timezone-naive date construction.** `new Date(`${date}T${block.start}:00`)` (no `Z`, no offset) is parsed in the **server process's local timezone**, then stored via `.toISOString()`. On any real deployment where the server's OS timezone differs from the user's — the normal case for hosted deployments — every task created from an applied plan will save at the wrong wall-clock hour. This is the same general class of issue the final audit already flagged for `todayISO()` (F-22), but this is a **new, specific instance** in a code path that literally could not be exercised before this session (Plan was completely broken until AI Recovery), so it was never previously discoverable.

**Are there other scheduling paths with similar bugs?** `detectOverlaps()` (used by the deterministic conflict-detection path referenced from `dashboard.js`, separate from Plan) was traced and is **not** affected by the double-merge bug — it operates on raw ISO datetime strings via `rangesOverlap()`, a completely separate code path from `buildBusyBlocks`/`placeActivities`. No evidence of a parallel defect there.

**Recommended future test scope (not implemented):** unit tests for `buildBusyBlocks`/`freeWindows`/`placeActivities` in isolation (none exist today — this is the actual root cause of why Bug 1 shipped and stayed hidden for the product's entire life); an integration test posting a realistic AI-shaped plan response through the real `/plan` route (would have caught Bug 1 immediately); a browser test that actually renders a successful `.plan-preview-day` (none exists — the AI Recovery browser run is the first time the UI even attempted this, and it failed for exactly this reason); explicit fixture cases for `minBlockMinutes` fragmentation (Bug 2) and an `earliest > latest` input (Bug 3), which the AI's own schema currently permits and should either validate against or the scheduler should handle gracefully.

**Should the deterministic scheduler architecture be adjusted?** No structural change is indicated — the bug is a call-site/contract mismatch (numeric vs. string ranges) between two functions in the same small module, not a design flaw in the deterministic-placement approach itself, which is sound, fast, and appropriately free of AI involvement in the actual math.

## 14. Framework / Technology Reassessment

| Technology | Current state | Problem | Evidence | Benefit of change | Migration cost | Risk | Recommendation |
|---|---|---|---|---|---|---|---|
| JavaScript vs TypeScript | Plain JS throughout, ~4,000 lines backend + 44 components | No type-related bug was found or reported in any of the six phases this session has full knowledge of | Every defect found across the entire project history (authorization gaps, the scheduler bug, the wiring bug) was a **logic** defect, not a type-shape defect a compiler would have caught | Would catch some categories of error earlier | High — every file touched, a new build step, a new dependency | Medium — this project's own stated constraint is "no unnecessary dependencies/abstractions" | **Do not change.** No concrete problem exists that TypeScript would have prevented; the project's own test-driven verification habit (which caught every real bug this session, including three new scheduler bugs by direct reproduction) is already doing the job types would do, and doing it against real runtime behavior, not just shape. |
| CSS vs Tailwind | Five hand-written CSS files, ~740 lines, token-driven | The design is visually thin (§5), not structurally messy | The CSS itself is consistent, small, and easy to trace (confirmed by reading all five files this session) — the weakness is a lack of deliberate accent choices, which Tailwind does not solve | None — Tailwind is a authoring-syntax change, not a design-quality change | Full rewrite of every class in every component | Would not fix the actual problem identified in §5 | **Do not change.** The visual weakness is a design-decision gap, not a tooling gap; adopting Tailwind would cost a full rewrite and fix nothing. |
| Hash routing vs React Router | Custom hash router in `public/js/app.js`, unchanged across 9 migration phases | None found | Every page's navigation need (list → detail, tab switching) is served correctly today, confirmed by this session's browser testing across the entire app | React Router would add nested-route/history-API sophistication the product does not use | Full navigation-layer rewrite | Low functional risk, but zero measurable benefit found | **Do not change.** No evidence of a routing limitation anywhere in this session's or any prior session's testing. |
| Local/module state vs a state library | `useState` + per-page hooks + a few module-level persisted variables | None found — no prop-drilling complaint, no state-sync bug found in any phase | Every hook (`useTasks`, `useBills`, etc.) owns exactly one page's data; no cross-page shared mutable state exists that isn't already handled correctly by the module-level pattern | A state library would formalize a pattern already working | Moderate — would touch every hook | Low benefit for the cost | **Do not change.** |
| Current forms vs a form library | Uncontrolled `<form>` + `FormData`, per Hardening 1.5's task-form fix this session re-verified as working correctly (including the privacy-sensitive family-select logic) | None found | The one place form logic got subtle (visibility/family selection) was fixed correctly and small (§6) — a form library would not have prevented that bug, which was a *business rule*, not a form-state bug | None demonstrated | Every form touched | New dependency, new abstraction over working code | **Do not change.** |
| Current validation vs a validation library | `zod` already used (AI schemas) + hand-written `validate.js` for request validation | None found — `zod` is already present for the one place it earns its cost (structured AI output); hand-written checks for simple request shapes are small and correct | Every validation gap found this session (e.g., `earliest`/`latest` unconstrained in Bug 3) is a **missing rule**, not a tooling limitation — `zod` is already available and could express that rule today with zero new dependency | Applying `zod` to more request bodies is possible with the existing dependency, not a new one | Low if scoped narrowly | Low | **Partially reconsider, not "adopt a new library":** the existing `zod` dependency could reasonably be extended to a few more request-validation spots (e.g., the scheduler's `earliest < latest` contract) — this is a scope decision for a future phase, not a framework decision. |
| Current component architecture vs a UI library | Hand-built components on shared CSS tokens | The visual thinness (§5) is a design-effort gap, not a component-architecture gap | Every component this session inspected is small, single-purpose, and consistent | A UI library would impose its own visual language, working against the product's calm, non-generic brand goal, and is explicitly against the project's stated intent | Total | Would likely make the product look *more* generic, not less — the opposite of the actual complaint | **Do not change.** |

**No framework/dependency change is recommended anywhere in this reassessment.**

## 15. Product Strategy

**Who is this for?** A single adult or a small household managing the ordinary logistics of a life — tasks, bills, shared family coordination, a few personal goals — who wants something calmer and more private than a generic productivity app, without needing to hand their data to a cloud service. **What job does it perform?** "Tell me what's actually urgent across my whole life right now" (Dashboard) plus "let my family and I coordinate this safely" (Family) — both jobs are genuinely done well. **What differentiates it?** The family-privacy rigor (§3) and the local-first, zero-mandatory-cloud-service posture (verified: the app runs fully with zero external calls when no `ANTHROPIC_API_KEY`/email provider is configured). **Where it feels generic:** the AI layer, ironically, given the tagline — right now it is the least distinctive, least reliable part of the product, and EcoLife's isolation dilutes rather than strengthens the core loop. **What should get stronger:** the Dashboard's "what matters right now" synthesis — it is already the product's best idea; deepening it (without adding new data sources) by surfacing bill-due-soon and goal-stalled signals more prominently would reinforce the actual promise. **What should stay small:** DecisionFlow and Goals are correctly scoped — useful, not bloated. **What should be reconsidered, not necessarily removed:** EcoLife's total isolation from the rest of the product.

## 16. Technical Debt Register

| Item | Class | Evidence | Recommendation |
|---|---|---|---|
| ~132 KB unreachable legacy `public/js/pages/*.js` | Dead code, migration leftover | Re-confirmed unreferenced this session | Safe to remove in a dedicated small phase; not urgent, but a genuine onboarding/maintenance hazard |
| Notifications lack a structured subject reference (§8) | Architectural, mild | `link`-string parsing works but is a smell | Worth a schema addition (nullable columns) if notifications ever gain a second linked-entity type; not urgent today |
| `scheduler.js` has zero test coverage | Test debt, now proven dangerous | Three real bugs found in one read-only pass this session | High priority for whatever phase fixes the scheduler |
| `otp_codes`/`password_reset_tokens` never purged | Slowing-at-scale debt | Confirmed unchanged | Low priority at current scale |
| No security-header middleware, no `/health` route | Deployment/operational debt | Confirmed absent | Bundle with a production-readiness phase, not standalone |
| `effort` parameter removed cleanly in AI Recovery, no debt introduced | — | Confirmed clean | No action |
| Three inert settings (`ai_enabled`, `notif_prefs`, `reminder_minutes_before`) | Dangerous-to-trust debt, not just dead code | Confirmed unchanged | High priority — actively misleads users, unlike silent dead code |

## 17. Production Readiness

| Layer | Status |
|---|---|
| **Code ready** | Yes — authorization, family lifecycle, AI structured-output boundary all verified correct and tested |
| **Configuration ready** | **No** — `.env.example` documents everything needed (Resend, Anthropic) but no real credentials, domain, or HTTPS/proxy decision exists anywhere in this project's history |
| **Operationally ready** | **No** — no health check, no security headers, no backup procedure, no migration-versioning story beyond additive `CREATE TABLE IF NOT EXISTS`, no observability beyond `console.error` |

This three-way split matters: the code is not the blocker for a real launch — the missing operational and configuration decisions are, and none of them are engineering problems this codebase can solve on its own (they need a hosting/domain decision from the product owner).

## 18. User Journey Matrix (30 journeys)

| # | Journey | State |
|---|---|---|
| 1 | First visit | Acceptable |
| 2 | Register | Acceptable |
| 3 | Login | Acceptable |
| 4 | Dashboard | Acceptable, visually thin (§5) |
| 5 | Create task | Acceptable; native date/time pickers weak (U1) |
| 6 | Complete task | Acceptable |
| 7 | Recurring task | Acceptable (deterministic, tested) |
| 8 | Family creation | Acceptable |
| 9 | Invite/join | Acceptable, well-hardened |
| 10 | Family task | Acceptable |
| 11 | Private task | Acceptable — genuinely well-built (§3) |
| 12 | Leave family | Acceptable |
| 13 | Remove member | Acceptable |
| 14 | Transfer ownership | Acceptable |
| 15 | Bill | Acceptable |
| 16 | Decision | Acceptable |
| 17 | Goals | Acceptable |
| 18 | EcoLife | Acceptable but isolated (§3) |
| 19 | Timeline | Acceptable |
| 20 | Assistant Chat | Acceptable *when a key is configured* (verified against mock only) |
| 21 | Assistant Plan | **Broken** (§13) |
| 22 | Weekly Review | Acceptable *when a key is configured* (verified against mock only) |
| 23 | Forgot password | Acceptable locally; unverified against real email |
| 24 | Reset password | Acceptable |
| 25 | Change password | Acceptable |
| 26 | Logout | Acceptable |
| 27 | Session expiry | Poor UX (U6), not unsafe |
| 28 | Account deletion | Acceptable, correctly blocked for unresolved family ownership |
| 29 | Mobile usage | Acceptable; no layout defect found (§22 self-critique) |
| 30 | Error recovery | Acceptable for most flows; poor specifically for session expiry and Plan |

## 19. Master Issue Matrix

| ID | Area | Issue | Evidence | Severity | User Impact | Technical Impact | Security/Privacy | Dependencies | Recommendation | Size | Tests Needed | Defer? | Why |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M1 | AI/Scheduler | Double-merge crash blocks 100% of realistic Plan requests | §13 Bug 1, server stack trace captured | **P0** | Complete journey failure | Isolated, one call-site mismatch | None | None | Fix the call-site contract mismatch | Small | Unit tests for the scheduler module (none exist) | No |Core AI journey |
| M2 | Scheduler | Fragmentation below requested minimum block size | §13 Bug 2 | P1 | Silent quality defect in AI output | Same module as M1 | None | M1 | Fix alongside M1 | Small | Fixture test | Can bundle with M1 |
| M3 | Scheduler | Midnight-crossing `earliest`/`latest` silently mis-explained | §13 Bug 3 | P2 | Misleading error message, rare trigger | Same module | None | M1 | Validate or handle wraparound | Small | Fixture test | Can bundle with M1 |
| M4 | AI / Plan apply | Timezone-naive `new Date()` in `/plan/apply` | §13 Bug 4 | P1 | Wrong task times on any real deployment | Isolated | None | None | Use an explicit offset/UTC construction | Small | Unit test with a non-UTC server TZ | Can bundle with M1 |
| M5 | Settings | `ai_enabled`/`notif_prefs`/`reminder_minutes_before` inert | §9, §16 | P1 | Actively misleading UI | Isolated, small | None | None | Enforce or remove each | Small–Medium | Backend test per setting | No — trust issue |
| M6 | Deployment | No verified real email, HTTPS/proxy, persistence, backups | §17, carried forward | **P0** for public release | Blocks public launch entirely | None (config, not code) | Low | Hosting decision | Configuration/ops phase | Medium, externally gated | Real-inbox test (never yet performed) | No, but externally gated |
| M7 | Accessibility | Family tabs + several rows keyboard-inoperable | §10, carried forward | P1 | Excludes keyboard/screen-reader users from core flows | Isolated per component | None | None | Accessibility phase | Medium | axe-core + real keyboard runs | Can defer briefly, not indefinitely |
| M8 | Chat | 200-message cap shows oldest, not newest | §4 U8, carried forward | P1 | The one real-time feature stops updating | Isolated | None | None | Serve/poll newest-N | Small | Regression test | Can defer |
| M9 | UX | Session expiry shows raw "Not authenticated." | §4 U6, carried forward | P1 | Confusing, looks broken | Shared shell code | None | None | Central 401 handler | Small | Browser test | Can defer |
| M10 | Security | No security headers, no `/health`, signup/AI unthrottled | §9 | P1/P2 mix | Low current exploit risk given solid authorization | Config/middleware | Defense-in-depth | Deployment decision helps scope headers correctly | Bundle with M6 | Small | Header presence test | Yes, safely |
| M11 | Visual design | Generic per-page visual treatment; native inputs unstyled | §5 | P2 | Perceived quality, trust-adjacent | CSS-only | None | None | Targeted accent pass (§5) | Small–Medium | Screenshot review | Yes, safely |
| M12 | Data model | Notifications lack a structured subject reference | §8 | P3 | None today | Schema addition, future-proofing | None | None | Defer until a second linked-entity type is needed | N/A yet | N/A | Yes |
| M13 | Dead code | ~132 KB unreachable legacy pages | §6, §16 | P2 | Maintenance hazard | Isolated removal | None | None | Remove in a small dedicated phase | Small | Build-size check | Yes, safely |
| M14 | AI | Real provider verification never performed | §12, carried forward | P0 for the AI claim specifically | Cannot claim AI works in production | External (needs a key) | Low | A real API key | Verify once available | N/A (verification, not code) | Real-key smoke test | No, but externally gated |

## 20. Roadmap Options (not chosen here)

**Option A — Minimum Release Hardening.** Scope: M1/M2/M4 (scheduler), M5 (inert settings), M6 (deployment/email), M10 (headers, bundled with M6). Solves: every P0 and the trust-eroding inert settings. Leaves open: accessibility, chat cap, visual design, dead code. Risk: low, each item independently testable. Complexity: medium, mostly small items plus one externally-gated item (M6). Validation: full regression suite (already the project's standing habit) + a real-inbox test + real-key AI smoke test once credentials exist.

**Option B — Product Quality / UX First.** Scope: M9 (session UX), M8 (chat), M7 (accessibility), M11 (visual accents), M5 (inert settings). Solves: the day-to-day experience gaps a real household would notice first. Leaves open: Plan remains broken, deployment remains unverified. Risk: low technically; product risk in shipping polish while a core AI journey stays broken.

**Option C — Architecture / Technical Quality First.** Scope: M13 (dead code removal), M12 (notification data-model improvement), scheduler test-coverage buildout (supports M1–M4 but doesn't have to fix them yet). Solves: long-term maintainability. Leaves open: every user-facing gap. Lowest urgency of the four given no architectural problem was found severe enough to justify prioritizing it over M1/M6.

**Option D — Balanced Product Release.** Scope: M1/M2/M4 (scheduler fix — cheap, no external gate, closes a P0), M5 (inert settings — cheap, closes a trust gap), M9 (session UX — cheap), then M6 (deployment/email, start the externally-gated work in parallel since it doesn't block anything else), with M7/M8/M11/M13 sequenced next. Solves: the highest-severity and cheapest items first, starts the one genuinely gated item early so it isn't the last thing blocking launch. Leaves open, deliberately, for a following phase: accessibility, visual accents, dead-code removal — all safely deferrable. Risk: lowest of the four — nothing here has an external dependency except M6, and M6 is *started*, not blocking.

## 21. Challenge to Current Plan

1. **ChatGPT's previous decisions (Hardening 1/1.5 scope discipline):** **agree, strong.** Evidence: every deferred item from those phases (chat/bill notification attribution, F-10 details, invite visibility) was correctly scoped and nothing found this session shows it should have been broader.
2. **My own previous recommendations (the standing `NEXT_PHASE_RECOMMENDATION.md`'s three-track split):** **agree with the split, weak disagreement on emphasis.** That document treated AI recovery as the cheap, fast-moving track. It was cheap for the AI-layer defect, but this session's scheduler audit shows the *feature* (Plan) is still broken and now has three known defects, not one — the standing plan should treat "Plan actually works" as its own tracked item, not folded silently into "AI is done."
3. **The current migration architecture:** **no challenge.** Nine phases of evidence (this session included) show zero structural problems.
4. **The current design direction:** **partial challenge, moderate strength.** The token system and component consistency are sound (no challenge there), but the *design effort* stopped short of giving each module its own visual identity — this is a real gap, not a false complaint, evidenced by direct screenshot comparison across pages.
5. **The assumption that React/Vite should remain unchanged:** **agree, strong.** No evidence anywhere in this session or prior ones of a limitation this stack causes.
6. **The assumption that TypeScript/Tailwind/etc. are unnecessary:** **agree, strong** (§14) — every defect found this session and in prior phases was a logic or design-effort gap, not a type-safety or authoring-syntax gap.
7. **The proposed AI recovery approach:** **agree it was correct, but incomplete as scoped** — it explicitly (and correctly, per its own boundary) stopped short of the scheduler, and that boundary should now be closed in the next phase rather than left open indefinitely (§13).
8. **The current security roadmap (headers/rate-limiting deferred to a deployment phase):** **agree, strong** — re-confirmed this session that neither is a demonstrated exploit given the authorization layer's current strength; bundling them with the deployment decision (Option A/D) remains correct.
9. **The current production-readiness plan:** **agree it's correctly identified as the largest real blocker, disagree slightly that it should wait for a "final" phase** — M6 has zero engineering dependency on anything else in this list and could start in parallel with a scheduler fix immediately (reflected in Option D above).
10. **The assumption that a previous PASS means an area is actually high quality:** **explicitly challenged, evidence-based.** Two concrete instances this session: (a) "Chat and Weekly Review verified" in the AI Recovery PASS did not, and could not, mean "Plan verified" — and the report correctly did not claim that, but a casual reading of "AI Recovery: PASS WITH LIMITATIONS" could still be mistaken for "AI now works," when one of three journeys is fully broken; (b) "design system: technically consistent, PASS" from earlier phases correctly described token discipline but was never a claim about visual strength, and should not be read as one — this reassessment's §5 does not contradict that earlier finding, it answers a different question.

## 22. Self-Critique

- **Did I mistake a test-script issue for an application bug?** Caught one directly this session: a DOM `getBoundingClientRect` overlap check suggested the mobile bottom nav covers page content — a real screenshot at the same scroll position showed a perfectly normal, opaque, correctly-styled fixed nav bar with no defect. Recorded in §22 rather than reported as a bug in §4/§17.
- **Did I mistake a theoretical risk for a confirmed vulnerability?** No new instance found; CSRF and header gaps are labeled theoretical/defense-in-depth consistently, not inflated.
- **Did I overlook a real user-facing defect?** The three new scheduler bugs (§13) were found specifically by not stopping at "the known bug is confirmed" — the instruction to assume more bugs exist was correct and productive.
- **Did I over-prioritize engineering cleanliness?** Checked: dead code (M13) and the notification data-model smell (M12) are both explicitly marked low/deferred, not elevated above user-facing gaps.
- **Did I under-prioritize UX/design?** Corrected during this pass — the visual design section was written from real screenshots specifically because an earlier framing ("technically consistent") could otherwise be misread as "visually fine," which this report explicitly does not claim.
- **Did I recommend technology without evidence?** No technology change is recommended anywhere in §14; every row has a concrete "no problem found" or "problem exists but tooling doesn't fix it" justification.
- **Did I overlook product strategy?** §3/§15 explicitly name EcoLife's isolation and the AI-tagline/AI-reliability mismatch as strategic, not just technical, observations.
- **Did I miss interactions between systems?** One worth flagging: the inert `ai_enabled` setting (§9/§12) interacts with cost risk once a real key exists — a user who disabled AI would still generate provider requests, a security *and* cost interaction, not purely a UX one; reflected in M5's classification.
- **Did I duplicate previous research unnecessarily?** Deliberately avoided re-running the full axe-core scan and the full security-probe suite, since their prior results are recent, specific, and unchanged by anything touched since — instead spent the effort on genuinely new ground (scheduler internals, real screenshots, a targeted security re-read for anything the last two phases might have altered).
- **Did I fail to test a critical path?** Plan's full failure mode is now directly traced to source, not just cited from the AI Recovery report — this is the one path this session tested more deeply than any prior report had.
- **Did I treat an old PASS as proof of current quality?** Explicitly addressed in §21, item 10.

## 23. Recommended Priority Order

Not a final decision — offered for ChatGPT's review against §20's options.

1. Scheduler fix (M1, M2, M4 bundled — cheap, no external gate, closes a P0 that blocks an entire advertised journey).
2. Inert settings (M5 — cheap, closes an active trust gap).
3. Start deployment/email configuration work (M6 — the only item with a long external lead time; starting it in parallel with #1–#2 avoids it being the last blocker before launch).
4. Session-expiry UX (M9) + chat pagination (M8) — small, shared-code-path, safely combinable (already reasoned about together in the prior next-phase recommendation).
5. Accessibility (M7) + a targeted visual-accent pass (M11) — combinable, since both touch the same set of components (Family tabs, task/bill/decision rows) and both benefit from being verified together rather than twice.
6. Dead-code removal (M13) and the notification data-model improvement (M12) — lowest urgency, no rush.
7. Real-key AI verification (M14) — performed whenever credentials become available, independent of the above sequence.

## 24. Explicit Stop / Go Conditions

**Go, no further research needed:** the scheduler fix (root cause and all three defects are fully diagnosed with exact locations); the inert-settings fix (exact fields identified); the session-expiry/chat-pagination pair (exact files identified in prior reports, re-confirmed unchanged).

**Stop and get a decision first:** the deployment/email track (needs a hosting/domain choice only the product owner can make — no amount of further investigation resolves this); real AI-key verification (needs a credential, not more code); any visual-design work beyond the restrained accent pass in §5 (needs explicit confirmation this is the desired scope, not a full redesign, given the user's original complaint could be read either way); whether EcoLife's isolation should be addressed at all (a product-scope question, not a technical one).

---

## FINAL CLAUDE POSITION

**Top 10 problems**
1. The Plan feature is completely broken — not degraded, broken — on every realistic input, and has three distinct scheduler bugs, not one.
2. Real email delivery has never been verified in this product's entire history.
3. No deployment target exists — HTTPS, persistence, backups, and reverse-proxy behavior are all unresolved.
4. Three settings visibly do nothing when changed.
5. The AI feature flag (`ai_enabled`) is not enforced.
6. Keyboard/screen-reader users cannot complete several core flows (Family tabs, task/bill/decision rows).
7. Chat silently stops showing new messages once a family accumulates 200 of them.
8. Session expiry drops users on a raw, unstyled error string.
9. The visual design is honest but has almost no deliberate personality beyond one dashboard number.
10. No security headers, no health check, and no rate limit on signup or AI endpoints.

**Top 10 strengths**
1. Family task-privacy and authorization model — rigorous, verified repeatedly, genuinely differentiated.
2. The canonical `taskAccess.js` predicate — one rule, everywhere, provably correct under NULL and randomized testing.
3. Invite-code lifecycle — strong entropy, owner-only visibility, correct rotation semantics.
4. Family ownership integrity — a family can no longer end up ownerless, proven under forced-failure rollback.
5. Zero confirmed XSS/SQLi/IDOR across the entire product, re-checked this session.
6. Deterministic business logic (DecisionFlow, BillSense stats, EcoLife rollups) stays deterministic — AI never touches the math.
7. The AI/Zod SDK boundary is now correctly wired and cleanly isolated in one file.
8. Consistent, small, dependency-light frontend architecture across 44 components and 9 migration phases.
9. A genuinely coherent design-token system with correct, separately-tuned light and dark themes.
10. A real testing culture — every phase this session reviewed produced its own reproducible evidence, not assertions.

**5 highest-priority actions**
1. Fix the scheduler (all three bugs, together — they share one module and one root cause pattern).
2. Enforce or remove the three inert settings.
3. Begin the deployment/email configuration track now, in parallel, since it has the longest lead time.
4. Fix session-expiry UX and chat pagination together (shared code path).
5. Run the accessibility and visual-accent passes together against the same component set.

**What should NOT be changed:** React/Vite, the hash-router shell, the lack of a state/form/UI library, TypeScript status, Tailwind status — no evidence anywhere in this product's history justifies any of these changes.

**What should be redesigned:** nothing structurally — the design *system* is sound. The per-page *visual treatment* should be strengthened (§5), not redesigned.

**What should be refactored:** nothing urgently — the notification-link-parsing pattern (§8) is worth a future schema addition if and when a second linked-entity type appears, not before.

**What should be fixed immediately:** the scheduler's three bugs and the three inert settings — both are cheap, both are fully diagnosed, both actively damage trust in a shipped feature right now.

**What can safely wait:** accessibility, chat pagination, visual accents, dead-code removal, the notification data-model improvement — all real, none urgent, all independently deferrable without compounding risk.

**What must be verified with real production credentials/environment:** email delivery to a real inbox (never yet done); AI responses from the real Anthropic API (never yet done, mock-only); actual behavior behind a real reverse proxy/HTTPS termination (never yet done).

**My strongest disagreement with the current project direction:** the project has, across six phases, correctly and rigorously hardened everything *underneath* the product's surface — and has now let one of its three headline AI features sit completely non-functional through two entire phases (AI Recovery closed the SDK layer but explicitly, correctly stopped short of the feature actually working) without treating that as its own tracked priority. A product whose tagline is "tell it what's happening, it organizes what's next" cannot afford to have its own AI planning feature crash on first realistic use, and I believe this should be fixed before, not after, the next round of infrastructure or polish work — it is cheaper, more diagnosed, and more damaging to the product's core promise than anything else currently open.

---

**Research complete. No application code was modified. Waiting for ChatGPT's audit and final decision.**
