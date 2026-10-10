# LifeAdmin — Phase 2.5: Shared Destructive-Action Verification + Visual Design System

**Date:** 2026-09-26
**Scope:** Two parts. Part A verifies the Phase 2 `confirmDialog` fix across every consumer in the app. Part B audits and improves the shared visual design system, triggered by the "Create Account" button having no visible keyboard-focus state. No pages migrated, no new product features, no redesign beyond the specific, justified fixes below.

---

# PART A — Shared confirmDialog Regression Verification

## 1. Consumer Inventory

Found by grepping the whole codebase for `confirmDialog` imports/calls — six consumers, two more than the four named as "known affected areas" in this phase's brief:

| # | Consumer | File | Destructive action gated |
|---|---|---|---|
| 1 | Family | `public/js/pages/family.js` | Remove a family member |
| 2 | EcoLife | `public/js/pages/ecolife.js` | Delete a logged eco action |
| 3 | DecisionFlow | `public/js/pages/decisionflow.js` | Remove a decision option |
| 4 | BillSense | `public/js/pages/billsense.js` | Delete a bill |
| 5 | Goals | `public/js/pages/goals.js` | Delete a goal |
| 6 | Settings | `public/js/pages/settings.js` | Delete the entire account |
| — | Tasks | `web/src/components/tasks/TaskDetailModal.jsx` | Delete a task — **already verified in Phase 2**, not re-tested here |

DecisionFlow and Settings weren't named in the brief's "known affected areas" list, but a full inventory was explicitly requested — both use the identical shared `confirmDialog()`, so both were verified. Settings' account deletion is the highest-stakes consumer in the app (irreversible, and gates a second native `prompt()` for password) and turned out to be the one that needed more than the Phase 2 fix alone.

## 2–5. Verification Performed, Cancel/Confirm Behavior, Persistence Evidence

All verified live, in a real browser (Playwright + the machine's Edge install), against the real backend — not inferred, not HTTP-status-only. For each: created real data, triggered the delete, chose **Cancel** and confirmed the item survived, triggered it again, chose **Confirm** and confirmed the item was actually gone (re-queried from the live list, not just "the request returned 200").

| Consumer | Cancel: item survives | Confirm: item removed | Console/network errors |
|---|---|---|---|
| Family | **VERIFIED** (2→2 members) | **VERIFIED** (2→1 members) | none |
| EcoLife | **VERIFIED** (1→1 logs) | **VERIFIED** (1→0 logs) | none |
| DecisionFlow | **VERIFIED** (1→1 options) | **VERIFIED** (1→0 options) | none |
| BillSense | **VERIFIED** (1→1 rows) | **VERIFIED** (1→0 rows) | none |
| Goals | **VERIFIED** (1→1 goals) | **VERIFIED** (1→0 goals) | none |
| Settings | **VERIFIED** (Cancel: no password prompt, page unchanged) | **FAILED**, then **VERIFIED after a required fix** — see §6 | one 500 pre-fix, none post-fix |

16/16 checks passed cleanly for Family, EcoLife, DecisionFlow, BillSense, and Goals in a single run — the Phase 2 confirmDialog fix (resolve-before-closeModal ordering) holds correctly everywhere it was applied.

## 6. Regression Found — and a Required Stop

**Settings' Confirm path was not simply "still broken" in the same way Phase 2 found — it failed differently, for a different reason, and the confirmDialog mechanics themselves were confirmed correct.** Clicking Confirm correctly triggered the native password `prompt()` (proof the Promise now resolves `true` as intended) and correctly sent `DELETE /api/settings/account` with the right payload. **The request itself then failed with a real, reproducible 500**, traced via the server log to:

```
Error: FOREIGN KEY constraint failed
    at src/routes/settings.js:114
```

**Root cause:** `families.owner_id REFERENCES users(id)` has no `ON DELETE` behavior specified in the schema. The account-deletion route does a bare `DELETE FROM users WHERE id = ?`, which SQLite's default FK enforcement rejects whenever that user still owns a family row. This is a separate, pre-existing bug — unrelated to the Phase 2 Promise-ordering fix — that was **invisible until now** because the confirmDialog bug always blocked this request from ever being sent. Fixing confirmDialog didn't create this bug; it unmasked it.

Per this phase's explicit instruction ("If any consumer still behaves incorrectly: STOP and report the exact consumer and failure. Do not continue into the design work until the shared confirmation behavior is understood"), **work stopped here** and the finding, with three concrete remediation options and their tradeoffs, was presented for a decision rather than resolved unilaterally — the "obviously correct" fix wasn't obvious: cascading the delete onto the family would silently destroy shared data (tasks, chat, shopping list) for every *other* family member with no warning, which is a real, destructive product decision, not a bug fix.

**Decision received: apply the minimal, safe fix** — reject the deletion with a clear, actionable error instead of attempting (and crashing on) a delete that can't safely succeed.

**Fix applied** (`src/routes/settings.js`):
```js
const ownedFamily = db.get('SELECT id FROM families WHERE owner_id = ?', [req.user.id]);
if (ownedFamily) {
  throw new ValidationError('You own a family. Transfer ownership or delete the family before deleting your account.');
}
```
Placed after password verification, before the delete attempt. A user who owns a family now gets a clear `400` with an actionable message instead of a `500` crash; their account is untouched. A user who is only a family *member* (not owner) is unaffected and can still delete their account normally — verified separately.

**Re-verified live, both paths, after the fix:**
- Family owner attempts deletion → **VERIFIED**: clear error toast ("You own a family. Transfer ownership or delete the family before deleting your account."), account survives, family survives, zero 5xx responses.
- Non-owner attempts deletion → **VERIFIED**: succeeds normally, reloads to the auth screen, re-login subsequently fails (`400`), confirming the account is genuinely gone — same as Phase 0's original verification, now re-confirmed still correct.

**Two new backend tests added** (`test/settings.test.js`) covering both paths; **89/89 backend tests pass** (87 + 2 new), lint clean.

**A known limitation, disclosed rather than hidden:** there is still no ownership-transfer feature. A user who owns a family and wants to delete their account must first delete the family entirely (losing shared history for all members) — there's no way to hand ownership to another member first. This is a legitimate product gap, not a bug, and is exactly the kind of decision (§17 of Phase 2's report already flagged something adjacent) that belongs in a deliberate future phase, not improvised here.

## 7. Final Shared-Component Verdict

**The `confirmDialog` fix from Phase 2 is verified correct across all six consumers in the codebase.** Five required no further work. The sixth (Settings) required one additional, narrowly-scoped, explicitly-approved fix to a *different*, previously-unmasked bug in the same code path — not a regression in the shared component itself. With both fixes in place, every destructive action in the app that goes through `confirmDialog` now behaves correctly: Cancel reliably does nothing, Confirm reliably executes and persists, and the one action that legitimately cannot always succeed (deleting a family-owning account) now fails with a clear, honest message instead of a server crash.

---

# PART B — Life Admin Visual Design System

## 8. Current Visual Design Audit

Per instructions, this started from actually looking at the running app (Playwright screenshots, light and dark mode, desktop and mobile), not from reading CSS and guessing.

**What the audit found, stated honestly:** the existing token system (`public/css/tokens.css`) is **not** the "rainbow interface, arbitrary colors, competing accents" problem the brief warned against — it's already a reasonably disciplined, semantic system: a single brand hue family (`--brand-50` … `--brand-900`), a separate accent hue for success/positive states, separate danger/warning/info hues, a 10-step neutral scale, semantic aliases (`--bg`, `--text-primary`, `--surface-border`, etc.), and a properly layered light/dark theme split. Typography and spacing are already used consistently through shared classes (`.page-title`, `.card-title`, `.text-sm`, the `--sp-*` scale) rather than one-off pixel values scattered through pages. Border radius is already a small, restrained family (`--radius-sm/md/lg/full`) applied by role, not everything-is-a-pill.

**What was concretely, verifiably broken** (found by testing, not assumed):

1. **The primary button — used for "Create account" and every other main call-to-action in the app — had no visible keyboard-focus indicator at all.** Confirmed via real keyboard `Tab` navigation (not a mouse click, not a programmatic `.focus()` call, both of which can produce false negatives/positives for `:focus-visible`): `document.activeElement.matches(':focus-visible')` correctly returned `true`, but the computed `box-shadow` showed only the button's own resting shadow (`rgba(24,38,69,0.18) 0 1px 2px`) — the intended focus ring (`var(--focus-ring)`) was being silently lost. **Root cause:** `.btn-primary`'s own box-shadow declaration and the global `:focus-visible` rule's box-shadow declaration have *equal* CSS specificity (one class vs. one pseudo-class, both (0,1,0)), and `.btn-primary` — declared later in the stylesheet load order (`components.css` loads after `base.css`) — won the tie for every `.btn-primary` in the app, not just this one screen. A keyboard-only user tabbing through the signup form could not tell whether the submit button was focused. This is the concrete, verifiable root cause of "insufficient/incomplete visual design" on the Create Account button.
2. **The same global focus rule forced `border-radius: var(--radius-sm)` on *any* focused element**, regardless of that element's own radius — meaning a focused button or card-like control briefly changed shape (10px/16px radius snapping to 6px) purely as a side effect of receiving focus, serving no apparent purpose.
3. **`--focus-ring`'s color was never redefined for dark mode.** It stayed at the light-mode-tuned `rgba(60, 96, 160, 0.35)` even though `--brand` itself correctly shifts to a lighter `#7ea3dc` in dark mode — the focus ring didn't track the same light/dark adaptation every other brand-colored element does, giving it comparatively low visibility against dark surfaces.
4. **Semantic "subtle" background tints (used by status badges) were computed ad hoc with inline `color-mix()` calls** rather than as named, reusable tokens — functionally fine, but not the single-source-of-truth pattern the rest of the token system otherwise follows, and not available for the ongoing React migration to reuse without re-deriving the same values.

**What was checked and found already correct, not re-designed unnecessarily:**
- Color contrast: the primary button's resting state (`#2f4d82` on near-white, white text) comfortably exceeds WCAG AA in both themes.
- Error states already avoid relying on color alone — every `.field-error`/`.has-error` pairing is accompanied by explicit text, not just a red border.
- The button size/padding/radius system (`.btn`, `.btn-sm`, `.btn-lg`, `.btn-icon`) was already a coherent, restrained 3-tier system with real hover/active/disabled treatment — nothing there needed to change.
- Typography scale and spacing rhythm were already consistently applied via shared tokens/classes across every page read during this and prior phases' audits.

## 9. Design Problems Discovered (summary)

1. Invisible keyboard focus on all `.btn-primary` buttons (severe — accessibility + the exact symptom reported).
2. Focus-triggered radius snap on any element (minor, cosmetic).
3. Dark-mode focus ring reusing a light-mode-tuned color (moderate — real visibility gap in one theme).
4. Non-tokenized semantic "subtle" backgrounds (minor — consistency/reuse gap, not a visible defect).

No other genuinely "arbitrary color," "competing accent," or "controls that don't look interactive" issues were found in the pages audited across this project so far (auth, Dashboard, Tasks, Family, BillSense, DecisionFlow, Goals, EcoLife, Settings). This is stated plainly rather than manufacturing additional findings to justify a larger rewrite than the evidence supports.

## 10. Design Principles Applied

- **Fix the verified defect precisely; don't relitigate what already works.** The token system, typography, spacing, and shape language were already coherent — the job here was closing a specific, real gap, not replacing a working system.
- **Additive over exhaustive.** New tokens (`--success-subtle`, `--warning-subtle`, `--danger-subtle`) extend the existing naming convention rather than introducing a parallel one.
- **Accessibility fixes should be structural, not decorative.** The focus-ring fix works by correcting *cascade mechanics* (specificity), not by adding a visually louder or differently-colored indicator — the same restrained blue ring the inputs already used, now reliably visible everywhere, including on buttons.

## 11. Final Color System

Unchanged in overall structure — extended, not replaced:

| Token | Role | Why this design works for LifeAdmin |
|---|---|---|
| `--brand-*` (50–900), `--brand`/`--brand-strong`/`--brand-soft` | Primary actions, links, focus (blue family) | A single, calm, desaturated blue reads as trustworthy and administrative without any of the "crypto dashboard" or "AI gimmick" associations a purple/neon palette would carry — exactly the "calm, trustworthy, mature" brief |
| `--accent-*` / success role | Positive/completed states, eco-positive actions | Kept semantically separate from `--brand` on purpose — "you did something good" (a completed task, a logged eco action) is a different signal than "here's the main action," and conflating them would blur the hierarchy |
| `--danger-*` | Destructive actions, errors, overdue/critical priority | Reserved strictly for genuine danger/urgency — never used decoratively |
| `--warning-*` | Caution, medium priority, due-soon states | A distinct amber, not overlapping visually with danger-red or success-green |
| `--priority-critical/high/medium/low` | Task/bill priority badges specifically | A deliberately *separate* semantic axis from status (success/warning/danger) — priority is about urgency ranking, not pass/fail state, and conflating the two would have been the "assign color without meaning" trap the brief warned against |
| `--n-0` … `--n-900` (neutrals) | The vast majority of the interface — backgrounds, borders, secondary text | A warm-leaning near-white/near-black scale (not pure gray), giving the interface a slightly warmer, less clinical feel than a stock gray-scale would, appropriate for a personal/family tool rather than an enterprise admin panel |
| `--success-subtle` / `--warning-subtle` / `--danger-subtle` (**new**) | Tinted badge/alert backgrounds | Consolidates what was already the *visual* pattern (a 12–14% tint of the semantic color) into reusable tokens, so the ongoing React migration doesn't re-derive the same `color-mix()` expression per component |
| `--focus-ring` (**fixed**, now theme-aware) | The one and only focus treatment, app-wide | A single consistent ring color/style everywhere, rather than a bespoke "focus style" per component — this is what makes focus feel like a *system* property rather than something each component reimplements |

**No new hue was introduced.** "Secondary" actions are deliberately handled by the existing neutral `.btn` style (bordered, neutral background) rather than a second brand color — introducing a second accent purely to have a literal "Secondary" swatch would have moved toward the "random collection of colorful components" the brief explicitly rejected. This is documented as an intentional choice, not an oversight.

## 12. Typography System

Unchanged — already coherent, confirmed correct rather than modified:
- Page titles: `.page-title` (serif, `--fs-2xl`)
- Card/section titles: `.card-title` (`--fs-md`, 650 weight), `.section-title` (`--fs-xs`, uppercase, letterspaced)
- Body text: `--fs-base` default, `.text-sm`/`.text-xs` for secondary/meta content
- Labels/helper text: `.field-label` (`--fs-xs`, 600 weight, secondary color), `.field-hint`/`.field-error` (`--fs-xs`, tertiary/danger color)
- Buttons: `--fs-sm` (default/sm), `--fs-base` (lg) — consistently smaller than body text, appropriately, since a button's weight (600) carries the visual emphasis rather than size

No arbitrary per-component font sizes were found in any page audited.

## 13. Spacing System

Unchanged — the `--sp-1` (4px) through `--sp-16` (64px) scale was already applied consistently for page padding, card padding, form field gaps, and button padding across every page read in this and prior phases. No arbitrary one-off spacing values were found to justify changing this.

## 14. Radius/Shape System

One change: **removed the focus-triggered radius override** (§8, finding 2). Otherwise unchanged — `--radius-sm` (6px, small controls), `--radius-md` (10px, buttons/inputs), `--radius-lg` (16px, cards/modals), `--radius-full` (badges/pills) was already a coherent, restrained 4-value system applied by role, not decoratively. Confirmed: pills/badges are the *only* fully-rounded elements in the app — buttons, cards, and inputs all use the more restrained md/lg values, consistent with "do not turn everything into pill-shaped components."

## 15. Button System

| Variant | Role | State completeness after this phase |
|---|---|---|
| `.btn` (default) | **Secondary** — bordered, neutral background | default/hover/active/disabled/**focus (fixed)** |
| `.btn-primary` | **Primary** — main CTA, e.g. "Create account" | default/hover/active/disabled/**focus (fixed this phase)** |
| `.btn-ghost` | **Tertiary/low-emphasis** — transparent until hovered | default/hover/focus (was already correct — no competing box-shadow to lose the cascade tie) |
| `.btn-danger` | **Destructive** | default/hover/focus (was already correct, same reason) |

Every variant now has a verified, visible focus-visible state (§17). Sizes (`.btn-sm`/`.btn-lg`/`.btn-icon`) and the block modifier (`.btn-block`, used by Create Account) were already consistent and unchanged.

## 16. Form System

Reviewed Create Account and Login specifically, per instructions. Both already share one system (same `.field`/`.input`/`.field-label`/`.field-error` classes, same validation-error pattern from `src/routes/auth.js`'s field-level errors rendered via `showFieldErrors()`). Confirmed via the same keyboard-navigation testing used for the button fix: input focus states were **already correct** (the `.input:focus` rule has higher specificity than the generic `:focus-visible` rule and declares the same `var(--focus-ring)` value, so no cascade conflict existed there — only buttons were affected). No changes were needed to the form system beyond the shared focus-ring fix, which every input already benefits from consistently.

## 17. Accessibility Decisions

- **Fixed:** keyboard focus visibility on all primary/default buttons, in both themes (§8, §11, §15) — the single largest concrete accessibility gap found.
- **Confirmed already correct, not touched:** color contrast (checked visually and via the existing token values), error messaging paired with text (not color alone), touch target sizes (`.btn` is 38px/`.btn-lg` is 44px — both meet or exceed the commonly-cited 40–44px minimum touch target guidance).
- **Deliberately not done:** adding icons or patterns to every colored badge "for accessibility" — per the explicit instruction not to introduce excessive colors/decoration in accessibility's name, and because the existing text-pairing already satisfies the actual requirement (not conveying meaning by color alone).

## 18. Responsive Decisions

Verified at all seven required breakpoints (§21). No CSS touched in this phase affects layout, grid, or flex sizing — only `box-shadow`/`border-radius` on focus and three new color tokens — so no new overflow risk was introduced by construction, and this was still verified empirically rather than assumed.

**The pre-existing, already-documented Dashboard/Family horizontal-overflow issue (Phase 1.5) is explicitly NOT claimed fixed here.** It was not re-triggered in this phase's responsive pass because that pass used a fresh account (empty Dashboard state) — the bug is specifically triggered by the *populated* `.dash-grid` layout with real card content, which this phase's testing didn't specifically re-create. Since nothing in this phase touched `.dash-grid`, `.card`, or any grid/flex sizing property, there is no mechanism by which it could have changed, but it is reported here as **presumed unchanged**, not **re-verified**, in the interest of not claiming more than was actually checked.

## 19. Files Changed

| File | Change |
|---|---|
| `public/css/base.css` | `:focus-visible` rule: removed the `border-radius: var(--radius-sm)` override; added explanatory comment pointing to the higher-specificity button rule |
| `public/css/components.css` | Added `.btn:focus-visible { box-shadow: var(--focus-ring); }` (the actual fix); added `.badge-warning`/`.badge-danger` classes; changed `.badge-success` to use the new `--success-subtle` token instead of an inline `color-mix()` |
| `public/css/tokens.css` | Added `--success-subtle`/`--warning-subtle`/`--danger-subtle` (light-mode root); added `--focus-ring` redefinition to both dark-mode blocks (`@media (prefers-color-scheme: dark)` and `:root[data-theme="dark"]`) |
| `src/routes/settings.js` | Part A fix — family-ownership guard on account deletion (§6) |
| `test/settings.test.js` | Two new tests for the family-ownership guard |

**Not changed:** any HTML/JSX markup, any component structure, any page layout, any color hue, any typography scale, any spacing value, any border-radius value (other than removing the focus-triggered override). This was a targeted correctness/consistency pass, not a redesign — consistent with "prefer existing CSS architecture... minimal structural changes."

## 20. Before/After Explanation

**Before:** tabbing to "Create account" (or any primary button anywhere in the app) gave a keyboard user zero visual feedback that the button was focused — the button looked identical whether focused or not. In dark mode, the one focus indicator that *did* work (on inputs) used a color tuned for light backgrounds.

**After:** every primary and default button now shows the same blue focus ring inputs already had, in both themes, correctly tuned per theme. Verified not just on the auth screen but on a second, unrelated `.btn-primary` elsewhere in the app (Tasks' "New task" button), confirming this is a systemic fix, not a one-off patch.

## 21. Browser Verification

All performed live, Playwright + the machine's Edge install, per the established pattern from Phases 1.5–2:

| Check | Result |
|---|---|
| Create Account button — default/hover/active states | **VERIFIED** (unchanged, already correct) |
| Create Account button — focus state | **VERIFIED FIXED** — real keyboard Tab navigation, `:focus-visible` match confirmed `true`, computed box-shadow confirmed to be the focus ring (not the resting shadow), in both light and dark mode |
| Login form | **VERIFIED** — same shared components/CSS as signup, no separate issues found |
| Shared buttons elsewhere in the app | **VERIFIED** — Tasks' "New task" `.btn-primary` confirmed to receive the same fixed focus ring |
| Inputs/forms | **VERIFIED** — confirmed already correct before this phase, re-confirmed unchanged |
| Cards | **NOT SEPARATELY RE-VERIFIED** — no CSS affecting cards was changed this phase; relying on Phases 1–2's existing card verification |
| Navigation / bottom navigation | **NOT SEPARATELY RE-VERIFIED** — no CSS affecting navigation was changed this phase |
| Focus/hover/disabled states generally | **VERIFIED** for buttons (the actual change); inputs/other controls **PARTIALLY VERIFIED** (spot-checked, not exhaustively re-tested since nothing there changed) |
| Mobile widths (320/360/375/390/414/tablet/desktop) | **VERIFIED** — zero overflow at every breakpoint on the auth screen; zero overflow on a fresh Dashboard and Tasks at 375px |
| Console errors | **VERIFIED clean** — zero, across the entire design-verification session |
| Network failures | **VERIFIED clean** — zero 5xx responses |
| Runtime exceptions | **VERIFIED clean** — none observed |
| New responsive overflow | **VERIFIED: none introduced** |

## 22. Test Results

```
npm test        →  tests 89, pass 89, fail 0   (87 from before Phase 2.5 + 2 new for the Settings fix)
npm run lint     →  0 errors, 0 warnings, exit 0
```

## 23. Build Results

```
npm run build (web/)  →  succeeds, 238.73 kB / 61.58 kB gzip — IDENTICAL to the pre-Phase-2.5 size
```
Confirmed identical because none of this phase's changes touched any `.jsx`/`.js` source — pure CSS and one backend route file, neither of which affects the Vite-built bundle.

## 24. Known Pre-existing Issues

Carried forward, unchanged:
- The Dashboard/Family CSS Grid horizontal-overflow bug (Phase 1.5) — **presumed unchanged**, not re-verified this phase (§18).
- Postpone/Delete handlers with no try/catch in Tasks (Phase 2) — unchanged.
- `#/tasks/:id` deep links ignored (Phase 2) — unchanged.
- No family-ownership-transfer feature — newly *documented* this phase (§6), not newly introduced; the underlying gap (no way to hand off a family) has always existed, it was just never blocking anything visible before.

## 25. Remaining Design Debt

- **No distinct "SURFACE-ELEVATED" tier** beyond `--bg-elevated` + `--shadow-lg` for modals/dropdowns — functional, but not a separate named token. Not fixed this phase (no visible defect traced to it).
- **`--warning-subtle`/`--danger-subtle` are defined but not yet consumed anywhere** beyond the new `.badge-warning`/`.badge-danger` classes, which nothing currently uses — added proactively for the ongoing React migration to reach for, per the brief's explicit token list, rather than left for a future phase to re-derive.
- **Loading-state button treatment** (spinner + disabled) exists and works but wasn't given a dedicated named "loading" variant/class — it's assembled ad hoc per call site (`btn.innerHTML = '<span class="spinner"></span> ...'`). Functional, consistent in practice, but not formalized. Not fixed this phase — no visible defect, and formalizing it would be a real (if small) structural change beyond this phase's "minimal structural changes" scope.

## 26. Recommendation for Phase 3

1. **The family-ownership-transfer gap (§6) is a real product decision waiting to be made** — worth deciding deliberately (a transfer-ownership flow? a "delete the family" confirmation as part of account deletion, with very explicit warnings? something else?) before it surfaces again as a support question from a real user.
2. **The Dashboard/Family overflow bug remains the one open, non-trivial CSS defect** in the app — a dedicated pass to add `min-width: 0` to the relevant grid children (diagnosed precisely in Phase 1.5) would close it; still not done here, per this phase's own scope boundary.
3. **When the next page migrates**, reuse the now-fixed focus-ring pattern and the new subtle-semantic tokens directly — no further design-system work should be needed for a typical page migration; this phase's fixes are structural (apply everywhere automatically) rather than per-component.

---

**Per the strict stop condition: no additional page was migrated, no new product features were added, and Part B was scoped to a targeted correctness/consistency pass rather than a redesign. Stopping here — awaiting review before Phase 3.**
