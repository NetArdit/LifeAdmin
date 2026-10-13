const test = require('node:test');
const assert = require('node:assert/strict');
const mailer = require('../src/lib/mailer');

test('start-up notice explains the outbox and is silent for real mail', () => {
  const old = { ...process.env };
  delete process.env.MAIL_TRANSPORT;
  process.env.NODE_ENV = 'development';
  assert.match(mailer.startupNotice(), /printed here in the server console/);
  process.env.MAIL_TRANSPORT = 'smtp';
  assert.equal(mailer.startupNotice(), null);
  process.env = old;
});
