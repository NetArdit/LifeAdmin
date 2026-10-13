## Findings from the code

**Reminders based on time are not built.** `tasks.reminder_minutes_before` is saved and returned, but nothing reads it to schedule or send a reminder. Bills have due dates and recurrence but no reminder path; goals and milestones have dates but no reminder path either.

**Current notifications are in-app bell rows.** `notifyUser()` checks the recipient’s `notif_prefs` and inserts a row. `notifyFamily()` applies that to each active member except the person who caused the event. The bell fetches rows from `/api/notifications`; [app.js] polls every 20 seconds while the app is running and displays up to 100 rows. There is no service worker, manifest, push subscription storage, or background delivery.

The code already writes bell rows for circle chat messages, shared task creation and changes, task comments, assignments, shared bill payments, and circle membership events. Comments on private tasks go only to people who can currently access the task. The existing linked-task filter hides a notification if the reader has since lost access to its task.

One preferences detail needs attention in a build: Settings currently displays four checkboxes (`task`, `comment`, `chat`, `bill`), while shared task creation uses type `family`. Types with no matching preference default to enabled. So shared-task pushes need explicit preference semantics; the current task checkbox does not control those `family` rows.

**The checked-in documentation and runtime configuration describe different deployment eras.** The README describes an Express/SQLite app, while the listed Netlify function and DB code describe one serverless API using PostgreSQL in production and PGlite in development/tests. The database code says hosted migrations are run separately, with `DB_SKIP_SCHEMA=1` preventing schema changes at function startup. A notification build should follow that runtime migration path rather than rely on a cold start to mutate production schema.

## 1. Web Push on browsers and phones

These are standards-based **web notifications**, not native iOS/Android apps. Delivery is possible while the page is closed, but it remains subject to the browser, operating system, network, power-saving behavior, and the user’s notification settings. We should promise “sent for delivery,” not guaranteed arrival at an exact second.

- **Chrome on desktop and Android — OBSERVED.** Chrome supports the standard Web Push protocol with VAPID. The browser’s subscription supplies the push-service endpoint; the server sends encrypted Web Push to that endpoint. Current Chrome documentation says VAPID removes the need for a Firebase project or `gcm_sender_id`. [Chrome’s Web Push interoperability documentation](https://developer.chrome.com/blog/web-push-interop-wins) [MDN’s Push API documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- **Firefox on desktop and Android — OBSERVED.** Firefox uses Mozilla’s push service on desktop; Firefox for Android uses Mozilla’s service together with Google Cloud Messaging. Push payloads are encrypted according to the Web Push standard. [Mozilla’s Firefox push-notification explanation](https://support.mozilla.org/en-US/kb/push-notifications-firefox)
- **iOS and iPadOS — OBSERVED.** Web Push is supported for web apps added to the Home Screen on iOS/iPadOS 16.4 and later. It is not ordinary push from a page left open in iOS Safari. The app must ask permission in response to a user gesture—such as tapping **Enable notifications**—and subscribe from that gesture handler. [Apple’s Web Push guide](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers) [Safari 16.4 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes)
- **Safari on macOS — OBSERVED.** Web Push is supported for Safari webpages on macOS Ventura/Safari 16 and later; Apple also supports it for Mac web apps. Apple says a paid Apple Developer Program membership is not required for Web Push. [Apple’s Web Push guide](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)
- **Browser and phone settings — OBSERVED.** A web page cannot honestly promise to open the phone’s notification settings or grant permission on the user’s behalf. LifeAdmin can request permission after a tap and explain where the user can change a previous decision. After permission, the user manages delivery in the relevant browser/site settings and operating-system notification settings. On iOS/iPadOS, the Home Screen web app is an additional prerequisite. Apple says the permission request must follow a user gesture. [Apple’s Web Push guide](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)

**No separate paid relay is required.** LifeAdmin needs an application server, VAPID keys, and the `web-push` library; the browser supplies its push endpoint. The browser vendor operates that endpoint’s push service. Chrome documents standard Web Push and VAPID without a Firebase project; Apple likewise says its developer program is not required. This means no extra paid relay service is necessary, not that every provider or hosting configuration is cost-free. [Chrome](https://developer.chrome.com/blog/web-push-interop-wins) [Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers) [web-push library](https://github.com/web-push-libs/web-push)

**Encryption and size.** `web-push` handles VAPID signing and payload encryption using the subscription’s `p256dh` and `auth` keys. Keep the application payload very small—roughly a few kilobytes at most, with a conservative target below 2 KB—rather than trying to send notification content. The library documents the Web Push encryption requirement and protocol support. [web-push documentation](https://github.com/web-push-libs/web-push)

**Expired or revoked subscriptions.** A push service may reject a send with **404** or **410** when an endpoint is no longer valid. Delete that subscription record and stop retrying it; it does not mean the user account or all their devices are invalid. Treat other failures according to status: retry transient server/network errors with bounded backoff; record permanent failures and alert through operational logs.

## 2. Scheduling reminders on this platform

**The clock belongs on the server.** A closed browser cannot reliably run a timer. A Netlify scheduled function can wake the application, query planned reminders, and send them even when the user has closed LifeAdmin.

**Recommended first interval: every 15 minutes.** Netlify documents Scheduled Functions on all pricing plans and a 30-second execution limit. Its cron runs in UTC. That makes an honest user-facing promise “around the selected time, usually within 15–30 minutes,” not “at 09:00:00.” [Netlify Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/)

**Why not every minute?** The current Neon Free plan documents 100 CU-hours per project per month and scale-to-zero after five minutes of inactivity. A job that connects more often than that can keep the compute awake. Netlify’s Free plan documents 300 credits/month and 15 credits per successful production deploy. Those are real constraints, but the precise cost of this job depends on its execution time and actual account usage; the job should be measured after implementation. [Neon Free plan limits](https://github.com/neondatabase/website/blob/main/content/faqs/free-plan-limits-and-quotas.md) [Netlify credit usage](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/)

**Do not scan every task on every run.** Materialize planned reminder rows and query a due batch through a composite index such as `(status, scheduled_at)`. In PostgreSQL, claim a bounded batch with row locks (`FOR UPDATE SKIP LOCKED`) inside a short transaction. A unique key on `(user_id, source_type, source_id, occurrence_key, rule_key, channel)` prevents duplicate logical reminder rows.

**Use a delivery outbox.** Create the bell notification and pending delivery rows in the same database transaction as the triggering event. A worker claims outbox rows with a lease, sends outside the transaction, then records the result and attempt count. This prevents two overlapping workers from both claiming the same row and allows safe retry after ordinary failures.

There is an unavoidable boundary: if the push provider accepts a send and the function dies before recording success, retrying can produce a duplicate push. Web Push has no general exactly-once transaction across PostgreSQL and the push service. Use a stable notification `tag` so clients replace an existing visible notification where supported, use a short TTL, and keep the delivery record’s stable event key. Describe delivery as at-least-once with deduplication and visible-push replacement, not mathematical exactly-once.

**Edits and completion must cancel stale reminders.** On task date/time change, completion, cancellation, or deletion, cancel its pending planned reminders in the same transaction. On a recurring task’s next occurrence, generate reminders for the new occurrence. When a recurring bill is paid and rolled to its next due date, replan its reminders then. Goal milestone edits/completion/deletion should likewise cancel or rebuild planned reminders.

**Time zones need an explicit policy.** Current task due dates and bill due dates are date strings; a date alone does not identify a time or time zone. Store an IANA time zone per user (for example, `Europe/Budapest`). Interpret “09:00” and date-only reminders in that zone, convert each planned instant to UTC, and retain the original zone and local date for audit. For DST changes, calculate from the local calendar date/time and zone rules, not by adding a fixed 24-hour duration.

## 3. Small reminder model and defaults

Avoid making each item an alarm-control panel. Keep defaults by item type, permit a per-item override, and provide one quiet-hours and digest setting per user.

**Recommended defaults to ship:**

| Item | Default reminder |
|---|---|
| Task with a due time | 1 hour before |
| Task with date only | Due date at 09:00 in the user’s time zone |
| Bill | 3 days before due date at 09:00 |
| Goal milestone | 1 day before at 09:00 |
| Goal target date without milestones | 7 days before at 09:00 |
| No due date | No reminder |

The exact time-of-day for date-only reminders should be editable in settings; 09:00 is a sensible default, consistent with Apple Reminders’ current default for an all-day reminder. [Apple Reminders user guide](https://support.apple.com/en-us/102484)

**Per-item control:** `Use default` / `No reminder` / `Custom`. `Custom` exposes one reminder choice: **At due time, 1 hour, 5 hours, 12 hours, 1 day, 3 days, 5 days, or 7 days before**. For a date-only item, “at due time” means the user’s configured reminder time. Permit one offset per item initially; don’t ship a whole 5-day/3-day/1-day/12-hour/5-hour/1-hour ladder on every item.

**Recurring schedule options** belong in a separate “Repeat reminder” control, available only if the user explicitly asks for it: **Every day at…**, **Selected weekdays at…**, or **Monthly on day… at…**. These satisfy the owner’s repeat-pattern use cases without putting weekday and calendar-date controls on every task. For monthly dates such as the 29th–31st, define and explain “last day of the month when that date doesn’t exist.”

**Quiet hours:** default 22:00–08:00, user-local. Queue non-urgent reminders to the next quiet-hours end. Do not silently drop them. Expose a simple on/off and start/end control.

**Daily digest:** optional, off by default, at 08:00 local. Include a single digest for today’s due items and overdue items, not a second reminder for items whose individual reminder will fire that morning. The digest should report counts and link to the authenticated app.

**Product precedents:**

- **Todoist — OBSERVED.** Its current guide describes automatic reminders for timed tasks, custom date/time or before-task reminders, and recurring reminders; some multi-reminder features are plan-dependent. The useful idea is automatic defaults plus a per-task override. [Todoist reminders](https://www.todoist.com/help/todoist/features/introduction-to-reminders-9PezfU)
- **TickTick — RECALLED.** TickTick’s product model includes date/time reminders, repeat patterns, notification delivery controls, and an optional daily notification. I recommend borrowing the single daily summary idea, not its broader settings surface. Its help result describes push, email, and reminder controls. [TickTick reminder help](https://help.ticktick.com/articles/7055782395743567872)
- **Google Calendar — OBSERVED.** Calendar has user-specific default reminders and event-level overrides; the defaults do not become other attendees’ reminders. Take the per-user default plus per-item override model. [Google Calendar reminders and notifications](https://developers.google.com/workspace/calendar/api/concepts/reminders)
- **Apple Reminders — OBSERVED.** A date-only reminder defaults to 09:00, and the user can change the all-day reminder time. Take the predictable date-only default, not its device-specific features. [Apple Reminders user guide](https://support.apple.com/en-us/102484)

## 4. Prevent notification overload

- Keep **one bell row per event** for history and completeness. Push can be grouped.
- **Chat:** for each user/circle, group pushes within a two-minute window into one “New messages in [circle]” notification with a count. The bell still records each message.
- **Task comments:** group pushes for the same task/thread within five minutes, with a count and a link to that task. Each comment still gets its bell row.
- **New tasks:** keep each task’s bell row. Group a burst into one “N new circle tasks” push, linking to the circle task list.
- **Due items:** group same-morning reminders into the daily digest when enabled. The app can show the full item list after authentication.
- **Rate limits:** cap ordinary pushes at 5 per user per 15 minutes and 20 per user per day, after event coalescing. Keep the rows in the bell even when a push is suppressed; record the suppression reason. These are starting product limits to tune from feedback, not platform guarantees.
- Add **Mute this circle for 8 hours**. It suppresses circle chat/task/comment pushes during that window, while retaining bell rows. Due reminders remain unaffected.
- Preserve the existing linked-task access filter for the bell. Before sending a push for a task-linked event, recheck current access; cancel pending deliveries if access has been revoked. If access changes after the push is sent, the push must contain no task detail and the click must require a fresh session/access check.

Chrome announced a rollout of Push API rate limits based on user engagement in January 2026, another reason not to treat high-volume push as a reliable channel. [Chrome push rate-limit announcement](https://developer.chrome.com/blog/web-push-rate-limits?hl=en)

## 5. The three required circle events

For every **other active circle member**, create a bell row and a push delivery candidate for:

1. Each circle chat message.
2. Each comment on a circle-visible task.
3. Each new circle-visible task created by a member.

The current event routes already create bell rows for these events. The change is in delivery: `notify.js` must also create durable push-delivery outbox rows and a worker must send them to each member’s active subscription. For comments on private tasks, retain the existing owner/assignee access rule; never fan them out to the whole circle.

“Every message” should mean **every message has its own bell record and is represented in push**, not one OS pop-up per message. Ten messages in a minute should be ten bell rows and one grouped push with the count and chat link. That respects the requirement that members are notified while avoiding a push storm. The event author should not be notified about their own event by default, matching current behavior.

These pushes are best-effort delivery through browser and OS controls. We should not promise every handset will display each individual push or that browsers will not suppress a burst.

## 6. Channels

- **Bell:** durable in-app history, always available after login, subject to event preferences and access filtering.
- **Push:** opt-in, for due reminders and grouped collaboration activity. It is per browser/device subscription.
- **Email fallback:** only an opt-in daily digest for users who have no active push subscription and a verified email address. Do not send one email per message/comment/task; Brevo’s stated 300/day limit makes that unsafe for chatty groups, and email exposes more content. Track digest delivery and suppress duplicate pushes/emails for the same digest window.

## 7. Security and privacy

- Require an authenticated session and CSRF protection for subscribe/unsubscribe. Bind each subscription to `user_id` and `session_id`; enforce a request-size limit and a small number of devices per account.
- A subscription endpoint is a capability URL: anyone who knows it can attempt to send to that subscription. Keep it secret, never log it, and encrypt endpoint/auth material at rest with an application key. [MDN notes the endpoint’s capability nature](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- Validate HTTPS endpoints and constrain outbound sends to known Web Push providers or otherwise harden against SSRF. Do not blindly POST to arbitrary URLs supplied by a client.
- Use `web-push` for payload encryption and VAPID signing. Store VAPID private key only in server-side secret configuration, never in source or browser code. The public VAPID key is safe to expose to the browser. [web-push documentation](https://github.com/web-push-libs/web-push)
- On sign-out, delete that session’s server subscriptions and call `unsubscribe()` from that browser when possible. On password change, revoke sessions and subscriptions; require devices to opt back in. Never silently transfer a subscription to a different account.
- Assume notification title and body can appear on a lock screen. Never include task names, comments, chat text, bill names/amounts, or family member names. Use generic text such as **“LifeAdmin — You have an update”** and look up details only after the user opens the app.
- On click, the service worker should open only a same-origin, allowlisted internal route. The opened page must check the session and current access before displaying the target. A push payload is not authorization.

## 8. Data model and API

**Suggested tables and indexes:**

- `push_subscriptions`: `id`, `user_id`, `session_id`, encrypted `endpoint`, `endpoint_hash UNIQUE`, encrypted `auth`, `p256dh`, `created_at`, `last_seen_at`, `revoked_at`. Index by `(user_id, revoked_at)`; cascade on user/session removal.
- `reminder_rules`: user/type defaults and per-item override fields, or compact validated JSON on the owning item at first. Avoid duplicating authoritative due dates.
- `planned_reminders`: `id`, `user_id`, `source_type`, `source_id`, `occurrence_key`, `rule_key`, `scheduled_at_utc`, `timezone`, `status`, `claimed_until`, `sent_at`, `cancelled_at`. Unique key on item occurrence + rule + recipient. Index `(status, scheduled_at_utc)` and `(source_type, source_id, status)`.
- `notification_deliveries` (the outbox): `id`, `notification_id`, `user_id`, `channel`, `event_key`, `status`, `attempts`, `available_at`, `claimed_until`, `sent_at`, `last_error_code`. Unique `(user_id, channel, event_key)`; index `(status, available_at)`.

**Endpoints:**

- `GET /api/push/public-key`
- `POST /api/push/subscriptions`
- `DELETE /api/push/subscriptions/:id`
- `PATCH /api/settings/notifications` for channel preferences, defaults, time zone, quiet hours, digest, and mute windows
- Extend task, bill, and milestone create/edit endpoints to accept validated reminder overrides.
- Add a scheduled function that claims due reminder/outbox work; it should not be exposed as a public user-triggerable endpoint.

**Service worker events:** `push` parses minimal data and calls `showNotification()` immediately; `notificationclick` validates a same-origin app path and opens/focuses it; `pushsubscriptionchange` attempts a refresh/re-subscribe where supported, otherwise marks the server record stale and asks the user to re-enable. Apple explicitly disallows invisible push; the worker should display a notification for every received push. [Apple Web Push guide](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)

**Schema rule:** add idempotent schema definitions to `schema.sql` for dev/test consistency and add an explicit hosted migration for production, consistent with `db/index.js` and its `DB_SKIP_SCHEMA=1` behavior. Do not run production DDL on function startup.

## 9. Testing without a phone

`node --test` on PGlite can verify:

- Default reminder planning by item type, per-item overrides, local-date/time conversion, and DST edge cases.
- Unique event keys and deduplication under overlapping claim attempts.
- Retry/lease behavior, including stale claims after a simulated crash.
- Cancellation/rescheduling on task edit, completion, deletion, recurrence rollover, bill payment, and milestone changes.
- Chat/comment/task push coalescing while retaining one bell row per event.
- Rate-limit and quiet-hour deferral behavior.
- Expired 404/410 subscription cleanup using a mock `web-push` sender.
- Permission/auth/CSRF checks on subscription endpoints and access checks at click-through targets.

A real browser is still required to verify permission prompts, service-worker registration, subscription creation, push delivery, notification tags, and click behavior. Chrome/Firefox desktop and Android should be checked separately. Only an actual iPhone/iPad can verify Home Screen installation, iOS permission flow, lock-screen display, and Settings behavior.

**Not verified until the owner tries it on their own phone:** the deployed HTTPS origin’s install flow; iPhone/iPad Home Screen installation and push permission; notifications with the phone locked and LifeAdmin closed; focus/quiet mode and OS notification settings; delivery on the owner’s carrier/Wi-Fi; and tap-through after session expiration. I did not change files, deploy, or run tests.

## 10. Reviewable implementation plan

Each unit should leave the app usable. Deployments remain an owner decision; none is included here.

1. **Reminder foundation:** timezone setting, validated reminder defaults/overrides, planned reminder schema/indexes, deterministic planner, migration, and PGlite tests. No push or scheduler yet. **Accept when** planning and cancellation/rescheduling pass tests and existing routes still work.
2. **Reliable due worker:** Netlify scheduled function every 15 minutes, lease-based claims, outbox/deduplication, retry handling, and metrics. Initially record due deliveries without sending. **Accept when** overlap/failure simulations do not lose logical reminders and a dry-run shows due work.
3. **Web Push vertical slice:** manifest, root-scoped service worker, subscribe/unsubscribe UI and endpoints, VAPID secret handling, one generic test push, invalid-subscription cleanup. **Accept when** browser-based tests work on desktop and no secrets or personal item content appear in payloads.
4. **Reminder delivery:** connect planned task/bill/milestone reminders to the push outbox; add quiet hours and digest. **Accept when** due, changed, completed, deleted, and recurring items produce the expected deliveries in tests.
5. **Circle event delivery:** fan out group messages, shared-task comments, and new shared tasks; preserve bell rows, preferences, coalescing, mute, and rate limits. **Accept when** integration tests cover every recipient/access case and ten-event bursts produce one push summary.
6. **Email digest and settings polish:** verified-email opt-in fallback, delivery limits, clear notification/device states, and in-app explanation for phone install/settings. **Accept when** no per-event email is sent and all preference combinations are tested.
7. **Owner device verification:** production-origin preview and owner’s real phone checks; fix any compatibility issues. **Accept when** the owner confirms behavior on their iPhone/Android as applicable. The owner decides whether to deploy each completed unit.

### Execution prompt for Unit 1 only

> Implement Unit 1 of the approved LifeAdmin notification plan only: reminder foundation. Read the repository instructions and relevant task, bill, goal/milestone, DB, and test code first. Add the smallest validated per-user notification time zone and reminder-default/per-item-override model needed for timed tasks, date-only tasks, bills, goal milestones, and goal target dates. Add a deterministic planner that calculates UTC instants from local dates/times and an IANA time zone, including DST behavior, and planned-reminder rows with stable occurrence/rule keys and indexes. Ensure edits, completion, cancellation, deletion, and recurrence rollover can cancel or regenerate pending planned rows. Follow the existing `schema.sql` + explicit production migration convention; do not apply production DDL at function startup. Add focused `node --test` PGlite tests for defaults, overrides, time-zone/DST conversion, stable keys, cancellation, and recurrence planning. Do not add push sending, service worker, manifest, email, scheduled function, or UI beyond what this foundation requires. Do not deploy to Netlify. Keep the existing app paths working and report files changed, migration steps, and test results.

## Questions for the owner

- **Should circle pushes exclude the person who sent the message/created the task/comment?** Recommendation: yes; that matches current behavior and avoids notifying someone about their own action.
- **Does “every message” require a separate phone banner for every chat message, or is one grouped push acceptable when every message still has its own bell row?** Recommendation: grouped push, with one bell row per message and a count/link in the push.
- **Should LifeAdmin use the browser’s current time zone the first time, then let the user change it in Settings?** Recommendation: yes, save the IANA zone to the account and make it editable.
- **Should email digest fallback be opt-in?** Recommendation: yes; enable only after the user verifies their email and explicitly turns it on.