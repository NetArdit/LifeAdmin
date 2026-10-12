// The Groq path of the AI gateway, against a local server that answers as Groq does. What must hold: the
// request carries the key and asks for JSON; an answer of the right shape is accepted; an answer of the wrong
// shape is asked for once more and then refused, never passed on; the provider's own words are never shown.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

test('AI gateway: Groq', async (t) => {
  const seen = [];
  let answers = [];
  const mock = http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => (body += d));
    req.on('end', () => {
      seen.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(body) });
      const next = answers.shift() ?? { status: 500, content: '' };
      res.writeHead(next.status, { 'content-type': 'application/json' });
      res.end(next.status === 200 ? JSON.stringify({ choices: [{ message: { role: 'assistant', content: next.content } }] }) : JSON.stringify({ error: { message: 'secret provider detail gsk_should_never_be_shown' } }));
    });
  });
  await new Promise((r) => mock.listen(0, r));
  process.env.GROQ_API_KEY = 'gsk_test_key';
  process.env.GROQ_API_BASE = `http://127.0.0.1:${mock.address().port}/openai/v1`;
  process.env.NODE_ENV = 'test';
  delete process.env.ANTHROPIC_API_KEY;
  delete require.cache[require.resolve('../src/lib/ai')];
  const ai = require('../src/lib/ai');
  t.after(() => {
    delete process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_BASE;
    mock.close();
  });

  await t.test('is configured by its own key, without any Anthropic key', () => {
    assert.equal(ai.isConfigured(), true);
  });

  await t.test('sends the key, the model and a request for JSON, and accepts an answer of the right shape', async () => {
    seen.length = 0;
    answers = [{ status: 200, content: JSON.stringify({ headline: 'A calm week', highlights: ['Two bills paid'], forgettingChecklist: [] }) }];
    const out = await ai.weeklyReview({ tasks: [] });
    assert.equal(seen.length, 1);
    assert.equal(seen[0].url, '/openai/v1/chat/completions');
    assert.equal(seen[0].auth, 'Bearer gsk_test_key');
    assert.equal(seen[0].body.response_format.type, 'json_object');
    assert.equal(typeof seen[0].body.model, 'string');
    assert.match(seen[0].body.messages[0].content, /JSON Schema/);
    assert.equal(seen[0].body.messages[1].content, JSON.stringify({ tasks: [] }), 'the context goes as the user message, unchanged');
    assert.deepEqual(out, { ok: true, data: { headline: 'A calm week', highlights: ['Two bills paid'], forgettingChecklist: [] } });
  });

  await t.test('asks once more when the answer is not the JSON asked for, then refuses it', async () => {
    seen.length = 0;
    answers = [{ status: 200, content: 'Sure! Here are some tips.' }, { status: 200, content: '{"unexpected": true}' }];
    const out = await ai.weeklyReview({ tasks: [] });
    assert.equal(seen.length, 2, 'one retry, no more');
    assert.deepEqual(out, { ok: false, error: 'AI returned a response that could not be parsed. Please try again.' });
  });

  await t.test('accepts a weekly review of the right shape', async () => {
    answers = [{ status: 200, content: JSON.stringify({ headline: 'Javë e qetë', highlights: ['Dy fatura të paguara'], forgettingChecklist: ['A e keni caktuar kontrollin vjetor?'] }) }];
    const out = await ai.weeklyReview({ tasks: [] });
    assert.deepEqual(out, { ok: true, data: { headline: 'Javë e qetë', highlights: ['Dy fatura të paguara'], forgettingChecklist: ['A e keni caktuar kontrollin vjetor?'] } });
  });

  await t.test('says what happened in its own words when the provider refuses, never in the provider\'s', async () => {
    for (const [status, pattern] of [[429, /rate-limited/], [401, /authentication failed/], [503, /temporarily unavailable/]]) {
      answers = [{ status, content: '' }];
      const out = await ai.weeklyReview({ tasks: [] });
      assert.equal(out.ok, false);
      assert.match(out.error, pattern);
      assert.doesNotMatch(out.error, /gsk_|secret provider detail/);
    }
  });

  await t.test('a provider that cannot be reached is a clear failure, not an exception', async () => {
    const saved = process.env.GROQ_API_BASE;
    process.env.GROQ_API_BASE = 'http://127.0.0.1:1/openai/v1';
    const out = await ai.weeklyReview({ tasks: [] });
    process.env.GROQ_API_BASE = saved;
    assert.equal(out.ok, false);
    assert.equal(typeof out.error, 'string');
  });
});
