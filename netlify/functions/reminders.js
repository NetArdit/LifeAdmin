// The clock of the reminders: Netlify runs this on the schedule written in netlify.toml. It has no address of
// its own to call from outside and takes nothing from a request. It answers with counts only.
require('dotenv').config({ quiet: true });
const { runDue, housekeeping } = require('../../src/lib/reminderWorker');
const { retryPushes } = require('../../src/lib/notify');

module.exports.handler = async () => {
  try {
    const counts = await runDue();
    // Pushes that are still owed: never attempted (the function stopped after a commit) or failed in passing.
    counts.pushes = await retryPushes();
    counts.sessionsEnded = await housekeeping();
    console.log('[reminders]', JSON.stringify(counts));
    return { statusCode: 200, body: JSON.stringify(counts) };
  } catch (err) {
    console.error('[reminders] run failed:', (err && (err.code || err.name)) || 'error');
    return { statusCode: 500, body: '{"error":"run failed"}' };
  }
};
