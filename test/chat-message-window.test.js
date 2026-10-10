// Daily Product Quality phase: the confirmed chat message-window defect.
//
// Root cause (see PHASE_DAILY_PRODUCT_QUALITY_REPORT.md §7 for the full
// investigation): both the family-chat and Assistant-chat "load messages"
// endpoints used `ORDER BY created_at ASC LIMIT N`, which always returns the
// OLDEST N messages, not the most recent ones. For any conversation whose
// total message count grows past the limit, this is a permanently stuck
// window — new messages are inserted fine but the read endpoint can never
// return them again, forever. These tests seed messages directly into the
// database (the established pattern in this test suite — see
// task-access-predicate.test.js, hardening15-authorization.test.js) rather
// than sending hundreds of real HTTP POSTs, since the defect is entirely a
// property of the read query, independent of how the rows got there.
const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('chat message window', async (t) => {
  const app = await startApp();
  t.after(() => app.close());
  const db = require('../src/db');

  // A fixed base instant well in the past (so a real, `datetime('now')`-
  // stamped row always sorts after every seeded row regardless of when this
  // test actually runs), one second per message so ordering is unambiguous.
  function tsAt(i) {
    const d = new Date(Date.UTC(2020, 0, 1, 0, 0, 0) + i * 1000);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }

  await t.test('family chat: empty, small, and exact-fit windows are unaffected', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const family = await c.post('/api/family', { name: 'Window Test Family' });
    const familyId = family.data.family.id;
    const userId = family.data.family.members[0].userId;

    const empty = await c.get(`/api/chat/${familyId}/messages`);
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.data.messages, []);

    for (let i = 0; i < 3; i++) {
      db.run('INSERT INTO messages (family_id, user_id, body, created_at) VALUES (?,?,?,?)', [familyId, userId, `small-${i}`, tsAt(i)]);
    }
    const small = await c.get(`/api/chat/${familyId}/messages`);
    assert.deepEqual(small.data.messages.map((m) => m.body), ['small-0', 'small-1', 'small-2'], 'chronological order preserved for a small chat');
  });

  await t.test('family chat: beyond the 200-message limit, the NEWEST 200 are returned (not the oldest), in chronological order', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const family = await c.post('/api/family', { name: 'Overflow Family' });
    const familyId = family.data.family.id;
    const userId = family.data.family.members[0].userId;

    const TOTAL = 205;
    const rows = [];
    for (let i = 0; i < TOTAL; i++) rows.push([familyId, userId, `msg-${String(i).padStart(4, '0')}`, tsAt(i)]);
    db.tx(() => {
      for (const r of rows) db.run('INSERT INTO messages (family_id, user_id, body, created_at) VALUES (?,?,?,?)', r);
    });

    const res = await c.get(`/api/chat/${familyId}/messages`);
    assert.equal(res.status, 200);
    assert.equal(res.data.messages.length, 200, 'still capped at 200 — this phase did not change the cap size, only which 200');
    assert.equal(res.data.messages[0].body, 'msg-0005', 'the oldest of the returned window is message #5 (i.e. messages 0-4 were correctly dropped, not 200-204)');
    assert.equal(res.data.messages[199].body, 'msg-0204', 'the newest message ever sent (#204) is present — this is exactly what the old ASC-LIMIT query could never return once the family passed 200 total messages');
    const bodies = res.data.messages.map((m) => m.body);
    assert.deepEqual(bodies, [...bodies].sort(), 'the 200 returned messages are in ascending chronological order for display');
  });

  await t.test('family chat: a newly-sent message is visible immediately even once the family is over the limit', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const family = await c.post('/api/family', { name: 'Post-Overflow Family' });
    const familyId = family.data.family.id;
    const userId = family.data.family.members[0].userId;
    db.tx(() => {
      for (let i = 0; i < 200; i++) db.run('INSERT INTO messages (family_id, user_id, body, created_at) VALUES (?,?,?,?)', [familyId, userId, `old-${i}`, tsAt(i)]);
    });

    const sent = await c.post(`/api/chat/${familyId}/messages`, { body: 'brand new message' });
    assert.equal(sent.status, 201);

    const res = await c.get(`/api/chat/${familyId}/messages`);
    assert.equal(res.data.messages[res.data.messages.length - 1].body, 'brand new message', 'the just-sent message is the newest entry in the returned window');
  });

  await t.test('family chat: the `since` incremental param still filters correctly under the new ordering', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const family = await c.post('/api/family', { name: 'Since Family' });
    const familyId = family.data.family.id;
    const userId = family.data.family.members[0].userId;
    for (let i = 0; i < 10; i++) {
      db.run('INSERT INTO messages (family_id, user_id, body, created_at) VALUES (?,?,?,?)', [familyId, userId, `s-${i}`, tsAt(i)]);
    }
    const cutoff = tsAt(5);
    const res = await c.get(`/api/chat/${familyId}/messages?since=${encodeURIComponent(cutoff)}`);
    assert.deepEqual(res.data.messages.map((m) => m.body), ['s-6', 's-7', 's-8', 's-9'], 'only messages strictly after the cutoff, in chronological order');
  });

  await t.test('Assistant chat: beyond the 40-message limit, the most recent 40 are returned in chronological order', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const me = (await c.get('/api/auth/me')).data.user;
    const conv = db.run("INSERT INTO ai_conversations (user_id, title) VALUES (?, 'Test conversation')", [me.id]);
    const convId = conv.lastInsertRowid;
    const TOTAL = 45;
    db.tx(() => {
      for (let i = 0; i < TOTAL; i++) {
        db.run('INSERT INTO ai_messages (conversation_id, role, content, created_at) VALUES (?,?,?,?)', [
          convId,
          i % 2 === 0 ? 'user' : 'assistant',
          `turn-${String(i).padStart(3, '0')}`,
          tsAt(i),
        ]);
      }
    });

    const res = await c.get('/api/ai/chat/history');
    assert.equal(res.status, 200);
    assert.equal(res.data.conversationId, convId);
    assert.equal(res.data.messages.length, 40);
    assert.equal(res.data.messages[0].content, 'turn-005', 'the oldest 5 turns were correctly dropped, not the newest 5');
    assert.equal(res.data.messages[39].content, 'turn-044', 'the most recent turn is present — the old ASC-LIMIT query could never return this once the conversation passed 40 messages');
    const contents = res.data.messages.map((m) => m.content);
    assert.deepEqual(contents, [...contents].sort(), 'chronological order for display');
  });

  await t.test('Assistant chat: a conversation at or under the limit is returned unchanged (regression)', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const me = (await c.get('/api/auth/me')).data.user;
    const conv = db.run("INSERT INTO ai_conversations (user_id, title) VALUES (?, 'Short')", [me.id]);
    const convId = conv.lastInsertRowid;
    db.run('INSERT INTO ai_messages (conversation_id, role, content, created_at) VALUES (?,?,?,?)', [convId, 'user', 'hello', tsAt(0)]);
    db.run('INSERT INTO ai_messages (conversation_id, role, content, created_at) VALUES (?,?,?,?)', [convId, 'assistant', 'hi there', tsAt(1)]);

    const res = await c.get('/api/ai/chat/history');
    assert.deepEqual(res.data.messages.map((m) => m.content), ['hello', 'hi there']);
  });

  await t.test('cross-family isolation is unaffected by the ordering fix (regression)', async () => {
    const c1 = makeClient(app.base);
    await signUp(c1);
    const f1 = await c1.post('/api/family', { name: 'Family One' });
    db.run('INSERT INTO messages (family_id, user_id, body, created_at) VALUES (?,?,?,?)', [f1.data.family.id, f1.data.family.members[0].userId, 'private to family one', tsAt(0)]);

    const c2 = makeClient(app.base);
    await signUp(c2);
    const res = await c2.get(`/api/chat/${f1.data.family.id}/messages`);
    assert.equal(res.status, 403, 'a non-member still cannot read this family\'s messages at all');
  });
});
