const path = require('path');
const http = require('http');
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const Anthropic = require(path.join(ROOT, 'node_modules/@anthropic-ai/sdk'));
const { z } = require(path.join(ROOT, 'node_modules/zod'));

(async () => {
  const mock = http.createServer((req, res) => {
    let body = ''; req.on('data', c => body += c);
    req.on('end', () => {
      console.log('MOCK SAW request body keys:', Object.keys(JSON.parse(body)));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: 'msg_1', type: 'message', role: 'assistant', model: 'mock',
        content: [{ type: 'text', text: JSON.stringify({ reply: 'hello there', suggestions: ['a', 'b'] }) }],
        stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 },
      }));
    });
  });
  await new Promise(r => mock.listen(0, '127.0.0.1', r));
  const client = new Anthropic({ apiKey: 'sk-ant-fake', baseURL: `http://127.0.0.1:${mock.address().port}` });

  // Fake, non-throwing stand-in for the broken betaZodOutputFormat, to isolate the SEPARATE
  // question: does output_config.format even get read by this SDK version?
  const AssistantReplySchema = z.object({ reply: z.string(), suggestions: z.array(z.string()).max(4) });
  const fakeFormat = { type: 'json_schema', schema: { type: 'object', properties: { reply: { type: 'string' } } }, parse: (c) => AssistantReplySchema.parse(JSON.parse(c)) };

  console.log('\n=== Reproducing the APP\'S CURRENT wiring: output_config: { effort, format } ===');
  const r1 = await client.beta.messages.parse({
    model: 'claude-opus-5', max_tokens: 200, system: 's',
    output_config: { effort: 'medium', format: fakeFormat },
    messages: [{ role: 'user', content: 'hi' }],
  });
  console.log('parsed_output (expect null — output_config is not read by this SDK):', JSON.stringify(r1.parsed_output));

  console.log('\n=== Using output_format directly (what this SDK version actually reads) ===');
  const r2 = await client.beta.messages.parse({
    model: 'claude-opus-5', max_tokens: 200, system: 's',
    output_format: fakeFormat,
    messages: [{ role: 'user', content: 'hi' }],
  });
  console.log('parsed_output:', JSON.stringify(r2.parsed_output));

  mock.close();
})();
