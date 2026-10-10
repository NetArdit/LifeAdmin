const path = require('path');
const http = require('http');
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const Anthropic = require(path.join(ROOT, 'node_modules/@anthropic-ai/sdk'));
const { AnthropicError } = require(path.join(ROOT, 'node_modules/@anthropic-ai/sdk/error'));
const { transformJSONSchema } = require(path.join(ROOT, 'node_modules/@anthropic-ai/sdk/lib/transform-json-schema.js'));
const z = require(path.join(ROOT, 'node_modules/zod/v4'));

// The exact local replacement I intend to write in src/lib/ai.js
function zodOutputFormat(schema) {
  const jsonSchema = transformJSONSchema(z.toJSONSchema(schema, { reused: 'ref' }));
  return {
    type: 'json_schema',
    schema: jsonSchema,
    parse: (content) => {
      const output = schema.safeParse(JSON.parse(content));
      if (!output.success) throw new AnthropicError(`Failed to parse structured output: ${output.error.message}`);
      return output.data;
    },
  };
}

// All 7 real schemas, copied verbatim, only the `z` import changed to zod/v4.
const LifePlanSchema = z.object({
  summary: z.string().describe('One short sentence describing what the user wants.'),
  workStart: z.string().nullable().describe('HH:MM 24h, or null if not mentioned'),
  workEnd: z.string().nullable().describe('HH:MM 24h, or null if not mentioned'),
  activities: z.array(z.object({
    label: z.string(),
    totalMinutesPerDay: z.number().int().min(15).max(720),
    minBlockMinutes: z.number().int().min(10).max(240),
    earliest: z.string().nullable(),
    latest: z.string().nullable(),
    priority: z.number().int().min(1).max(5),
    days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])),
  })),
  notes: z.array(z.string()),
});
const AssistantReplySchema = z.object({ reply: z.string(), suggestions: z.array(z.string()).max(4) });
const DecisionAnalysisSchema = z.object({
  suggestedCriteria: z.array(z.object({ name: z.string(), weight: z.number().int().min(1).max(5) })).max(6),
  options: z.array(z.object({
    name: z.string(), pros: z.array(z.string()).max(5), cons: z.array(z.string()).max(5), risks: z.array(z.string()).max(4),
    ratings: z.record(z.string(), z.number().int().min(1).max(5)),
  })),
  missingInfo: z.array(z.string()).max(5),
  reasoningSummary: z.string(),
});
const InsightsSchema = z.object({ insights: z.array(z.string()).max(4) });
const EcoTipsSchema = z.object({ tips: z.array(z.object({ area: z.string(), tip: z.string() })).max(5) });
const MilestonesSchema = z.object({ milestones: z.array(z.object({ title: z.string(), dueOffsetDays: z.number().int().min(1).max(365) })).max(8) });
const WeeklyReviewSchema = z.object({ headline: z.string(), highlights: z.array(z.string()).max(5), forgettingChecklist: z.array(z.string()).max(5) });

const all = { LifePlanSchema, AssistantReplySchema, DecisionAnalysisSchema, InsightsSchema, EcoTipsSchema, MilestonesSchema, WeeklyReviewSchema };
console.log('=== Step 1: build zodOutputFormat() for all 7 real app schemas, no throw expected ===');
const formats = {};
for (const [name, schema] of Object.entries(all)) {
  try {
    formats[name] = zodOutputFormat(schema);
    console.log(`OK  ${name} -> json schema type=${formats[name].schema.type}`);
  } catch (e) {
    console.log(`FAIL ${name}:`, e.constructor.name, e.message);
  }
}

(async () => {
  const mock = http.createServer((req, res) => {
    let body = ''; req.on('data', c => body += c);
    req.on('end', () => {
      const parsed = JSON.parse(body);
      let text;
      if (parsed.model === 'BAD') text = 'not even json';
      else if (parsed.model === 'INVALID_SHAPE') text = JSON.stringify({ reply: 42 });
      else text = mock.nextText;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'm', type: 'message', role: 'assistant', model: parsed.model, content: [{ type: 'text', text }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } }));
    });
  });
  await new Promise(r => mock.listen(0, '127.0.0.1', r));
  const client = new Anthropic({ apiKey: 'sk-ant-fake', baseURL: `http://127.0.0.1:${mock.address().port}` });

  console.log('\n=== Step 2: full round-trip through the REAL SDK for the simple and the most complex schema ===');
  mock.nextText = JSON.stringify({ reply: 'hi there', suggestions: ['x'] });
  const r1 = await client.beta.messages.parse({ model: 'claude-opus-5', max_tokens: 200, system: 's', output_format: formats.AssistantReplySchema, messages: [{ role: 'user', content: 'hi' }] });
  console.log('AssistantReplySchema parsed_output:', JSON.stringify(r1.parsed_output));

  mock.nextText = JSON.stringify({ summary: 'plan', workStart: '09:00', workEnd: null, activities: [{ label: 'gym', totalMinutesPerDay: 60, minBlockMinutes: 30, earliest: null, latest: '20:00', priority: 3, days: ['mon', 'wed'] }], notes: ['n1'] });
  const r2 = await client.beta.messages.parse({ model: 'claude-opus-5', max_tokens: 200, system: 's', output_format: formats.LifePlanSchema, messages: [{ role: 'user', content: 'hi' }] });
  console.log('LifePlanSchema (nested+nullable+enum) parsed_output:', JSON.stringify(r2.parsed_output));

  console.log('\n=== Step 3: malformed provider output is handled without throwing out of parse() ===');
  try {
    await client.beta.messages.parse({ model: 'BAD', max_tokens: 200, system: 's', output_format: formats.AssistantReplySchema, messages: [{ role: 'user', content: 'hi' }] });
    console.log('FAIL: no error thrown for non-JSON text');
  } catch (e) { console.log('non-JSON provider text correctly throws AnthropicError:', e.constructor.name); }
  try {
    await client.beta.messages.parse({ model: 'INVALID_SHAPE', max_tokens: 200, system: 's', output_format: formats.AssistantReplySchema, messages: [{ role: 'user', content: 'hi' }] });
    console.log('FAIL: no error thrown for schema-invalid JSON');
  } catch (e) { console.log('schema-invalid provider JSON correctly throws AnthropicError:', e.constructor.name, e.message.slice(0, 80)); }

  mock.close();
})();
