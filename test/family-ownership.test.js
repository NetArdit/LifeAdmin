// Phase 8.3: explicit ownership transfer + leave family + account deletion after transfer.
const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('family ownership lifecycle', async (t) => {
  const app = await startApp();
  t.after(() => app.close());
  const db = require('../src/db'); // after startApp: bound to the disposable DB

  async function newUser() {
    const c = makeClient(app.base);
    const { payload } = await signUp(c);
    const me = (await c.get('/api/auth/me')).data.user;
    return { c, payload, id: me.id };
  }
  // owner creates a family; each given user joins with the invite code.
  async function makeFamily(owner, ...joiners) {
    const created = (await owner.c.post('/api/family', { name: 'Test Family' })).data.family;
    for (const j of joiners) {
      const r = await j.c.post('/api/family/join', { code: created.inviteCode });
      assert.equal(r.status, 201);
    }
    return (await owner.c.get(`/api/family/${created.id}`)).data.family;
  }
  const memberOf = (family, userId) => family.members.find((m) => m.userId === userId);
  const ownerRows = async (familyId) => await db.all("SELECT * FROM family_members WHERE family_id = ? AND role = 'owner'", [familyId]);

  await t.test('owner transfers ownership: both ownership fields change, old owner becomes a member, nothing is deleted', async () => {
    const a = await newUser(), b = await newUser(), c = await newUser();
    const fam = await makeFamily(a, b, c);
    const res = await a.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: (await memberOf(fam, b.id)).id });
    assert.equal(res.status, 200);
    const after = res.data.family;
    assert.equal(after.ownerId, b.id);
    assert.equal((await memberOf(after, b.id)).role, 'owner');
    assert.equal((await memberOf(after, a.id)).role, 'member');
    assert.equal((await memberOf(after, c.id)).role, 'member');
    assert.equal(after.members.length, 3, 'no membership removed');
    const rows = await ownerRows(fam.id);
    assert.equal(rows.length, 1, 'exactly one owner row');
    assert.equal(rows[0].user_id, b.id);
    assert.equal((await db.get('SELECT owner_id FROM families WHERE id = ?', [fam.id])).owner_id, b.id, 'families.owner_id agrees with the owner row');
    const feed = (await b.c.get(`/api/family/${fam.id}/activity`)).data.activity;
    assert.ok(feed.some((x) => x.type === 'ownership_transferred'));
    const notes = (await b.c.get('/api/notifications')).data;
    assert.ok(JSON.stringify(notes).includes('now the owner'), 'new owner is notified');
  });

  await t.test('only the owner may transfer: member, admin and outsider are refused (backend-enforced) and nothing changes', async () => {
    const a = await newUser(), b = await newUser(), c = await newUser(), outsider = await newUser();
    const fam = await makeFamily(a, b, c);
    await a.c.patch(`/api/family/${fam.id}/members/${(await memberOf(fam, c.id)).id}`, { role: 'admin' });
    const targetId = (await memberOf(fam, c.id)).id;
    for (const [who, label] of [[b, 'member'], [c, 'admin'], [outsider, 'outsider']]) {
      const r = await who.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: targetId });
      assert.equal(r.status, 403, `${label} must be refused`);
    }
    const unauth = await makeClient(app.base).post(`/api/family/${fam.id}/transfer-ownership`, { memberId: targetId });
    assert.equal(unauth.status, 401);
    assert.equal((await db.get('SELECT owner_id FROM families WHERE id = ?', [fam.id])).owner_id, a.id);
    assert.equal((await ownerRows(fam.id))[0].user_id, a.id);
  });

  await t.test('invalid targets are rejected: self, unknown, other family\'s member, unregistered placeholder, missing id', async () => {
    const a = await newUser(), b = await newUser(), x = await newUser(), y = await newUser();
    const fam = await makeFamily(a, b);
    const otherFam = await makeFamily(x, y);
    const url = `/api/family/${fam.id}/transfer-ownership`;
    assert.equal((await a.c.post(url, { memberId: (await memberOf(fam, a.id)).id })).status, 400, 'self');
    assert.equal((await a.c.post(url, { memberId: 999999 })).status, 404, 'unknown');
    assert.equal((await a.c.post(url, { memberId: (await memberOf(otherFam, y.id)).id })).status, 404, 'member of a different family');
    assert.equal((await a.c.post(url, {})).status, 400, 'missing');
    assert.equal((await a.c.post(url, { memberId: 'abc' })).status, 400, 'non-numeric');
    await a.c.post(`/api/family/${fam.id}/members`, { phone: '+38344123456' });
    const placeholder = (await a.c.get(`/api/family/${fam.id}`)).data.family.members.find((m) => !m.registered);
    const r = await a.c.post(url, { memberId: placeholder.id });
    assert.equal(r.status, 400, 'unregistered invited member cannot become owner');
    assert.equal((await ownerRows(fam.id))[0].user_id, a.id);
  });

  await t.test('transfer is atomic: if the last step fails, no ownership field has changed', async () => {
    const a = await newUser(), b = await newUser();
    const fam = await makeFamily(a, b);
    await db.exec("CREATE FUNCTION boom_promote_fn() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN IF NEW.role = 'owner' THEN RAISE EXCEPTION 'simulated failure'; END IF; RETURN NEW; END $f$; CREATE TRIGGER boom_promote BEFORE UPDATE OF role ON family_members FOR EACH ROW EXECUTE FUNCTION boom_promote_fn();");
    try {
      const r = await a.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: (await memberOf(fam, b.id)).id });
      assert.equal(r.status, 500);
    } finally {
      await db.exec('DROP TRIGGER boom_promote ON family_members; DROP FUNCTION boom_promote_fn();');
    }
    assert.equal((await db.get('SELECT owner_id FROM families WHERE id = ?', [fam.id])).owner_id, a.id, 'owner_id rolled back');
    const rows = await ownerRows(fam.id);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].user_id, a.id, 'role rolled back — still exactly one owner');
    assert.equal((await db.get('SELECT role FROM family_members WHERE user_id = ? AND family_id = ?', [b.id, fam.id])).role, 'member');
  });

  await t.test('after transfer: old owner has no owner powers; new owner has them (and can transfer back)', async () => {
    const a = await newUser(), b = await newUser(), c = await newUser();
    const fam = await makeFamily(a, b, c);
    await a.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: (await memberOf(fam, b.id)).id });
    const cid = (await memberOf(fam, c.id)).id;
    assert.equal((await a.c.post(`/api/family/${fam.id}/members`, { phone: '+38344999888' })).status, 403);
    assert.equal((await a.c.patch(`/api/family/${fam.id}/members/${cid}`, { role: 'admin' })).status, 403);
    assert.equal((await a.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: cid })).status, 403);
    assert.equal((await a.c.del(`/api/family/${fam.id}/members/${cid}`)).status, 403);
    assert.equal((await b.c.post(`/api/family/${fam.id}/members`, { phone: '+38344999888' })).status, 201, 'new owner can manage');
    assert.equal((await b.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: (await memberOf(fam, a.id)).id })).status, 200, 'and can transfer back');
    assert.equal((await db.get('SELECT owner_id FROM families WHERE id = ?', [fam.id])).owner_id, a.id);
  });

  await t.test('a non-owner can leave: membership removed, family and other members untouched, account intact', async () => {
    const a = await newUser(), b = await newUser(), c = await newUser();
    const fam = await makeFamily(a, b, c);
    const r = await b.c.post(`/api/family/${fam.id}/leave`, {});
    assert.equal(r.status, 200);
    assert.deepEqual((await b.c.get('/api/family')).data.families, [], 'no longer in any family');
    assert.equal((await b.c.get(`/api/family/${fam.id}`)).status, 403, 'and no access to it');
    assert.ok((await b.c.get('/api/auth/me')).data.user, 'account intact');
    const still = (await a.c.get(`/api/family/${fam.id}`)).data.family;
    assert.equal(still.members.length, 2);
    assert.ok(await memberOf(still, c.id));
    assert.ok((await a.c.get(`/api/family/${fam.id}/activity`)).data.activity.some((x) => x.type === 'member_left'));
    assert.equal((await b.c.post(`/api/family/${fam.id}/leave`, {})).status, 403, 'leaving twice: no longer a member');
  });

  await t.test('an owner cannot leave (backend-enforced); an outsider cannot leave someone else\'s family', async () => {
    const a = await newUser(), b = await newUser(), outsider = await newUser();
    const fam = await makeFamily(a, b);
    const r = await a.c.post(`/api/family/${fam.id}/leave`, {});
    assert.equal(r.status, 400);
    assert.match(r.data.error, /transfer ownership/i);
    assert.equal((await ownerRows(fam.id))[0].user_id, a.id);
    assert.equal((await outsider.c.post(`/api/family/${fam.id}/leave`, {})).status, 403);
    assert.equal((await makeClient(app.base).post(`/api/family/${fam.id}/leave`, {})).status, 401);
    assert.equal((await a.c.get(`/api/family/${fam.id}`)).data.family.members.length, 2);
  });

  await t.test('a single-member owner can neither transfer nor leave, and deletion stays blocked with accurate guidance', async () => {
    const a = await newUser();
    const fam = (await a.c.post('/api/family', { name: 'Solo' })).data.family;
    const ownRow = fam.members[0].id;
    assert.equal((await a.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: ownRow })).status, 400);
    assert.equal((await a.c.post(`/api/family/${fam.id}/leave`, {})).status, 400);
    const del = await a.c.del('/api/settings/account', { password: a.payload.password });
    assert.equal(del.status, 400);
    assert.match(del.data.error, /only registered member/i);
    assert.match(del.data.error, /invite code/i);
    assert.match(del.data.error, /isn't available/i, 'honest about delete-family not existing');
    assert.ok((await a.c.get('/api/auth/me')).data.user);
  });

  await t.test('deletion with a registered co-member points to the transfer path that exists, and stays blocked', async () => {
    const a = await newUser(), b = await newUser();
    await makeFamily(a, b);
    const del = await a.c.del('/api/settings/account', { password: a.payload.password });
    assert.equal(del.status, 400);
    assert.match(del.data.error, /Transfer ownership to another member/);
    assert.doesNotMatch(del.data.error, /delete the family/i);
  });

  await t.test('full flow: owner -> transfer -> member -> leave -> delete account; family, new owner and others remain valid', async () => {
    const a = await newUser(), b = await newUser(), c = await newUser();
    const fam = await makeFamily(a, b, c);
    const item = (await a.c.post(`/api/family/${fam.id}/shopping`, { name: 'milk' })).data.item;
    await a.c.post(`/api/chat/${fam.id}/messages`, { body: 'hello from A' });
    const msgsBefore = (await db.get('SELECT COUNT(*) c FROM messages WHERE family_id = ?', [fam.id])).c;

    assert.equal((await a.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: (await memberOf(fam, b.id)).id })).status, 200);
    assert.equal((await a.c.post(`/api/family/${fam.id}/leave`, {})).status, 200);
    const del = await a.c.del('/api/settings/account', { password: a.payload.password });
    assert.equal(del.status, 200);
    assert.equal((await a.c.get('/api/auth/me')).data.user, null);

    const famAfter = (await b.c.get(`/api/family/${fam.id}`)).data.family;
    assert.equal(famAfter.ownerId, b.id);
    assert.equal((await memberOf(famAfter, b.id)).role, 'owner');
    assert.equal((await memberOf(famAfter, c.id)).role, 'member');
    assert.equal(famAfter.members.length, 2);
    assert.equal((await ownerRows(fam.id)).length, 1);
    const shopping = (await c.c.get(`/api/family/${fam.id}/shopping`)).data.items;
    assert.ok(shopping.some((s) => s.id === item.id), 'shared shopping item survives (added_by becomes NULL)');
    // Existing, unchanged schema semantics: messages.user_id cascades with the author's account.
    const msgsAfter = (await db.get('SELECT COUNT(*) c FROM messages WHERE family_id = ?', [fam.id])).c;
    t.diagnostic(`family chat messages before/after the author's account deletion: ${msgsBefore} -> ${msgsAfter}`);
    assert.equal((await db.get('SELECT COUNT(*) c FROM families WHERE id = ?', [fam.id])).c, 1, 'the family itself is untouched');
  });

  await t.test('a former owner who transferred but has not left can still delete their account (membership cascades)', async () => {
    const a = await newUser(), b = await newUser();
    const fam = await makeFamily(a, b);
    await a.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: (await memberOf(fam, b.id)).id });
    assert.equal((await a.c.del('/api/settings/account', { password: a.payload.password })).status, 200);
    assert.equal((await b.c.get(`/api/family/${fam.id}`)).data.family.ownerId, b.id);
  });
}
);
