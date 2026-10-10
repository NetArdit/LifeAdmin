# Plan / Deterministic Scheduler Reliability Phase — Report

Scope: `src/lib/scheduler.js`, `src/routes/ai.js` (`/plan/apply` only), `web/src/components/assistant/PlanTab.jsx`. No other product area was touched.

---

## 1. Root cause of each confirmed defect

**Defect 1 — type/contract crash.** `buildBusyBlocks()` returned an already-merged `Range[]` (numeric `{start,end}`), but its only caller (`placeActivities` → `freeWindows` → `mergeBlocks` → `toRanges`) still ran that output back through `toRanges()`, which called `hmToMinutes()` — a `String.split(':')` call — on a number. This crashed on the very first non-trivial plan. Root cause: no explicit contract existed for which functions produce/consume "HH:MM" strings ("Block") vs. numeric minutes-from-midnight ("Range"); `buildBusyBlocks` silently returned the wrong shape for its position in the pipeline.

**Defect 2 — minimum-block fragmentation.** The old placement loop computed `use = Math.min(avail, remaining)` with no floor comparison against the activity's `minBlockMinutes`, so a 20-minute leftover fragment of free time was placed as a 20-minute activity block even when the user asked for a 45-minute minimum. Root cause: "never place below the minimum" was never enforced as an invariant at a single point — it was left to be true by accident.

**Defect 3 — overnight window bug.** Busy blocks already supported wraparound (`toRanges` split `end <= start` into two same-day pieces), but activity *preference* windows (`earliest`/`latest`) were clamped as a single non-wrapping range: `earliestMin..latestMin` with no split. For `earliest:"22:00", latest:"06:00"`, this produced the range `[1320, 360)`, which is backwards/empty under `Math.max(w.start, ar.start)`/`Math.min(w.end, ar.end)` arithmetic — every window's usable overlap came out ≤ 0, so the scheduler reported "not enough free time" even on an empty day. Root cause: two different code paths implemented "does this span wrap past midnight" with two different (and inconsistent) answers.

**Defect 4 — timezone bug.** `/plan/apply` reconstructed each task's `start_time` via `new Date(`${date}T${block.start}:00`)` **on the server**, which resolves the "HH:MM" against the server process's own local timezone. On any deployment where the server's timezone differs from the user's, this persists a plausible-looking but wrong UTC instant. Root cause: the app has no persisted user-timezone setting, and the fix used the server as if it were a reliable source of the user's offset.

## 2. Existing data contracts (as found)

- `tasks.start_time` is a UTC ISO datetime string, always written from a JS `Date` computed **in the browser** for every other task-creation path (`web/src/components/tasks/TaskFormModal.jsx`: `new Date(`${fd.dueDate}T${fd.startTimeOnly}:00`).toISOString()`). This is the one place in the whole app the user's real timezone is available.
- `tasks.duration_minutes` is a plain integer.
- `buildBusyBlocks`/`placeActivities`/`freeWindows`/`mergeBlocks`/`hmToMinutes`/`minutesToHm`/`detectOverlaps` are used **only** by `src/routes/ai.js` — confirmed by a full-repo grep. No other route, service, or test relies on `scheduler.js`, so its internal contract could be corrected without any risk of breaking another feature.
- `db.tx()` is an existing transaction helper already used elsewhere (family-ownership transfer, password reset) — reused here, not invented.

## 3. Chosen canonical time representation

Two explicit shapes now exist in `scheduler.js`, documented in the module's own header comment:

- **Block** `{ label, start: "HH:MM", end: "HH:MM" }` — a clock-face description, input/output boundary format only. May wrap past midnight (`end <= start`).
- **Range** `{ label?, start: number, end: number }` — minutes-from-midnight, `0..1440`, **never wrapping**; a wrapping span is represented as two adjacent same-day Ranges. This is the only shape any arithmetic is ever performed in.

`toRanges()`/`splitOvernightRange()` are the sole parse boundary (Block → Range); `placeActivities()`'s final `.map()` is the sole serialize boundary (Range → Block). No function in the middle of the pipeline receives or returns a string it does arithmetic on.

## 4. Timezone contract

No persisted user-timezone column exists (checked the `users` table schema) and none was added — inventing one would have been a data-model change requiring its own product decision (out of scope; would have triggered a STOP). Instead, Plan-created tasks now follow the **exact same, already-shipped contract** every other task in the app uses: `PlanTab.jsx`'s `handleApply()` computes `new Date(`${date}T${block.start}:00`).toISOString()` **in the browser**, for every placed block, before POSTing to `/plan/apply`. The server (`/plan/apply`) now validates and stores that client-supplied `startISO`/`endISO` verbatim — it no longer reconstructs a `Date` from `date + "HH:MM"` itself.

**Limitation, documented rather than hidden:** the `/plan` GET handler's "existing commitments" busy-block builder still reads `t.start_time` back via `new Date(t.start_time).getHours()`, which returns the **server's** local hour when computing which times are already busy. This affects only the *quality of a suggestion* (it could treat an existing task as busy at the wrong clock hour when suggesting new placements) — it never persists anything and is a materially smaller, pre-existing issue than the four confirmed defects. Fixing it would require either the same client-side-computation pattern threaded through the read path, or a persisted timezone field; scoped out to avoid mid-phase expansion, flagged here as a known limitation, not silently dropped.

## 5. Overnight-window semantics

Centralized in `splitOvernightRange(startMin, endMin)`, used identically for busy blocks and activity preference windows:

- `end > start` (same-day): unchanged, single Range.
- `end <= start` (wraps past midnight): two Ranges, `[start, 1440)` and `[0, end)`.
- `start === end`: falls into the wrap case, producing `[start, 1440)` ∪ `[0, start)` = the entire day. **This is not a new rule invented for this phase** — it is the exact behavior an overnight busy block with `start === end` already had before this phase (e.g., `"23:00"–"23:00"` already blocked the whole day under the pre-existing `toRanges` logic); this phase only extended the *same* meaning to activity preference windows, which previously had no wraparound handling at all.

Verified against every case in the brief: `22:00→06:00`, `23:00→23:30`, `23:30→00:30`, `00:00→06:00`, `18:00→23:59`, `22:00→22:00` (whole day) — see scenarios G/G2/H/I in `test/scheduler.test.js`.

## 6. Minimum-duration semantics

Enforced at one single point: `takeSlice()`. A candidate slice is only returned if `avail >= minMinutes` **and** `use >= minMinutes` (`use = min(avail, remaining)`), so no caller can bypass the floor. If no window/allowed-range combination has room for at least the minimum, the activity's remaining time is reported as a warning ("not enough free time"), never as an undersized placement. Verified exact-fit, one-minute-short, multi-fragment, fragmented-availability, minimum-equals-window, and minimum-greater-than-every-fragment cases (scenarios F/F2/F3/F4/F5/F6).

## 7. Exact files changed

- `src/lib/scheduler.js` — rewritten: added `splitOvernightRange`, `DAY_MINUTES`/`toRanges` exports, fixed `buildBusyBlocks` return shape, replaced the placement loop with `takeSlice`.
- `src/routes/ai.js` — `/plan/apply` rewritten to validate all blocks before writing, wrap inserts in `db.tx()`, and store the client-supplied `startISO` verbatim instead of reconstructing a `Date` server-side.
- `web/src/components/assistant/PlanTab.jsx` — `handleApply()` rewritten to compute `startISO`/`endISO` client-side per block before applying, mirroring `TaskFormModal.jsx`.
- `test/scheduler.test.js` (new, 31 tests) and `test/plan-apply.test.js` (new, 8 tests).

No other file was modified.

## 8. Exact behavior changed

- Plan requests no longer crash (Defect 1).
- No placed activity block can ever be shorter than its requested `minBlockMinutes` (Defect 2) — previously-possible undersized fragments now correctly surface as a truthful "not enough free time" warning instead.
- Overnight preference windows (e.g. `22:00→06:00`) now correctly find and use free time instead of reporting zero availability (Defect 3).
- `/plan/apply` now stores the user's real intended local wall-clock time regardless of server timezone, and applies all-or-nothing per request (new atomicity; previously partial application was possible, though never observed in tests since inserts were already sequential and fast — this closes the theoretical gap).
- Everything else (default protected blocks, meal defaults, decompression buffer, priority ordering, `/plan` GET response shape, manual/non-Plan task creation) is unchanged.

## 9. Tests added

- `test/scheduler.test.js` — 31 unit tests with exact expected values: hmToMinutes/minutesToHm round-trip; `splitOvernightRange` (same-day/overnight/start===end, sums to `DAY_MINUTES`); `toRanges` refactor-equivalence; `buildBusyBlocks` Block[] contract; scenarios A (normal same-day), B (exact-fit), C (too-short window), D (multiple busy blocks), E/E2 (fragmented availability), F/F2/F3/F4/F5/F6 (minimum-duration preservation, 6 edge cases), G/G2 (overnight preference window), H (overnight busy block), I (midnight boundary, 3 sub-cases), J (impossible schedule), K (multiple activities by priority); an invariant sweep asserting no-overlap/no-busy-intrusion across a complex fixture; `freeWindows`/`mergeBlocks` adjacency and empty-availability tests.
- `test/plan-apply.test.js` — 8 HTTP-level integration tests with `aiLib.parseLifePlan` stubbed: M (timezone — two blocks with identical "HH:MM" but different client-computed `startISO` stored as genuinely different instants), M2 (5 malformed-input variants rejected 400, zero tasks created), M3 (atomicity — one bad block among valid ones applies none), auth-required + cross-user isolation, a documented pre-existing duplicate-apply limitation (unchanged, out of scope), a full real end-to-end pipeline test (stubbed AI → real scheduler → real `/plan/apply` → verified stored duration and wall-clock time), and N (regression — manual task creation via `startTime` unaffected).

## 10. Test results

- `test/scheduler.test.js`: 31/31 passing.
- `test/plan-apply.test.js`: 8/8 passing.
- Full backend suite: **223/223 passing** (up from 184 before this phase).
- Mutation testing: reintroduced each of the 4 original defects one at a time in a scratch script; the new test suite caught all 5 mutations tried (including a variant of Defect 2), then reverted.

## 11. Browser verification

Playwright (Edge, headless) against a real running server with a mock Anthropic HTTP endpoint (same pattern as the AI Recovery phase — not real-provider verification). All 16 required checks executed; **16/16 passed**:

1–2. Assistant → Plan tab opened. 3–4. Realistic request submitted, loading state observed. 5. Structured response rendered (days > 0). 6. Activities placed. 7. No overlapping blocks. 8. No block below its 30-minute requested minimum. 9. Times render as HH:MM. 10. "Add these to my tasks" succeeded with a confirmation toast (`Added 2 tasks`). 11. Created tasks visible via API immediately after apply. 12. Refreshed Tasks page shows the applied tasks. 13. Persisted task time, re-fetched after refresh, matches the exact browser-intended time (19:45) — direct proof the timezone fix works end-to-end, not just at the unit level. 14. An impossible schedule (720 min requested in a fully busy day) showed a truthful "not enough free time" warning with zero fabricated placements, no crash. 15. The overnight-window activity (22:00→06:00) from the first run placed correctly with no crash. 16. After a completed request, the form re-enabled for another attempt.

Zero console errors, zero page errors. Screenshots and the full script are stored in `audit-evidence/plan-scheduler/`.

## 12. Regression results

- Full backend suite: 223/223 passing.
- Lint: clean.
- Build: succeeds, 356.75 kB / 81.36 kB gzip (small expected increase from `PlanTab.jsx`'s new client-side ISO computation).
- Browser regression scripts re-run against the fixed code:

  | Suite | Result |
  |---|---|
  | tasks | 24 pass, 0 fail |
  | billsense | 62 pass, 0 fail |
  | family | 26 pass, 0 fail |
  | phase83-family | 26 pass, 0 fail |
  | ai-recovery-regression-smoke | 12 pass, 0 fail |
  | h15-recovery (account recovery) | 5 pass, 2 fail — see below |

  **h15-recovery investigation:** the 2 failures (`exactly one reset email generated` — mails=0, `reset token/link generated`) were traced to `verify-h15-recovery.mjs` hardcoding `const LOG = './server-h15reg.log'`, a stale filename left over from the Hardening 1.5 phase's own server session; this regression run's server was started writing to `server-reg.log` instead, so the script's mail-outbox parser was reading an empty/nonexistent file. This phase touched no auth, email, or mailer code. Confirmed as a test-script artifact, not a product regression, by re-running `test/account-recovery.test.js` directly (unrelated to the disposable browser script): **21/21 passing**, including the reset-token/email-generation assertions the browser script was trying to re-check. No product code was changed to "fix" this — per the brief's own instruction, the script was diagnosed as the wrong artifact to patch (it is a disposable per-run verification script, not part of the repo's test suite) and is reported here rather than silently rerun until green.

## 13. Performance impact

None expected or observed. The algorithmic complexity of scheduling is unchanged (still O(activities × windows) per day, tiny constants); the only new work is a fixed number of extra array splices in `takeSlice` (already implicit in the old, buggier in-place mutation it replaced) and one extra `Date` parse/validate pass over each `/plan/apply` request before writing, which is negligible against the DB writes it guards.

## 14. Security / data-integrity review

- No arbitrary date injection: `/plan/apply` now validates every block's `startISO`/`endISO` via `Date.parse` (`Number.isFinite`), rejects `end <= start`, and caps duration at `DAY_MINUTES` before any write.
- No malformed datetime persistence: invalid blocks are rejected with 400 before the transaction begins; nothing partial is ever written (verified by M2/M3).
- No authorization bypass: `/plan/apply` is still behind the existing auth middleware (401 for anonymous, verified in tests); every inserted task uses `req.user.id` as `owner_id`, unchanged from before this phase.
- No cross-user task creation / no family leakage: verified directly — a second user cannot see or fetch tasks created by the first user's plan apply.
- No unsafe parsing: `Date.parse`/`new Date()` on server-validated ISO strings only; no `eval`, no dynamic code execution.
- No XSS: task `title`/`notes` follow the exact same insert path and output-encoding as every other task in the app — untouched.
- No sensitive-data logging: no new logging was added.

## 15. Architecture review

- **Naming**: "Block" vs. "Range" are now explicit, documented types with a single conversion boundary each way — matches the brief's mandate to establish a canonical representation rather than patch symptoms.
- **Single responsibility**: `takeSlice` is the one and only place the minimum-duration invariant is enforced; `splitOvernightRange` is the one and only place wraparound is interpreted, shared by both busy blocks and preference windows (previously two separate, inconsistent implementations — now one).
- **No duplicate time-conversion logic**: `hmToMinutes`/`minutesToHm` remain the sole string↔minutes converters; nothing new was added that duplicates them.
- **No magic numbers**: `DAY_MINUTES` replaces implicit `1440`/`24*60` literals in the code this phase touched.
- **No timezone assumptions**: the server never uses its own local timezone for anything client-facing in the changed code; it either stores a client-supplied instant verbatim or (in the unrelated, documented-limitation read path) inherits a pre-existing, unfixed one.
- **No unnecessary abstraction**: no new classes, no new files beyond the two test files; `takeSlice` and `splitOvernightRange` are the only new functions, both directly load-bearing for a named defect.
- **No silent coercion**: `/plan/apply` throws `ValidationError` (400) rather than coercing bad input into a best-guess date.
- **Clear error semantics**: scheduler returns explicit `warnings` for genuinely unfit requests, distinct from a crash or a silently wrong placement.
- **Comments explain why, not what** — see the extensive contract-explaining header comments added to `scheduler.js` and `/plan/apply`.

## 16. Unresolved limitations

- The `/plan` GET handler's existing-commitments read path still interprets a stored task's `start_time` using the **server's** local hour (Section 4). Not fixed this phase — affects suggestion quality only, never persists, and fixing it correctly needs either the same client-side-computation pattern extended to the read path or a persisted timezone field.
- Duplicate `/plan/apply` calls with the same preview still create duplicate tasks (pre-existing behavior, unchanged, explicitly documented and tested rather than silently left in place).
- No persisted user-timezone setting exists anywhere in the app; the fix relies on the browser being the source of truth for "now," which is correct for a live user session but means any future server-side/background task creation (e.g. a cron-based recurring-task feature) would face the same open question this phase deliberately did not resolve with a new data-model field.

## 17. Product decisions still required

- Whether the app should eventually add a persisted user-timezone column (to support server-initiated task creation, e.g. recurring tasks or notifications, that can't rely on a live browser). Not needed for this phase's scope; flagged for a future phase's owner to decide, not decided here.
- Whether the `/plan` GET existing-commitments read-path timezone quirk (Section 4/16) is worth fixing on its own, given it is a suggestion-quality issue rather than a data-integrity one.

---

## CHALLENGE TO CURRENT PLAN

**Did we fix the root contract or patch symptoms?** The root contract — the Block/Range distinction and the single parse/serialize boundary — is what was fixed. All four confirmed defects are traceable to a version of that contract being violated (buildBusyBlocks returning the wrong shape; the minimum-duration check missing from the one arithmetic function; two divergent wraparound interpretations; a server-side reconstruction where a client-supplied value should have been trusted). No defect was fixed by adding a special-case branch around its symptom.

**Is the canonical time model correct?** Yes for this module's scope: Block for boundaries, Range for arithmetic, one parse function (`toRanges`/`splitOvernightRange`), one serialize point (`placeActivities`'s final map). It was deliberately *not* extended into `/plan/apply`'s persisted-datetime handling, which uses full ISO instants (`Date`), a different and already-correct representation for that boundary — extending "minutes-from-midnight" into datetime persistence would have been a wrong application of the same idea, not a stronger one.

**Did we accidentally introduce timezone assumptions?** No new ones. The one remaining timezone dependency (`/plan` GET's existing-commitments read) is pre-existing and was found, evaluated, and explicitly left alone with documentation, not newly introduced.

**Did we over-engineer overnight support?** No — `splitOvernightRange` is a single ~7-line function reused for both busy blocks and preference windows; it replaced a previously *inconsistent* pair of implementations rather than adding new surface area. The `allowed`-outer/`windows`-inner loop-order choice in `takeSlice` is a small, justified, well-documented decision, not a new subsystem.

**Did we preserve existing task semantics?** Yes — verified directly by test N (manual task creation via `startTime` unchanged) and the full 223/223 regression suite, none of which touches Plan-specific code paths.

**Are the tests strong enough to prevent regression?** 39 new tests with exact expected values (not "does not throw"), plus a direct mutation-testing pass that caught every reintroduced defect, plus real-browser end-to-end verification of the timezone fix specifically (item 13) rather than relying on unit tests alone. This is stronger evidence than typical for this codebase's other phases.

**Is any remaining issue actually outside this phase?** Yes, two: the `/plan` GET read-path timezone quirk (Section 4/16 — a suggestion-quality issue, not data corruption, explicitly scoped out to avoid expanding into a data-model change) and the pre-existing duplicate-apply behavior (explicitly named in the original brief as something to *inspect*, not necessarily fix — assessed as an existing, documented product risk rather than a bug this phase introduced or was asked to close).

---

## FINAL VERDICT: PASS WITH LIMITATIONS

All four confirmed defects are fixed at the contract level with passing exact-value tests, full regression, and real-browser end-to-end verification including the timezone fix specifically. The "PASS WITH LIMITATIONS" qualifier reflects two explicitly-scoped-out, pre-existing items documented in Sections 4, 16, and 17 (the `/plan` GET read-path timezone quirk, and duplicate-apply behavior) — neither is a regression introduced by this phase, and both were deliberately left alone per the brief's own STOP-condition guidance rather than expanding scope into a data-model change.

Do not start another phase after this report. STOP.
