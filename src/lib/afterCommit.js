// Work that must happen only once a change is really stored, and never inside the transaction that stores
// it: handing a notification to a phone's push service is a call over the network. Inside a transaction it
// would hold the transaction open while a service far away takes its time, and it would announce something
// that a rollback then takes back.
//
// A request (or the reminder worker) opens a scope; code deep inside it says "do this afterwards"; the scope
// runs what was collected after the transaction has committed, and before the request answers (a serverless
// function may be frozen the moment it has answered). Outside any scope, "afterwards" is "now".
//
// In both cases a failure of that work is reported and goes no further: what it follows is already stored,
// and the caller must not be told otherwise, nor the next piece of work be skipped.

const { AsyncLocalStorage } = require('node:async_hooks');

const scope = new AsyncLocalStorage();

const report = (err) => console.error('[LifeAdmin] after-commit work failed:', (err && (err.code || err.name)) || 'error');

async function runSafely(fn, onError) {
  try {
    await fn();
  } catch (err) {
    try {
      onError(err);
    } catch {}
  }
}

/** Runs `fn` now if nothing is collecting, otherwise after the current scope's change has been committed. */
async function afterCommit(fn) {
  const queue = scope.getStore();
  if (queue) queue.push(fn);
  else await runSafely(fn, report);
}

/**
 * Runs `change` (which commits what it changes before it returns), then everything it asked to be done
 * afterwards. If `change` throws, nothing collected is run: there is nothing to announce.
 * A failure of the work afterwards never undoes or fails the change: it is reported to `onError`.
 */
async function withAfterCommit(change, onError = report) {
  const queue = [];
  const result = await scope.run(queue, change);
  // Outside the scope: what runs now is "now", not collected again.
  await scope.exit(async () => {
    for (const fn of queue) await runSafely(fn, onError);
  });
  return result;
}

module.exports = { afterCommit, withAfterCommit };
