// AI Recovery phase: verifies the structured-output boundary (src/lib/ai.js) against a LOCAL
// mock Anthropic server — never the real provider, no credentials exist in this environment.
//
// This proves two specific things that were broken before this phase, independently of each
// other, and distinguishes them from "the real AI feature works" (which needs a real key):
//   1. zodOutputFormat() no longer throws building the JSON Schema for every real app schema
//      (the zod 3 vs SDK-needs-zod-4 defect).
//   2. the request the SDK actually sends carries `output_format` (not the previous, silently
//      ignored `output_config: { effort, format }`), and the mocked provider's response is
//      correctly turned into `response.parsed_output` / `{ok:true, data:...}`.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { startApp, makeClient, signUp } = require('./helpers');

test('AI structured-output boundary (mock provider)', async (t) => {
  const calls = [];
  let mode = 'ok';
  let nextText = null;
  const mock = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const parsed = JSON.parse(body);
      calls.push({ url: req.url, headers: req.headers, body: parsed });
      if (mode === 'hang') return; // never respond -> client-side timeout
      if (mode === 'error') {
        res.writeHead(529, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ type: 'error', error: { type: 'overloaded_error', message: 'PROVIDER-INTERNAL-DETAIL' } }));
      }
      const text = mode === 'malformed_json' ? 'not json at all'
        : mode === 'schema_invalid' ? JSON.stringify({ wrongField: 123 })
        : nextText;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: 'msg_mock', type: 'message', role: 'assistant', model: parsed.model,
        content: [{ type: 'text', text }],
        stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 },
      }));
    });
  });
  await new Promise((r) => mock.listen(0, '127.0.0.1', r));
  t.after(() => new Promise((r) => mock.close(r)));

  const FAKE_KEY = 'sk-ant-test-FAKE-do-not-use';
  process.env.ANTHROPIC_API_KEY = FAKE_KEY;
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${mock.address().port}`;
  t.after(() => { delete process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_BASE_URL; });

  // Fresh module instance bound to the mock (the SDK client is memoized on first use).
  delete require.cache[require.resolve('../src/lib/ai')];
  const ai = require('../src/lib/ai');

  const logs = [];
  const origError = console.error;
  const capture = () => { logs.length = 0; console.error = (...a) => logs.push(a.map(String).join(' ')); };
  const release = () => { console.error = origError; };
  t.after(release);

  await t.test('isConfigured() is true once a key is set', () => {
    assert.equal(ai.isConfigured(), true);
  });

  await t.test('every real app schema builds a request without throwing, and the wire body carries output_format (not output_config)', async () => {
    mode = 'ok';
    const cases = [
      ['assistantChat', () => ai.assistantChat({ message: 'hi', context: {}, history: [] }), { reply: 'hello', suggestions: ['a', 'b'] }],
      ['parseLifePlan', () => ai.parseLifePlan({ text: 'gym daily', today: '2026-01-01', weekday: 'thu' }), {
        summary: 's', workStart: '09:00', workEnd: null,
        activities: [{ label: 'gym', totalMinutesPerDay: 60, minBlockMinutes: 30, earliest: null, latest: '20:00', priority: 3, days: ['mon'] }],
        notes: ['n'],
      }],
      ['analyzeDecision', () => ai.analyzeDecision({ question: 'q?', existingOptions: ['A'], existingCriteria: [] }), {
        suggestedCriteria: [{ name: 'Cost', weight: 3 }],
        options: [{ name: 'A', pros: ['p'], cons: ['c'], risks: [], ratings: { Cost: 4 } }],
        missingInfo: [], reasoningSummary: 'r',
      }],
      ['billInsights', () => ai.billInsights({ monthlyTotal: 10, byCategory: {}, billCount: 1 }), { insights: ['i1'] }],
      ['ecoTips', () => ai.ecoTips({ recentLogs: [] }), { tips: [{ area: 'a', tip: 't' }] }],
      ['suggestMilestones', () => ai.suggestMilestones({ title: 'g', description: null, targetDate: null, today: '2026-01-01' }), { milestones: [{ title: 'm', dueOffsetDays: 3 }] }],
      ['weeklyReview', () => ai.weeklyReview({ completedTasksLast7Days: 1 }), { headline: 'h', highlights: [], forgettingChecklist: [] }],
    ];
    for (const [name, invoke, replyShape] of cases) {
      nextText = JSON.stringify(replyShape);
      calls.length = 0;
      const result = await invoke();
      assert.equal(result.ok, true, `${name}: ${JSON.stringify(result)}`);
      assert.deepEqual(result.data, replyShape, `${name}: parsed_output should equal what the mock returned`);
      assert.equal(calls.length, 1, `${name}: exactly one provider request`);
      const sent = calls[0].body;
      assert.ok(!('output_config' in sent), `${name}: the old, silently-ignored field must be gone`);
      assert.ok('output_format' in sent, `${name}: the field the SDK actually reads must be present`);
      assert.equal(sent.output_format.type, 'json_schema');
      assert.equal(typeof sent.output_format.schema, 'object');
      assert.ok(!('parse' in sent.output_format), 'the client-side parse() function must not be serialized onto the wire');
      // Anthropic's API auth convention is `x-api-key` (unlike, e.g., OpenAI's Bearer scheme).
      assert.equal(calls[0].headers['x-api-key'], FAKE_KEY);
      assert.match(calls[0].url, /^\/v1\/messages/);
    }
  });

  await t.test('malformed (non-JSON) provider text is a clean ok:false, not a thrown error or a crash', async () => {
    mode = 'malformed_json';
    const result = await ai.assistantChat({ message: 'hi', context: {}, history: [] });
    assert.equal(result.ok, false);
    assert.match(result.error, /request failed unexpectedly|could not be parsed/i);
  });

  await t.test('schema-invalid provider JSON (valid JSON, wrong shape) is a clean ok:false via the schema\'s own validation', async () => {
    mode = 'schema_invalid';
    const result = await ai.assistantChat({ message: 'hi', context: {}, history: [] });
    assert.equal(result.ok, false);
    assert.match(result.error, /request failed unexpectedly|could not be parsed/i);
  });

  await t.test('provider error responses are mapped to a friendly message; the provider body is never surfaced to the caller', async () => {
    mode = 'error';
    capture();
    const result = await ai.assistantChat({ message: 'hi', context: {}, history: [] });
    release();
    assert.equal(result.ok, false);
    assert.doesNotMatch(result.error, /PROVIDER-INTERNAL-DETAIL/);
    assert.ok(!logs.some((l) => l.includes('PROVIDER-INTERNAL-DETAIL')), 'provider body must not reach the server logs either');
    mode = 'ok';
  });

  await t.test('provider unreachable / timeout does not hang and does not throw out of callStructured', async () => {
    mode = 'hang';
    process.env.ANTHROPIC_TIMEOUT_MS_TEST_ONLY = '1'; // not read by the SDK; timeout exercised via a dead port instead
    delete require.cache[require.resolve('../src/lib/ai')];
    const savedBase = process.env.ANTHROPIC_BASE_URL;
    process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:1'; // a port nothing listens on
    const aiUnreachable = require('../src/lib/ai');
    const t0 = Date.now();
    const result = await aiUnreachable.weeklyReview({});
    process.env.ANTHROPIC_BASE_URL = savedBase;
    delete require.cache[require.resolve('../src/lib/ai')];
    assert.equal(result.ok, false);
    assert.ok(Date.now() - t0 < 15000, 'did not hang indefinitely');
    mode = 'ok';
  });

  await t.test('the API key never appears in a returned result, in server logs, or in the request path/query', async () => {
    mode = 'error';
    capture();
    const result = await ai.assistantChat({ message: 'hi', context: {}, history: [] });
    release();
    assert.ok(!JSON.stringify(result).includes(FAKE_KEY));
    assert.ok(!logs.some((l) => l.includes(FAKE_KEY)));
    assert.ok(!calls[calls.length - 1].url.includes(FAKE_KEY));
    mode = 'ok';
  });

  // ---- Through the HTTP routes: full request/response, response never leaks the key ----
  await t.test('the /api/ai routes exercise the same fixed path end to end and never leak the key in their JSON response', async () => {
    mode = 'ok';
    nextText = JSON.stringify({ reply: 'route reply', suggestions: [] });
    const app = await startApp();
    t.after(() => app.close());
    const c = makeClient(app.base);
    await signUp(c);
    const chat = await c.post('/api/ai/chat', { message: 'what is on my plate today' });
    assert.equal(chat.status, 200);
    assert.equal(chat.data.ok, true);
    assert.equal(chat.data.data.reply, 'route reply');
    assert.ok(!JSON.stringify(chat.data).includes(FAKE_KEY));

    nextText = JSON.stringify({ headline: 'h', highlights: ['x'], forgettingChecklist: [] });
    const review = await c.post('/api/ai/weekly-review', {});
    assert.equal(review.status, 200);
    assert.equal(review.data.ok, true);
    assert.equal(review.data.data.headline, 'h');

    nextText = JSON.stringify({ summary: 's', workStart: null, workEnd: null, activities: [], notes: [] });
    const plan = await c.post('/api/ai/plan', { text: 'a calm week' });
    assert.equal(plan.status, 200);
    assert.equal(plan.data.ok, true);
    assert.equal(plan.data.plan.summary, 's');
  });
});
