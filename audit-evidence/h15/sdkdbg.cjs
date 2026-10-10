const http=require('node:http');
const Anthropic=require('@anthropic-ai/sdk');const {betaZodOutputFormat}=require('@anthropic-ai/sdk/helpers/beta/zod');const {z}=require('zod');
(async()=>{
const seen=[];
const mock=http.createServer((req,res)=>{let b='';req.on('data',c=>b+=c);req.on('end',()=>{seen.push(req.method+' '+req.url);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({id:'m',type:'message',role:'assistant',model:'mock',content:[{type:'text',text:'{"reply":"ok"}'}],stop_reason:'end_turn',stop_sequence:null,usage:{input_tokens:1,output_tokens:1}}));});});
await new Promise(r=>mock.listen(0,'127.0.0.1',r));
const c=new Anthropic({apiKey:'sk-ant-x',baseURL:'http://127.0.0.1:'+mock.address().port,maxRetries:0});
try{const r=await c.beta.messages.parse({model:'claude-opus-5',max_tokens:100,system:'s',output_config:{effort:'medium',format:betaZodOutputFormat(z.object({reply:z.string()}))},messages:[{role:'user',content:'hi'}]});console.log('OK',JSON.stringify(r.parsed_output),seen);}catch(e){console.log('ERR',e.name,e.message.slice(0,300),seen);}
mock.close();process.exit(0);})();
