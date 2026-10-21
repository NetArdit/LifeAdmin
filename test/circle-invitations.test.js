// Invitations to a circle by email, the invitation-code regression, and the negative authorization matrix
// over every circle surface (the server decides, whatever the page shows).
const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp, verifyEmailOf } = require('./helpers');

test('circles: email invitations and who may see what', async (t) => {
  const app = await startApp();
  const db = require('../src/db');
  t.after(() => app.close());

  async function person({ verified = true } = {}) {
    const c = makeClient(app.base);
    const { res, payload } = await signUp(c);
    if (verified) await verifyEmailOf(c, payload.email);
    return { c, id: res.data.user.id, email: payload.email, payload };
  }
  async function circleOf(owner, name = 'Home') {
    const r = await owner.c.post('/api/family', { name });
    assert.equal(r.status, 201);
    return { id: r.data.family.id, code: r.data.family.inviteCode };
  }
  const invite = (owner, circle, email) => owner.c.post(`/api/family/${circle.id}/invitations`, { email });
  const isMember = async (circle, user) => !!(await db.get('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?', [circle.id, user.id]));
  const pendingRows = async (circle, email) => Number((await db.get("SELECT COUNT(*) AS c FROM circle_invitations WHERE family_id = ? AND email = ? AND status = 'pending'", [circle.id, email])).c);

  // ---- the invitation code: unchanged ---------------------------------------------------------------------
  await t.test('regression: the invitation code still works exactly as before (join, wrong code, already a member)', async () => {
    const owner = await person();
    const circle = await circleOf(owner);
    assert.ok(circle.code);
    const joiner = await person({ verified: false }); // the code never needed a verified email
    assert.equal((await joiner.c.post('/api/family/join', { code: 'WRONGCODE123' })).status, 400);
    const ok = await joiner.c.post('/api/family/join', { code: circle.code });
    assert.equal(ok.status, 201);
    assert.equal(await isMember(circle, joiner), true);
    assert.equal((await joiner.c.post('/api/family/join', { code: circle.code })).status, 400);
    assert.equal(ok.data.family.inviteCode, undefined, 'a member never receives the code');
  });

  // ---- sending ------------------------------------------------------------------------------------------
  await t.test('sending: the answer is the same for an account, a stranger, myself and someone already inside', async () => {
    const owner = await person();
    const circle = await circleOf(owner);
    const insider = await person();
    await insider.c.post('/api/family/join', { code: circle.code });
    const known = await person();
    const answers = [];
    for (const email of [known.email, 'nobody.at.all@example.test', owner.email, insider.email]) {
      const r = await invite(owner, circle, email);
      answers.push([r.status, JSON.stringify(r.data)]);
    }
    for (const a of answers) assert.deepEqual(a, answers[0]);
    assert.equal(answers[0][0], 202);
    assert.equal(await pendingRows(circle, known.email), 1);
    assert.equal(await pendingRows(circle, 'nobody.at.all@example.test'), 1);
    assert.equal(await pendingRows(circle, owner.email), 0, 'no invitation to myself');
    assert.equal(await pendingRows(circle, insider.email), 0, 'none for someone already inside');
  });

  await t.test('sending: no duplicate pending row, one mail only; the address is case-insensitive', async () => {
    const mailer = require('../src/lib/mailer');
    const owner = await person();
    const circle = await circleOf(owner);
    const target = `Dup.${Date.now()}@Example.Test`;
    await invite(owner, circle, target);
    await invite(owner, circle, target.toUpperCase());
    await invite(owner, circle, target.toLowerCase());
    assert.equal(await pendingRows(circle, target.toLowerCase()), 1);
    assert.equal(mailer.getOutbox().filter((m) => m.to === target.toLowerCase() && /invited you/.test(m.text)).length, 1);
  });

  await t.test('sending needs a verified email, an owner/admin role and a real address', async () => {
    const owner = await person({ verified: false });
    const circle = await circleOf(owner);
    assert.equal((await invite(owner, circle, 'x@example.test')).status, 403, 'unverified inviter');
    await verifyEmailOf(owner.c, owner.email);
    assert.equal((await invite(owner, circle, 'not-an-email')).status, 400);
    const member = await person();
    await member.c.post('/api/family/join', { code: circle.code });
    assert.equal((await invite(member, circle, 'x@example.test')).status, 403, 'a plain member may not invite');
    const outsider = await person();
    assert.equal((await invite(outsider, circle, 'x@example.test')).status, 403, 'a stranger may not invite');
    assert.equal((await outsider.c.get(`/api/family/${circle.id}/invitations`)).status, 403);
    assert.equal((await makeClient(app.base).post(`/api/family/${circle.id}/invitations`, { email: 'x@example.test' })).status, 401);
  });

  // ---- answering ----------------------------------------------------------------------------------------
  await t.test('accepting: only the VERIFIED account of that address; once; the circle opens only afterwards', async () => {
    const owner = await person();
    const circle = await circleOf(owner);
    const invitee = await person({ verified: false });
    await invite(owner, circle, invitee.email);

    // Invited, not accepted: nothing opens. Unverified: cannot even see or answer.
    assert.equal((await invitee.c.get(`/api/family/${circle.id}`)).status, 403);
    const mineBefore = await invitee.c.get('/api/family/invitations/mine');
    assert.equal(mineBefore.data.needsVerification, true);
    assert.deepEqual(mineBefore.data.invitations, []);
    const list = await owner.c.get(`/api/family/${circle.id}/invitations`);
    const inv = list.data.invitations.find((i) => i.email === invitee.email);
    assert.equal(inv.status, 'pending');
    assert.equal((await invitee.c.post(`/api/family/invitations/${inv.id}/accept`, {})).status, 403);

    // Someone else, even verified, cannot answer it.
    const thief = await person();
    assert.equal((await thief.c.post(`/api/family/invitations/${inv.id}/accept`, {})).status, 404);
    assert.equal((await thief.c.get('/api/family/invitations/mine')).data.invitations.length, 0);
    assert.equal(await isMember(circle, thief), false);

    await verifyEmailOf(invitee.c, invitee.email);
    const mine = await invitee.c.get('/api/family/invitations/mine');
    assert.equal(mine.data.invitations.length, 1);
    assert.equal(mine.data.invitations[0].familyName, 'Home');
    const accepted = await invitee.c.post(`/api/family/invitations/${inv.id}/accept`, {});
    assert.equal(accepted.status, 200);
    assert.equal(accepted.data.family.inviteCode, undefined);
    assert.equal(await isMember(circle, invitee), true);
    assert.equal((await invitee.c.get(`/api/family/${circle.id}`)).status, 200);

    // Single use: the same invitation cannot be answered again, and there is one membership only.
    assert.equal((await invitee.c.post(`/api/family/invitations/${inv.id}/accept`, {})).status, 404);
    assert.equal((await invitee.c.post(`/api/family/invitations/${inv.id}/decline`, {})).status, 404);
    assert.equal(Number((await db.get('SELECT COUNT(*) AS c FROM family_members WHERE family_id = ? AND user_id = ?', [circle.id, invitee.id])).c), 1);
    const after = await owner.c.get(`/api/family/${circle.id}/invitations`);
    assert.equal(after.data.invitations.find((i) => i.id === inv.id).status, 'accepted');
  });

  await t.test('accepting twice at the same moment makes one membership', async () => {
    const owner = await person();
    const circle = await circleOf(owner);
    const invitee = await person();
    await invite(owner, circle, invitee.email);
    const inv = (await invitee.c.get('/api/family/invitations/mine')).data.invitations[0];
    const results = await Promise.all([1, 2, 3].map(() => invitee.c.post(`/api/family/invitations/${inv.id}/accept`, {})));
    assert.equal(results.filter((r) => r.status === 200).length, 1);
    assert.equal(Number((await db.get('SELECT COUNT(*) AS c FROM family_members WHERE family_id = ? AND user_id = ?', [circle.id, invitee.id])).c), 1);
  });

  await t.test('declined, revoked and expired invitations cannot be accepted; a new one can follow', async () => {
    const owner = await person();
    const circle = await circleOf(owner);
    const invitee = await person();

    await invite(owner, circle, invitee.email);
    let inv = (await invitee.c.get('/api/family/invitations/mine')).data.invitations[0];
    assert.equal((await invitee.c.post(`/api/family/invitations/${inv.id}/decline`, {})).status, 200);
    assert.equal((await invitee.c.post(`/api/family/invitations/${inv.id}/accept`, {})).status, 404);
    assert.equal(await isMember(circle, invitee), false);

    await invite(owner, circle, invitee.email);
    inv = (await invitee.c.get('/api/family/invitations/mine')).data.invitations[0];
    assert.equal((await owner.c.del(`/api/family/${circle.id}/invitations/${inv.id}`)).status, 200);
    assert.equal((await owner.c.del(`/api/family/${circle.id}/invitations/${inv.id}`)).status, 404, 'already revoked');
    assert.equal((await invitee.c.post(`/api/family/invitations/${inv.id}/accept`, {})).status, 404);

    await invite(owner, circle, invitee.email);
    inv = (await invitee.c.get('/api/family/invitations/mine')).data.invitations[0];
    await db.run("UPDATE circle_invitations SET expires_at = datetime('now', '-1 minutes') WHERE id = ?", [inv.id]);
    assert.equal((await invitee.c.post(`/api/family/invitations/${inv.id}/accept`, {})).status, 404);
    const states = (await owner.c.get(`/api/family/${circle.id}/invitations`)).data.invitations.map((i) => i.status).sort();
    assert.deepEqual(states, ['declined', 'expired', 'revoked']);

    await invite(owner, circle, invitee.email);
    inv = (await invitee.c.get('/api/family/invitations/mine')).data.invitations[0];
    assert.equal((await invitee.c.post(`/api/family/invitations/${inv.id}/accept`, {})).status, 200);
  });

  await t.test('only an owner/admin of THAT circle can revoke; another circle’s owner cannot', async () => {
    const ownerA = await person();
    const ownerB = await person();
    const a = await circleOf(ownerA, 'A');
    const b = await circleOf(ownerB, 'B');
    const invitee = await person();
    await invite(ownerA, a, invitee.email);
    const inv = (await invitee.c.get('/api/family/invitations/mine')).data.invitations[0];
    assert.equal((await ownerB.c.del(`/api/family/${b.id}/invitations/${inv.id}`)).status, 404, 'right circle, wrong invitation');
    assert.equal((await ownerB.c.del(`/api/family/${a.id}/invitations/${inv.id}`)).status, 403, 'not a member of A');
    assert.equal((await invitee.c.del(`/api/family/${a.id}/invitations/${inv.id}`)).status, 403, 'the invitee is not an admin');
    assert.equal(await pendingRows(a, invitee.email), 1);
  });

  await t.test('an address whose account is made AFTER the invitation still needs the verified address to accept', async () => {
    const owner = await person();
    const circle = await circleOf(owner);
    const email = `late.${Date.now()}@example.test`;
    await invite(owner, circle, email);
    const late = makeClient(app.base);
    const { res, payload } = await signUp(late, { email });
    assert.equal(res.status, 200);
    const pending = await db.get("SELECT id FROM circle_invitations WHERE email = ? AND status = 'pending'", [email]);
    assert.equal((await late.post(`/api/family/invitations/${pending.id}/accept`, {})).status, 403, 'registering the address proves nothing');
    await verifyEmailOf(late, payload.email);
    assert.equal((await late.post(`/api/family/invitations/${pending.id}/accept`, {})).status, 200);
  });

  // ---- the negative matrix -------------------------------------------------------------------------------
  await t.test('negative matrix: a stranger, a removed member, an invited-not-accepted person and another circle’s member are denied everywhere', async () => {
    const owner = await person();
    const circle = await circleOf(owner, 'Matrix');
    const other = await person();
    const otherCircle = await circleOf(other, 'Elsewhere');
    const stranger = await person();
    const invited = await person();
    await invite(owner, circle, invited.email);
    const removed = await person();
    await removed.c.post('/api/family/join', { code: circle.code });
    const member = (await owner.c.get(`/api/family/${circle.id}`)).data.family.members.find((m) => m.userId === removed.id);
    assert.equal((await owner.c.del(`/api/family/${circle.id}/members/${member.id}`)).status, 200);

    // Something real to protect.
    const item = await owner.c.post(`/api/family/${circle.id}/shopping`, { name: 'Milk' });
    assert.equal(item.status, 201);
    const msg = await owner.c.post(`/api/chat/${circle.id}/messages`, { body: 'private words' });
    assert.equal(msg.status, 201);
    const msgId = msg.data.message.id;
    const bill = await owner.c.post('/api/bills', { name: 'Rent', amount: 100, dueDate: '2030-01-01', category: 'rent', familyId: circle.id });
    assert.equal(bill.status, 201);

    const surfaces = (circleId, itemId, mid) => [
      ['GET', `/api/family/${circleId}`],
      ['GET', `/api/family/${circleId}/activity`],
      ['GET', `/api/family/${circleId}/shopping`],
      ['POST', `/api/family/${circleId}/shopping`, { name: 'Intruder item' }],
      ['PATCH', `/api/family/${circleId}/shopping/${itemId}`, { done: true }],
      ['DELETE', `/api/family/${circleId}/shopping/${itemId}`],
      ['GET', `/api/chat/${circleId}/messages`],
      ['POST', `/api/chat/${circleId}/messages`, { body: 'let me in' }],
      ['POST', `/api/chat/${circleId}/messages/${mid}/react`, { emoji: '👍' }],
      ['POST', `/api/family/${circleId}/members`, { phone: '+38344123456' }],
      ['PATCH', `/api/family/${circleId}/members/1`, { role: 'admin' }],
      ['DELETE', `/api/family/${circleId}/members/1`],
      ['GET', `/api/family/${circleId}/invitations`],
      ['POST', `/api/family/${circleId}/invitations`, { email: 'friend@example.test' }],
      ['POST', `/api/family/${circleId}/invite-code/regenerate`, {}],
      ['GET', `/api/family/${circleId}/mute`],
    ];
    for (const [label, who] of [['stranger', stranger], ['removed member', removed], ['invited but not accepted', invited], ['member of another circle', other]]) {
      for (const [method, url, body] of surfaces(circle.id, item.data.item.id, msgId)) {
        const r = await who.c[method === 'DELETE' ? 'del' : method.toLowerCase()](url, body);
        assert.ok([403, 404].includes(r.status), `${label}: ${method} ${url} answered ${r.status}`);
        assert.equal(JSON.stringify(r.data || '').includes('private words'), false, `${label}: ${url} leaked a message`);
      }
    }
    // The family bill cannot be seen, paid or changed by them either, and nothing was written.
    for (const who of [stranger, removed, invited, other]) {
      assert.equal((await who.c.get(`/api/bills/${bill.data.bill.id}`)).status, 404);
      assert.equal((await who.c.post('/api/bills', { name: 'Hijack', amount: 1, dueDate: '2030-01-01', category: 'rent', familyId: circle.id })).status, 403);
    }
    assert.equal(Number((await db.get('SELECT COUNT(*) AS c FROM shopping_items WHERE family_id = ?', [circle.id])).c), 1);
    assert.equal(Number((await db.get('SELECT COUNT(*) AS c FROM messages WHERE family_id = ?', [circle.id])).c), 1);
    assert.equal((await db.get('SELECT done FROM shopping_items WHERE family_id = ?', [circle.id])).done, 0);
    // The invited person's own pending invitation was not turned into access by all this.
    assert.equal(await isMember(circle, invited), false);
    // The unaffected owner still sees everything.
    assert.equal((await owner.c.get(`/api/chat/${circle.id}/messages`)).data.messages.length, 1);
    assert.ok(otherCircle.id);
  });
});
