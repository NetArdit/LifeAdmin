const path = require('path');
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const { z } = require(path.join(ROOT, 'node_modules/zod'));
const { betaZodOutputFormat } = require(path.join(ROOT, 'node_modules/@anthropic-ai/sdk/helpers/beta/zod'));
const schema = z.object({ reply: z.string() });
console.log('zod root has toJSONSchema:', typeof z.toJSONSchema);
try {
  const fmt = betaZodOutputFormat(schema);
  console.log('NO THROW', JSON.stringify(fmt).slice(0,200));
} catch (e) {
  console.log('THROW:', e.constructor.name, ':', e.message);
  console.log(e.stack.split('\n').slice(0,8).join('\n'));
}
