// Work that must happen only once a change is really stored, and never inside the transaction that stores
// it: handing a notification to a phone's push service is a call over the network. Inside a transaction it
// would hold the transaction open while a service far away takes its time, and it would announce something
// that a rollback then takes back.
//
// A request (or the reminder worker) opens a scope; code deep inside it says "do this afterwards"; the scope
// runs what was collected after the transaction has committed, and before the request answers (a serverless
// function may be frozen the moment it has answered). Outside any scope, "afterwards" is "now".

const { AsyncLocalStorage } = require('node:async_hooks');

const scope = new AsyncLocalStorage();

/** Runs `fn` now if nothing is collecting, otherwise after the current scope's change has been committed. */
async function afterCommit(fn) {
  const queue = scope.getStore();
  if (queue) queue.push(fn);
  else await fn();
}

/**
 * Runs `change` (which commits what it changes before it returns), then everything it asked to be done
 * afterwards. If `change` throws, nothing collected is run: there is nothing to announce.
 * A failure of the work afterwards never undoes or fails the change: it is reported to `onError`.
 */
async function withAfterCommit(change, onError = () => {}) {
  const queue = [];
  const result = await scope.run(queue, change);
  // Outside the scope: what runs now is "now", not collected again.
  await scope.exit(async () => {
    for (const fn of queue) {
      try {
        await fn();
      } catch (err) {
        onError(err);
      }
    }
  });
  return result;
}

module.exports = { afterCommit, withAfterCommit };
