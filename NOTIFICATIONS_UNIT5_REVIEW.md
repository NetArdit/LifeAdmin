## A. Findings

### High — retries are not actually bounded for thrown delivery errors

[notify.js](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/notify.js:85) increments attempts when it claims a row. But if `deliverPush` throws—for example, a database error while reading subscriptions or recording an outcome—[retryPushes](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/notify.js:153) catches it and leaves the row pending. The three-attempt limit is applied only when `sendToUser` returns a failed-device count. Thrown errors can therefore be retried until the age expiry, beyond attempt three. Count and close these attempts consistently, while preserving the documented ambiguity when a provider may have accepted a push before the error.

### Medium — the two-minute claim is a lease, not an absolute exclusion

The single conditional `UPDATE ... RETURNING` in [notify.js](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/notify.js:85) gives one caller the row initially. But `sendToUser` sends to devices sequentially, and the claim has no renewal, timeout bound, or fencing token. If a send runs beyond two minutes, another caller can claim the row while the first is still sending. The first caller can also finalize the row because the final update checks only `push_status = 'pending'`. Bound provider calls and make ownership safe through completion, or use a renewable/fenced claim.

### Medium — task access is not rechecked before sending

For task comments, recipients are selected using current visibility/access in [tasks.js](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/routes/tasks.js:485), but the pending notification stores no task identifier. At send time, [notify.js](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/notify.js:63) rechecks circle membership and mute, not whether the recipient can still see the task. The generic payload and normal access check on opening limit the impact, but this misses the send-boundary access check from the review. Preserve enough task context to recheck visibility before sending.

### Medium — some event routes still do not store the event and its bells atomically

The chat and task-comment handlers now use `txRoute`, so their event, activity, and bell rows commit together in [chat.js](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/routes/chat.js:58) and [tasks.js](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/routes/tasks.js:471). The bill-paid, invitation, and task-update notification paths remain outside that transaction boundary. Their bell rows are durable once inserted, but a failure or process stop during fan-out can still leave the event committed with some or all bells missing. Complete that atomicity for those paths before relying on notifications as a complete record.

The two converted handlers do not appear to perform network work inside the transaction: they write the event/activity/bell rows and queue pushes for after commit. That is appropriate. Keep any future email or other provider calls outside the transaction.

### Backup and migration changes

The backup changes address the prior findings: [backup.js](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/src/lib/backup.js:57) starts a read-only repeatable-read transaction before reading table data; restore checks exact table/column shape and locks the backed-up tables before checking emptiness; [backup.cjs](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/scripts/backup.cjs:23) uses exclusive file creation; and the sequence name is passed as a `regclass` parameter.

One small consistency caveat: export’s table and shape metadata are read before the snapshot transaction. Concurrent schema changes could make that metadata differ from the data snapshot. That should be moved into the transaction or migrations should be guaranteed not to overlap backups. Restore’s locks/check cover backed-up tables; excluded tables such as `rate_limits` are not checked for emptiness.

[scripts/migrate.cjs](/C:/Users/Promotech/OneDrive/Desktop/claude%20projects/LifeAdmin-main/scripts/migrate.cjs:8) correctly refuses an implicit target and refuses `DATABASE_URL` combined with `--local`.

## B. Rulings

**Per-device outcomes:** I do not require a per-device table before first use. One bell/push row per recipient is the right initial cut if the documented meaning of `sent` is “at least one active device accepted it.” When one device succeeds and another fails, the row becomes sent and the failed device is not retried. That is a clear best-effort tradeoff; per-device tracking is needed only if the product promises delivery to every device.

**Rate-limit race:** I want the login check/count race closed before production use. Serialize login attempts by the existing IP-and-normalized-identifier key, then check the limit, verify the password, and update the counter while holding that per-key serialization. A PostgreSQL transaction-scoped advisory lock keyed by a stable hash is one option. Count only failed attempts; reset on success. This avoids counting successful sign-ins or letting concurrent failures all pass the same pre-check.

**Quiet circles:** The implementation matches the binding decision: `quietCircles` defaults to false; when enabled during quiet hours, the bell row remains and the push is marked quiet, with no morning send. Dated reminders remain governed by their separate quiet-hour scheduling.

## C. Decision

**APPROVED WITH FIXES.**

The durable notification row closes the core post-commit loss window once the bell row is stored, and the callback isolation and backup/migration fixes are sound by inspection. Before first production use, close the retry-bound, lease, task-visibility, remaining route-atomicity, and login-race gaps above.

I did not run tests or change files. The stated evidence is 14/14 for the corrected scheduled-function test, reported ESLint/build success, and the earlier suite result before that one-line test correction; the full suite was not rerun after it. PostgreSQL server behavior, real concurrency, browser/device behavior, and hosted scheduling remain unverified. No deployment, hosted migration, or real push was performed.

## D. Execution prompt for the next unit

The remaining push-delivery correctness work ranks above adding another delivery channel. Use this as the next execution prompt; implement the opt-in daily email digest afterward as a separate unit.

> Close the remaining LifeAdmin push-delivery review findings before adding email.
>
> Read the current notification code, event routes, schema/migration path, prior Unit 4 review, and this Unit 5 review. Keep this read-only review’s owner decisions binding: circle pushes are immediate by default; `quietCircles` is an opt-in suppression switch; muted/quiet bells remain; no morning replay; push payloads stay generic.
>
> Make push retry limits apply to thrown delivery errors as well as returned provider failures. Preserve and document the ambiguous provider-accepted/database-failure boundary. Ensure an expired claim cannot overlap an active send or let a stale claimant finalize another claimant’s work. Recheck task visibility at the send boundary for task-comment notifications. Make the remaining event/bell fan-outs atomic where they are ordinary database work; keep external provider calls after commit.
>
> Close the login limiter check/count race without counting successful sign-ins: serialize by the login key, check and verify under that serialization, count only failures, and reset on success. Preserve the HMAC privacy boundary.
>
> Add focused PGlite tests for thrown delivery errors and retry limits, lease expiry/stale ownership, changed task access, event/bell rollback and fan-out, and concurrent login failures plus successful-login reset. Do not add tests that call a real push service. Do not deploy, migrate the owner’s hosted database, or contact a real push service. Report changed files, migration steps, test results, and remaining PostgreSQL/browser/device verification.
>
> Once this follow-up is reviewed, implement the daily email digest as a separate opt-in unit: off by default, verified email plus explicit consent, daily summary only, account-local time, easy opt-out, existing mail abstraction, stubbed tests, no real inbox or deployment.

## MEMORY UPDATE

Unit 5 records push work on the notification row and retries pending pushes. Initial claims are atomic, but the two-minute lease is not fenced through completion; thrown delivery errors can retry beyond the nominal three-attempt limit. Task visibility is not rechecked at send time. Chat and task-comment event/bell writes are transactional; bill-paid, invitation, and task-update paths are not.

A per-device outcome table is not required before first use if `sent` means at least one device accepted the push and this best-effort behavior is documented. The login check/count race should be closed before production using per-key serialization and counting only failures.

Quiet circles default off and, when enabled, retain the bell without sending later. Backup snapshot, schema, locking, exclusive-file, sequence-parameter, and migration-target safeguards are improved. Export metadata is still read before the snapshot transaction.

No full-suite rerun after the test-only correction, PostgreSQL-server verification, hosted migration, deployment, real push, or browser/device validation was performed.