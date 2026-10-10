const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('family', async (t) => {
  const app = await startApp();
  t.after(() => app.close());

  await t.test('create a family, list it, get it by id', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const created = await c.post('/api/family', { name: 'The Testers' });
    assert.equal(created.status, 201);
    assert.equal(created.data.family.members.length, 1);
    assert.equal(created.data.family.members[0].role, 'owner');
    assert.ok(created.data.family.inviteCode);

    const list = await c.get('/api/family');
    assert.equal(list.data.families.length, 1);

    const detail = await c.get(`/api/family/${created.data.family.id}`);
    assert.equal(detail.status, 200);
  });

  await t.test('add a member by phone, and a non-owner/admin cannot add members', async () => {
    const owner = makeClient(app.base);
    await signUp(owner);
    const family = await owner.post('/api/family', { name: 'Add By Phone Family' });
    const familyId = family.data.family.id;

    const added = await owner.post(`/api/family/${familyId}/members`, { phone: '+38344999888', displayName: 'Grandma' });
    assert.equal(added.status, 201);
    assert.equal(added.data.member.displayName, 'Grandma');
    assert.equal(added.data.member.registered, false);

    // A registered member added this way, then demoted to 'member', cannot add others.
    const memberClient = makeClient(app.base);
    const { res: memberUser } = await signUp(memberClient);
    await owner.post(`/api/family/${familyId}/members`, { phone: memberUser.data.user.phone });
    const memberFamily = await memberClient.get('/api/family');
    assert.equal(memberFamily.data.families.length, 1);

    const forbidden = await memberClient.post(`/api/family/${familyId}/members`, { phone: '+38344111000' });
    assert.equal(forbidden.status, 403);
  });

  await t.test('owner can change a member role; the owner role itself cannot be removed', async () => {
    const owner = makeClient(app.base);
    await signUp(owner);
    const family = await owner.post('/api/family', { name: 'Roles Family' });
    const familyId = family.data.family.id;
    const added = await owner.post(`/api/family/${familyId}/members`, { phone: '+38344777000' });
    const memberId = added.data.member.id;

    const promoted = await owner.patch(`/api/family/${familyId}/members/${memberId}`, { role: 'admin' });
    assert.equal(promoted.status, 200);

    const ownerMember = family.data.family.members[0];
    const removeOwner = await owner.del(`/api/family/${familyId}/members/${ownerMember.id}`);
    assert.equal(removeOwner.status, 400);
  });

  // --- Fix #5: invite-code join flow (previously non-functional) ---
  await t.test('join fix: an invite code that does not exist is rejected', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const res = await c.post('/api/family/join', { code: 'NOTAREALCODE' });
    assert.equal(res.status, 400);
  });

  await t.test('join fix: joining with a valid invite code adds the joiner as a member', async () => {
    const owner = makeClient(app.base);
    await signUp(owner);
    const family = await owner.post('/api/family', { name: 'Joinable Family' });
    const inviteCode = family.data.family.inviteCode;

    const joiner = makeClient(app.base);
    await signUp(joiner);
    const joined = await joiner.post('/api/family/join', { code: inviteCode.toLowerCase() });
    assert.equal(joined.status, 201, 'join should accept a lowercase code too');
    assert.equal(joined.data.family.id, family.data.family.id);

    const joinerFamilies = await joiner.get('/api/family');
    assert.equal(joinerFamilies.data.families.length, 1);
    assert.equal(joinerFamilies.data.families[0].members.length, 2);
  });

  await t.test('join fix: joining twice with the same code is rejected the second time', async () => {
    const owner = makeClient(app.base);
    await signUp(owner);
    const family = await owner.post('/api/family', { name: 'No Double Join' });

    const joiner = makeClient(app.base);
    await signUp(joiner);
    const first = await joiner.post('/api/family/join', { code: family.data.family.inviteCode });
    assert.equal(first.status, 201);
    const second = await joiner.post('/api/family/join', { code: family.data.family.inviteCode });
    assert.equal(second.status, 400);
  });

  await t.test('join fix: joining claims a pre-existing phone-invited placeholder row instead of duplicating', async () => {
    const owner = makeClient(app.base);
    await signUp(owner);
    const family = await owner.post('/api/family', { name: 'Placeholder Claim Family' });
    const familyId = family.data.family.id;

    // Owner invites a phone number that ISN'T registered yet — this is the
    // "member invited but not yet registered" placeholder row (user_id NULL).
    const unregisteredPhone = '+38344700700';
    const invited = await owner.post(`/api/family/${familyId}/members`, { phone: unregisteredPhone, displayName: 'Future Member' });
    assert.equal(invited.data.member.registered, false);

    // That person signs up afterward, using the same phone number, then
    // redeems the invite code — this should claim the placeholder row
    // rather than create a second, duplicate membership row.
    const joiner = makeClient(app.base);
    const { res: joinerUser } = await signUp(joiner, { phone: unregisteredPhone });

    const joined = await joiner.post('/api/family/join', { code: family.data.family.inviteCode });
    assert.equal(joined.status, 201);
    assert.equal(joined.data.family.members.length, 2, 'should still be exactly 2 members (owner + claimed placeholder), not 3');
    const claimedMember = joined.data.family.members.find((m) => m.userId === joinerUser.data.user.id);
    assert.ok(claimedMember, 'the placeholder row should now be linked to the joiner user id');
  });

  await t.test('shopping list: add, toggle, remove', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const family = await c.post('/api/family', { name: 'Shopping Family' });
    const familyId = family.data.family.id;

    const item = await c.post(`/api/family/${familyId}/shopping`, { name: 'Milk', quantity: '2L' });
    assert.equal(item.status, 201);
    const itemId = item.data.item.id;

    const toggled = await c.patch(`/api/family/${familyId}/shopping/${itemId}`, { done: true });
    assert.equal(toggled.status, 200);

    const list = await c.get(`/api/family/${familyId}/shopping`);
    assert.equal(list.data.items.find((i) => i.id === itemId).done, 1);

    const removed = await c.del(`/api/family/${familyId}/shopping/${itemId}`);
    assert.equal(removed.status, 200);
  });

  await t.test('activity log reflects family creation', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const family = await c.post('/api/family', { name: 'Activity Family' });
    const activity = await c.get(`/api/family/${family.data.family.id}/activity`);
    assert.equal(activity.status, 200);
    assert.ok(activity.data.activity.length >= 1);
  });

  await t.test('chat: send and list messages within a family', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const family = await c.post('/api/family', { name: 'Chat Family' });
    const familyId = family.data.family.id;

    const sent = await c.post(`/api/chat/${familyId}/messages`, { body: 'hello family' });
    assert.equal(sent.status, 201);

    const list = await c.get(`/api/chat/${familyId}/messages`);
    assert.equal(list.status, 200);
    assert.equal(list.data.messages.length, 1);
    assert.equal(list.data.messages[0].body, 'hello family');
  });
});
