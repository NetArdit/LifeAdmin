# Next-Phase Recommendation — Post Hardening 1.5

**Research only. No application code, schema, dependencies or configuration were modified.** Every claim below was re-checked against the current repository in this session (grep/read only); baseline re-confirmed: 175/175 backend tests, lint clean, no `.env`, no security-header middleware, no `/health` route, no `trust proxy`.

---

## 1. Current project state

Authorization and privacy are now sound where they matter most: cross-family bill/reaction injection is closed, family-owner integrity is closed, invite codes are strong/owner-only/throttled/migrated, and — the largest single change — task access now runs through one canonical, NULL-safe, mutation-tested predicate (`src/lib/taskAccess.js`) that closed former-member access, the private-task re-share bug, F-10, and historical notification leakage. 175/175 backend tests, lint clean, build OK, zero dependency or schema changes across both hardening phases.

What is **not** true yet, re-verified today: no security headers exist anywhere in `server.js`; there is no `/health` endpoint; `trust proxy` is unset; `notif_prefs` and `ai_enabled` are stored but never read by any route; `reminder_minutes_before` is stored and returned but nothing ever acts on it; chat still hard-caps at `LIMIT 200` oldest-first; `.env.example` documents Resend but no credentials exist and no real send has ever occurred; the ~117 KB of legacy `public/js/pages/*.js` (everything but `auth.js`) is still shipped and unreachable. The AI/Zod defect is real and, as investigated below, is **not a version-pinning nuance — it is a complete, currently-shipping breakage of every AI feature**, including with a valid key.

## 2. What Hardening 1.5 changed strategically

It replaced four separate, drifting copies of "who can see a task" with one module used by every read and write path, including settings export and the AI context builder. That is an architectural win beyond its five closed findings: the next time a new task-linked surface is added, it inherits the rule instead of re-introducing the bug. It also established a pattern this project should keep using — Gate A research with executable probes and a differential prototype before writing product code, then a mutation check proving the tests actually catch the defects (9/9 caught this round). That pattern is reusable for the next phase's own predicate work (see §7, Option A).

## 3. Remaining major risks (re-verified, not re-audited)

| Risk | Evidence (this session) | Severity if shipped publicly today |
|---|---|---|
| No AI feature works with a real key | `z.toJSONSchema is not a function`; SDK's own helper calls root `zod`, which is 3.25 and has no `toJSONSchema` at root | Not a security risk; a **complete functional failure** of an advertised pillar |
| No security headers | grep of `server.js`/`src` for CSP/X-Frame/HSTS: none | Defense-in-depth gap, not a demonstrated exploit (Hardening 1.5 already closed the content-exposure paths headers would have mitigated) |
| Join/signup/AI throttling gaps | unchanged since final audit | Low now that content-level authorization is fixed; still lets someone burn CPU/bcrypt cycles |
| No persistent-storage/backup/HTTPS story | `.env.example`, `server.js` unchanged | Blocks *any* real deployment, not a code defect |
| Production email unverified | `.env.example` has no real `RESEND_API_KEY`; no send has occurred | Blocks account recovery in production |
| Two settings lie to the user | `notif_prefs`/`ai_enabled` stored, never read (grep confirms) | Trust/UX defect, not security |
| Chat freezes at 200 messages | `chat.js:35` unchanged | Functional defect in the one real-time feature the product has |
| Accessibility (Level A failures) | not touched since final audit | Blocks users who need keyboard/screen-reader access; not addressed by anything since |

**The single largest remaining obstacle to a credible release is not any one security item — it is that the product cannot be deployed at all yet** (no email, no proxy/HTTPS decision, no persistence plan) **and one of its three advertised pillars (AI) is completely non-functional the moment someone supplies a key.** Everything else in the list is real but secondary to those two facts.

## 4. Remaining product gaps (by journey, per Part 5)

| Journey | Status |
|---|---|
| Onboarding (register → login → dashboard → family) | **acceptable** — solid, re-verified across every hardening phase |
| Daily management (dashboard → tasks → complete/postpone/comment → family) | **acceptable**, with **poor UX**: keyboard-inoperable rows (unchanged, deferred by design) |
| Family lifecycle (create → invite → join → members → remove → leave → transfer) | **acceptable and now the best-tested area of the product** |
| Financial (bills → create/edit/pay → notifications) | **acceptable**; validation gaps (F-14) remain **deferred**, not blocking |
| Planning (goals/timeline/ecolife/decisionflow) | **acceptable**; EcoLife still product-isolated (not a bug) |
| **AI (assistant/chat/plan/weekly review)** | **broken** the instant a key is configured; **misleading** — the UI, docs and `.env.example` all present this as "just add a key" when it will not work |
| Account (password/reset/logout/delete) | **acceptable** locally; reset email **unverified** in any real deployment |

## 5. Old Hardening 2 plan — what still makes sense

Every item on it is a real, still-open finding (re-confirmed above), not stale. Accessibility, chat pagination, session-expiry UX, security headers and rate limits all remain legitimate work with no evidence they were addressed as side effects of Hardening 1/1.5.

## 6. Old Hardening 2 plan — what should change

**CHALLENGE TO THE CURRENT CHATGPT PLAN**

- **What ChatGPT previously assumed:** that the natural next step is more platform hardening (accessibility → chat pagination → session UX → headers → rate limits), in roughly that order, as a single "Hardening 2."
- **What I now think is incomplete:** that plan treats every remaining item as comparable in kind. They are not. Accessibility, chat pagination and session-expiry UX are **product-facing defects a real user hits every day**. Security headers and rate limits are **infrastructure hardening with no demonstrated exploit today** (Hardening 1.5 closed the actual content-exposure paths). And the AI defect and deployment readiness are **not hardening items at all** — one is a complete feature outage, the other is "this product cannot go live yet regardless of how hardened it is." Bundling all five into one phase mixes three different kinds of risk and delays the two that most affect whether real users get a working, honest product.
- **Evidence that changed my view:** direct SDK reproduction — `z.toJSONSchema` is undefined on the root `zod` export with the pinned version, confirmed by calling the SDK's own `betaZodOutputFormat` directly, with zero HTTP requests reaching even a mock provider. That means **every AI code path in this repository has been non-functional with a real key since it was written**, not just "unverified." No prior report stated this plainly; Phase 8.3 only recorded "not verified" for production *email*, and Phase 7 only recorded prompt-injection as a limitation — the actual breakage was never demonstrated until this session's `sdkdbg.cjs`.
- **What I would do differently:** split "Hardening 2" into two independently shippable tracks rather than one sequential list — (1) a small, fast **AI compatibility fix + Assistant re-validation**, because it is cheap, isolated, and turns a false advertising problem into a real one; and (2) **accessibility + chat pagination + session-expiry UX** as one combined phase, because — as detailed in §8 — they touch the same shell/session/chat-polling code paths and should be verified together, not three times. Security headers and rate limiting should move to a **deployment-readiness phase** alongside email/HTTPS/persistence, because none of them matter until there is an actual place to deploy to, and testing them in isolation (as Hardening 2 implied) would produce headers nobody can verify against a real origin.
- **What ChatGPT should reconsider:** whether "Hardening 2" as originally scoped is still the right container, or whether the AI defect and deployment-readiness work deserve to be pulled out and sequenced first, given they are the two items closest to "the product doesn't do what it says" rather than "the product could be more hardened."

## 7. Independently proposed next-phase options

### Option A — Core UX reliability: accessibility + chat pagination + session-expiry UX
**Scope:** keyboard operability of task/bill/decision rows and the Family tab strip, form label association, icon-button names (all previously catalogued, unchanged); chat pagination fix (serve/poll newest messages, not oldest-200); central handling of a 401 mid-session (redirect to sign-in instead of the raw "Not authenticated." shell). **Why now:** these are the three items a real household hits within its first week of daily use, and all three are already fully diagnosed with evidence, not new investigation. **Evidence:** final audit's axe-core run (Level A violations on core pages) + this session's re-confirmation that `chat.js:35` and the shell's notification-poll `catch {}` are unchanged. **User value:** high — fixes things people actually notice. **Security implications:** none (pure UX/reliability). **Architectural implications:** touches the shared `app.js` routing/auth-check path (session-expiry) and the shared modal/tab components (accessibility) — both are "fix once, benefits everywhere" the way `taskAccess.js` was. **Size:** medium (accessibility is the biggest single piece; chat pagination and session UX are each small). **Testing complexity:** medium — needs axe-core plus real keyboard-only browser runs (the pattern already used in every phase so far). **Dependencies:** none. **Risks:** accessibility fixes touching shared CSS/JS can regress other pages if not run through the full regression suite (as every prior phase has done). **Closes:** the three most-cited "poor UX" findings across every audit since the final whole-product audit. **Leaves open:** AI, deployment, headers, rate limits, notification/AI-preference enforcement.

### Option B — AI compatibility fix + Assistant re-validation
**Scope:** resolve the zod/SDK mismatch (see §9 for the recommended approach), then re-run every AI-dependent flow (Assistant chat, plan/apply, weekly review, DecisionFlow analyze, BillSense insights, EcoLife tips, milestone suggestions) against a **real** Anthropic key for the first time in this project's history. **Why now:** it is the cheapest possible fix (one file, no schema, likely no or one dependency line) that converts a totally broken advertised feature into a working one, and it is currently blocking any honest claim about the product's AI pillar. **Evidence:** `sdkdbg.cjs` — direct call to the installed SDK throws before any network request. **User value:** very high *if* a household actually wants AI features; zero impact on households that don't (the app already degrades gracefully without a key — confirmed unchanged). **Security implications:** must re-verify prompt content still excludes private/former-member data now that real model output is possible (Hardening 1.5's context-privacy tests used a stub; this is the first chance to confirm it end-to-end against a live provider, which is more evidence, not more risk). **Architectural implications:** none — isolated to `src/lib/ai.js`'s schema layer. **Size:** small. **Testing complexity:** needs a **real API key** for true verification (not available in this environment) — that is the one hard dependency. **Dependencies:** requires ChatGPT/the user to supply or approve obtaining a key; requires a decision among the four fix approaches (§9). **Risks:** a zod major-version bump, if chosen, could subtly change validation error shapes; mitigated by keeping schemas simple (already are) and testing against the mock provider first, real provider second. **Closes:** the single most misleading gap in the product today. **Leaves open:** everything else in this report; does not touch security or deployment posture at all.

### Option C — Deployment readiness: email, headers, rate-limit topology, proxy/HTTPS, persistence
**Scope:** obtain and configure a real Resend sender + domain, run the actual real-inbox test that has never happened; add a minimal security-header middleware; decide and document `trust proxy` for the real hosting target; decide persistent-storage/backup approach for the SQLite file; add signup/AI-endpoint rate limits reusing the existing in-memory limiter. **Why now:** none of the security or content work done in Hardening 1/1.5 matters to a real user until the product can actually be deployed somewhere with a real domain, real email and a real session-cookie story. **Evidence:** `.env.example` still has no real key; `server.js` has no header middleware, no `/health`, no `trust proxy` (all re-confirmed this session). **User value:** indirect but foundational — nothing else ships without this. **Security implications:** closes the last analysis-only items from the final audit (F-06, F-07 partially, F-31, F-36). **Architectural implications:** minimal code change; mostly configuration, infrastructure decisions and one real-inbox test. **Size:** small-to-medium, but **externally gated** (needs a domain, a hosting decision, and credentials that only the user/ChatGPT can provide — not something this environment can self-serve). **Testing complexity:** the real-inbox test is the one piece of evidence no prior phase has ever produced; everything else is configuration verification. **Dependencies:** a hosting/domain decision must come first, which is a product decision, not an engineering one. **Risks:** guessing at a topology (proxy vs. direct) before the real one is chosen risks configuring the wrong thing. **Closes:** "production email: not verified" (unresolved since Phase 8.3) and the deployment-dependent items in the final audit's release gate. **Leaves open:** AI, accessibility, chat, notification-preference enforcement.

### Option D (smaller, worth naming) — Settings honesty pass
**Scope:** either enforce `ai_enabled`/`notif_prefs` server-side or remove the controls; decide the fate of `reminder_minutes_before` (build a minimal reminder path or drop the field from the form). **Why now:** these are small, isolated, and the product currently shows controls that lie to the user, which is a trust problem cheap to fix. **Evidence:** grep-confirmed unchanged: `ai_enabled`/`notif_prefs` written, never read. **Size:** small. Not proposed as a standalone phase — folds naturally into whichever of A/B/C ships first (notification preferences pair naturally with A's session/notification work; the AI toggle pairs naturally with B).

## 8. Combinable work

- **Session-expiry UX + route protection + notification polling:** all three live in `public/js/app.js`'s shared shell/auth-check code; fixing session-expiry redirect is the natural place to also stop the notification poller from silently failing forever. **Combine.**
- **Chat pagination + chat notification behavior:** both are in `src/routes/chat.js`/`ChatTab.jsx`; changing how messages are fetched (newest-N vs. oldest-200) is the same code path that would need to change if chat notifications ever gained family attribution (deferred, but worth not making harder later). **Combine the pagination fix with Option A; do not attempt the deferred chat-attribution schema change now.**
- **Accessibility + the components it affects:** task/bill/decision rows and the Family tab strip are exactly the components already touched twice (Hardening 1.5's task form, Hardening 1's invite dialogs) — doing accessibility now means testing against code that has already been proven stable, not code about to change again. **Combine into one phase, not split by page.**
- **AI compatibility + Assistant validation:** inseparable — fixing the schema layer without re-running every AI flow against a real key would repeat the exact mistake that let this defect ship unnoticed. **Must combine; cannot combine with anything else** (it needs a real key, which the other options don't).
- **Security headers + deployment configuration:** headers are meaningless to test without a real origin/HTTPS decision; **combine with Option C, do not do headers alone.**
- **Production email + account recovery + deployment config:** the real-inbox test *is* an account-recovery test; **combine with Option C**, not with Option A even though both touch "account."
- **What should NOT be combined:** accessibility (UX, no external dependency) with AI (needs a real key) or with deployment (needs a real domain) — these three have genuinely different blocking dependencies and gain nothing from being done together.

## 9. AI defect — separate evaluation (per Part 7)

- **Exact mismatch:** `@anthropic-ai/sdk@0.70.1`'s `betaZodOutputFormat`/`betaZodTool` call `z.toJSONSchema(...)` on whatever `require("zod")` resolves to. The pinned `zod@3.25.76` root export has no `toJSONSchema` (confirmed: `typeof z.toJSONSchema === 'undefined'`). The SDK's own `package.json` lists `"zod": "^3.25.0 || ^4.0.0"` as a peer — so the SDK *claims* 3.25 support but its beta-zod helper only actually works with v4's API shape.
- **Caused by SDK or by our pinned version?** Both, narrowly: the SDK's peer range over-promises 3.25 support for a helper that needs v4's `toJSONSchema`; our `package.json` pins exactly the version (3.25.76) that lacks it.
- **Is AI usable today?** Not through any structured-output path (all seven `ai.js` capabilities use `callStructured` → `betaZodOutputFormat`), with or without a real key — the failure happens before any network call. **Without** a key, nothing is attempted and the app degrades gracefully (already verified in every prior phase). **With** a key, every call would fail exactly the same way (this session's direct SDK reproduction, not the app, since no key exists here).
- **What remains useful in Assistant without the provider:** nothing generative — but the deterministic parts of the product it sits alongside (DecisionFlow's weighted scoring, BillSense stats, EcoLife rollups, the scheduler's conflict detection, Timeline, notifications) are entirely independent of this defect and already fully verified across multiple phases.
- **Fix options, evaluated:**
  1. **Zod 3 → Zod 4** (dependency bump): cleanest long-term; SDK's peer range already allows it; Zod v4's core API (`object`/`string`/`number`/`array`/`enum`/`.describe`/`.min`/`.max`/`.int`/`.nullable`) is what every schema in `ai.js` already uses, so surface-level compatibility looks high from inspection — **not exercised**, since this phase does no implementation.
  2. **Build the JSON schema via `zod/v4`, validate with the existing v3 schema's `.safeParse`:** **investigated this session and found genuinely dependency-free** — the installed `zod@3.25.76` package already ships a `zod/v4` compatibility subpath (`node_modules/zod/package.json` exports `"./v4"`), and `require('zod/v4').toJSONSchema` **exists and is callable today**, confirmed directly. This means a fix could construct the schema-for-the-API-call via `zod/v4` while keeping every existing `z.object(...)` schema and its `.safeParse` unchanged, with **zero dependency or version change**.
  3. **SDK version change:** unexplored — no evidence a different SDK version resolves this without also requiring zod 4; lower priority than (2).
  4. **Hand-written JSON schemas:** would work but throws away the convenience the `zod` schemas already provide and doubles the maintenance surface (schema + validator kept in sync by hand). Not recommended given (2) exists.
  5. **Adapter approach:** effectively what (2) already is (an adapter at the schema-conversion boundary); no separate option needed.
- **Recommendation:** evaluate (2) first in the AI phase itself — it is the only option confirmed here to require **no dependency change at all**, which fits this project's stated cost/dependency discipline better than a major-version bump. If (2) proves awkward in practice (e.g., subtle v3/v4 schema incompatibilities when the same object is fed to both a v3 `.safeParse` and a v4 `toJSONSchema`), fall back to (1).
- **Should AI be next, later, or deferred?** **Its own small phase, sequenced independently of accessibility/deployment** — not blocked on them, not blocking them. It is cheap and isolated (Option B), but its *verification* is gated on obtaining a real API key, which is a resourcing decision for ChatGPT/the user, not an engineering blocker. If no key will be available soon, defer Option B and do Option A or C first; do not let AI block core-product work, and do not skip verifying it against a real key once one is available — mock-only verification is exactly how this defect went unnoticed for this many phases.

## 10. Cost and infrastructure (Part 8)

| Need | Can stay local/free? | Notes |
|---|---|---|
| Runtime deps, SQLite, build tooling | Yes | unchanged, 0 vulnerabilities (re-confirmed each hardening phase) |
| HTTPS | **Required** for any public deployment (Secure cookie already gated on `NODE_ENV=production`) | not a cost item — most hosts provide TLS termination free (e.g. platform-managed certs) |
| Persistent DB | **Required** if deployed to ephemeral-disk hosting | choose a host with a persistent volume; no new *software* needed, this is a hosting decision |
| Backups | Not currently implemented anywhere | a scheduled file copy of the SQLite file is free; no service needed |
| Email provider | **Required** for real account recovery | Resend already chosen and integrated (Phase 8.3); free tier likely sufficient at this scale — **verify actual current Resend pricing before committing**, not assumed here |
| AI provider | Optional, pay-per-use, already isolated with graceful degradation | no change recommended |
| Security headers, rate limiting | Free (code-only) | recommended to fold into Option C once a real origin exists, not standalone |
| Distributed rate limiting / Redis | **Not needed** unless multi-instance hosting is chosen | do not add pre-emptively; single-instance remains adequate per every prior report |

Nothing here requires new paid infrastructure beyond what Phase 8.3 already selected (Resend) and whatever baseline hosting is chosen for HTTPS + persistent disk — both unavoidable for a real deployment regardless of engineering choices in this repo.

## 11. Security / privacy release gate (Part 6)

| Item | Classification | Why |
|---|---|---|
| Former-member access, notification privacy, invite credentials, task authorization, XSS, SQL injection | **ACCEPTABLE FOR INITIAL RELEASE** | closed and verified across Hardening 1/1.5 and the final audit's sink census; no open exploit |
| Account recovery (reset flow itself) | **ACCEPTABLE FOR INITIAL RELEASE** locally | token lifecycle, session invalidation, enumeration-safety all verified (Phase 8.2/8.3) |
| **Production email delivery** | **BLOCKER for public release**, acceptable for local/trusted use | never verified against a real inbox — recovery is unusable if email doesn't actually arrive |
| **HTTPS / persistent storage / backups** | **BLOCKER for public release** | no deployment target chosen yet; not a code defect, a prerequisite |
| Security headers | **IMPORTANT**, not a blocker | no demonstrated exploit they would have prevented, now that content-level authorization is fixed |
| Session expiry / CSRF (no token, SameSite=Lax only) | **IMPORTANT** | theoretical, no state-changing GET exists, no demonstrated exploit |
| Rate limiting (signup, AI, per-process nature) | **IMPORTANT** | real but bounded risk; per-process is fine for the currently-supported single-instance deployment |
| Email verification (OTP demo mode) | **IMPORTANT**, borderline blocker if the product claims "verified" badges publicly | currently a demo; misleading if shipped as-is with real users |
| Accessibility | **IMPORTANT for real users, not a security blocker** | excludes keyboard/screen-reader users; a trust and legal-exposure concern for some markets, not a data-exposure risk |

Nothing is marked a blocker "because it exists" — each blocker above is a prerequisite the product literally cannot function without in public use (working email, a real HTTPS origin, and durable storage), not a residual security finding.

## 12. Recommended next phase

**Option B (AI compatibility + Assistant re-validation), run only if a real API key can be made available; otherwise Option A (accessibility + chat pagination + session-expiry UX) first, with Option C (deployment readiness) run in parallel or immediately after by whoever controls hosting/domain decisions — those two do not depend on each other and can proceed independently.**

## 13. Why this ordering over the alternatives

Option B is the cheapest fix in this entire report (one file, likely zero dependency change per the `zod/v4` finding) and closes the most misleading gap: a pillar of the product presented as available that has never worked. It should not be delayed by bundling it with unrelated hardening. But it is **gated on a resource (a real key) this environment does not have**, so it cannot simply run first unconditionally — that decision belongs to ChatGPT/the user. Option A is next because it is fully diagnosed, self-contained, has no external gate, and is what a real household hits daily. Option C is necessary but is gated on a hosting/domain decision that is itself a product choice, not something to default into.

## 14. Exact proposed scope (for whichever is approved)

- **If B:** `src/lib/ai.js` schema-conversion layer only; new tests against both the mock provider (already have the pattern from Phase 8.3) **and** a real key if supplied; no other file touched.
- **If A:** `web/src/pages/Family.jsx` tab strip, task/bill/decision row components, `TaskDetailModal`/equivalent for keyboard focus, `src/routes/chat.js` + `ChatTab.jsx` pagination, `public/js/app.js` central 401 handling; axe-core + real keyboard-only browser verification on every page already in the standard regression list.
- **If C:** `.env.example` real values (never committed), a header middleware module, `server.js` for `trust proxy` (only once the topology is known), a backup script/cron doc, and the first-ever real-inbox test.

## 15. MUST DO

- Whichever option is approved: full regression (backend suite, lint, build, the standard browser-suite list) before and after, exactly as every prior phase has done.
- If B: verify against the mock provider at minimum; real-key verification if a key is provided.
- If A: axe-core scan + real keyboard-only traversal of every changed page, at 320/375/414/1280.
- If C: the real-inbox test, end to end, is not optional — "implemented but not verified" is not an acceptable final state for this specific item given it has now been open since Phase 8.2.

## 16. SHOULD DO

- Fold Option D (settings honesty) into whichever of A/B ships first, per §7.
- Document (not necessarily fix) the CSRF/no-token posture and the per-process rate-limit topology as part of whichever phase touches session handling.

## 17. DEFER

- Distributed rate limiting / Redis (no multi-instance deployment planned).
- New admin-role UI, Delete Family, reminders engine (unless Option D's settings-honesty pass chooses to build a minimal one instead of removing the field — a decision for that phase, not this one).
- Broad other-browser/real-device/screen-reader coverage beyond Edge+axe-core, until a concrete need is identified.
- Chat/bill notification family-attribution schema change (already explicitly deferred with reasoning in Hardening 1.5).

## 18. Stop conditions (for whichever phase is approved)

- If Option B's schema-conversion approach turns out to require behavior changes to the existing `z.object(...)` schemas (not just the conversion call), STOP and report before changing schema semantics.
- If Option A's chat-pagination fix would change the wire contract of `GET /api/chat/:familyId/messages` in a way that breaks the existing `since` parameter's meaning, STOP and report the ambiguity rather than guessing.
- If Option C's hosting target turns out to require a topology decision (reverse proxy, multi-instance) not yet made, STOP short of guessing `trust proxy` values.

## 19. Expected verification

Same standard this project has used every phase: full backend suite, lint, production build, real-browser verification (Edge, Playwright) of every changed and adjacent page, and — new for whichever phase is chosen — either a real AI key or a real inbox, because both of those specific "NOT VERIFIED" labels have now persisted across multiple phases and should not persist further without a concrete plan to close them.

## 20. Expected deliverables

A single `PHASE_<NAME>_REPORT.md` following this project's established format (evidence-labeled findings, before/after, exact verdict block), plus updated tests colocated with the existing suite, following the naming pattern already established (`test/hardening15-*.test.js` etc.).

## 21. Dependencies

- Option B depends on ChatGPT/the user deciding whether a real API key will be supplied for true verification.
- Option C depends on a hosting/domain decision being made first.
- Option A has no external dependency.

## 22. Risks

- Proceeding with B using only mock verification would repeat the exact failure mode that let this defect ship unnoticed for eight prior phases — flagged explicitly so it is not repeated.
- Proceeding with C before a hosting decision risks configuring headers/proxy trust for the wrong topology.
- Proceeding with A is lowest-risk of the three; its main risk is standard shared-component regression, already well-mitigated by this project's established full-regression habit.

## 23. What should NOT be touched

Everything closed by Hardening 1/1.5 (cross-family authorization, invite lifecycle, task access predicate, family-owner integrity) — no reopening without new evidence. No new admin role. No Delete Family. No dependency additions beyond what a chosen AI-fix option requires. No schema changes beyond what Option C's email/backup work might need to document (not implement) for a real host.

## 24. Proposed following phase after this one

Whichever of A/B/C is not chosen now should follow next, with the third completing the set — this report does not recommend abandoning any of the three, only sequencing them by dependency and cost. After all three, the product would be in a materially different position: honest about AI, usable by keyboard/screen-reader users, chat that doesn't freeze, and actually deployable with verified email — at which point a second, much smaller final audit (not another full line-by-line pass) would be appropriate to confirm the release gate in §11 has moved every "BLOCKER" row to "ACCEPTABLE."

---

**Research complete. No application code, schema, dependencies or configuration were modified. Stopping as instructed — awaiting ChatGPT's review and approved next-phase prompt.**
