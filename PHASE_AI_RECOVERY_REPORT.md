# Phase AI Recovery Report

Evidence files: [audit-evidence/ai-recovery/](audit-evidence/ai-recovery/) (isolated repro scripts `repro1.cjs`–`repro5.cjs`, browser logs, screenshots). New tests: [test/ai-structured-output.test.js](test/ai-structured-output.test.js). Labels used throughout: **VERIFIED** (observed this phase) · **NOT VERIFIED** · **BLOCKED**.

## 1. Executive Summary

The hypothesis was correct in principle but incomplete in practice, and reproduction found a **second, independent defect** the hypothesis didn't anticipate. Both are now fixed, confined to one file (`src/lib/ai.js`), with **zero dependency changes** — `zod@3.25.76` already ships the full zod-4 API at its `zod/v4` subpath, confirmed by direct inspection of the installed package. Local/mock verification is complete and strong: all 7 of the app's real AI schemas build correctly, round-trip through the real SDK against a local mock server, and the six previously-guaranteed-null AI features (chat, plan, weekly review, decision analysis, bill insights, eco tips, milestone suggestions) now correctly reach a provider and parse a structured response. **Real API verification was not executed — no legitimate API key is available in this environment.** Real-browser verification against the mock exposed a **third, pre-existing, unrelated bug** in the deterministic scheduler that blocks the Plan feature specifically; per this phase's explicit scope boundary, it was diagnosed and documented, **not fixed**.

## 2. Starting State

`package.json`: `"@anthropic-ai/sdk": "^0.70.0"`, `"zod": "^3.25.76"` (installed: SDK 0.70.1, zod 3.25.76). `src/lib/ai.js` imported `betaZodOutputFormat` from `@anthropic-ai/sdk/helpers/beta/zod` and `z` from root `zod`, and called it inside `callStructured` as `output_config: { effort, format: betaZodOutputFormat(schema) }`. Existing `test/ai.test.js` only verified the no-key "not configured" degrade path (still passes, untouched by this phase — that path never reaches the code changed here).

## 3. AI Architecture Trace

```
USER ACTION (Assistant Chat / Plan / Weekly Review)
    ↓
FRONTEND — web/src/components/assistant/{ChatTab,PlanTab,WeeklyReviewModal}.jsx
    responsibility: render, loading/error state, disable-while-sending
    ↓ fetch via public/js/api.js
API CLIENT — public/js/api.js
    responsibility: JSON fetch wrapper, throws ApiError on non-2xx
    ↓
EXPRESS AI ROUTE — src/routes/ai.js
    responsibility: HTTP/auth (requireAuth in server.js), input validation,
    building a SMALL feature-specific context from the DB, never AI logic itself
    ↓
AI SERVICE — src/lib/ai.js: parseLifePlan / assistantChat / analyzeDecision /
    billInsights / ecoTips / suggestMilestones / weeklyReview
    responsibility: prompts + the zod schema each capability expects, all
    delegating to the one shared callStructured()
    ↓
SCHEMA / STRUCTURED-OUTPUT BOUNDARY — src/lib/ai.js: zodOutputFormat() (new)
    responsibility: convert a zod schema to a provider-consumable JSON Schema
    + response validator — THE LAYER THIS PHASE FIXED
    ↓
ANTHROPIC SDK — node_modules/@anthropic-ai/sdk (client.beta.messages.parse)
    responsibility: build the HTTP request, send it, parse content back
    through output_format.parse()
    ↓
MODEL PROVIDER — real Anthropic API (NOT reached in this phase — no key) /
    local mock HTTP server (this phase's verification)
    ↓
VALIDATION — the same zod schema's .safeParse(), invoked by the SDK's own
    response parser via output_format.parse()
    ↓
RESPONSE — { ok, data } or { ok:false, error } — src/lib/ai.js: callStructured()
    responsibility: curated, non-leaking error mapping (friendlyAiError)
    ↓
FRONTEND RENDERING — same components as above
```

Responsibilities were already well-separated before this phase (route = HTTP/context, service = prompts/schemas, one shared `callStructured` = provider call + error curation, frontend = UI only). This phase's fix stays entirely inside the "Schema / structured-output boundary" layer; no other layer's responsibility changed.

## 4. Root Cause

**Two independent defects**, not one:

**A — schema/helper construction failure.** `betaZodOutputFormat` (`node_modules/@anthropic-ai/sdk/helpers/beta/zod.js`) calls `z.toJSONSchema(zodObject, ...)` where `z` is the SDK's **own** internal `require('zod')` — always the root export, regardless of what schema object is passed to the helper. Root `zod@3.25.76` has no `toJSONSchema` function at all (confirmed: `typeof z.toJSONSchema === 'undefined'`) — it was added in zod 4. The helper throws synchronously, **before any HTTP request is built**, with or without a real API key.

**B — request/response wiring failure, previously undiscoverable because A always threw first.** The app called `output_config: { effort, format: ... }`. The installed SDK's typed request surface has **no `output_config` field anywhere** (`grep` of every `.d.ts` file: zero matches) and **no `effort` field anywhere** in the whole SDK. The field the SDK actually reads is a top-level `output_format` (confirmed: `BetaJSONOutputFormat` in `resources/beta/messages/messages.d.ts:1753`, documented "Body param"). `create()` just spreads whatever params object it's given into the request body (so `output_config` would have been sent, harmlessly ignored by the real API), and — critically — the SDK's own response parser (`lib/beta-parser.js`, `parseBetaMessage`/`parseBetaOutputFormat`) reads **only `params.output_format`**, never `params.output_config.format`. **Proven directly against the real SDK with a non-throwing stub format object and a local mock server:** with the app's old shape, `response.parsed_output` is `null` every single time, even for a perfectly well-formed mocked response; with `output_format` used directly, it parses correctly (see `repro4.cjs`). This means even a working zod fix, on top of the old wiring, would have made every structured AI call fail with "AI returned a response that could not be parsed" forever.

Classification against the required distinctions: **A = schema/helper construction failure. B = a request/response-shape defect, not a network, provider, or validation failure** — proven with zero network calls involved in the assertion (A) and a fully mocked, controlled network call (B). Neither is a network failure, a provider failure, a structured-output *validation* failure, or an application-rendering failure — those layers were never reached before this phase, and are now separately verified working (§10).

## 5. Evidence Before the Fix

- `repro1.cjs`: direct call to the installed `betaZodOutputFormat` with a real app-shaped schema → `TypeError: z.toJSONSchema is not a function`, stack trace rooted inside the SDK's own helper file, zero network activity.
- `repro2.cjs`: even a schema built with `zod/v4`'s own constructors, passed into the *existing* `betaZodOutputFormat`, **still throws** — because the helper's `z` reference is fixed to its own internal root-zod import regardless of the schema passed in. This directly disproves the naive reading of the hypothesis ("just build schemas with zod/v4 and keep using the SDK's helper") — see §6.
- `repro3.cjs`: a schema built via the app's *existing* root-`zod` import is not recognized by `zod/v4`'s own `toJSONSchema` either (`Cannot read properties of undefined (reading 'def')`) — the two APIs' internal schema representations are not interchangeable. This is why the fix must build the schema itself with `zod/v4`, not merely change what converts it.
- `repro4.cjs`: isolates defect B against the real SDK and a local mock — old `output_config` shape → `parsed_output: null`; `output_format` → correctly parsed. Defect B is completely independent of zod version.
- `repro5.cjs`: the complete intended fix (zod/v4 schema construction + the SDK's own `transformJSONSchema` + `output_format`), run against **all 7 of the app's real schemas** verbatim, plus full SDK round-trips for the simplest and the most structurally complex schema (nested objects, `.nullable()`, `.enum()`), plus both malformed-JSON and schema-invalid-JSON provider responses — all pass before any code was edited.

## 6. Options Considered

**Option A — use the existing zod package's `zod/v4` subpath.** Verified directly: `require('zod/v4')` exists inside the already-installed `zod@3.25.76` package (its own `package.json` `exports` map publishes `"./v4"`), exposes the complete v4 API including `toJSONSchema`, and — critically — **only works when the schema itself is also built with `zod/v4`'s constructors** (repro2/repro3 rule out every other combination). Correctness: high, proven against all 7 real schemas plus edge cases. Dependency impact: **none** — same installed package, same version, no `package.json` change. Bundle/runtime impact: negligible (this file is server-only; not in the frontend bundle, confirmed by an unchanged `public/app/main.js` size). Security: no change to the trust boundary (server-side only, same as before). Migration risk: low — the app's 7 schemas use only `object/string/number/array/enum/.nullable()/.describe()/.min()/.max()/.int()/record(keyType,valueType)`, which is verified identical between the two APIs for this app's usage (the app's existing `.record(z.string(), ...)` two-argument call already matches v4's signature). Test burden: covered by the new mock-server test file. Rollback: trivial (revert one file). Existing schemas: **unaffected in shape or behavior** — same `.safeParse()` semantics, same validation rules, same data shapes in and out.

**Option B — upgrade the project to zod 4.** Would also work (the SDK's own peer range already allows `^4.0.0`), but changes a real dependency version across the whole `zod` import surface, for a defect that Option A closes without touching `package.json` at all. Rejected as unnecessarily large for this defect, per the phase's explicit preference for the smallest correct fix.

**Option C — change the Anthropic SDK version.** Unexplored and not pursued: no evidence surfaced that a different SDK version avoids needing zod 4's `toJSONSchema` (the beta helper's dependence on that function looks structural to how the SDK implements structured outputs in this API generation, not a version quirk), and this would be a second, larger variable to control for no proven benefit over Option A.

**Option D — replace the structured-output mechanism** (e.g., hand-rolled prompting + manual JSON parsing without the SDK's `output_format`/parse feature). Rejected: throws away a working, documented SDK feature and the schema-driven validation the app already relies on, for no reason once Option A is proven to work.

**Option E — introduce another validation/AI library.** Rejected outright: adds a dependency for a problem that needed none; violates the phase's dependency-discipline instruction with no offsetting benefit.

**Option A wins**: correctly resolves both root causes, verified against every real schema, zero dependency change, smallest possible code change (one file), fully reversible.

## 7. Architecture Decision

- **Provider boundary**: unchanged — `getClient()`/`isConfigured()` still the only code that touches the `Anthropic` client, still lazily constructed only when `ANTHROPIC_API_KEY` is set.
- **Zod boundary**: newly explicit and isolated in one function, `zodOutputFormat(schema)`, with a comment explaining *why* it exists (not what it does) — the zod-version mismatch, and why `zod/v4` is used instead of root `zod`. This is the only place in the codebase that imports `zod/v4`; every schema definition below it is unchanged code, unaware of the distinction.
- **Dependency strategy**: no new dependency, no version bump. The fix depends only on a subpath already published by the exact installed `zod` version, and a `transform-json-schema.js` helper already published by the exact installed SDK version's own `exports` map (`"./lib/*"`), reused rather than duplicated — this keeps a future SDK upgrade's JSON-Schema-normalization behavior automatically in sync, instead of drifting from a copy-pasted version.
- **Why no larger migration**: Option B (zod 4) remains available later with no new obstacle — the schemas already use only zod-4-compatible constructs — but nothing in this defect required it, and the phase's own quality bar (minimal, correct, no unnecessary abstraction) argues against it.
- **The `effort` parameter** was removed from `callStructured`'s signature and all 7 call sites, not kept as a silently-ignored accepted argument — it was never a real, functioning field (§4-B), and keeping a parameter that visibly does nothing is exactly the kind of misleading code this phase's own quality bar warns against. No replacement quality-tuning mechanism was invented; that would be a product decision outside this phase's scope.

## 8. Implementation

**Files modified: one application file, `src/lib/ai.js`.**
- Import change: `const { betaZodOutputFormat } = require('@anthropic-ai/sdk/helpers/beta/zod'); const { z } = require('zod');` → `const { transformJSONSchema } = require('@anthropic-ai/sdk/lib/transform-json-schema.js'); const { z } = require('zod/v4');`
- New function `zodOutputFormat(schema)` (replaces the broken SDK helper call site): builds `{ type: 'json_schema', schema: transformJSONSchema(z.toJSONSchema(schema, {reused:'ref'})), parse: (content) => schema.safeParse(...) or throw Anthropic.AnthropicError }`.
- `callStructured`: dropped the dead `effort` parameter; request now sends `output_format: zodOutputFormat(schema)` at the top level instead of the non-existent `output_config: { effort, format }`.
- All 7 call sites (`parseLifePlan`, `assistantChat`, `analyzeDecision`, `billInsights`, `ecoTips`, `suggestMilestones`, `weeklyReview`): removed the now-nonexistent `effort: 'low'|'medium'` argument. No other line in any of these functions changed — every schema definition, every prompt string, every `maxTokens` value is byte-identical to before.
- `friendlyAiError` and `getClient`/`isConfigured`/`NOT_CONFIGURED`: **untouched**.

No other file (route, frontend, schema consumer) needed a change — `src/routes/ai.js` and every frontend component already only depend on the `{ok, data|error}` contract `callStructured` returns, which is unchanged.

## 9. Code Quality Review

- **SRP**: `zodOutputFormat` has exactly one responsibility (zod schema → provider-consumable format + validator); `callStructured` still has exactly one responsibility (make the call, curate errors); routes remain thin (unchanged); React components remain UI-only (unchanged, not touched).
- **Dependency direction**: unchanged — route → service → provider/SDK boundary, no cycles introduced.
- **Naming**: `zodOutputFormat` mirrors the SDK's own (broken) `betaZodOutputFormat` name closely enough to be recognizable as "the fixed local replacement for that," while dropping "beta" since it isn't a beta-specific wrapper — it's this app's own boundary function. No vague names (`helper`, `temp`, `fix`) introduced.
- **Duplication**: the abstraction test was applied — `transformJSONSchema` is reused (not copied) because it is genuinely zod-independent, stable, and centralizing it avoids drift from a future SDK update; nothing else was abstracted, since each of the 7 schemas has exactly one call site.
- **Comments**: explain *why* (the zod-3-vs-4 mismatch, why `output_format` not `output_config`, why the deep SDK import is safe/supported) — not restating *what* the code obviously does.
- **Error handling**: `friendlyAiError`'s curated, status-code-based messages are unchanged and still apply to every failure path (confirmed in §10/§12/§13); provider response bodies and the API key are never included in any returned error (verified in §15); malformed provider JSON and schema-invalid JSON both fail through the *same* generic `AnthropicError` → `friendlyAiError` path as before, not a new one.

## 10. Local / Mock Verification

**Distinguishing "helper no longer crashes" from "the real AI feature works":** everything in this section is against a **local mock HTTP server standing in for the Anthropic API** (`test/ai-structured-output.test.js`, 9 tests, all pass) — it proves the code path is now structurally correct end-to-end, not that the real provider behaves this way.

1. SDK/helper initialization — VERIFIED (client constructs with a fake key, no throw).
2. Structured-output helper creation — VERIFIED for all 7 real schemas, no throw (was the original crash point).
3. Request construction — VERIFIED: request body contains `output_format` (not `output_config`), `x-api-key` header present, correct endpoint (`/v1/messages?beta=true`), the `parse` function is correctly dropped by JSON serialization before hitting the wire.
4. Network boundary reached — VERIFIED: the mock server receives exactly one request per call, for every one of the 7 capabilities.
5. Expected handling of a mocked valid response — VERIFIED: `response.parsed_output` matches exactly what the mock returned, for the simplest schema and the most structurally complex one (nested objects, arrays, `.nullable()`, `.enum()`, `.record()`).
6. Valid structured output → `{ok:true, data}` — VERIFIED for all 7 schemas.
7. Invalid structured output (valid JSON, wrong shape) → `{ok:false}` via the schema's own `.safeParse()` rejecting it, no throw escapes `callStructured` — VERIFIED.
8. Provider error (mock returns HTTP 529) → curated message, provider body never surfaced to the caller or to server logs — VERIFIED.
9. Malformed provider response (non-JSON text) → clean `{ok:false}`, no crash — VERIFIED.
10. Application-level error handling (`friendlyAiError`) still produces the same class of message as before this phase — VERIFIED (unchanged code path, exercised by the mock).
11. Unreachable provider / timeout → does not hang, resolves `{ok:false}` — VERIFIED (dead-port test, resolved well under 15s).
12. The 3 HTTP routes (`/api/ai/chat`, `/api/ai/weekly-review`, `/api/ai/plan`) exercise this same fixed path end to end and never leak the fake key in their JSON response — VERIFIED.

## 11. Real API Verification

**REAL API VERIFICATION: NOT EXECUTED — NO LEGITIMATE API KEY AVAILABLE.**

No `.env` file exists in this project, and no `ANTHROPIC_API_KEY` is present anywhere in the shell/session environment (checked directly). No key was requested from, or pasted by, the user, and none was fabricated. Everything reported as "verified" in §10, §12–§14 is against the local mock server, never the real provider.

**Exact safe configuration needed later:** set `ANTHROPIC_API_KEY` (a real key) as a server-side environment variable only (never in frontend code, never committed) — `.env.example` already documents this variable and needs no change for this fix. Once set, re-run `test/ai-structured-output.test.js`'s equivalent scenarios (or simply use the product) against the real endpoint; no code change is anticipated to be needed for that step based on the mock evidence, but it has not been observed.

## 12. Assistant Chat Verification

Real-browser run (`verify-ai-recovery.mjs`, Edge, real server process with a fake key + `ANTHROPIC_BASE_URL` pointed at a local mock — **not real-provider verification**):

REQUEST CREATED: YES · PROVIDER REACHED: YES (mock, 1 request) · PROVIDER RESPONSE: YES · VALIDATION PASSED: YES · UI RENDERED: YES (user + assistant bubbles, 2 suggestion pills) · ERROR HANDLING: PASS (mocked 529 → friendly toast "The AI service is temporarily unavailable...", no provider internals, no key) · SECURITY CHECK: PASS.

Also verified: loading state (send input/button disabled while in flight — a transient "Thinking…" bubble is correctly replaced by the real reply, not a duplicate); repeated-submission behavior (exactly one provider request per click, confirmed by counting mock hits — **no duplicate request was reproduced under tested conditions**); no API key in page HTML, the built JS bundle, any `/api/ai/*` response body, or the server's console output.

## 13. Plan Verification

REQUEST CREATED: YES · PROVIDER REACHED: YES (mock, 1 request) · PROVIDER RESPONSE: YES · VALIDATION PASSED: YES (`ai.parseLifePlan`'s zod schema — including the nested `activities[]`, `.nullable()` fields, and `.enum()` days — validated the mocked response correctly, matching §10's direct schema-level proof) · **UI RENDERED: NO — the route returns HTTP 500 downstream of a successful, validated AI response** · ERROR HANDLING: PASS (the 500 surfaces as a curated field-level error, not a raw crash, when reproduced through the mock-error path) · SECURITY CHECK: PASS (no leakage observed in the failing request either).

**This is not the AI/Zod defect.** Root cause, found via direct reproduction (`curl` against the real server + a minimal mock, full stack trace captured): `src/lib/scheduler.js`'s `buildBusyBlocks()` already returns **merged numeric-minute ranges** (it calls its own internal `mergeBlocks()`/`toRanges()` before returning), but `src/routes/ai.js`'s `/plan` handler passes that numeric-range result into `placeActivities()`, which **re-runs `freeWindows()` → `mergeBlocks()` → `toRanges()` on it a second time**, calling `hmToMinutes(b.start)` on a value that is now a number, not an `"HH:MM"` string — `TypeError: hm.split is not a function`, at `scheduler.js:13`, reproduced with the exact server stack trace in `audit-evidence/ai-recovery/`. This is unconditional: `buildBusyBlocks()` always includes at least the hardcoded `Sleep` protected block, so **any** call to `placeActivities` with a non-trivial `busy` list crashes — this is not an edge case, it affects essentially every realistic Plan request. `grep` of `test/` confirms **zero existing test coverage of `scheduler.js` or this route's scheduling logic**, and the route could never have reached this code before this phase, because `ai.parseLifePlan` always threw first (defect A). **This bug has existed, untested and unreachable, since the scheduler code was written — this phase is the first time it has ever executed.**

Per this phase's explicit scope boundary ("AI execution code only where directly required by the defect... do not silently fix unrelated problems... if you discover an unrelated issue, document it and STOP if it is important enough to require code changes"), **this was not fixed.** It is a real, pre-existing, deterministic-scheduler bug, unrelated to zod/SDK compatibility, and is reported here as required rather than repaired.

**Correct, unambiguous statement:** the AI/Zod defect for the Plan feature is closed — the provider is reached and the structured plan is correctly parsed and validated. The Plan feature as a whole remains **BLOCKED** by this separate, newly-discovered, pre-existing scheduler bug.

## 14. Weekly Review Verification

REQUEST CREATED: YES · PROVIDER REACHED: YES (mock, 1 request) · PROVIDER RESPONSE: YES · VALIDATION PASSED: YES · UI RENDERED: YES (headline, highlights, forgetting-checklist all rendered from the mocked structured response) · ERROR HANDLING: PASS (mocked provider failure renders inline in the modal as a field error, not a crash) · SECURITY CHECK: PASS. Modal lifecycle also verified: opens on click, closes on Escape, reopens cleanly with a fresh request (no stale state).

## 15. Security Verification

- API key exists only server-side: VERIFIED (never read by any frontend file; `zod`/SDK imports touched only `src/lib/ai.js`).
- Frontend bundle contains no API key: VERIFIED (rebuilt bundle, identical size to before this phase, 356.42 kB; grepped for the fake test key — absent).
- Browser network requests do not contain the API key: VERIFIED (checked every `/api/ai/*` response body in the browser run — absent; the key only ever appears in the server→mock request, never in any client-visible surface).
- Server logs do not expose the key: VERIFIED (captured server stdout/stderr across a provider-error scenario — absent).
- Error responses do not expose the key: VERIFIED.
- Provider errors are sanitized: VERIFIED (the mock's deliberately-planted `PROVIDER-INTERNAL-DETAIL` string never appeared in any response body or log line, in both the mock-server unit tests and the browser run — same `friendlyAiError` curation as before this phase, unchanged).
- User-controlled AI inputs are handled safely: unchanged — routes still build small, feature-specific context objects (unchanged code); this phase did not touch input handling.
- AI output is not inserted into the DOM unsafely: unchanged — output rendering is unchanged React JSX (text nodes), not touched by this phase; no new `innerHTML` or equivalent sink was introduced (confirmed: this phase's only application-code file, `src/lib/ai.js`, is backend-only and contains no DOM APIs).
- Existing zod validation remains active: VERIFIED — `.safeParse()` is still what accepts/rejects every provider response (§10 item 7); the schemas' actual validation rules (min/max/int/enum/etc.) are byte-identical to before.
- No authorization boundary was weakened: VERIFIED — `requireAuth` middleware on `/api/ai/*` is untouched; a fresh regression check confirms unauthenticated requests still receive 401 (unchanged, covered by the existing `test/ai.test.js`, still passing).
- **Prompt-injection hardening is explicitly out of scope for this phase and was not addressed or assessed further than the pre-existing, previously-documented limitation** (unchanged system-prompt instructions; no technical enforcement existed before this phase and none was added).

## 16. Cost / Operational Verification

- No new dependency: VERIFIED (`package.json`/`package-lock.json` unmodified; `zod/v4` is a subpath of the already-installed package).
- No new paid service, no new infrastructure, no provider change: VERIFIED.
- No accidental retry loop: VERIFIED — the mock-server test explicitly counted requests per call (always exactly 1); the browser's duplicate-submission test also counted exactly 1 provider request per click.
- No unexpected increase in AI requests, no polling change, no hidden background requests: VERIFIED — `callStructured` is invoked only from the same explicit user actions as before (send message, submit plan text, open weekly review); nothing new calls it.
- Flows exercised in real (mock) testing this phase: Assistant Chat (~4 requests: success, duplicate-guard, error), Plan (~2 requests: success attempt exposing the scheduler bug, error), Weekly Review (~2 requests: success, error), plus 7 direct unit-level calls (one per schema) and 3 HTTP-route-level calls — all against the local mock, **zero requests to the real provider** (none possible without a key). No token/cost figures are reported, as no real provider usage occurred.

## 17. Regression Testing

- Backend tests: **184/184** (was 175 before this phase; +9 new `test/ai-structured-output.test.js` tests; the existing `test/ai.test.js` no-key degrade tests still pass unchanged).
- Lint: clean.
- Production build: succeeds; `public/app/main.js` **356.42 kB / 81.25 kB gzip — byte-size identical to the Hardening 1.5 baseline** (frontend was not touched; rebuilt as a safety check only).
- AI-specific tests: `test/ai.test.js` (no-key path, unchanged, passing) + new `test/ai-structured-output.test.js` (9/9, §10).
- Assistant browser tests: `verify-ai-recovery.mjs`, **14/15** (the one documented failure is §13's separate scheduler bug, not a test defect and not this phase's defect).
- Cross-page regression smoke (Dashboard, Tasks, Family, BillSense, Timeline, Goals, EcoLife, DecisionFlow, Assistant, Settings — every page loads, zero console errors, zero page errors, correct "AI unavailable" state shown with no key configured): **12/12** (`verify-ai-recovery-regression-smoke.mjs`). This was a proportionate sanity pass, not a full re-verification of each page's feature set, because this phase touched exactly one backend file with no shared-component, route-contract, or schema surface used by those pages.
- **Test-script corrections made (not product defects), reported per instructions:** (1) the browser script's first chat-send assertion raced against a transient "Thinking…" placeholder that shares the same CSS selector as the real reply bubble — fixed by waiting for the send button to re-enable before reading the bubble text; (2) the Plan button's actual label is "Build my plan," not the placeholder text "Get my plan" the script initially used (the click still worked via a fallback selector, but the assertion text was corrected for clarity); (3) the smoke script's "AI unavailable" banner text-match used wording from an unrelated part of the codebase instead of the Assistant page's actual copy ("...need an ANTHROPIC_API_KEY set on the server...") — corrected. None of these were product defects; all were fixed on the test-script side only.

## 18. Change Inventory

FILES CREATED
- `test/ai-structured-output.test.js`

FILES MODIFIED
- `src/lib/ai.js`
- `public/app/main.js` (rebuilt as a safety check; byte-size identical, no frontend source changed)

FILES DELETED
- None.

DEPENDENCIES ADDED
- None.

DEPENDENCIES REMOVED
- None.

DEPENDENCY VERSIONS CHANGED
- None. (`package.json`, `package-lock.json`, `web/package.json` all unmodified.)

DATABASE/SCHEMA CHANGES
- None.

CONFIGURATION CHANGES
- None. (`.env.example` already documented `ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL`; no new variable was introduced by this fix — `ANTHROPIC_BASE_URL` is an SDK-native override used only by this phase's own test/verification scripts, not by application code.)

## 19. Remaining Limitations

- **Real provider behavior is unverified** — everything in §10–§14 is against a local mock; token usage, latency, actual model output quality/shape adherence, and any provider-side quirks (rate limits, content policy responses, etc.) with a real key remain unobserved.
- **The Plan feature is blocked** by the separate, pre-existing scheduler bug documented in §13 — not fixed in this phase, by design.
- **Prompt-injection hardening remains exactly as limited as before this phase** — not assessed or changed further.
- Only Edge (via Playwright) was used for browser verification, consistent with this project's established pattern; no other browser/device coverage was added.
- The mock server used here approximates the real Anthropic response envelope closely (matching the real SDK's request/response contract observed directly from its source) but is not the real API; subtle real-world response variations are not covered.

## 20. Production Implications

To use AI in production: set a real `ANTHROPIC_API_KEY` server-side (never in frontend code, never committed — `.env.example` already documents this). Based on the mock evidence, the structured-output path should now work with a real key exactly as it does against the mock, but this is **NOT VERIFIED** and must be confirmed with a real key before being relied upon. The Plan feature specifically should be expected to fail (HTTP 500) until the scheduler bug in §13 is separately fixed — Chat and Weekly Review are not affected by that bug.

## 21. Final Verdict

**PASS WITH LIMITATIONS**

- The AI/Zod SDK compatibility defect (and the independently-discovered request-wiring defect) that made every AI feature non-functional is fixed, isolated to one file, with no dependency changes — **VERIFIED locally against a mock provider** for all 7 real schemas, all 3 AI-facing user journeys' request/response/error paths, and security properties.
- **Real API verification remains BLOCKED** — no legitimate key is available in this environment.
- Chat and Weekly Review are verified working end-to-end against the mock, including their error paths.
- Plan's AI layer is verified fixed, but the feature as a whole is **BLOCKED** by a separate, pre-existing, newly-discovered scheduler bug, correctly left unfixed per this phase's scope boundary and reported in full.

This is not claimed as "AI is fixed and working" — it is: **the AI/Zod compatibility defect is fixed and verified locally; real-provider verification is blocked on credentials; the Plan feature has a separate, pre-existing bug that this phase exposed but did not fix.**

---

## 22. Next-Phase Reassessment

Independently re-evaluated after completing this phase (not a repeat of the pre-existing `NEXT_PHASE_RECOMMENDATION.md`), against this phase's own new evidence — chiefly, that Plan is now blocked by a freshly-discovered, pre-existing, 100%-reproducible scheduler bug (§13).

**A. Accessibility + Chat Pagination + Session-Expiry UX.** User impact: high — these are things a real household hits daily, unchanged since the final audit. Severity: real, previously fully diagnosed (axe-core Level-A violations; `chat.js:35`'s oldest-200 cap; the raw "Not authenticated." shell state). Release impact: blocks a trustworthy daily-use experience, not a security exploit. Technical dependency: none external. Security/privacy: none. Cost: none. Complexity: medium (accessibility is the larger piece). Combinable: yes, internally (all three already analyzed as one phase in the standing recommendation). Deferrable: yes, safely — nothing about this phase's work changes that.

**B. Production Readiness** (real email, HTTPS, proxy, persistent storage, backups, deployment validation). User impact: indirect but foundational — nothing ships publicly without it. Severity: real (production email has been "NOT VERIFIED" since Phase 8.2). Release impact: blocking for any public deployment. Technical dependency: **external** — needs a hosting/domain decision only the user/ChatGPT can make; this environment cannot self-serve it, same as before this phase. Security/privacy: closes real, if low-severity, analysis-only gaps (headers, rate-limit topology documentation). Cost: existing choices (Resend) likely sufficient; unavoidable baseline hosting cost regardless of engineering work. Complexity: small-to-medium, externally gated. Combinable: yes, internally (headers/proxy only make sense once a real origin exists). Deferrable: no longer indefinitely — it is the single most overdue "NOT VERIFIED" label in the project's history at this point.

**C. Remaining privacy/data-lifecycle issues.** The major privacy/authorization work (former-member access, task visibility, notification filtering, invite-code lifecycle) was already closed in Hardening 1/1.5, re-confirmed unaffected by this phase (regression: 184/184, including all Hardening 1/1.5 tests). What remains — chat/bill notification family-attribution — was explicitly, deliberately deferred in Hardening 1.5 with reasoning already on record, not newly discovered here. User impact: low (a narrow, already-documented edge case). Severity: low. Release impact: minor. Nothing in this phase changes that assessment; it does not need to move up the queue.

**D. AI follow-up improvements — real verification exposed additional issues, so this candidate is now concretely populated, not hypothetical.** Two items: (1) real-key verification of everything proven against the mock in this phase (§11, still BLOCKED on credentials) — small, cheap, but externally gated exactly like Option B; (2) the scheduler bug (§13) — small, well-understood, well-isolated (likely a one-line fix to stop double-merging an already-numeric range), zero relationship to AI/Zod, currently blocks 100% of realistic Plan requests. This is a **direct, concrete finding from this phase**, not a repeat of the standing plan.

**E. Another phase — the scheduler bug fix, as its own small, explicitly-scoped item.** Given it blocks an entire journey (Plan) unconditionally and is now fully diagnosed (§13) with a clear, narrow, already-identified fix location (`placeActivities`/`buildBusyBlocks`'s duplicate-merge in `src/lib/scheduler.js`), it is cheap enough to fold into whichever of B/D happens next, but should not be silently forgotten — it was out of scope for *this* phase specifically because it is unrelated to AI/Zod, not because it is unimportant.

## 23. CHALLENGE TO THE CURRENT CHATGPT PLAN

**What I agree with:** the standing `NEXT_PHASE_RECOMMENDATION.md` correctly separated accessibility/chat/session-UX (Option A there) from production readiness (Option C there) from the AI fix (Option B there) as three independently-gated tracks, rather than one sequential "Hardening 2." That structure holds up after this phase and does not need to change.

**What I disagree with / what evidence changed my view:** that document treated AI recovery as a clean, isolated, cheap fix whose only open question was "does a real key exist." This phase proved that assumption **incomplete**, not wrong: the AI/Zod layer itself was cheap and is now closed (§4–§10), but reproducing it end-to-end (not just inspecting the zod question) surfaced a **second, unrelated, pre-existing bug** (§13) that the standing plan had no way to know about, because it could never have been observed before this phase — `ai.parseLifePlan` always crashed before the scheduler code ever ran, for the entire life of the project until this phase.

**What I would change:** add the scheduler fix (§13) as its own named, small, explicitly-scoped item to whatever is approved next — it should not be silently bundled into "AI is now done" (it isn't, for Plan specifically) nor silently dropped because it wasn't anticipated.

**Why:** it is a concrete, 100%-reproducible defect blocking one of the three journeys this very phase was asked to verify, with a captured stack trace and a clear, narrow root cause already identified — the cheapest possible time to schedule its fix is now, while the diagnosis is fresh, rather than rediscovering it later during real-key verification.

**What ChatGPT should reconsider:** whether "D" (AI follow-up) in §22 should be split into two independently-approvable pieces — (i) real-key verification (external dependency, small) and (ii) the scheduler fix (no external dependency, small, could start immediately) — since (ii) has no gating dependency at all and could proceed before a key is ever obtained, while (i) cannot.

**Evidence:** `audit-evidence/ai-recovery/` (server stack trace, mock-based full-cycle proof of the AI-layer fix); §13 of this report; `grep` confirming zero pre-existing test coverage of `src/lib/scheduler.js`.

---

## CHALLENGE TO THE FIX HYPOTHESIS (Gate A reassessment of the approved hypothesis itself)

**What I agree with:** the hypothesis that zod's `zod/v4` subpath could resolve this without a dependency change was directionally correct, and turned out to be exactly right once fully worked out — Option A required zero dependency change, confirmed by direct reproduction, not assumption.

**What I disagree with / found incomplete:** the hypothesis as stated ("this may allow the existing AI architecture to work") implicitly assumed the *only* problem was the zod version mismatch. Reproduction proved that assumption incomplete in two ways: (1) simply passing a `zod/v4`-built schema into the *existing* SDK helper still throws (`repro2.cjs`) — the fix required writing a small local replacement, not just changing an import; (2) even with a working schema-conversion layer, the app's `output_config: { effort, ... }` wiring is read by nothing in this SDK version — `response.parsed_output` would have stayed `null` forever, a completely separate defect that could only be discovered by reproducing the *full* request/response cycle against a mock, not by inspecting the zod compatibility question in isolation (`repro4.cjs`).

**What I would change:** treat "AI recovery" as verified only once the *response* comes back parsed, not once the *schema* stops throwing — the two are easy to conflate and the second one was silently broken in a way that would have re-produced the exact same user-visible symptom ("AI returned a response that could not be parsed") that the original bug produced, making it very easy to believe the fix was complete when it was not.

**Why:** without `repro4.cjs`'s mock-based full-cycle test, a fix that only addressed the zod throw would have shipped, the app would have looked "fixed" in casual testing (no more crash), and every real AI call would still have silently failed with a generic, misleading error message — indistinguishable from the original bug's user-visible symptom.

**What ChatGPT should reconsider:** when scoping the next AI-related work (real-key verification, per §19/§20), it should explicitly account for the newly-discovered scheduler bug (§13) as a **separate, pre-existing item**, not fold it into "AI compatibility" — it needs its own small, explicitly-scoped fix (likely a one-line correction to stop double-merging already-numeric ranges in `placeActivities`), and should not be assumed closed by this phase just because "AI" is now working. I did not fix it here because it falls outside this phase's explicit boundary, not because it is unimportant — it currently blocks 100% of realistic Plan requests once a real key is configured.

**Evidence supporting this:** `repro1.cjs`–`repro5.cjs` and `test/ai-structured-output.test.js` for the two AI-layer defects; the captured server stack trace in `audit-evidence/ai-recovery/` and the zero-test-coverage finding (`grep` of `test/`) for the scheduler defect.
