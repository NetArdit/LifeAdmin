const { ValidationError } = require('../lib/validate');

// Wraps an async route handler so rejected promises reach the error handler
// instead of crashing the process or hanging the request.
function asyncRoute(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// A route that changes an item AND what depends on it (its planned reminders): everything the handler does
// in the database happens together or not at all. Not for a handler that waits on another service.
function txRoute(fn) {
  return asyncRoute((req, res, next) => require('../db').tx(() => fn(req, res, next)));
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
