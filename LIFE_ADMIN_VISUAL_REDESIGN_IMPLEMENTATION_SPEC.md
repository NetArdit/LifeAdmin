# Life Admin — Visual Redesign Implementation Specification

**Mode: research + specification only. No application code, CSS, JSX, backend, database, configuration, or dependency was modified in this phase.**

Builds on `LIFE_ADMIN_FULL_VISUAL_REDESIGN_PROPOSAL.md` (approved direction: **Structured Warmth**, disciplined by **Editorial Ledger**; **Focused Workspace** rejected as primary) and `VISUAL_PRODUCT_QUALITY_AUDIT.md` (confirmed defects + 75-screenshot evidence base, `audit-evidence/visual-quality/`). This document does not re-argue the direction — it converts it into exact tokens, exact per-page behavior, and an exact migration plan, while re-verifying every load-bearing claim the previous proposal made against the actual repository.

---

## 1. Executive Summary

Every hard-gate question the previous proposal left open has now been answered against real source, not assumed:

- **Timeline's event-kind data is confirmed available today** — `GET /api/timeline` already returns a `type` field (`src/routes/timeline.js:34`) with exactly **9 real values** in current use (`task_created`, `task_completed`, `comment`, `bill_paid`, `decision_made`, `goal_progress`, `member_joined`, `member_left`, `ownership_transferred`, `invite_code_changed`), cleanly mapping to 5 modules. Accent-per-event-type is buildable with **zero backend change**. This removes the one "verify before build" flag the previous proposal carried.
- **Two previously undocumented inert Settings controls were found and confirmed by tracing the code, not guessing**: `notifPrefs` (Notifications section) and `aiEnabled` (AI preferences toggle) are both persisted to the database and read back correctly, but **neither is ever checked anywhere a notification or an AI call is actually created** (`src/lib/notify.js` never reads `notifPrefs`; every `src/routes/ai.js` route checks only `ai.isConfigured()`, never `req.user.ai_enabled`). These controls give the user real-looking control with zero actual effect. This is a functional defect, out of scope to fix in a visual phase, but the spec below explicitly does not visually promote or expand either control, and flags the finding as a required separate engineering gate (§31).
- **The "5-accent" framing in the previous proposal is corrected to 4 net-new accents plus reuse of the existing brand color**, not 5 new hues — Dashboard/Tasks/Assistant/Timeline's own chrome/Settings were never proposed to get a *new* color, only to keep brand blue, so the real scope is 4 new tokens × 2 themes, not 5.
- **All new colors in this spec are computed, not eyeballed** — every module accent and every corrected badge color below has a verified WCAG contrast ratio, shown as a number, against the exact surface it will sit on in each theme.
- **The responsive breakpoint set is corrected**: the actual CSS uses exactly 5 `max-width` breakpoints (640/800/860/900/1024px), authored desktop-base-with-mobile-overrides, not the "mobile-first" framing the project's own stated conventions claim. This doesn't require fixing (the output is already overflow-free at every tested width) but the spec is written against the *real* breakpoints, not invented ones.
- **`prefers-reduced-motion` is already correctly and globally handled** (`base.css:52-54`) — the previous proposal treated this as an open requirement; it is in fact already solved and simply needs to keep covering whatever new transitions this spec adds, which it will automatically since the rule is universal.
- **Fraunces is loaded with exactly two weight axes today (440, 560)** — any new typographic treatment in this spec stays within those two weights; if a genuinely new weight is needed, it is called out explicitly as a one-line, zero-cost Google Fonts URL change, not assumed to already exist.

---

## 2. Verified Current State

Re-checked directly against source in this phase (not re-stated from memory):

| Area | Verified fact | Source |
|---|---|---|
| CSS architecture | 5 files, ~746 lines total, custom-property token system, no preprocessor | `public/css/*.css` |
| Card primitive | One rule, `.card`, reused unmodified across all page components | `components.css:43-48` |
| Breakpoints | `640px, 800px, 860px, 900px, 1024px` — all `max-width`, no `min-width` queries anywhere | `grep @media public/css/*.css` |
| Reduced motion | Already globally handled | `base.css:52-54` |
| Font loading | Google Fonts, Fraunces `wght 440;560`, system sans stack, no other typefaces | `public/index.html:11`, `tokens.css:87-89` |
| Icon set | 34 distinct glyphs (not 35 — minor correction), stroke-based, `currentColor` | `public/js/components/icons.js` |
| Dependencies | Backend: express, bcryptjs, cookie-parser, dotenv, zod, `@anthropic-ai/sdk`. Frontend: react, react-dom, vite. No UI/animation/icon libraries. | `package.json`, `web/package.json` |
| Timeline data | `type` field present and populated with 9 real, currently-logged values | `src/routes/timeline.js`, `logActivity()` call sites in `tasks.js`, `bills.js`, `decisions.js`, `goals.js`, `family.js` |
| Settings — Notifications | Persisted (`notif_prefs` column, round-trips correctly) but **never read** by `src/lib/notify.js` — fully inert | `src/routes/settings.js:52-54`, `src/lib/notify.js` (no reference found) |
| Settings — AI toggle | Persisted (`ai_enabled` column) but **never read** by any `src/routes/ai.js` route — fully inert | `src/routes/settings.js:48-50`, `src/routes/ai.js` (no reference found) |
| Settings — Language | A `language` column is written/read by the settings route but **no UI control exists anywhere** to set it, and no i18n system exists in the product | `src/routes/settings.js:44-46`, confirmed absent from every `web/src/components/settings/*.jsx` |
| Modal system | Confirmed, again, fully intact — focus trap, Escape, initial-focus heuristic, restoration | `public/js/components/modal.js` (unchanged since the accessibility phase that built it) |
| Family data shape | Members carry `role` (`owner`/`admin`/`member`), family carries `inviteCode`; chat/shopping/activity are separate per-family collections | `src/routes/family.js`, `src/routes/chat.js` |

---

## 3. Corrections to Previous Proposal

1. **"5-accent system" → 4 net-new accents.** Brand blue was never being replaced for Dashboard/Tasks/Assistant/Settings; it's the existing core color, unchanged. The actual new-token surface is 4 hues × 2 themes = 8 new color values, not 10. Stated precisely in §9.
2. **Timeline's data dependency is resolved, not open.** §31 of the previous proposal listed this as "unverified pending implementation." It is now verified: buildable with zero backend change (§2, §19).
3. **Two new, previously undocumented findings** (Settings' inert `notifPrefs`/`aiEnabled`) were not in either prior document. Both are folded into §21 with an explicit instruction not to visually expand these controls, and flagged as a separate engineering gate (§31) rather than something this visual spec silently fixes or silently hides.
4. **"Mobile-first" claim corrected.** The project's stated conventions (and this phase's own brief) describe the CSS as mobile-first; the actual authored CSS is desktop-base with `max-width` mobile overrides. This is a documentation-accuracy correction, not a defect — the *output* is confirmed overflow-free at every required width regardless of how it's authored — but the spec's responsive rules (§23) are written against the real mechanism so implementation doesn't have to guess which direction each override goes.
5. **Badge-contrast fix is now exact, not directional.** The previous proposal said "adjust the color-mix ratio... so all 8 combinations clear 4.5:1." This document provides the exact 8 hex pairs, each with a computed ratio (§9).
6. **Icon-gap analysis is now exact, not general.** The previous proposal said "at most 3-4 new glyphs." Checked against the full 34-icon inventory: BillSense's 6 bill categories and EcoLife's water category have no adequate existing match. Exactly **2 new glyphs** are required (a water-drop, a bolt/electricity mark), described precisely in §17.

---

## 4. Design Thesis

Restated, unchanged from the approved proposal, as the governing constraint for every decision below:

> Life Admin should feel like a well-kept personal ledger with a distinct voice for each responsibility it holds — warm and structured, not a SaaS dashboard and not a minimalist zine.

Operationally: **composition follows content shape** (a "set" gets a card, a "continuum" gets a list region — see §10); **module identity is a small, disciplined accent**, never a full-surface recolor and never on a button; **typography (the existing Fraunces/sans pairing) carries hierarchy**, not decoration; **nothing is added to fill empty space** — every change below either fixes a confirmed defect, corrects a shape-mismatch (§10), or extends an already-proven pattern (the hero-numeral/accent-border language Dashboard and BillSense already use) to a module that currently lacks it.

---

## 5. Visual Grammar

Explicit rules, each with its reasoning, governing every page spec that follows.

**Hierarchy rules**
- Every page has exactly one dominant visual element. On hero-type pages (Dashboard, Family-overview) it is a content region (§13, §15); on list-type pages (Tasks, Timeline, BillSense's bill list) it is the list itself, with filters/summary as secondary framing; on set-type pages (DecisionFlow, Goals, Settings) it is the primary card grid, unchanged. *Why*: §6/§8 of the previous proposal found the current product has no inter-section hierarchy tool beyond a label and a dot — this rule exists specifically to fix that.

**Typography hierarchy**
- Page title: Fraunces 560, `--fs-2xl`, unchanged from today.
- New — section/module label: Fraunces 560, `--fs-md`, used for a "list region" or "hero region" header where today a plain `.card-title` (system sans, 650 weight) would have been used. *Why*: extends the one typographic motif that already works (Dashboard's banner) rather than inventing a new voice.
- New — Timeline date-group header: Fraunces 560, `--fs-lg`, replacing today's `.timeline-day-label` (system sans, uppercase, 700 weight, `--fs-xs`). *Why*: Timeline is the page most defined by chronology; its date is its single most important piece of typography and should read that way.
- Body/metadata/labels/buttons/navigation: **unchanged** — system sans throughout, already correct, already restrained (confirmed no finding against it in either prior audit).
- Hero numeral: unchanged pattern (Fraunces 560/500, `--fs-2xl`/2.75rem), extended to EcoLife's category counts (§17) as a direct fix of the confirmed typography inconsistency.
- Dense-list numerals (amounts, counts in a tight row): system sans + `font-variant-numeric: tabular-nums` (already the pattern used in `.plan-block-time`) — explicitly **not** serif in this context, since serif's proportional numerals actively hurt column alignment in a tight list. *Why*: prevents the "expand Fraunces everywhere" instinct from breaking a place it would cause a real usability regression.

**Heading rules**: one `<h1>` per page (`.page-title`, unchanged); section/module labels (new) are `<h2>` where they head a genuine region, never skipping a level; card titles inside a set-type card stay `<h3>`-equivalent (`.card-title`, unchanged markup pattern).

**Spacing/alignment/density rules**: the existing `--sp-*` scale is unchanged (§9) — no finding against it. New rule: a "list region" (§10) uses tighter vertical rhythm than a "set" card grid (row padding stays `.row-item`'s existing `--sp-3 --sp-2`, unchanged — only the *removed* outer card padding changes, which nets *more* content per screen, not less).

**Surface hierarchy, border, divider, elevation/shadow, radius rules**: fully specified in §10 (Surface Strategy) — not restated here to avoid duplication.

**Icon rules**: existing 34-glyph stroke style, size, and weight (`--icon: 18px, stroke-width 1.8`) unchanged and unconditionally preserved as the base language; category-specific assignments corrected (§17); exactly 2 new glyphs added in the identical stroke style (§17) — no new icon *system*.

**Interaction rules (hover/active/pressed/focus/disabled/loading)**: entirely unchanged — `base.css`'s global `:focus-visible` ring, `.btn:hover/:active/:disabled`, `.row-item:hover` — no finding against any of these in either prior audit. New elements (list-region rows, hero regions) reuse these exact existing rules, not new ones.

**Selected-state rule**: unchanged pattern (`.nav-link.active`, `.tab.active`) — new module-accented nav treatment (§20) extends this exact mechanism, swapping which color variable is referenced, not introducing a new selected-state model.

**Empty/loading/error/success-state rules**: pattern (icon-in-soft-circle + Fraunces heading + one sentence) is unchanged and unconditionally preserved (confirmed excellent, twice). One addition: every error state gains a retry action wired to that page's existing `refetch`/reload function (carried forward from the prior audit's confirmed gap).

**What this grammar explicitly avoids** (per the brief's own list, each checked against something in this codebase that could have drifted toward it): gradients (none exist today, none proposed); glassmorphism/blur (none exist, none proposed — `--shadow-*` values are simple, opaque); excessive shadow (unchanged, single-level `--shadow-sm` on set-cards only, zero shadow on list regions); excessive rounded corners (unchanged radius scale, applied more selectively — list regions get *no* radius, since they have no box); decorative empty whitespace (§13's Dashboard rework exists specifically to replace unused space with resolved hierarchy, not to add filler); enterprise-console density (explicitly the rejected Direction C, §19-20 of the previous proposal); AI-product visual clichés (Assistant explicitly kept brand-blue/unaccented, §18).

---

## 6. Design Tokens

Implementation-ready, additive to `tokens.css`. **KEEP / EVOLVE / REPLACE / REMOVE** stated per group.

### Color — KEEP (unchanged, core scale)
`--brand-50…900`, `--accent-400/500/600`, `--danger-400/500/600`, `--warning-400/500/600`, `--info-500`, `--n-0…900`, `--bg/--bg-elevated/--bg-sunken/--bg-hover`, `--surface-border/--surface-border-strong`, `--text-primary/secondary/tertiary/inverse/on-brand`, `--brand/--brand-strong/--brand-soft/--brand-soft-border`, `--focus-ring`, `--shadow-sm/md/lg`. No finding against any of these in either audit.

### Color — EVOLVE (badge contrast fix, exact values)

Replaces the current single-hex-at-14%-opacity approach with an explicit text+background pair per priority per theme, each independently computed (relative-luminance method):

| Priority | Light bg | Light text | Ratio | Dark bg | Dark text | Ratio |
|---|---|---|---|---|---|---|
| Critical | `#f9e5e3` | `#8f2c24` | **6.79:1** | `#352427` | `#ff9a8f` | **7.17:1** |
| High | `#faf0e1` | `#7a5310` | **6.06:1** | `#363024` | `#ffcf7a` | **9.01:1** |
| Medium | `#e4edf4` | `#1f5177` | **7.08:1** | `#202c38` | `#9cc7e8` | **7.94:1** |
| Low | `#edeef0` | `#50565f` | **6.38:1** | `#292e34` | `#c3c9d1` | **8.21:1** |

All 8 clear WCAG AA (4.5:1) with substantial margin — chosen deliberately above the bare minimum so future minor hue tuning doesn't reintroduce a near-miss like the original 4.55:1 text-tertiary finding. Background values are unchanged from today's actual rendered output (same 14%-mix visual weight); only the text color changes, from the raw brand hue to a darkened/lightened shade of the same hue. **New tokens**: `--badge-critical-bg/-text`, `--badge-high-bg/-text`, `--badge-medium-bg/-text`, `--badge-low-bg/-text` (light block in `:root`, dark block in both `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and `:root[data-theme="dark"]`, exactly matching the existing three-block pattern already used for every other themed token).

**Required implementation detail, made explicit (added during pre-implementation verification, §Audit-1 below)**: adding these tokens is not sufficient on its own. `components.css`'s four existing rules (`.badge-critical`, `.badge-high`, `.badge-medium`, `.badge-low`, confirmed at `components.css:82-85`) currently compute their color **inline** via `color: var(--priority-critical); background: color-mix(in srgb, var(--priority-critical) 12%, transparent);` — they do not currently reference any themed token at all, which is *why* the original bug existed (a single value, mixed once, with no per-theme branch). Implementation must **replace these four rules' `color`/`background` declarations** to reference `var(--badge-critical-text)`/`var(--badge-critical-bg)` etc. directly — the new tokens alone, sitting unused in `tokens.css`, would fix nothing.

### Color — NEW (module accents, exact values, computed)

4 net-new hues (§3.1), each independently defined per theme, never derived by opacity trick from a single value (the exact mistake that caused the badge bug):

| Accent | Modules | Light value | Light-on-page (5.77–7.17:1 range, all pass) | Dark value | Dark-on-page |
|---|---|---|---|---|---|
| **Money** | BillSense | `#1f6f63` | `5.77:1` | `#5fb3a3` | `7.30:1` |
| **Warmth** | Family, Goals | `#96502a` | `5.83:1` | `#d99a6c` | `7.58:1` |
| **Reasoning** | DecisionFlow | `#48566d` | `7.17:1` | `#a7b4c9` | `8.64:1` |
| **Nature** | EcoLife | `#3f7a4a` | `4.95:1` | `#7ec28e` | `8.62:1` |

Each accent gets 4 derived tokens, naming convention `--accent-{name}` / `--accent-{name}-muted` / `--accent-{name}-border` / `--accent-{name}-strong`.

**Correction made during pre-implementation verification** (the original draft of this section defined `-muted` as "a hero-region background wash," which directly contradicted the prohibited-usage rule below — a real internal contradiction, caught and fixed here rather than left for implementation to discover): `--accent-{name}-muted` is instead scoped narrowly to a **small icon-badge background only** (a ≤15% tint sized to a single icon's own circular/rounded backing shape, matching the app's own existing pattern — EcoLife's current `.eco-cat-icon` already does exactly this, `color-mix(in srgb, var(--accent-500) 15%, transparent)` behind a single icon, confirmed in `tokens.css`) — **never** a region, card, or page-level background of any size larger than one icon's backing shape. This keeps `-muted` inside the "row-icon tint" entry of the permitted-usage list below, with no carve-out needed. `--accent-{name}-border` is the base value, used at full strength only as a 2-3px border/rule. `--accent-{name}-strong` is a further-saturated variant reserved for the icon glyph itself (the stroke, sitting on top of the `-muted` backing), verified for **non-text 3:1 contrast** per WCAG 1.4.11, not the 4.5:1 text threshold, since icons are graphical objects. Brand blue (unchanged, existing tokens) remains the "core" identity for Dashboard, Tasks, Assistant, Timeline's own chrome, and Settings — explicitly **not** a 5th new accent, per the §3.1 correction.

**Permitted usage (all 4 accents, no exceptions)**: a hero/list-region's top border or left-rule (§10); a module's section-label text color; a module's row-icon tint (`-muted` sized to one icon's own backing shape only + `-strong` for the icon glyph, verified 3:1 minimum); the sidebar/bottom-nav active-state tint for that module's own nav item (§20).
**Prohibited usage (all 4 accents, no exceptions)**: full-surface background fill of any card, hero region, list region, or page — including any tint sized larger than a single icon's backing shape; any button (`.btn-primary` stays brand blue everywhere, unconditionally, so "this is the primary action" remains a single, unambiguous visual signal app-wide); body text color; more than one accent visible on screen as a *dominant* color at once (Timeline is the deliberate, sole exception — see §19 — because showing multiple accents together *is* its specific job).

### Color — REPLACE (one specific, narrow case)

DecisionFlow's "recommended" treatment and Goals' progress-bar fill currently both reuse the generic `--accent-500` success-green token as if it were module branding. This is replaced: `--accent-500` remains reserved purely for actual success/positive-status semantics (unchanged everywhere else in the app — task-check color, badge-success, etc.); DecisionFlow's recommended-option border/badge keeps a status-green look (it *is* a status, "this option is recommended," not a module identity signal) using the same existing success token, now clearly intentional rather than incidental; Goals' progress-bar fill switches to the new Warmth accent (module identity, shared with Family per §3.1), separating "this goal is progressing" (any color reads as *a* progress fill) from "this app celebrates a decision being made" (success-green, semantically correct either way it's used).

### Color — REMOVE
Nothing. No color token is deleted — this is additive evolution throughout.

### Typography — EVOLVE
No new families, no new files, no new `<link>` beyond confirming the existing Fraunces URL's two weights (440/560) cover every use in §5 — verified they do; **no font-loading change is required**. New: two additional *semantic* type-role names (`--type-section-label`, `--type-date-group`) defined as composed shorthand (family+size+weight references to existing tokens), not new raw values.

### Spacing — KEEP
`--sp-1…16` unchanged, no finding against the scale.

### Radius — KEEP, applied more deliberately
`--radius-sm/md/lg/full` unchanged values; new *usage* rule only (§5, §10) — list regions use no radius (no box exists to round).

### Shadows — KEEP for set-cards, REMOVE for list regions
`--shadow-sm/md/lg` unchanged values; list regions (§10) use none, by design, which also directly reduces the dark-mode elevation-is-quieter observation from the prior audit (fewer surfaces need elevation contrast to read correctly at all).

### Motion — KEEP + one addition
`--transition-fast` (120ms)/`--transition-base` (200ms) unchanged, already correctly respect `prefers-reduced-motion` globally (§2). **What may animate**: hover/focus/active states (unchanged), route transitions (unchanged `page-in`), modal open/close (unchanged), toast in (unchanged), and **one new case**: a bucket/section expand-collapse (Dashboard §13, Family §15) using `--transition-base` on `max-height`/`opacity`. **What must not animate**: anything not listed above — no decorative motion, no attention-seeking micro-interactions, no loop animations beyond the existing spinner/skeleton-wave (both unchanged, both already purposeful).

---

## 7. Light Theme

Every token in §6 with a "Light value" column is the light-theme specification. No color in this document is defined by inverting a dark value or vice versa — each was computed independently against its actual light-theme surface (`--bg: #fbfbfa`, `--bg-elevated: #fff`), per the explicit anti-pattern this whole spec exists to avoid repeating.

Contrast targets, restated as acceptance criteria (verified per §22): body/heading text against page/card background ≥ existing baseline (already 4.55:1–16.97:1, unchanged, unconditionally preserved); all badge text/background pairs ≥ 6:1 (§6, exceeds the 4.5:1 minimum); all module-accent text/label usage ≥ 4.5:1 (§6 shows 4.95–7.17:1); all module-accent icon-fill (non-text) usage ≥ 3:1 (to be confirmed per exact icon-fill value during implementation, using the same computed method, not assumed).

---

## 8. Dark Theme

Every token in §6 with a "Dark value" column is the dark-theme specification, independently computed against the actual dark surfaces (`--bg: #14161a`, `--bg-elevated: #1c1f24`) — not derived from the light value by any automatic transform. The existing dark-mode focus-ring fix (`tokens.css:143-151`) is unconditionally preserved and used as the *reference example* for how every new dark-mode token in this spec was built: independently, not by inversion. Elevation: list regions (§6, §10) carry no shadow in dark mode by design, directly reducing the previously-observed "dark-mode cards read mostly via border, not fill" gap, since fewer surfaces need elevation signal at all once list content stops being boxed.

---

## 9. Module Accent System — Governance

Restated concretely from §6, with the explicit governance question from Step 5 answered: **is 4 (net-new) the right number?** Tested against the alternative of 3 (merging two of the four) and 5-6 (splitting Family/Goals apart, or giving Timeline/Assistant their own):

- **3 accents (merging, e.g., Nature into Warmth)**: rejected — EcoLife and Family/Goals are conceptually unrelated (environment vs. people/effort) and the prior audit already found EcoLife's existing circular icon treatment is a genuine, working piece of identity worth keeping distinct, not folding into another module's color.
- **5-6 accents (splitting Family from Goals, or adding one for Timeline/Assistant)**: rejected — §15 of the previous proposal's shape-analysis explicitly found no structural reason Dashboard/Tasks/Assistant need to differ from each other (all three are "core operating" surfaces), and Timeline's entire distinctiveness (§19) comes specifically from **borrowing** other modules' accents, not owning one — giving it its own color would work against its actual design purpose.
- **4 is retained** as the evidence-supported number: it maps to 4 genuinely distinct life-domains (money, people/effort, reasoning, environment) with no natural merge or split candidate found during this review.

**Enforcement mechanism for implementation — corrected during pre-implementation verification.** The original draft of this section claimed the shared `.module-accent--*` class/`moduleAccentClass()` helper (§11) "is the concrete mechanism that prevents accent-discipline drift." That overstates what a naming helper can actually do: a JS function that returns the right class name, or a CSS class that bundles the right custom properties, makes the *correct* usage convenient and consistent — it does **not** stop a future edit from writing `style={{ background: 'var(--accent-money)' }}` directly, or adding a fifth prohibited use, anywhere else in the codebase. Nothing about a helper function is self-enforcing. The honest position: `.module-accent--*` / `moduleAccentClass()` is a **convenience and consistency mechanism** (one place defines what "the money accent" means, so every correct usage looks the same and is easy to apply correctly) — the actual **enforcement** of the permitted/prohibited-usage rules in §6 is **procedural**: the explicit "no accent misuse" visual-QA assertion already specified in §25, checked by whoever reviews each implementation batch, the same way every other design rule in this small-team, no-lint-framework-for-CSS-rules project is enforced today (by review, not by tooling). Introducing an actual automated guard (e.g., a stylelint rule forbidding `--accent-*` properties inside `background` declarations) was considered and is **not** proposed here, since it would be new tooling/dependency surface for a single narrow rule, disproportionate given this project's stated "no new dependencies without a compelling reason" constraint (§26) — flagged as a legitimate future idea if accent misuse actually recurs after implementation, not a requirement of this spec.

---

## 10. Surface Strategy

The central mechanism of this whole spec, stated as an explicit decision procedure:

**Rule**: content is a **card** if it is one of several genuinely separate, individually comparable things (DecisionFlow's options, Goals' goals, Family's members, Settings' sections). Content is a **list region** if it is a single continuous, ordered thing being scanned or searched (Tasks' queue, Timeline's chronology, BillSense's bill list, Family's chat/activity feed). This is not a stylistic preference — it is grounded in the cited UX-research finding that cards "deemphasize ranking" and suit browsing over searching (previous proposal §16), applied to this specific product's actual content.

**List region, defined exactly**: no background fill distinct from the page, no border-radius, no box-shadow; a single `1px solid var(--surface-border)` **top rule** (replacing the card's full border) separates it from whatever precedes it; rows inside use the existing, unchanged `.row-item` styling. This is a genuinely small CSS delta — removing 3 properties (`background`, `border-radius`, `box-shadow`) and 3 sides of border from what a card currently provides, not a new component built from scratch.

**Hero region, defined exactly**: today's `.today-banner` pattern, generalized — `background: var(--bg-elevated)`, a **left accent border** (module color, 3px), `--radius-lg`, `--shadow-sm`, containing a serif heading and (where earned) a hero numeral. Used for: Dashboard's dominant bucket (§13), Family's shared-tasks region (§15).

**Hero-numeral tile — a distinct pattern, corrected during pre-implementation verification.** The original draft of this section listed "BillSense's stat row (unchanged, already this pattern)" as an example of the Hero region above. That's inaccurate: confirmed against source (`BillSense.jsx:98-110`), each stat tile is `className="card card-pad stat-tile"` — the plain, unchanged **Set card** rule below, with no left accent border at all; it shares only the serif-numeral *typography* (`.stat-tile .stat-value`, `pages.css`) with the Hero region, not its surface treatment. These are two genuinely different existing patterns that happened to look similar in prose. Naming them separately matters because conflating them could lead an implementer to add an accent border to BillSense's stat tiles "to match the hero-region pattern," which was never actually proposed anywhere in this spec (§14 does not add a border to the stat tiles, only to the category-bar fill and bill-row icons). **Hero-numeral tile, defined exactly**: `.card.card-pad` (unchanged, no border addition) containing a serif hero numeral — used for BillSense's 4 stat tiles (unchanged) and EcoLife's category-count tiles (§17, gaining this typography for the first time, still no accent border).

**Set card**: today's unchanged `.card`/`.card-pad` rule — used for DecisionFlow's options/criteria, Goals' goal cards, Family's member roster, Settings' section panel, EcoLife's category tiles (which are simultaneously "set cards," per §10's classification rule, and "hero-numeral tiles," per their typography — the two labels describe independent axes, surface-shape vs. numeral-typography, not competing categories).

Applied per page: **removed** from Tasks (outer wrapper), Timeline (outer wrapper), BillSense (bill-list wrapper only — stat tiles/category-bars/overdue card keep card treatment), Family (Chat/Activity tabs' implicit framing). **Kept** on DecisionFlow, Goals, Settings, Family's Members tab, EcoLife's category tiles.

---

## 11. Shared Component Architecture

Translated into actual React/CSS terms, checked against the real `web/src/components/` structure (not invented names) — every item below states what it actually changes at the markup/class level, since this is a class-and-token-level redesign, not a new component-library.

**KEEP unchanged**: `Icon.jsx` (extend the underlying icon table, §17 — the wrapper component itself needs no change), `modal.js` and every component that calls `openModal()` (zero changes), all form field markup/classes, all button classes, `TaskRow.jsx`/`BillRow.jsx`/`DecisionRow.jsx`'s keyboard-accessible structure from the last phase (their *wrapper* class changes per §10, their internal button/link structure does not).

**EVOLVE (class/token swap, no new component)**: `TaskRow.jsx`'s parent `.row-list`/`.card` wrapper in `Tasks.jsx` → list-region wrapper class; same for `Timeline.jsx`, `BillSense.jsx`'s bill list, `family/ChatTab.jsx` and `family/ActivityTab.jsx`'s containers; `BucketCard.jsx` gains a `dominant` boolean prop controlling whether it renders as a hero region (§13) or a compact summary (its existing card form, kept for the two non-dominant buckets); `GoalCard.jsx`'s progress-fill color reference, `DecisionDetail.jsx`'s recommended-badge color reference (§6).

**NEW, genuinely new markup/logic (not just a class swap)**:
- A small `moduleAccentClass(moduleName)` helper (plain JS function, not a component) returning the right `.module-accent--*` class per §9's governance — used by any page/component that needs to apply a module accent, so the 3-permitted-uses rule lives in one place, not copy-pasted per page.
- `Timeline.jsx`'s event-type→accent/icon lookup (§19) — a small object map, following the exact existing pattern `EcoLife.jsx`'s `CATEGORY_ICON` already uses, not a new abstraction pattern.
- `Dashboard.jsx`/`OverviewTab.jsx`'s expand/collapse state for subordinate buckets (§13/§15) — local `useState`, no new shared hook needed (each page's own existing `useState` pattern is sufficient, confirmed by reading how `Family.jsx`/`Assistant.jsx` already manage local tab/section state).

**Explicitly NOT created**: no new `<Surface>` or `<PageHeader>` wrapper component is proposed — per the brief's own instruction ("do not create abstraction for abstraction's sake"), every page's header already follows the identical `.page-header` markup pattern by convention across all 10 files; introducing a component to enforce what's already a consistently-copied 4-line JSX block would be a net increase in indirection for zero behavior change. The same reasoning applies to a hypothetical `<ListRow>`/`<Card>` wrapper — `.row-item`, `.card`, and the new list-region class are CSS contracts already correctly used via plain `className`, and wrapping them in components would only be justified if their *behavior* (not just their class) needed to be shared, which it doesn't.

**Responsibility boundaries**: `Icon.jsx` owns rendering an SVG from a name, never color (color is applied by the caller via CSS, unchanged); `moduleAccentClass()` owns only the name→class mapping, never renders anything itself; each page component owns its own data-fetching/state (unchanged, per-page `useXxx` hooks untouched) and now additionally owns which surface-strategy class (hero/list-region/set-card) it applies to its own regions — this is a page-level decision per §10's rule table, not a shared-component decision, since the whole point of the rule is that different pages make different calls based on their own content shape.

---

## 12. Dashboard Specification

- **A. Product purpose**: home/control center, first impression.
- **B. Primary user question**: "What actually needs me right now?"
- **C. Visual hierarchy**: today-banner (unchanged, already correct) → dominant bucket (new — **not hardcoded to "Needs attention"**, see rule below) → subordinate buckets/side cards (newly compact) → goals/activity (unchanged position, visually quieter by contrast once the bucket above it is properly weighted).
- **D. Page header structure**: unchanged (`.page-header`, greeting + subtitle, no actions).
- **E. Primary action**: complete/open the dominant bucket's top item.
- **F. Secondary actions**: view goals, view family activity, expand whichever buckets are currently subordinate.
- **G. Main composition**: banner (unchanged) → one hero-region dominant bucket (full-width or majority-width) → two subordinate buckets as compact link-out summaries → existing `.dash-grid` side column (goals/activity) unchanged. **Dominance rule, made explicit here** (reconciled during pre-implementation verification — the original draft only stated this rule in the Challenge section, §33, and never carried it back into this page's own spec, which is exactly the kind of cross-section inconsistency this verification pass exists to catch): the dominant bucket is **not** unconditionally "Needs attention." It is whichever of the three buckets is non-empty and highest in the existing severity order (Needs attention → Coming soon → Can wait). If "Needs attention" has zero items, "Coming soon" becomes dominant instead, and so on; if all three are empty, no bucket is dominant and the page falls back to today's unchanged three-equal-card layout (a real, existing, already-handled empty state, not a new one to design).
- **H. Surface strategy**: hero region for the dominant bucket (§10); the two subordinate buckets keep set-card styling but shrink to a 1-2 line summary + count + "View all →" rather than a full item list.
- **I. Module accent usage**: brand blue (core module, §9) — bucket-dot colors (existing red/amber/gray priority coding) unchanged, these are status colors, not module accents, and correctly stay as-is.
- **J. Typography hierarchy**: banner unchanged; dominant bucket gets the new section-label treatment (§5) in place of today's plain `.card-title`.
- **K. Information density**: reduced on first paint specifically (subordinate buckets compact by default) — directly mitigates the confirmed 39.5px mobile bottom-nav occlusion (§14) by shortening the page's natural first-viewport content, without hiding any data (everything remains one click away).
- **L. Empty state**: unchanged onboarding-card pattern.
- **M. Loading state**: unchanged.
- **N. Error state**: gains retry action (§5).
- **O. Success state**: unchanged (existing toast on task completion).
- **P. Mobile layout**: dominant bucket full-width, expanded; subordinate buckets collapsed to single summary lines by default, each individually expandable via existing disclosure interaction pattern (reuse `<details>`-equivalent local state, not a new component).
- **Q. Tablet layout**: `dash-grid` already collapses to 1 column at 900px (confirmed, unchanged) — dominant-bucket treatment applies identically to the tablet single-column flow.
- **R. Desktop layout**: dominant bucket takes clear visual priority in the left column; subordinate buckets stack compactly beneath it, still above the fold on a typical 1280×900 viewport (verify during implementation against the real content volume, not assumed).
- **S. Keyboard behavior**: bucket expand/collapse must be a real `<button>` (not a styled div) with `aria-expanded`, following the exact pattern already established for the family/assistant tab strips in the last phase — same discipline, not a new pattern.
- **T. Accessibility considerations**: verify the collapsed-bucket summary line still names its content accurately for a screen reader (e.g., "2 more due soon" must be programmatically associated with what "2 more" refers to, not just visually adjacent).
- **U. What existing UI is removed**: the "three equal-weight boxes" composition.
- **V. What existing UI is retained**: banner, hero numeral, bucket-dot color coding, goals/activity side cards, `.dash-grid` structure.
- **W. What existing UI is transformed**: bucket visual weight and mobile collapse behavior.
- **X. Required shared components**: `moduleAccentClass()` (unused here, brand-only, listed for completeness), the new expand/collapse local pattern.
- **Y. New page-specific components**: none — `BucketCard.jsx` gains a prop, not a sibling component.
- **Z. Risks / implementation notes**: collapsing subordinate buckets must not bury a genuinely time-sensitive item — needs explicit product sign-off on exactly what "safe to summarize" means (flagged as Open Question, §31).

---

## 13. Tasks Specification

- **A. Product purpose**: action/execution.
- **B. Primary user question**: "What do I need to do, in what order?"
- **C. Visual hierarchy**: filter pills (unchanged, already the page's real interactive anchor) → list region (new) → row content (unchanged, already correct per-row hierarchy).
- **D. Page header structure**: unchanged.
- **E. Primary action**: open/complete a task (unchanged, keyboard-accessible from the last phase, untouched).
- **F. Secondary actions**: filter, search, create.
- **G. Main composition**: filter bar, then list region (no outer card).
- **H. Surface strategy**: list region (§10) — first page this pattern is proven on (§29, migration order).
- **I. Module accent usage**: brand blue (core module).
- **J. Typography hierarchy**: unchanged row typography; optional small serif count near the filter row ("12 tasks"), echoing the hero-numeral motif at small scale — genuinely optional, not required for this page to be correct.
- **K. Information density**: slightly higher (removed card's nested padding), a small net mobile win.
- **L. Empty state**: unchanged.
- **M. Loading state**: unchanged.
- **N. Error state**: gains retry.
- **O. Success state**: existing toast on completion, unchanged.
- **P. Mobile layout**: unchanged list behavior, marginally more content-per-screen without the card's extra padding.
- **Q. Tablet layout**: unchanged.
- **R. Desktop layout**: unchanged beyond the card removal.
- **S. Keyboard behavior**: fully unchanged — `TaskRow.jsx`'s sibling-button structure from the last phase is untouched by this spec; only its parent wrapper's class changes.
- **T. Accessibility considerations**: re-verify (not assume) that removing the outer `.card`'s implicit landmark-adjacent grouping doesn't remove any meaningful semantic boundary — a plain list-region has no `role` change needed since `.row-list` was never itself a semantic list element (confirmed, it's a plain `<div>` today).
- **U. What existing UI is removed**: `.card`/`.card-pad` wrapper around the task list.
- **V. What existing UI is retained**: filter pills, search input, row content/hierarchy, keyboard accessibility.
- **W. What existing UI is transformed**: outer wrapper class.
- **X. Required shared components**: list-region CSS class only.
- **Y. New page-specific components**: none.
- **Z. Risks / implementation notes**: lowest-risk page-level change in the entire spec (§29 places it early in the migration order for exactly this reason).

---

## 14. BillSense Specification

- **A. Product purpose**: financial clarity and trust.
- **B. Primary user question**: "What do I owe, and when?"
- **C. Visual hierarchy**: stat row (unchanged, already strong) → overdue/AI-insights (unchanged) → bill list (transformed) → category breakdown (unchanged card).
- **D. Page header structure**: unchanged.
- **E. Primary action**: mark paid.
- **F. Secondary actions**: open/edit a bill, AI insights, add bill.
- **G. Main composition**: unchanged `stat-row` + `dash-grid`, with the bill-list column's card replaced by a list region.
- **H. Surface strategy**: stat tiles = hero-style facts (unchanged card treatment, already correct); bill list = list region (new); category-bars/overdue = set cards (unchanged, genuinely separate summary facts).
- **I. Module accent usage**: **Money** accent — stat-tile border, category-bar fill (replacing generic brand blue), bill-row category icon tint.
- **J. Typography hierarchy**: stat-tile serif numerals unchanged (pattern origin, untouched).
- **K. Information density**: bill list gains one less padding layer; otherwise unchanged.
- **L. Empty state**: unchanged.
- **M. Loading state**: unchanged.
- **N. Error state**: gains retry — the exact page the prior audit's missing-retry finding was tested on, concretely anchored here.
- **O. Success state**: existing "Marked as paid" toast, unchanged.
- **P. Mobile layout**: stat row already collapses correctly to 2×2 (confirmed, unchanged); list region removes a nested-padding layer, small mobile win.
- **Q. Tablet layout**: unchanged collapse behavior, confirmed correct in the prior audit's tablet screenshots.
- **R. Desktop layout**: unchanged beyond bill-list surface change.
- **S. Keyboard behavior**: fully unchanged — `BillRow.jsx`'s sibling-button structure from the last phase untouched; only the parent list wrapper's class changes.
- **T. Accessibility considerations**: category-bar fill color change (brand blue → Money accent) needs its own non-text 3:1 contrast re-check against `--bg-sunken` (the bar's track color) in both themes before finalizing the exact fill hex — flagged as a required implementation-time check, not assumed passing by inheritance from the text-contrast numbers in §6.
- **U. What existing UI is removed**: bill-list `.card` wrapper.
- **V. What existing UI is retained**: stat row, category bars' chart, overdue card, AI insights card.
- **W. What existing UI is transformed**: bill-list surface, category-bar fill color, per-row category icons (§17).
- **X. Required shared components**: list-region class, `moduleAccentClass('money')`.
- **Y. New page-specific components**: none — `BillRow.jsx` gains a category-driven icon prop, not a new component.
- **Z. Risks / implementation notes**: the category-bar fill is an existing, working data-visualization element — its color change is the one BillSense change needing an explicit before/after visual diff, not just a glance, since it's a filled shape rather than text.

---

## 15. Family Specification

- **A. Product purpose**: people, collaboration, shared household activity.
- **B. Primary user question**: "What does my family need from me, and what's happening?"
- **C. Visual hierarchy**: shared-tasks (newly dominant, was equal-weight) → invite-code (newly clearly secondary) → tab content (Members/Chat/Shopping/Activity, mostly unchanged).
- **D. Page header structure**: unchanged (family switcher select + Join/New-family actions).
- **E. Primary action**: open a shared task; send a chat message (tab-dependent).
- **F. Secondary actions**: switch family, manage members, shopping list, view activity.
- **G. Main composition**: Overview tab restructured (hero region for shared-tasks, compact utility card for invite-code); Chat/Activity tabs' content moves to list-region treatment; Members/Shopping tabs unchanged (genuine sets).
- **H. Surface strategy**: Overview shared-tasks = hero region; invite-code = small set card (unchanged size class, now visually secondary by comparison, not by being made smaller); Members roster = set card (unchanged); Chat bubbles/Activity feed = list region (removing their loose card framing).
- **I. Module accent usage**: **Warmth** accent — Overview hero-region border, tab-strip active-state tint, Members' role labels.
- **J. Typography hierarchy**: no hero-numeral introduced (§26 of the previous proposal, reaffirmed — no single "big number" fact exists for Family, and inventing one would violate the "don't fill empty space with features" constraint).
- **K. Information density**: unchanged on Chat/Shopping (already confirmed working); Overview gains real hierarchy where none existed.
- **L. Empty state**: unchanged (`NoFamilyState`, not evaluated as broken in either audit).
- **M. Loading state**: unchanged.
- **N. Error state**: gains retry.
- **O. Success state**: existing toasts (invite sent, member added, etc.), unchanged.
- **P. Mobile layout**: Chat/Activity already confirmed working on mobile (prior audit) — unchanged; Overview's hero/compact split follows the exact same mobile pattern established for Dashboard (§12.P), not a separate pattern.
- **Q. Tablet layout**: unchanged, `member-grid`'s `auto-fill minmax(200px,1fr)` already collapses correctly.
- **R. Desktop layout**: unchanged beyond Overview's weight redistribution.
- **S. Keyboard behavior**: fully unchanged — the ARIA tablist pattern from the last phase (Overview/Members/Chat/Shopping/Activity tabs) is untouched; only content *within* the Overview and Chat/Activity panels changes class.
- **T. Accessibility considerations**: the Warmth accent is, per §22's acceptance criteria, the one color requiring the most deliberate "does this read as mature, not childish" review — this is a design-judgment risk (§28), not primarily a technical accessibility risk, though its actual contrast numbers (§6) are already verified passing.
- **U. What existing UI is removed**: Chat/Activity's loose card framing (already minimal today, low-risk to formalize as list region).
- **V. What existing UI is retained**: tab structure (already ARIA-correct, untouched), all chat/shopping/members functionality, invite-code mechanism.
- **W. What existing UI is transformed**: Overview's bucket weighting, Warmth accent introduction.
- **X. Required shared components**: hero-region class, list-region class, `moduleAccentClass('warmth')` (shared literally with Goals, §9).
- **Y. New page-specific components**: none.
- **Z. Risks / implementation notes**: highest subjective-judgment risk in the whole spec (§26 of the previous proposal, reaffirmed and carried as this page's dominant risk in §28's self-critique).

---

## 16. DecisionFlow Specification

- **A. Product purpose**: structured reasoning and comparison.
- **B. Primary user question**: "Given what matters to me, which option actually wins?"
- **C. Visual hierarchy**: unchanged — already correct (options → recommended badge/score → criteria/weights).
- **D-H**: unchanged.
- **I. Module accent usage**: **Reasoning** accent — module header/tab tint only; the existing green "Recommended" badge/border is explicitly **kept as-is**, now understood and documented as a status color, not a module-identity color (§6's REPLACE entry clarifies the distinction rather than changing the pixel value).
- **J-N**: unchanged.
- **O. Success state**: existing "Decision recorded" toast, unchanged.
- **P-S**: unchanged, already confirmed correct at every breakpoint and via keyboard.
- **T. Accessibility considerations**: none new — this page has no confirmed finding against it in either prior audit.
- **U. What existing UI is removed**: nothing.
- **V. What existing UI is retained**: everything — option cards, scoring bars, weight-dots, pros/cons grid, AI-reasoning card, the "Recommended" green treatment exactly as-is.
- **W. What existing UI is transformed**: module-accent token reference only (header/tab tint).
- **X. Required shared components**: `moduleAccentClass('reasoning')`.
- **Y. New page-specific components**: none.
- **Z. Risks / implementation notes**: lowest-risk page in the entire spec, alongside Goals — explicitly first in the migration order (§29) for this reason.

---

## 17. EcoLife Specification

- **A. Product purpose**: lifestyle/environment tracking without gimmicks.
- **B. Primary user question**: "Am I actually doing the things I care about, across the categories I care about?"
- **C. Visual hierarchy**: unchanged structurally — category tiles → recent activity.
- **D-H**: unchanged; activity log becomes a list region (§10), category tiles keep set-card treatment (unchanged, genuinely separable facts).
- **I. Module accent usage**: **Nature** accent — category-tile icon background (extending, not replacing, the existing circular treatment the prior audit already praised).
- **J. Typography hierarchy**: category counts adopt the serif hero-number treatment, fixing the confirmed inconsistency against BillSense's identical content role (`EcoLife.jsx:93`'s inline `fontWeight:700` style is replaced by the shared hero-numeral pattern).
- **K-N**: unchanged beyond the above.
- **O. Success state**: existing "logged" behavior (implicit via list refresh), unchanged.
- **P-R**: unchanged, `grid-3` already confirmed collapsing correctly.
- **S-T**: unchanged/none new.
- **U. What existing UI is removed**: activity-log `.card` wrapper.
- **V. What existing UI is retained**: category-tile grid layout, circular icon treatment, tips card.
- **W. What existing UI is transformed**: icon assignments (below), count typography, activity-log surface.
- **X. Required shared components**: list-region class, `moduleAccentClass('nature')`.
- **Y. New page-specific components**: none.
- **Z. Icon fix — exact, not general**: checked the full 34-icon inventory (§2) against EcoLife's 6 categories (transport/energy/food/shopping/waste/water). Confirmed matches already exist and are correctly reassignable with **zero new icons**: `sun` → energy (already correct today), `trash` → waste (already correct today), `refresh` → transport (kept). Confirmed collisions requiring a real fix: `cart` currently serves both food and shopping; `refresh` currently also serves water (should not, transport already owns it). **Exact fix**: shopping keeps `cart` (better semantic fit than food); food gets a **new glyph** (a simple fork/utensil mark, same 18px/1.8-stroke style); water gets a **new glyph** (a simple droplet mark, same style). This is 2 new icons, both within the existing visual language, zero new dependency — confirmed as the minimum necessary, not a rounded-up estimate.

---

## 18. Goals Specification

- **A. Product purpose**: progress and long-term direction.
- **B. Primary user question**: "Am I actually moving toward what I said mattered?"
- **C-H**: unchanged — already correct, genuine "set" content (confirmed, card treatment kept).
- **I. Module accent usage**: **Warmth** accent (shared with Family, §9) — progress-bar fill (replacing the borrowed `--accent-500` green, §6's REPLACE entry).
- **J-N**: unchanged.
- **O. Success state**: unchanged (milestone-toggle visual feedback via the existing `.row-check.checked` pattern).
- **P-R**: unchanged, `grid-2` already confirmed collapsing correctly.
- **S-T**: unchanged/none new.
- **U. What existing UI is removed**: nothing.
- **V. What existing UI is retained**: goal-card layout, milestone checklist, empty-state CTA (already praised in the prior audit).
- **W. What existing UI is transformed**: progress-bar fill color only.
- **X. Required shared components**: `moduleAccentClass('warmth')`.
- **Y. New page-specific components**: none.
- **Z. Risks / implementation notes**: lowest-risk tier, alongside DecisionFlow.

---

## 19. Timeline Specification

- **A. Product purpose**: chronology, context, life history.
- **B. Primary user question**: "What has actually happened, and when, across everything I use this app for?"
- **C. Visual hierarchy**: date-group header (newly typographically dominant) → event dot/icon (newly type-aware) → event text (unchanged).
- **D. Page header structure**: unchanged.
- **E. Primary action**: open the linked item (unchanged).
- **F. Secondary actions**: none — Timeline is read-only by design, confirmed in source, not proposed to change.
- **G. Main composition**: list region only (§10), no card at all — the module whose shape (§15 of the previous proposal) is a pure continuum with zero "set" content.
- **H. Surface strategy**: list region, day-group headers as typographic dividers (no box).
- **I. Module accent usage**: **inherited per event**, confirmed buildable with the real data (§2) — `task_created`/`task_completed`/`comment` → brand blue (Tasks is a core/unaccented module, so these render with the existing neutral dot, unchanged from today); `bill_paid` → Money; `decision_made` → Reasoning; `goal_progress` → Warmth; `member_joined`/`member_left`/`ownership_transferred`/`invite_code_changed` → Warmth (Family's accent). This is Timeline's entire distinctive identity — the one page in the product where multiple accents appear together is deliberate and correct (§6's "one exception" clause), because showing the shape of a whole life across modules is literally this page's job.
- **J. Typography hierarchy**: day-group headers become Fraunces 560 `--fs-lg` (§5) — the single largest typographic change in this spec.
- **K. Information density**: unchanged event count/grouping logic; visual density decreases slightly (no card padding) while information density (events per screen) stays the same or improves.
- **L. Empty state**: unchanged (already good).
- **M. Loading state**: unchanged.
- **N. Error state**: **gains retry, and requires a real code fix to be paired with it** — `Timeline.jsx`'s initial fetch has no `.catch()` today (confirmed, `Timeline.jsx:27`, `.then()` only), meaning a failed load currently hangs the loading spinner forever. This is a functional defect, not a visual one, and is explicitly named here rather than silently left broken behind a nicer-looking (but still permanently spinning) loading state — flagged as required alongside this page's implementation, not deferred indefinitely (§31).
- **O. Success state**: N/A (read-only page).
- **P. Mobile layout**: a vertical chronicle is naturally mobile-first — if anything this page becomes *easier* to build correctly on mobile than it is today (no card-collapse behavior to get right, since there's no card).
- **Q. Tablet layout**: unchanged mechanism, same list-region flow.
- **R. Desktop layout**: unchanged mechanism.
- **S. Keyboard behavior**: unchanged — each event remains a real `<a href>` (confirmed already correct in source, `Timeline.jsx:75`), no new interactive elements introduced.
- **T. Accessibility considerations**: each event dot's accent-inherited color is decorative (the event text and the source module are both still conveyed in text, per the existing "no color-only communication" finding) — verify this remains true once accents are added (i.e., don't let the dot become the *only* signal of which module an event came from; the existing icon-per-kind treatment already planned here provides the non-color-dependent signal).
- **U. What existing UI is removed**: `.card` wrapper, the uniform-color dot styling (a minor factual correction: today's `.timeline-dot` is `background: var(--brand)` — navy blue, not literally gray, confirmed at `pages.css:100`; the finding that matters, "identical regardless of event type," is unaffected by this correction).
- **V. What existing UI is retained**: day-grouping logic, the underlying `/api/timeline` query and its existing cross-module authorization (unchanged, confirmed — `getUserFamilyIds`/`HIDE_NON_FAMILY_TASK_ACTIVITY`/`showsLinkedTaskSql` all untouched).
- **W. What existing UI is transformed**: dot/icon rendering (type/accent-aware), date-group header typography.
- **X. Required shared components**: list-region class, all 4 `moduleAccentClass()` variants (the one page that uses all of them), the new event-type→accent/icon lookup map.
- **Y. New page-specific components**: none — the lookup is a plain object map in `Timeline.jsx`, following `EcoLife.jsx`'s existing `CATEGORY_ICON` pattern exactly.
- **Z. Risks / implementation notes**: the missing-`.catch()` bug (N, above) must be fixed as part of this page's implementation batch, not treated as pre-existing and out of scope, since shipping a nicer Timeline with the same silent-hang failure mode would be a real, avoidable regression in perceived quality — explicitly called out so it isn't lost between "visual spec" and "engineering backlog."

---

## 20. Assistant Specification

- **A. Product purpose**: useful intelligence and conversation, integrated into Life Admin.
- **B. Primary user question**: "Can this actually help me right now, in plain terms?"
- **C-H**: unchanged — chat bubbles already correctly avoid card framing (confirmed, `.assistant-msg`/`.bubble` rules), Plan tab's day preview could optionally adopt the list-region pattern for consistency with Timeline's chronology (genuinely optional, not required).
- **I. Module accent usage**: **none, deliberately** — brand blue (core module), explicitly not given its own accent, per the brief's own explicit instruction that Assistant must not read as a separate "AI product." Restated here as a firm constraint, not an oversight.
- **J-N**: unchanged.
- **O. Success state**: N/A in the traditional sense (a successful reply is the normal conversational flow, already handled).
- **P. Mobile layout**: unchanged, already confirmed functionally correct (prior phase's scheduler-verification browser pass).
- **Q-R**: unchanged.
- **S. Keyboard behavior**: unchanged — send button, input, prompt chips all already correctly focusable.
- **T. Accessibility considerations**: unchanged, `aria-live="polite"` on the "Thinking…" state already confirmed present (`ChatTab.jsx:112`).
- **U. What existing UI is removed**: nothing.
- **V. What existing UI is retained**: essentially everything.
- **W. What existing UI is transformed**: nothing required; Plan tab's list-region alignment is optional polish.
- **X. Required shared components**: none required.
- **Y. New page-specific components**: none.
- **Z. Risks / implementation notes**: the primary risk here is a *process* risk, not a design one — this is the page most likely to attract "make it feel more AI" pressure during implementation, and this specification exists specifically to hold the line the brief itself sets against that.

---

## 21. Settings Specification

- **A. Product purpose**: calm configuration and account/security management.
- **B. Primary user question**: "Can I control how this works and how it looks, and manage my account safely?"
- **C-H**: unchanged section-panel structure (already the most correctly-differentiated navigation pattern in the product — vertical tablist reusing `.nav-link`, confirmed and praised twice now).
- **I. Module accent usage**: **none, deliberately** — Settings is about the whole product, not a life domain, and correctly stays neutral/brand (matching Assistant's reasoning).
- **J-N**: unchanged.
- **O. Success state**: existing "Preferences saved"/"Save changes" toasts, unchanged.
- **P. Mobile layout**: unchanged, `settings-layout` already collapses correctly under 800px (confirmed in source).
- **Q-R**: unchanged.
- **S-T**: unchanged.
- **U. What existing UI is removed**: nothing from Settings itself.
- **V. What existing UI is retained**: everything structural, all 7 existing sections.
- **W. What existing UI is transformed**: **Appearance section** gains the relocated theme control (below); explicitly, **Notifications and AI-preferences sections are NOT visually expanded or promoted** — both contain the confirmed-inert controls (§2), and per this phase's own instruction ("if a preference is currently inert, explicitly identify it... do not visually expand or promote settings that are not actually functional"), they remain in their current, modest, unexpanded visual form. A one-line, honest UI note is warranted at implementation time (not a redesign): e.g. the existing muted helper text under each section could be extended to accurately describe current real behavior, but that is a copy/content decision for implementation, not a structural spec item.
- **X. Required shared components**: the new Appearance control (below).
- **Y. New page-specific components**: a `ThemeControl` — three explicit options (Light/Dark/System), built as a `role="radiogroup"` of three buttons. **Precision correction**: this is a genuinely *new* ARIA widget pattern for this codebase — confirmed via a full-repo search, `role="radiogroup"`/`role="radio"` appears nowhere in `web/src` or `public/js` today, only inside `react-dom`'s own internals. It follows the *same discipline* as the existing tablist implementations (real semantic roles, real keyboard handling, not a styled-div approximation) but is not a reuse of the tablist code itself — radiogroup and tablist are different ARIA patterns with different keyboard contracts, and implementation should build this fresh against the WAI-ARIA APG "Radio Group" pattern, not by copying `Assistant.jsx`'s/`Family.jsx`'s tab-keydown handler.
- **Z. Risks / implementation notes**: removing one-click topbar theme access is a named, accepted trade-off (§26 of the previous proposal, reaffirmed) — mitigated by the fact that "System" is a real, already-supported state (`tokens.css`'s `prefers-color-scheme` block) that a user who toggles frequently for day/night can set once and never touch again.

**Theme control — exact behavior**: `AppearanceSection.jsx` renders `role="radiogroup" aria-label="Theme"` containing three `role="radio"` buttons (Light/Dark/System), one always `aria-checked="true"`; selecting one calls the existing `applyTheme()`/`PATCH /api/settings/preferences` flow (unchanged endpoint, unchanged persistence, only the UI control changes); **keyboard behavior, made exact** (the original draft left "arrow keys move selection" unspecified as to which keys — ambiguous enough that two different implementers could reasonably build it two different ways): both **ArrowLeft/ArrowRight and ArrowUp/ArrowDown** move selection one option at a time and wrap at the ends (Left/Up = previous, Right/Down = next), per the WAI-ARIA APG Radio Group pattern's own standard recommendation to support both axes regardless of the group's visual orientation; moving selection **immediately** changes the theme (matching this control's own "automatic activation" nature — there is no separate "confirm" step, consistent with how a preference toggle should behave); Tab enters/exits the group as a whole (one stop), not per-option. `app.js`'s `renderShell()` loses its `#theme-toggle` button and `toggleTheme()` call entirely — **no replacement control appears anywhere outside Settings**, exactly matching the brief's explicit instruction.

---

## 22. Navigation Specification

Structurally unchanged (§9 of the previous proposal, reaffirmed — no IA finding justifies restructuring, React Router remains explicitly rejected). Visual changes only:

- **Active-state treatment**: unchanged mechanism (`background: brand-soft`, left border, bold label) for Dashboard/Tasks/Assistant/Settings (core/unaccented); for Family/BillSense/DecisionFlow/EcoLife, the active-state left-border and icon color swap to that module's accent instead of brand blue, using the same `.nav-link.active` rule with a per-module modifier class (`moduleAccentClass()`, §9/§11) — the active-state *mechanism* doesn't change, only which color variable it references, per module.
- **Icon treatment**: unchanged style/size; resting (non-active) nav icons stay `--text-secondary` regardless of module, exactly as today — module accent appears **only** on the active/current-page state, never as a permanent per-item color, which would reintroduce the "rainbow sidebar" risk this whole spec is designed to avoid.
- **Grouping**: a thin visual rule (not new copy, not a new nesting level) separates Dashboard (home) from the 8 module links from Settings/Log-out — implemented as a `<div className="sidebar-section">`-equivalent gap, reusing the exact pattern already used to separate Settings/Log-out from the main nav list today (`app.js`'s existing `.sidebar-section` markup, confirmed present).
- **Mobile bottom-nav**: same active-state accent-color extension as desktop; the previously measured 39.5px occlusion (§14, carried forward) is addressed at the content level (Dashboard/Family's bucket-collapse, §12/§15), not by changing the nav bar itself — the nav's own height/position (`--bottomnav-height: 64px`, `position: fixed`) and the page's compensating `padding-bottom` are unconditionally unchanged, since the prior audit already confirmed the padding mechanism itself works correctly (content is always reachable by scrolling); the fix is to what naturally lands in the first viewport, not to the nav.
- **Accessibility**: unchanged — nav links remain real `<a href>` elements (confirmed, already correct), focus-visible ring unchanged, no new ARIA needed since accent color is applied via CSS class only, carrying no independent semantic meaning a screen reader needs to announce (the link text already names the destination).

---

## 23. Responsive Rules

Corrected against the real breakpoint set (§2/§3.4): `640px, 800px, 860px, 900px, 1024px`, all `max-width`. Per-component behavior, specified exactly (not just "collapses correctly"):

| Component | ≥1024px | 900-1023px | 800-899px | 640-799px | <640px |
|---|---|---|---|---|---|
| Sidebar/bottom-nav | Sidebar visible, bottom-nav hidden | — | — | — | Sidebar hidden, bottom-nav visible (switch happens at 1024px, unchanged) |
| `.dash-grid` (Dashboard/DecisionFlow/BillSense) | 2fr:1fr columns | 1 column (switch at 900px, unchanged) | — | — | — |
| `.stat-row` (BillSense) | 4 columns | 4 columns | 4 columns | 2 columns (switch at 900px per existing rule, confirmed) | 2 columns |
| `.settings-layout` | 200px:1fr columns | — | 1 column (switch at 800px, unchanged) | — | — |
| `.grid-2`/`.grid-3` (Goals/EcoLife) | as defined | as defined | as defined | 1 column (switch at 640px, unchanged) | 1 column |
| `.page` padding | `--sp-6` | `--sp-6` | `--sp-6` | `--sp-4` (switch at 640px, unchanged) | `--sp-4` |
| New: hero region (Dashboard/Family dominant bucket) | full weight, majority column width | full weight, single column | full weight | full-width, expanded | full-width, expanded |
| New: subordinate bucket collapse | expanded by default (desktop has room) | expanded by default | expanded by default | **collapsed by default** (switch at 640px — the point where the page already drops to compact padding, a natural, existing threshold to reuse rather than inventing a new one) | collapsed by default |
| New: list region (Tasks/Timeline/BillSense-list/Family-activity) | unchanged flow at every width — no breakpoint-specific behavior needed, since removing a card's fixed padding makes this pattern inherently width-agnostic | | | | |

**No horizontal overflow, no clipped actions, no hidden important information, no accidental overlap**: every existing overflow-prevention mechanism (`.dash-grid > * { min-width: 0 }`, `.tabs { overflow-x: auto }`, modal's `width: min(560px, 92vw)`) is unconditionally unchanged and re-verified (not re-invented) at implementation time (§25).

---

## 24. Accessibility Requirements

Restated as measurable acceptance criteria, superseding prose:

1. **Contrast**: every text/background pair introduced by this spec ≥ 4.5:1 (normal text) or ≥ 3:1 (large text/graphical objects, per WCAG 1.4.11) — computed and listed in §6/§7/§8, not estimated; any new value decided during implementation (e.g., the category-bar fill exact hex, §14.T) must be computed the same way before merging, not after.
2. **Keyboard navigation**: every page whose row/wrapper markup changes (Tasks, Timeline, BillSense, Family's Chat/Activity) must re-pass the exact keyboard test sequence already established in the Daily Product Quality phase's own verification script (Tab reaches the row, Enter/Space activates it, Escape/focus-restoration on any modal triggered from it) — re-run, not assumed to survive.
3. **Visible focus**: unchanged global `:focus-visible` mechanism, applies automatically to every new interactive element (bucket-expand buttons, theme-control radiogroup) with zero new CSS required.
4. **Semantic HTML / no nested interactive controls**: the new bucket-expand button and theme-control radiogroup must each be verified as valid, non-nested interactive markup — directly informed by the exact class of bug the last two phases already found and fixed once (button-in-button in the old TaskRow) and once flagged-but-deferred (button-in-anchor in `ItemRow.jsx`) — do not reintroduce either pattern.
5. **Accessible names**: every new icon-only affordance (if any is introduced — none are currently specified as icon-only) requires an `aria-label`, per the existing app-wide convention.
6. **Reduced motion**: automatically satisfied by the existing global rule (§2) for every new transition this spec adds — verify, don't assume, that the new bucket expand/collapse specifically respects it (it should, by inheriting the existing universal selector, but confirm in the real browser during implementation).
7. **Touch target sizing**: no new control in this spec is smaller than the existing `.btn-sm` (32px) or `.icon-btn` (36px) minimums; the theme-control's three radio-buttons should each meet or exceed 36px, matching existing icon-button sizing, not shrunk to fit three options in a tight row.
8. **No clipped content / no horizontal overflow / no focus loss after dynamic updates**: re-verified per §23's table and per §25's QA matrix — the bucket expand/collapse interaction specifically needs a focus-loss check (does focus remain sensibly placed after a subordinate bucket expands and its content pushes the page down?).
9. **Screen-reader meaning for color-coded elements**: Timeline's per-event accent dot (§19) must never be the sole signal of an event's source module — the existing icon-per-kind treatment (already planned) and the event's own text both independently convey this, satisfying "no color-only communication" by construction, not by afterthought.

---

## 25. Visual QA Matrix

**Mandatory combinations** (not every theoretical combination — scoped to what actually changes):

- **Viewports**: 320, 360, 390, 430, 768, 1024, 1280, 1440 (per the brief's exact list — note this supersedes the prior audit's 320/360/375/390/414 set slightly; 430 and 1440 are new additions worth adopting going forward since they cover the current largest common phone (iPhone Pro Max-class) and a common large-desktop width the prior sweep didn't test).
- **Themes**: light, dark — both mandatory for every viewport above, no exceptions, since this spec's core content (module accents, badges) is exactly the content most likely to regress per-theme.
- **States**: populated (seeded demo data, the primary QA state), empty (once per page, desktop only — mobile/tablet empty states are lower-risk since they inherit the same unchanged pattern), error (BillSense + Timeline specifically, since Timeline's error-state fix is paired with a real code change, §19.N), one modal-open state per page that has a primary create/edit modal (Task detail, Bill form — matching the prior audit's own scope).

**Specific visual assertions per screenshot** (not a generic "looks fine" pass):
- No horizontal overflow (`document.documentElement.scrollWidth <= clientWidth`, the exact existing automated check from prior phases, reused).
- No bottom-nav occlusion of the dominant bucket's content at 390px on first paint — re-run the exact `getBoundingClientRect()` measurement method from the prior audit (§15 there), this time against the *redesigned* Dashboard, to confirm the fix actually worked, not just that it was attempted.
- No header/action collision at 320px specifically (the narrowest mandatory width) on every page with `page-actions` (Tasks, BillSense, Goals, EcoLife, Family, DecisionFlow).
- No contrast failures — automated computation (the same relative-luminance script used throughout this document) re-run against every *actually rendered* color, not just the token specification, since a CSS cascade bug could theoretically apply the wrong variable even if the token itself is correct.
- No accent misuse — a manual/automated grep-style check that no `.module-accent--*` class or CSS custom property appears on a `.btn-primary` or as a full-surface `background` anywhere in the built CSS, directly enforcing §6/§9's prohibition.
- No layout jumps on bucket expand/collapse (verify via a before/after screenshot diff of surrounding content, not just the animated element itself).
- No clipped list rows or unreadable metadata at 320px on Tasks/Timeline/BillSense's new list-region layout specifically, since this is new surface behavior without prior-phase precedent to inherit confidence from.

---

## 26. Performance / Cost Constraints

- **New dependencies**: zero. Confirmed nothing in this spec requires anything beyond what `package.json`/`web/package.json` already list (§2).
- **CSS growth**: additive — **exact count, corrected during pre-implementation verification** (the original draft undercounted by omitting the ×2-themes multiplier for module accents): 8 badge tokens (4 priorities × bg/text) × 2 themes = 16, plus 4 accents × 4 derived values × 2 themes = 32, for **48 new custom properties** total, each a one-line declaration. Even at this corrected count, still well under 150 new lines across `tokens.css`/`components.css` combined once the `.module-accent--*` classes and list-region rule are added — versus card-chrome removal on 4-5 pages netting negative lines elsewhere. Net CSS delta: small, likely near-zero.
- **Bundle/runtime**: two new small lookup objects (`moduleAccentClass()`, Timeline's event-type map) — negligible, same order of magnitude as the existing `CATEGORY_ICON` object already shipping today.
- **Fonts**: zero new requests — Fraunces already loaded, both weights used already suffice (§2/§6).
- **Images**: zero — 2 new icons are inline SVG path strings added to the existing `icons.js` table, not image assets.
- **Animation cost**: one new transition (bucket expand/collapse, `max-height`/`opacity` over 200ms) — negligible, same cost class as the existing modal-open animation.
- **Mobile performance**: no new mechanism that could regress it — list-region pages become *lighter* (less DOM/CSS per row, no card chrome), the only page gaining new interactive JS state is Dashboard/Family's bucket toggle (trivial).

---

## 27. Security / Privacy Boundaries

Explicitly verified against every proposed change: no new data collection, no new fields fetched, no new field displayed to a user who couldn't already see it. Dashboard's bucket-weight change, Timeline's per-event accent, and Family's region restructuring all render the exact same already-authorized queries (`getUserFamilyIds`, `HIDE_NON_FAMILY_TASK_ACTIVITY`, `showsLinkedTaskSql`, `requireMembership` — all confirmed unchanged, none touched by this spec). Timeline's `type` field (the one piece of data this spec newly *uses* visually) was already present in the existing, already-authorized API response (§2) — reading a field that was already being sent to the client is not a new exposure. The two inert-Settings-control findings (§2) are **not** proposed to be fixed by exposing more data or changing authorization — they are explicitly flagged as a separate engineering gate (§31) precisely because fixing them would mean *changing what the backend actually does* (checking a preference before creating a notification/making an AI call), which is out of bounds for a visual-only phase per this brief's own instruction.

---

## 28. Migration Order

Evaluated against the previous proposal's suggested order (token foundation → DecisionFlow/Goals/EcoLife → Tasks/BillSense → Timeline → Dashboard/Family) and **confirmed correct, with one refinement**: Settings/Appearance's theme relocation is independent of every other stage (§21) and should be called out as parallelizable rather than slotted into the linear sequence, since it touches an unrelated part of the shell (`app.js`'s topbar) and has zero dependency on the accent/list-region work.

**Why this order, restated with the evidence for each step**:
1. **Color/token foundation** (badge fix + 4 module accents, both themes) first, because it is the one change with genuine app-wide blast radius (badges appear on Tasks/Dashboard/Timeline; module accents will be referenced by every subsequent page's batch) — verify across all 10 pages × 2 themes before anything downstream depends on it, exactly the caution the prior audit itself flagged for this class of change.
2. **List-region CSS pattern**, proven on **Tasks alone** before reuse elsewhere — Tasks is the lowest-risk page with this content shape (§13.Z), so it's the right place to catch any unforeseen issue with the new pattern cheaply.
3. **DecisionFlow, Goals** — token-reference-only changes (§16/§18), essentially zero risk, good early wins that validate the accent system's *usage* discipline (§9) in production before more complex pages depend on it.
4. **EcoLife** — small, fully scoped (§17), including the one genuinely new asset work (2 icons) in isolation.
5. **BillSense** — list-region reuse + category-bar color change (§14), the first page combining two new patterns at once, appropriately sequenced after each pattern has already shipped independently.
6. **Timeline** — the most structurally different page (§19), done once list-region and the full accent system are both already proven, **plus its own paired code fix** (the missing `.catch()`, §19.N) — this batch is explicitly larger than a pure-visual batch and should be scoped/estimated as such.
7. **Dashboard, Family** — the genuinely new layout logic (bucket dominance/collapse, §12/§15), done last among the content pages specifically because it's the least precedented pattern in this spec and benefits most from every other pattern already being battle-tested.
8. **Settings/Appearance** — independent, can run at any point in parallel with any batch above.
9. **Assistant** — no dedicated batch required; picks up the shared error-state retry pattern wherever that lands.

---

## 29. Implementation Batches

| Batch | Scope | Dependencies | Expected visual result | Regression risk | Validation | Rollback |
|---|---|---|---|---|---|---|
| 1 | Badge contrast fix + 4 module-accent tokens (both themes) | None | Badges read correctly in both themes; new accent tokens exist but are unused until later batches reference them | High blast radius, low per-change complexity | Full 10-page × 2-theme screenshot re-shoot (§25), computed contrast re-check | Revert `tokens.css`/`components.css` diff only — no markup changed, trivially revertible |
| 2 | List-region CSS class, applied to Tasks only | Batch 1 (uses corrected badge tokens on the same page) | Tasks loses its outer card | Low | Keyboard re-test (§24.2), 320-1440px screenshot sweep on Tasks only | Revert Tasks' wrapper class, class definition can stay unused |
| 3 | DecisionFlow + Goals accent references | Batch 1 | Reasoning/Warmth accents visible for the first time, in the lowest-risk context | Low | Contrast spot-check, screenshot diff | Revert 2 small token-reference lines each |
| 4 | EcoLife (list-region + accent + 2 new icons + hero-numeral typography) | Batches 1-2 (reuses list-region pattern) | First page combining 3 new patterns; validates icon-addition workflow | Low-moderate | Full screenshot sweep, verify new icons render correctly at 18px in both themes | Revert page diff; icons can stay in the shared table unused if needed |
| 5 | BillSense (list-region + Money accent + category-bar color + category icons) | Batches 1-2 | Bill list restructured, category visualization re-colored | Moderate (category-bar fill is a working data-viz element) | Explicit before/after diff on the category bars specifically, full keyboard re-test | Revert page diff |
| 6 | Timeline (full rebuild + missing-`.catch()` fix) | Batches 1-2-3-4-5 (uses all 4 accents) | Timeline becomes a genuine chronicle with per-event accent/icon | Moderate-high (most new logic, paired functional fix) | Full screenshot sweep, error-state re-test (deliberately break the fetch, confirm retry now works, confirm no infinite spinner), event-type mapping spot-check against real seeded data | Revert page diff; the `.catch()` fix can ship independently/first if the visual work needs more time (explicitly decomposable) |
| 7 | Dashboard + Family (bucket dominance/collapse, Warmth accent) | Batches 1, 3 (Family shares Goals' Warmth token) | Both pages gain real inter-section hierarchy | Moderate (new interaction state, mobile-occlusion re-verification required) | Full screenshot sweep including the specific 390px bottom-nav re-measurement (§25), keyboard test on the new expand/collapse control, product sign-off on collapse-safety (§31) | Revert page diff; `BucketCard.jsx`'s new prop can default to its old always-expanded behavior |
| 8 | Settings/Appearance theme relocation | None (independent) | Topbar toggle gone, Settings gains the 3-way control | Low-moderate (a real behavior change a returning user will notice) | Keyboard re-test of the new radiogroup, confirm `PATCH /api/settings/preferences` round-trip unchanged, confirm System mode still correctly follows OS preference | Revert `app.js`/`AppearanceSection.jsx` diff; trivially reversible since the endpoint itself never changed |

**No single-commit redesign** — each batch above is independently shippable and independently revertible, directly satisfying the brief's explicit instruction against one giant commit.

---

## 30. Acceptance Criteria

A batch is done when: its own row in §29's "Validation" column passes; the relevant subset of §25's QA matrix passes; the relevant subset of §24's accessibility criteria passes; the full existing backend test suite (231 tests as of the last phase) still passes unchanged (none of this spec's batches touch backend logic except Batch 6's paired `.catch()` fix, which needs exactly one new or extended test case, following the existing test-file convention); `npm run lint` and `npm run build` both remain clean; no new console errors/failed network requests appear in a full click-through of the batch's affected pages, light and dark, desktop and mobile (the same discipline the last two phases' browser-verification scripts already established, reused rather than reinvented).

---

## 31. Open Questions / Separate Gates

**BLOCKED / REQUIRES SEPARATE APPROVAL** (per §26 of the brief — genuine engineering work this visual phase must not silently absorb):

1. **`notifPrefs` is fully inert** (§2) — fixing this means adding a real check in `src/lib/notify.js` before each notification is created. This is a backend logic change, not visual, and is explicitly out of this phase's scope. **Reason it's blocked here**: the brief's own boundary excludes backend changes; **exact scope if approved separately**: gate each `notify()` call site by the recipient's own `notifPrefs[type]`, a small, well-contained change given `notify.js`'s existing single-entry-point structure.
2. **`aiEnabled` is fully inert** (§2) — same class of issue, same reasoning. **Exact scope if approved separately**: each `src/routes/ai.js` route would need to check `req.user.ai_enabled` alongside its existing `ai.isConfigured()` check — small, but touches every AI route, so slightly larger than item 1.
3. **`Timeline.jsx`'s missing error handling** — **not blocked**, explicitly folded into Batch 6 (§29) since it's small enough to ship with that page's own visual work and leaving it unfixed would undercut the redesigned error state's whole purpose.
4. **Mobile bucket-collapse "safety" threshold** (§12.Z/§15) — needs product-owner sign-off on exactly which categories of information are safe to summarize-by-default on first paint, not a purely visual/engineering decision.
5. **The `language` field's total absence of any UI** (§2) — not a redesign concern (nothing currently references it visually to preserve or change); flagged only as dead backend surface worth a maintainability note for a future cleanup phase, not this one.

**Not blocked, explicitly confirmed buildable within this spec's scope**: Timeline's event-type accent inheritance (§2/§19) — the one item the previous proposal flagged as possibly needing a gate, now resolved as needing none.

---

## 32. Risks

Carried forward and refined from the previous proposal, with this phase's new findings folded in:

- **Accent-discipline drift** (§9) — largest named risk, mitigated by the `moduleAccentClass()` enforcement mechanism (§9/§11) rather than relying on per-page convention alone.
- **Family's Warmth-accent execution drifting toward childish** (§15.T/§28) — the single highest subjective-judgment item in the spec; needs explicit design review against that specific failure mode.
- **Dashboard/Family bucket-collapse hiding urgent information** (§12.Z, §31.4) — needs product sign-off, not an engineering-only decision.
- **BillSense's category-bar fill color change regressing a working data-viz element** (§14.Z) — needs its own explicit before/after check, not folded into a generic page review.
- **Timeline batch is genuinely larger than its peers** (§29, Batch 6) — combines the most new visual logic with a real functional fix; should not be estimated as "just another page."
- **Settings/Appearance is a real, user-visible behavior change** (§21.Z, §29 Batch 8) — the one item in this spec where "the user will notice something is different" is the *intended* outcome of a deliberate product decision (already made in the governing brief), not a side effect to minimize, but it still needs its own explicit QA pass rather than being treated as trivial because it's "just Settings."

---

## 33. Challenge / Counterarguments

Per Step 27, each item stress-tested against "what could make this decision wrong," answered with evidence rather than restated as settled:

1. **Structured Warmth** — could be wrong if the 4-accent system proves too subtle to notice in practice, making the whole effort invisible. *Evidence against this concern*: Dashboard's today-banner and BillSense's stat row already prove a single accent border + typography combination is noticeable (both are the two pages already independently identified as "the strongest" in two separate audits, on the strength of exactly this kind of small, disciplined accent) — the mechanism is proven, only its consistent extension is new.
2. **Editorial Ledger influence (list regions)** — could be wrong if removing card chrome makes data-dense pages (a 40-item Tasks list, BillSense's bill list) feel less organized rather than more. *Evidence against*: the cited external research (previous proposal §16) specifically found cards hurt *ranking/scanning* tasks, which is exactly what a long list is — the direction of this concern points toward the change helping, not hurting, though this should still be verified visually (§25) rather than assumed from the citation alone.
3. **4-accent system** — could be wrong if 4 is still too many for users to actually learn. *Evidence*: checked against the product's own existing precedent — priority badges already use 4 distinct semantic colors (critical/high/medium/low) without confusion, per no finding against them beyond contrast (a legibility issue, not a too-many-colors issue) in either audit — 4 is within a range this product already demonstrates working.
4. **Card → list migration** — could be wrong if a "list region" without a border reads as *unfinished* rather than *editorial* to a user unfamiliar with that design vocabulary. *Evidence/mitigation*: this is a real, unresolved risk this document cannot fully settle from source inspection alone — flagged honestly (§34) as the item most dependent on actual visual execution quality, not something contrast math or component architecture can guarantee.
5. **Dashboard bucket model** — could be wrong if "Needs attention" isn't reliably the right bucket to make dominant (e.g., a user with an empty Needs-attention list but a full Coming-soon list). *Evidence/mitigation*: the dominance rule should be content-aware, not hardcoded to always favor "Needs attention" — refined here: the dominant bucket should be **whichever bucket is non-empty and highest in the existing severity order** (Needs attention → Coming soon → Can wait), not unconditionally the first one; this is a small but real refinement this challenge step surfaced that the original proposal didn't fully specify.
6. **Family warm accent** — addressed extensively already (§15, §28, §32) as the item with the least resolvable-from-source risk.
7. **Timeline accent inheritance** — could be wrong if it makes Timeline feel *more* chaotic (many colors) rather than *more* legible. *Evidence/mitigation*: mitigated by keeping dot/icon size small and by every event still carrying the same amount of text as today — the accent is additive signal, not a replacement for the existing, already-working text-based clarity; should be the first thing checked visually once built (§25), not assumed safe.
8. **Mobile bucket collapse** — addressed in item 5 above and §31.4; the real answer is "content-aware, product-approved," not a fixed rule this document can finalize alone.
9. **Existing typography** — could be wrong to leave unchanged if Fraunces at only 2 weights proves limiting once its role expands (§6/§5's date-group header, section labels). *Evidence*: checked directly — both new uses (§5) fit within weight 560, no third weight is actually needed, this concern doesn't materialize in practice for what's actually specified.
10. **Existing icon system** — could be wrong to keep the same thin-stroke style if it's part of why the product reads as generic (previous proposal §4). *Evidence against changing it*: the *style* isn't the problem per that same analysis — the problem was *incomplete category coverage* (collisions), which §17 fixes without changing the visual language itself; changing the whole icon style would be a much larger, unevidenced intervention.
11. **Navigation structure** — addressed at length already (§22); no new counterargument surfaced beyond what's there.
12. **Current spacing scale** — could be wrong to leave unchanged if list regions (with less padding than cards) end up feeling cramped. *Evidence/mitigation*: list regions reuse `.row-item`'s existing, unchanged internal padding (`--sp-3 --sp-2`) — only the *outer* card padding is removed, and that outer padding was never load-bearing for row-level readability, only for the card-as-object illusion this spec is deliberately removing.

---

## 34. Self-Critique

- **Weakest design decision**: the Family Warmth-accent color choice (§6/§15) — its contrast numbers are solid (5.83–7.58:1), but "does this feel mature, not childish" is a judgment this document reasons about but cannot fully verify without seeing the real, finished execution — flagged honestly rather than oversold as settled.
- **Highest implementation risk**: Timeline (Batch 6, §29) — the most new logic, combined with a real functional fix, in one page.
- **Biggest UX uncertainty**: Dashboard/Family's mobile bucket-collapse "safety" threshold (§31.4) — this document proposes a mechanism (severity-ordered dominance, §33.5's refinement) but explicitly defers the exact policy to product sign-off rather than claiming to have solved it unilaterally.
- **Biggest accessibility risk**: the new bucket-expand/collapse interaction (§12.S/§24.8) — it's the one genuinely new interaction pattern in this spec (everything else reuses proven patterns from the last two phases), so it carries the most first-time-implementation risk of a subtle keyboard/focus bug, and is called out explicitly for its own dedicated re-test rather than assumed to inherit the last phase's blanket keyboard-accessibility confidence.
- **Biggest maintainability risk**: token sprawl if the `moduleAccentClass()` enforcement mechanism (§9/§11) isn't actually adopted consistently during implementation — the spec proposes the mechanism specifically to prevent this, but a spec cannot enforce its own adoption; this is named as a process risk for whoever implements it, not something this document can close on its own.
- **Biggest chance of "rainbow UI"**: correctly identified and mitigated at three separate layers in this document (the 3-permitted-uses rule in §6, the single enforcement class in §9/§11, and the explicit QA assertion in §25) — redundant on purpose, since this is the single most brief-repeated failure mode to avoid.
- **Biggest chance of making the app look more generic rather than less**: the list-region pattern, if executed with insufficient typographic confidence (§33.4's honest flag) — a poorly-weighted date header or section label could make a "list region" read as "we forgot to finish styling this" rather than "this is deliberately editorial." This is the single largest execution-quality-dependent risk in the whole document and cannot be fully de-risked by specification alone.
- **Where this document relies on an assumption**: the exact category-bar fill hex for BillSense (§14.T) is deferred to implementation-time contrast verification rather than pre-computed here, since the bar's exact track-color interaction wasn't independently modeled with the same rigor as the text-pair values in §6 — flagged rather than silently presented as already-solved.
- **Correction made as a direct result of this self-critique**: §33.5's Dashboard bucket-dominance refinement (severity-ordered, not hardcoded) was added specifically because this step surfaced a real gap in the original proposal's simpler "Needs-attention is always dominant" framing.

---

## 35. Final Implementation Checklist

For the next phase, in order, gated by this document:

- [ ] Batch 1: badge-contrast tokens + 4 module-accent tokens, both themes, full 10-page × 2-theme screenshot re-shoot.
- [ ] Batch 2: list-region pattern proven on Tasks.
- [ ] Batch 3: DecisionFlow + Goals accent references.
- [ ] Batch 4: EcoLife (list-region + accent + 2 new icons + hero-numeral typography).
- [ ] Batch 5: BillSense (list-region + Money accent + category-bar color, with explicit before/after diff).
- [ ] Batch 6: Timeline (full rebuild + the paired `.catch()` fix), including product sign-off on the event-type→accent mapping if it differs from §19's proposed default.
- [ ] Batch 7: Dashboard + Family (bucket dominance/collapse — **pending product sign-off on §31.4's collapse-safety policy before this batch starts**), Warmth accent.
- [ ] Batch 8: Settings/Appearance theme relocation (independent, may run in parallel with any batch above).
- [ ] Full regression: 231-test backend suite, lint, build, the extended 8-viewport × 2-theme visual QA matrix (§25), full keyboard re-pass on every page whose markup changed.
- [ ] Confirm both BLOCKED items (§31.1-2) are logged as separate, explicitly-not-started engineering tickets, not silently forgotten.

**This document does not authorize starting any checklist item.** Per the governing brief: independent review of this specification is the required next step before implementation approval.

---

**STOP.** No application code, CSS, component, route, schema, or dependency was modified in this phase. `LIFE_ADMIN_VISUAL_REDESIGN_IMPLEMENTATION_SPEC.md` is the complete deliverable, together with the verification trail in §2-3 and the unchanged evidence base in `audit-evidence/visual-quality/`.
