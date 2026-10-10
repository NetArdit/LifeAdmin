const path = require('path');
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const v4 = require(path.join(ROOT, 'node_modules/zod/v4'));
console.log('zod/v4 has toJSONSchema:', typeof v4.toJSONSchema);
console.log('zod/v4 has object/string/number/array/enum:', typeof v4.object, typeof v4.string, typeof v4.number, typeof v4.array, typeof v4.enum);

// Hypothesis A: build the schema with zod v4's constructors directly, matching the app's existing shapes.
const schemaV4 = v4.object({
  reply: v4.string().describe('Conversational reply'),
  suggestions: v4.array(v4.string()).max(4),
});
const { betaZodOutputFormat } = require(path.join(ROOT, 'node_modules/@anthropic-ai/sdk/helpers/beta/zod'));
try {
  const fmt = betaZodOutputFormat(schemaV4);
  console.log('OPTION A WORKS. schema:', JSON.stringify(fmt.schema).slice(0, 300));
  const parsed = fmt.parse(JSON.stringify({ reply: 'hi', suggestions: ['a'] }));
  console.log('parse() round-trips through the v4 schema:', JSON.stringify(parsed));
  try { fmt.parse(JSON.stringify({ reply: 123 })); console.log('BAD: invalid payload did not throw'); }
  catch (e) { console.log('invalid payload correctly rejected by parse():', e.message.slice(0,120)); }
} catch (e) {
  console.log('OPTION A FAILS:', e.constructor.name, e.message);
}
