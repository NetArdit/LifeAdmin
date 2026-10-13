const { ValidationError } = require('../lib/validate');
const { withAfterCommit } = require('../lib/afterCommit');

// Wraps an async route handler so rejected promises reach the error handler
// instead of crashing the process or hanging the request.
function asyncRoute(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// A route that changes an item AND what depends on it (its planned reminders): everything the handler does
// in the database happens together or not at all. Not for a handler that waits on another service.
//
// The handler's answer is held back until the transaction has been committed: a client is told "done" only
// for what is really stored. If the handler or the commit fails, what it had answered is dropped and the
// error handler answers instead. Such a handler answers with res.status() and res.json() only.
function txRoute(fn) {
  return asyncRoute(async (req, res, next) => {
    let status = 200;
    let body;
    let answered = false;
    const held = {
      status(code) {
        status = code;
        return held;
      },
      json(value) {
        body = value;
        answered = true;
        return held;
      },
    };
    // What the handler asked to be done once its changes are stored (telling a phone, for one) is done
    // after the commit, and before the answer: a serverless function may be frozen once it has answered.
    await withAfterCommit(
      () => require('../db').tx(() => fn(req, held, next)),
      (err) => console.error('[LifeAdmin] after-commit work failed:', (err && (err.code || err.name)) || 'error')
    );
    if (answered) res.status(status).json(body);
  });
}

// Centralized error handler. Never leaks stack traces or internals to the client.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ValidationError) {
    return res.status(err.status).json({ error: err.message, fields: err.fields });
  }
  if (err && err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error('[LifeAdmin] Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong on our end. Please try again.' });
}

module.exports = { asyncRoute, txRoute, errorHandler };
