const P = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const { startApp, makeClient, signUp } = require(P + '/test/helpers.js');
(async () => {
  const app = await startApp();
  const mk = async () => { const c = makeClient(app.base); const { payload } = await signUp(c); return { c, payload, id: (await c.get('/api/auth/me')).data.user.id }; };
  const A = await mk(), B = await mk(), C = await mk();
  const f = (await A.c.post('/api/family', { name: 'F' })).data.family;
  await B.c.post('/api/family/join', { code: f.inviteCode }); await C.c.post('/api/family/join', { code: f.inviteCode });
  const t = (await A.c.post('/api/tasks', { title: 'SECRET private title', familyId: f.id, visibility: 'private', assignedTo: B.id })).data.task;
  await B.c.post(`/api/tasks/${t.id}/comments`, { body: 'SECRET comment body' });
  const cn = (await C.c.get('/api/notifications')).data.notifications;
  console.log('C (third member, cannot see the task) notifications:', JSON.stringify(cn.map((n) => ({ title: n.title, body: n.body }))));
  console.log('C GET task ->', (await C.c.get(`/api/tasks/${t.id}`)).status);
  await app.close(); process.exit(0);
})();
