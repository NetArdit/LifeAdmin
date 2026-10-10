// Minimal in-memory fixed-window rate limiter (Phase 8.2). No dependency, no
// infrastructure. Honest limits of this design:
//   - state lives in this process only: it resets on restart and is NOT shared
//     across multiple server instances (LifeAdmin is a single-process,
//     local-first app, so this fits today; a multi-instance deployment would
//     need a shared store — that is a deployment decision, not made here);
//   - keys are chosen by the caller (IP + identifier), so the limiter itself
//     does not know or reveal whether an account exists.

function createLimiter({ windowMs, max }) {
  const hits = new Map(); // key -> { count, resetAt }

  function prune(now) {
    if (hits.size < 1000) return;
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }

  function current(key, now) {
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) return null;
    return entry;
  }

  return {
    // true when `key` has already used up its allowance in the current window.
    isLimited(key) {
      const entry = current(key, Date.now());
      return !!entry && entry.count >= max;
    },
    // Records one hit. Returns true if this hit is over the allowance.
    consume(key) {
      const now = Date.now();
      prune(now);
      let entry = current(key, now);
      if (!entry) {
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      return entry.count > max;
    },
    reset(key) {
      hits.delete(key);
    },
    resetAll() {
      hits.clear();
    },
    retryAfterSeconds(key) {
      const entry = current(key, Date.now());
      return entry ? Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000)) : 1;
    },
  };
}

module.exports = { createLimiter };
