// Proves on a real PostgreSQL, with independent connections, what the embedded test database cannot: that two
// runs of the reminder worker at the same moment never take the same row, and that a run whose lease was
// taken over can finish nothing.
//
//   DATABASE_URL=<a THROWAWAY database> node scripts/verify-worker-race.cjs
//
// It creates the schema and its own rows in that database. Never point it at a database with real data: it
// refuses one that already has users.

const { spawn } = require('node:child_process');
const path = require('node:path');

const ROWS = 60;
const ROUNDS = 5;
const root = path.join(__dirname, '..');

function child(code, env = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, ['-e', code], { cwd: root, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (status) => (status === 0 ? resolve(out.trim().split('\n').pop()) : reject(new Error(`child failed (${status}): ${err.slice(-300)}`))));
  });
}

// Each child is a process of its own, with its own connections. They wait for the same instant.
const CLAIM = `
  const db = require('./src/db'); const w = require('./src/lib/reminderWorker');
  (async () => {
    await db.get('SELECT 1 AS x');
    await new Promise((r) => setTimeout(r, Math.max(0, Number(process.env.GO_AT) - Date.now())));
    const c = await w.claimDue({ now: Number(process.env.NOW), limit: Number(process.env.LIMIT) });
    console.log(JSON.stringify({ token: c.token, ids: c.rows.map((r) => r.id) }));
    await db.close();
  })().catch((e) => { console.error(e.message); process.exit(1); });`;
const RUN = `
  const db = require('./src/db'); const w = require('./src/lib/reminderWorker');
  (async () => {
    await db.get('SELECT 1 AS x');
    await new Promise((r) => setTimeout(r, Math.max(0, Number(process.env.GO_AT) - Date.now())));
    const c = await w.runDue({ now: Number(process.env.NOW), limit: Number(process.env.LIMIT) });
    console.log(JSON.stringify(c));
    await db.close();
  })().catch((e) => { console.error(e.message); process.exit(1); });`;

(async () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL of a throwaway database is required.');
  delete process.env.DB_SKIP_SCHEMA;
  const db = require('../src/db');
  const reminders = require('../src/lib/reminders');
  const worker = require('../src/lib/reminderWorker');
  if ((await db.get('SELECT COUNT(*)::int AS c FROM users')).c > 0) throw new Error('This database has users: not a throwaway one. Nothing was changed.');

  const user = await db.run("INSERT INTO users (first_name, last_name, email, phone, password_hash) VALUES ('Race', 'Test', 'race@example.test', '+38344000000', 'x')");
  const due = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  const taskIds = [];
  for (let i = 0; i < ROWS; i++) taskIds.push((await db.run('INSERT INTO tasks (owner_id, title, due_date) VALUES (?, ?, ?)', [user.lastInsertRowid, `Task ${i}`, due])).lastInsertRowid);
  for (const id of taskIds) await reminders.replanTask(id);
  const all = (await db.all("SELECT id, scheduled_at FROM planned_reminders WHERE status = 'pending'"));
  if (all.length !== ROWS) throw new Error(`expected ${ROWS} planned rows, found ${all.length}`);
  const now = Date.parse(all[0].scheduled_at) + 1000;
  const report = { rows: ROWS, rounds: [] };

  // 1. Claims at the same instant: no row to both, and together not more than there are.
  for (let round = 1; round <= ROUNDS; round++) {
    await db.run("UPDATE planned_reminders SET status = 'pending', claim_token = NULL, claimed_until = NULL, attempts = 0");
    const env = { NOW: String(now), LIMIT: '40', GO_AT: String(Date.now() + 4000) };
    const [a, b, c] = (await Promise.all([child(CLAIM, env), child(CLAIM, env), child(CLAIM, env)])).map((x) => JSON.parse(x));
    const ids = [...a.ids, ...b.ids, ...c.ids];
    const twice = ids.length - new Set(ids).size;
    const tokens = await db.all("SELECT claim_token, COUNT(*)::int AS n FROM planned_reminders WHERE status = 'claimed' GROUP BY claim_token");
    report.rounds.push({ round, took: [a.ids.length, b.ids.length, c.ids.length], takenTwice: twice, claimedInTable: tokens.reduce((s, t) => s + t.n, 0) });
    if (twice !== 0) throw new Error(`round ${round}: ${twice} rows were taken by two runs`);
    if (ids.length !== ROWS) throw new Error(`round ${round}: ${ids.length} rows taken, ${ROWS} were due`);
    for (const run of [a, b, c]) {
      const mine = (tokens.find((t) => t.claim_token === run.token) || { n: 0 }).n;
      if (mine !== run.ids.length) throw new Error(`round ${round}: a run holds ${mine} rows by its token but was given ${run.ids.length}`);
    }
  }

  // 2. A lease that ran out is taken by another run, and the first one can finish nothing.
  await db.run("UPDATE planned_reminders SET status = 'pending', claim_token = NULL, claimed_until = NULL, attempts = 0");
  const dead = await worker.claimDue({ now, limit: 5 });
  const live = await worker.claimDue({ now: now + (worker.LEASE_SECONDS + 1) * 1000, limit: 5 });
  const lost = await worker.handle(dead.rows[0], dead.token, { now });
  const row = live.rows.find((r) => r.id === dead.rows[0].id);
  const sent = row ? await worker.handle(row, live.token, { now }) : 'not retaken';
  report.lease = { retaken: live.rows.length, deadRunAnswer: lost, liveRunAnswer: sent };
  if (lost !== 'lost' || sent !== 'sent') throw new Error(`lease: dead run answered ${lost}, live run ${sent}`);

  // 3. Whole runs at the same instant: every reminder in the bell exactly once.
  await db.run("UPDATE planned_reminders SET status = 'pending', claim_token = NULL, claimed_until = NULL, attempts = 0, sent_at = NULL");
  await db.run('DELETE FROM notifications');
  // A run stops when its time is up and gives the rest back, so three at a time are repeated until nothing is due.
  const waves = [];
  for (let wave = 0; wave < 12; wave++) {
    const env = { NOW: String(now), LIMIT: '50', GO_AT: String(Date.now() + 4000) };
    const runs = (await Promise.all([child(RUN, env), child(RUN, env), child(RUN, env)])).map((x) => JSON.parse(x));
    waves.push({ sent: runs.map((r) => r.sent), released: runs.map((r) => r.released), lost: runs.map((r) => r.lost), ms: runs.map((r) => r.ms) });
    if (runs.every((r) => r.claimed === 0)) break;
  }
  const bells = await db.get('SELECT COUNT(*)::int AS n, COUNT(DISTINCT link)::int AS items FROM notifications');
  const states = await db.all('SELECT status, COUNT(*)::int AS n FROM planned_reminders GROUP BY status');
  report.runs = { waves, bells: bells.n, itemsWithABell: bells.items, states };
  if (bells.n !== ROWS || bells.items !== ROWS) throw new Error(`runs: ${bells.n} bells for ${bells.items} items, expected ${ROWS} and ${ROWS}`);

  report.server = (await db.get('SHOW server_version')).server_version;
  console.log(JSON.stringify(report, null, 1));
  console.log('VERIFIED');
  await db.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
