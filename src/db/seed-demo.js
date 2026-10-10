// Demo data generator (spec §29). Populates realistic sample data for a
// given user so the app can be explored immediately. Never runs automatically
// — only via POST /api/demo/seed or `npm run seed` for a fresh standalone demo user.
const db = require('./index');
const { hashPassword } = require('../lib/auth');
const { addDays, todayISO } = require('../lib/dates');
const { generateInviteCode } = require('../lib/inviteCode');
const { computeProgress } = require('../lib/goalProgress');

const DEMO_TAG = '[demo-seed]';

function seedDemoForUser(userId) {
  const user = db.get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) throw new Error('User not found');
  const today = todayISO();

  // Family
  let family = db.get(
    `SELECT f.* FROM families f JOIN family_members fm ON fm.family_id = f.id WHERE fm.user_id = ? LIMIT 1`,
    [userId]
  );
  if (!family) {
    // Hardening 1 / F-03: the demo family gets the same strong random invite code as
    // any real family (it used to be "DEMO" + 4 digits, guessable in seconds).
    let code;
    do {
      code = generateInviteCode();
    } while (db.get('SELECT id FROM families WHERE invite_code = ?', [code]));
    const r = db.run('INSERT INTO families (name, invite_code, owner_id) VALUES (?, ?, ?)', ['The Demo Circle', code, userId]);
    family = db.get('SELECT * FROM families WHERE id = ?', [r.lastInsertRowid]);
    db.run("INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, 'owner')", [family.id, userId]);
    db.run(
      `INSERT INTO family_members (family_id, phone, display_name, role) VALUES (?, ?, ?, 'member')`,
      [family.id, '+38344000111', 'Alex (invited)']
    );
  }

  // Tasks
  const tasks = [
    { title: 'Pay electricity bill', category: 'bills', priority: 'high', dueDate: addDays(today, 1), status: 'todo', visibility: 'private' },
    { title: 'Family dinner planning', category: 'family', priority: 'medium', dueDate: today, status: 'todo', visibility: 'family' },
    { title: 'Study JavaScript — Chapter 4', category: 'learning', priority: 'medium', dueDate: today, startTime: `${today}T20:00:00`, durationMinutes: 60, status: 'todo', visibility: 'private' },
    { title: 'Doctor appointment', category: 'health', priority: 'critical', dueDate: addDays(today, 2), startTime: `${addDays(today, 2)}T18:00:00`, durationMinutes: 45, status: 'todo', visibility: 'family' },
    { title: 'Submit tax documents', category: 'admin', priority: 'high', dueDate: addDays(today, -1), status: 'todo', visibility: 'private' },
    { title: 'Weekly grocery shopping', category: 'family', priority: 'low', dueDate: addDays(today, 3), status: 'todo', visibility: 'family' },
    { title: 'Finish Q3 report', category: 'work', priority: 'medium', dueDate: addDays(today, 5), status: 'in_progress', visibility: 'private' },
    { title: 'Renew car insurance', category: 'bills', priority: 'medium', dueDate: addDays(today, 10), status: 'todo', visibility: 'private' },
  ];
  const taskIds = [];
  for (const t of tasks) {
    const r = db.run(
      `INSERT INTO tasks (owner_id, family_id, visibility, title, category, status, priority, due_date, start_time, duration_minutes, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [userId, t.visibility === 'family' ? family.id : null, t.visibility, t.title, t.category, t.status, t.priority, t.dueDate, t.startTime || null, t.durationMinutes || null, DEMO_TAG]
    );
    taskIds.push(r.lastInsertRowid);
    db.run(`INSERT INTO activity_log (user_id, family_id, type, summary, link) VALUES (?, ?, 'task_created', ?, ?)`, [
      userId,
      t.visibility === 'family' ? family.id : null,
      `${user.first_name} created "${t.title}"`,
      `#/tasks/${r.lastInsertRowid}`,
    ]);
  }
  db.run(`INSERT INTO task_comments (task_id, user_id, body) VALUES (?, ?, ?)`, [taskIds[1], userId, "Don't forget to invite grandma."]);
  db.run(`INSERT INTO task_comments (task_id, user_id, body) VALUES (?, ?, ?)`, [taskIds[5], userId, "I'll go after work, add anything you need to the shopping list."]);

  // Chat messages
  const chatLines = [
    'Good morning everyone!',
    "Don't forget the doctor appointment on Thursday.",
    'I did the groceries, added milk and bread.',
    'Can we plan the weekend trip this week?',
  ];
  for (const line of chatLines) {
    db.run('INSERT INTO messages (family_id, user_id, body) VALUES (?, ?, ?)', [family.id, userId, line]);
  }

  // Shopping list
  const shoppingItems = [
    { name: 'Milk', quantity: '2L' },
    { name: 'Bread', quantity: '1 loaf' },
    { name: 'Cereal', quantity: null },
  ];
  for (const item of shoppingItems) {
    db.run('INSERT INTO shopping_items (family_id, name, quantity, added_by) VALUES (?,?,?,?)', [family.id, item.name, item.quantity, userId]);
  }

  // Bills
  const bills = [
    { name: 'Electricity', category: 'electricity', amount: 62.5, dueDate: addDays(today, 1), recurrence: 'monthly' },
    { name: 'Internet', category: 'internet', amount: 25, dueDate: addDays(today, 6), recurrence: 'monthly' },
    { name: 'Water', category: 'water', amount: 18.3, dueDate: addDays(today, -3), recurrence: 'monthly' },
    { name: 'Streaming subscription', category: 'subscription', amount: 12.99, dueDate: addDays(today, 9), recurrence: 'monthly' },
    { name: 'Apartment rent', category: 'rent', amount: 420, dueDate: addDays(today, 15), recurrence: 'monthly' },
    { name: 'Car insurance', category: 'insurance', amount: 240, dueDate: addDays(today, 40), recurrence: 'yearly' },
  ];
  for (const b of bills) {
    db.run(
      `INSERT INTO bills (owner_id, name, category, amount, currency, due_date, recurrence, notes) VALUES (?,?,?,?,?,?,?,?)`,
      [userId, b.name, b.category, b.amount, 'EUR', b.dueDate, b.recurrence, DEMO_TAG]
    );
  }

  // Decision
  const decision = db.run('INSERT INTO decisions (owner_id, question) VALUES (?, ?)', [userId, 'Should I buy a new laptop or repair my current one?']);
  const critCost = db.run('INSERT INTO decision_criteria (decision_id, name, weight) VALUES (?, ?, ?)', [decision.lastInsertRowid, 'Cost', 5]);
  const critLongevity = db.run('INSERT INTO decision_criteria (decision_id, name, weight) VALUES (?, ?, ?)', [decision.lastInsertRowid, 'Long-term value', 4]);
  const critConv = db.run('INSERT INTO decision_criteria (decision_id, name, weight) VALUES (?, ?, ?)', [decision.lastInsertRowid, 'Convenience', 3]);
  db.run('INSERT INTO decision_options (decision_id, name, pros, cons, scores) VALUES (?,?,?,?,?)', [
    decision.lastInsertRowid,
    'Repair current laptop',
    JSON.stringify(['Cheaper now', 'No data migration needed']),
    JSON.stringify(['Still old hardware', 'May break again soon']),
    JSON.stringify({ [critCost.lastInsertRowid]: 5, [critLongevity.lastInsertRowid]: 2, [critConv.lastInsertRowid]: 4 }),
  ]);
  db.run('INSERT INTO decision_options (decision_id, name, pros, cons, scores) VALUES (?,?,?,?,?)', [
    decision.lastInsertRowid,
    'Buy new laptop',
    JSON.stringify(['Faster, reliable for years', 'Better for work']),
    JSON.stringify(['Expensive now', 'Setup time']),
    JSON.stringify({ [critCost.lastInsertRowid]: 2, [critLongevity.lastInsertRowid]: 5, [critConv.lastInsertRowid]: 3 }),
  ]);

  // Goals — progress is derived from the milestones below via the same
  // canonical computeProgress() the live API uses (src/lib/goalProgress.js),
  // never hand-picked, so seeded goals can't drift out of sync with their
  // own milestones (Batch 7C fix — see src/routes/goals.js's
  // recomputeProgress for the equivalent live-data path).
  const goal1 = db.run('INSERT INTO goals (owner_id, title, description, category, target_date, progress) VALUES (?,?,?,?,?,?)', [
    userId,
    'Learn JavaScript fundamentals',
    'Complete a structured path to be comfortable building small apps.',
    'learning',
    addDays(today, 60),
    0,
  ]);
  const milestones1 = ['Finish basics course', 'Build a to-do app', 'Learn async/await', 'Build a small API'].map((title, i) => ({ title, done: i < 2 }));
  milestones1.forEach((m, i) => {
    db.run('INSERT INTO goal_milestones (goal_id, title, done, sort_order) VALUES (?,?,?,?)', [
      goal1.lastInsertRowid,
      m.title,
      m.done ? 1 : 0,
      i,
    ]);
  });
  db.run('UPDATE goals SET progress = ? WHERE id = ?', [computeProgress(milestones1).progress, goal1.lastInsertRowid]);

  const goal2 = db.run('INSERT INTO goals (owner_id, title, description, category, target_date, progress) VALUES (?,?,?,?,?,?)', [
    userId,
    'Save €1000 emergency fund',
    null,
    'financial',
    addDays(today, 120),
    0,
  ]);
  const milestones2 = ['Reach €250', 'Reach €500', 'Reach €750', 'Reach €1000'].map((title, i) => ({ title, done: i === 0 }));
  milestones2.forEach((m, i) => {
    db.run('INSERT INTO goal_milestones (goal_id, title, done, sort_order) VALUES (?,?,?,?)', [goal2.lastInsertRowid, m.title, m.done ? 1 : 0, i]);
  });
  db.run('UPDATE goals SET progress = ? WHERE id = ?', [computeProgress(milestones2).progress, goal2.lastInsertRowid]);

  // Eco logs
  const ecoEntries = [
    { category: 'transport', action: 'Took the bus instead of driving', quantity: 12, unit: 'km' },
    { category: 'energy', action: 'Switched to LED bulbs in the kitchen' },
    { category: 'waste', action: 'Recycled a full bin of paper', quantity: 3, unit: 'kg' },
    { category: 'food', action: 'Meatless dinner' },
  ];
  for (const e of ecoEntries) {
    db.run('INSERT INTO eco_logs (owner_id, category, action, quantity, unit) VALUES (?,?,?,?,?)', [
      userId,
      e.category,
      e.action,
      e.quantity || null,
      e.unit || null,
    ]);
  }

  // Notifications
  const notifs = [
    { type: 'bill', title: 'Water bill is overdue', body: 'Due 3 days ago', link: '#/billsense' },
    { type: 'comment', title: 'New comment on "Family dinner planning"', link: `#/tasks/${taskIds[1]}` },
    { type: 'family', title: 'Welcome to The Demo Family', link: '#/family' },
  ];
  for (const n of notifs) {
    db.run('INSERT INTO notifications (user_id, type, title, body, link) VALUES (?,?,?,?,?)', [
      userId,
      n.type,
      n.title,
      n.body || null,
      n.link,
    ]);
  }

  return { familyId: family.id };
}

function clearDemoForUser(userId) {
  db.run(`DELETE FROM tasks WHERE owner_id = ? AND notes = ?`, [userId, DEMO_TAG]);
  db.run(`DELETE FROM bills WHERE owner_id = ? AND notes = ?`, [userId, DEMO_TAG]);
}

// Standalone CLI usage: `npm run seed` creates a fresh demo account.
if (require.main === module) {
  (async () => {
    const email = 'demo@lifeadmin.local';
    const phone = '+38344999000';
    let user = db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      const hash = await hashPassword('demo1234');
      const r = db.run(
        `INSERT INTO users (first_name, last_name, email, phone, password_hash, email_verified, phone_verified) VALUES (?,?,?,?,?,1,1)`,
        ['Demo', 'User', email, phone, hash]
      );
      user = db.get('SELECT * FROM users WHERE id = ?', [r.lastInsertRowid]);
      console.log('Created demo user:', email, '/ password: demo1234');
    } else {
      console.log('Demo user already exists:', email);
    }
    seedDemoForUser(user.id);
    console.log('Demo data seeded.');
  })();
}

module.exports = { seedDemoForUser, clearDemoForUser, DEMO_TAG };
