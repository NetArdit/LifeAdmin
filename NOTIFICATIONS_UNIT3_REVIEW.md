## A. Findings

### Medium — the Origin check is partial

[`src/routes/push.js:12–28`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/routes/push.js:12>) checks the Origin on push mutations only when the header is present, and accepts the request’s `Host` header as an allowed origin. `SameSite=Lax` plus JSON requests are useful defenses, but this is not a complete CSRF policy for cookie-authenticated state changes.

For these routes, require and compare the browser Origin to the configured canonical app origin. Apply the same policy to other authenticated state-changing routes; those routes use the same session cookie. A global check should account for any legitimate non-browser clients rather than silently allowing missing Origin on browser mutations.

### Medium — the Microsoft endpoint allowlist needs evidence

[`src/lib/push.js:20–23, 59–74`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/push.js:20>) accepts `*.notify.windows.com`. Apple’s Web Push guide explicitly says to allow `https://*.push.apple.com`, so the Apple pattern is supported. [Apple Web Push guide](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)

Microsoft’s Edge guide documents standards-based Web Push with VAPID and the Web Push protocol, but does not specify that Edge subscriptions use `notify.windows.com`. Microsoft’s WNS documentation does use that domain for its separate WNS service. [Edge Web Push guide](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/push), [WNS request documentation](https://learn.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/push-request-response-headers)

Remove `notify.windows.com` until an actual Edge subscription or primary documentation confirms it is required. The current regex accepts any depth of subdomain under that suffix, which makes this an avoidable outbound-request surface.

The Mozilla wildcard appears consistent with Mozilla push service hosts. The exact `fcm.googleapis.com` host is plausible for browser subscriptions, but this implementation has not verified real subscriptions yet. MDN also describes endpoints as push-service URLs and warns they are capability URLs that should be kept secret. [MDN PushSubscription endpoint](https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription/endpoint)

### Medium — use an independent, stable storage key

[`src/lib/push.js:32–51`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/push.js:32>) uses AES-256-GCM and HKDF, which is a sound encryption-at-rest approach for the endpoint and auth secret. The fallback derives the encryption key from the VAPID private key. Changing the VAPID pair then makes existing encrypted rows undecryptable; the version prefix does not provide a rotation mechanism.

Set a separate, randomly generated `PUSH_STORE_KEY` before saving real subscriptions. Keep it stable and backed up independently of VAPID. Before rotating it, add a migration/re-encryption procedure. The public `p256dh` key is not secret; the endpoint and `auth` secret are encrypted as intended.

### Low — expired sessions stop receiving, but their rows remain

Subscriptions are bound to both account and session. [`src/db/schema.sql:310–324`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/db/schema.sql:310>) cascades deletion when a session is deleted, and logout/password reset paths delete sessions. [`sendToUser`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/push.js:154>) also excludes expired sessions from sends.

A session that merely expires is not deleted by this code, so its subscription row remains but is not used. It can inflate the device count until the browser reconnects or the session row is cleaned up. Add expiry cleanup or ensure the existing session cleanup handles it.

### Low — payload tags are bounded, not semantically constrained

[`src/lib/push.js:118–130`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/push.js:118>) restricts paths to internal-looking app paths and maps kinds to fixed sentences. That keeps current titles and bodies generic. The `tag`, however, accepts any string up to 64 characters. Current callers use generic tags, but future callers should use opaque event identifiers rather than user content.

### No finding — shared-browser takeover is deliberate and bounded

[`saveSubscription`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/push.js:77>) deletes an existing row for the browser endpoint and replaces it only when the authenticated user explicitly subscribes. The previous account then stops receiving on that browser. The sign-in resume path checks the remembered user ID before reconnecting, so another account does not silently inherit the subscription. This is a reasonable shared-device rule; make the takeover consequence clear in product copy.

### No finding — session binding and unsubscribe behavior

The server binds each row to a session; logout removes the browser subscription locally and session deletion cascades server-side. [`public/js/push.js:66–103`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/public/js/push.js:66>) handles local unsubscribe and reconnects only for the previously remembered account. `localStorage` stores only that account ID, not subscription secrets. If the session expires without being deleted, sends are filtered out as noted above.

### No finding — click handling stays in the app

[`public/sw.js:17–20, 36–50`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/public/sw.js:17>) rejects external URLs and focuses an existing same-origin app window or opens the app. The page routes the message through its normal hash router; API access remains server-authorized. This is sufficient for the current generic payload design. The path pattern is a syntactic internal-path check, not an explicit list of route names, so keep it limited to app routes as new links are added.

## B. Rulings

**Unit 2 response-before-commit: fixed.** [`txRoute`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/middleware/errorHandler.js:17>) holds the response until `db.tx` returns. The new deferred-FK test covers both a handler failure after it stages a response and a commit-time constraint failure. The original medium finding is closed.

**PostgreSQL concurrency: verified by the reported run.** The reported independent-process test against PostgreSQL 18.6 establishes no duplicate claims across the tested rounds, lease takeover fencing, and one bell per item for the tested whole runs. I reviewed the guard and test structure in [`scripts/verify-worker-race.cjs`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/scripts/verify-worker-race.cjs:1>); I did not rerun it.

**Reminder throughput: acceptable for the first low-volume deployment, with monitoring.** [`runDue`](</C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/reminderWorker.js:119>) now releases unprocessed claims and reverses their attempt count. At roughly one second per row, 20–40 reminders per scheduled run is a workable starting capacity for a 15-minute schedule, not a scale target. Measure backlog age and rows processed. Reduce round trips or move execution closer to Frankfurt if the backlog approaches the next run or users observe late reminders.

**Origin policy: not enough as a general app policy.** Keep the per-route check now, strengthen it as described above, then apply the canonical-origin rule consistently to authenticated browser mutations.

**Push design: sound foundation, with fixes before production use.** Takeover, session binding, generic fixed sentences, and the worker’s visible notification behavior are sensible. The allowlist uncertainty, Origin policy, and independent key handling should be resolved before the first real subscriptions are stored.

**Approval: APPROVED WITH FIXES.** This approves the reviewed implementation once those fixes are addressed; it does not claim real-browser or hosted verification.

## D. First deploy steps and costs

Do these after addressing the approval fixes.

1. **Migrate the hosted database first.** Back it up, then run the idempotent schema application against the hosted `DATABASE_URL` with `DB_SKIP_SCHEMA` unset, for example `npm run db:migrate`. Confirm the command targets the intended database. The schema includes the new subscription table and reminder settings. The migration itself has no separate charge on Neon Free while usage stays within the included allowance; it does consume database compute. Neon currently lists 100 CU-hours and 1 GB storage per Free project. [Neon Free plan details](https://neon.com/blog/neon-free-plan-1-gb-per-project)

2. **Set the push environment variables in Netlify.** Generate the VAPID pair locally with `npm run push:keys`; do not commit the generated `.env` file. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` (a valid `mailto:` or HTTPS contact). Also set the strongly recommended independent `PUSH_STORE_KEY`. Environment variables have no separate charge. Keep the private VAPID key and storage key server-side.

3. **Make one production deploy.** A successful Netlify production deploy currently costs 15 credits; function compute, including scheduled functions, is accounted separately. [Netlify credit usage](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/)

The schema migration is a separate step from the deploy. Do not rely on function startup to migrate the hosted database.

### Owner’s device checklist

**Android**

- Use Chrome on the owner’s HTTPS site, sign in, and tap **Turn on notifications**. “Works” means Android shows a permission prompt, the setting says this device is on, and **Send test notification** produces the generic test notice.
- Close the tab and lock the phone, then send another test. The notification should still appear. Tapping it should open LifeAdmin at Settings.
- Turn notifications off. The browser subscription should be removed and the server should stop sending to that device.

**iPhone**

- In Safari, add LifeAdmin to the Home Screen, then launch it from that icon. Push on iOS requires a Home Screen web app on iOS/iPadOS 16.4 or later; permission must follow a user gesture. [Apple Web Push guide](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)
- Tap **Turn on notifications**, allow the prompt, and send a test. “Works” means the notice appears in the Home Screen app’s notification context, including with the app closed or phone locked subject to iOS notification settings.
- Tap the notice and confirm it returns to LifeAdmin. Turn notifications off and confirm the device is removed.

**Desktop**

- Use a supported browser on the HTTPS site, allow notifications, and confirm the test notice appears. Close the tab and repeat; the browser or OS may still require the browser process to be running.
- Tap/click the notice and confirm it opens or focuses LifeAdmin. Turn notifications off and confirm future tests no longer arrive.
- In browser developer tools, confirm `/sw.js` registers at scope `/` and the manifest and icon requests succeed. The real deployment still needs to establish correct Netlify serving behavior.

The test results and bundle build in the request are reported evidence; I did not rerun tests or claim the browser, phone, hosted migration, deploy, or scheduled function was verified here.

## E. Execution prompt for the next unit

> Implement the next LifeAdmin notification unit in two stages: dated reminder push through the reminder worker’s `deliver`, then immediate circle-event push.
>
> First read `NOTIFICATIONS_RESEARCH_AND_DESIGN.md`, `NOTIFICATIONS_UNIT2_REVIEW.md`, the Unit 3 review findings, and current reminder, notification, circle-event, auth, and migration code. Preserve the rule that reminders are scheduled work while circle events are attempted immediately after their event transaction commits.
>
> **Stage 1: dated reminders**
>
> - Extend the reminder worker’s `deliver` path to send the generic Web Push reminder to the owner’s active subscriptions while preserving the bell behavior and reminder transaction/claim rules.
> - Apply quiet hours to dated reminders only, using the user’s IANA time zone. Defer a quiet-hours reminder to the next quiet-hours end; do not drop it.
> - Persist delivery state and attempt results. Treat provider acceptance as best-effort: if the provider accepts and the database update then fails, retry may duplicate. Use stable event identifiers/tags, bounded retries, and truthful delivery states.
>
> **Stage 2: circle events**
>
> For every accepted event, create a durable push delivery for each other active circle member, excluding the author:
>
> - Every circle group message.
> - Every comment on a circle-visible task.
> - Every newly created circle-visible task.
>
> Do not group or coalesce these pushes. Commit the event and its delivery records atomically; then attempt push immediately, with durable retry records for failures. Do not wait for the reminder schedule. Recheck active membership and task visibility at the appropriate authorization boundary.
>
> Store a durable record per intended recipient/event delivery and record per-device send outcomes so retries and partial device failures are inspectable. Send to active session-bound subscriptions only. Keep payloads generic; include no message text, comment, task title, names, or other private content.
>
> Add a per-circle **Mute this circle for 8 hours** control. It suppresses circle-event pushes only; it must not suppress dated reminders or delete bell records. Store the mute window durably and apply it using the user’s time-independent expiry timestamp.
>
> Add tests for event fan-out, author exclusion, active membership and task visibility, no grouping, quiet-hours deferral, mute expiry/scope, durable delivery outcomes, lease/retry behavior, and the provider-accepted/database-failed duplicate boundary. Use a stub sender; do not call a real push service.
>
> Do not deploy or migrate the owner’s hosted database. Report changed files, migration steps, test/build results, and remaining real-browser and hosted verification.

## MEMORY UPDATE

Unit 2 is approved: `txRoute` now responds after commit, and independent PostgreSQL concurrency verification was reported successful. `runDue` releases unprocessed claims without consuming attempts; 20–40 reminders per 15-minute run is acceptable as an initial low-volume limit with backlog monitoring.

Unit 3 is **APPROVED WITH FIXES**: confirm or remove the `notify.windows.com` allowlist, strengthen Origin validation and apply it across authenticated browser mutations, and use a stable independent `PUSH_STORE_KEY` with a rotation plan. The shared-browser takeover is explicit and session-bound; expired-but-not-deleted session rows are ignored for sending but can linger in device counts.

No hosted migration, deployment, real browser/phone verification, or real push send was performed in this review.