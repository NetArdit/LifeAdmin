const path = require('path');
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const { z } = require(path.join(ROOT, 'node_modules/zod'));       // what src/lib/ai.js currently imports (v3 API)
const v4 = require(path.join(ROOT, 'node_modules/zod/v4'));

// The app's actual schema shapes (copied verbatim from src/lib/ai.js), built with the SAME
// `z` import the app already uses everywhere else.
const AssistantReplySchema = z.object({
  reply: z.string().describe('Conversational reply to the user, in the language they wrote in.'),
  suggestions: z.array(z.string()).max(4).describe('Short follow-up suggestions the user could tap.'),
});

console.log('--- Can v4.toJSONSchema() accept a schema object built via the app\'s existing root `zod` (v3) import? ---');
try {
  const schema = v4.toJSONSchema(AssistantReplySchema, { reused: 'ref' });
  console.log('YES:', JSON.stringify(schema).slice(0, 400));
} catch (e) {
  console.log('NO:', e.constructor.name, e.message.slice(0, 300));
}

console.log('\n--- Does AssistantReplySchema.safeParse still work as before (unchanged validation)? ---');
const good = AssistantReplySchema.safeParse({ reply: 'hi', suggestions: ['a', 'b'] });
const bad = AssistantReplySchema.safeParse({ reply: 123 });
console.log('valid payload success:', good.success);
console.log('invalid payload success (should be false):', bad.success, bad.success ? '' : bad.error.issues[0].message);

console.log('\n--- Is the object returned by z.object() from root zod actually an instance zod/v4 recognizes as its own class? ---');
console.log('AssistantReplySchema instanceof v4.ZodType:', AssistantReplySchema instanceof v4.ZodType);
console.log('constructor.name:', AssistantReplySchema.constructor.name);
