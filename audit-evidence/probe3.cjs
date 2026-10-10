const P = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const { startApp, makeClient, signUp } = require(P + '/test/helpers.js');
(async () => {
  const app = await startApp();
  const c = makeClient(app.base); await signUp(c);
  const f = (await c.post('/api/family', { name: 'F' })).data.family;
  for (let i = 1; i <= 205; i++) await c.post(`/api/chat/${f.id}/messages`, { body: 'm' + i });
  const msgs = (await c.get(`/api/chat/${f.id}/messages`)).data.messages;
  console.log('posted 205; GET returns', msgs.length, 'first=', msgs[0].body, 'last=', msgs[msgs.length - 1].body);
  const t0 = Date.now(); for (let i = 0; i < 20; i++) await c.get(`/api/chat/${f.id}/messages`); console.log('20 polls of 200 msgs ms:', Date.now() - t0);
  // task list scale
  for (let i = 0; i < 300; i++) await c.post('/api/tasks', { title: 'task ' + i });
  const t1 = Date.now(); const r = await c.get('/api/tasks'); console.log('GET /api/tasks with 300 tasks: ms', Date.now() - t1, 'count', r.data.tasks.length, 'bytes', JSON.stringify(r.data).length);
  await app.close(); process.exit(0);
})();
