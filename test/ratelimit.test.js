// The limits are counted in the database: two copies of the application share one count, a window ends,
// tries at the same moment are each counted, and the table never says whom a count is about.

const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp } = require('./helpers');

test('limits counted in the database', async (t) => {
  const app = await startApp();
  t.after(() => app.close());
  const db = require('../src/db');
  const { createLimiter } = require('../src/lib/ratelimit');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  await t.test('a limiter without a name is refused', () => {
    assert.throws(() => createLimiter({ windowMs: 1000, max: 1 }), /name/);
  });

  await t.test('two copies with the same name share one count; another name counts apart', async () => {
    const one = createLimiter({ name: 'tShared', windowMs: 60000, max: 3 });
    const two = createLimiter({ name: 'tShared', windowMs: 60000, max: 3 });
    const other = createLimiter({ name: 'tOther', windowMs: 60000, max: 3 });
    assert.equal(await one.consume('k'), false);
    assert.equal(await two.consume('k'), false);
    assert.equal(await one.consume('k'), false);
    assert.equal(await two.isLimited('k'), true, 'the allowance is used up for every copy');
    assert.equal(await two.consume('k'), true, 'the fourth try is over it');
    assert.equal(await other.isLimited('k'), false);
    assert.equal(await one.isLimited('someone else'), false);
    const retry = await two.retryAfterSeconds('k');
    assert.ok(retry >= 1 && retry <= 60, String(retry));
    await one.reset('k');
    assert.equal(await two.isLimited('k'), false);
  });

  await t.test('tries at the same moment are each counted', async () => {
    const l = createLimiter({ name: 'tBurst', windowMs: 60000, max: 100 });
    await Promise.all(Array.from({ length: 20 }, () => l.consume('k')));
    assert.equal((await db.get("SELECT hits FROM rate_limits WHERE bucket = 'tBurst'")).hits, 20);
  });

  await t.test('when the window ends the count starts again', async () => {
    const l = createLimiter({ name: 'tWindow', windowMs: 150, max: 1 });
    assert.equal(await l.consume('k'), false);
    assert.equal(await l.consume('k'), true);
    await wait(200);
    assert.equal(await l.isLimited('k'), false);
    assert.equal(await l.consume('k'), false, 'a new window, a first try');
    assert.equal((await db.get("SELECT hits FROM rate_limits WHERE bucket = 'tWindow'")).hits, 1);
  });

  await t.test('the table holds a keyed hash, never the address or the email', async () => {
    const l = createLimiter({ name: 'tPrivate', windowMs: 60000, max: 5 });
    await l.consume('dikush@example.com|203.0.113.7');
    const row = await db.get("SELECT key_hash FROM rate_limits WHERE bucket = 'tPrivate'");
    assert.match(row.key_hash, /^[0-9a-f]{64}$/);
    const all = JSON.stringify(await db.all('SELECT * FROM rate_limits'));
    assert.ok(!all.includes('dikush') && !all.includes('203.0.113.7'));
    await l.resetAll();
    assert.equal(await db.get("SELECT 1 AS x FROM rate_limits WHERE bucket = 'tPrivate'"), undefined);
  });
});
