const http=require('node:http');const P='C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
(async()=>{
const seen=[];
const mock=http.createServer((req,res)=>{let b='';req.on('data',c=>b+=c);req.on('end',()=>{seen.push({url:req.url,method:req.method,len:b.length});res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({id:'msg_mock',type:'message',role:'assistant',model:'mock',content:[{type:'text',text:JSON.stringify({reply:'ok',suggestions:[]})}],stop_reason:'end_turn',stop_sequence:null,usage:{input_tokens:1,output_tokens:1}}));});});
await new Promise(r=>mock.listen(0,'127.0.0.1',r));
process.env.ANTHROPIC_API_KEY='sk-ant-FAKE';process.env.ANTHROPIC_BASE_URL='http://127.0.0.1:'+mock.address().port;
const {startApp,makeClient,signUp}=require(P+'/test/helpers.js');const app=await startApp();
const c=makeClient(app.base);await signUp(c);
const r=await c.post('/api/ai/chat',{message:'hello family tasks'});
console.log('status',r.status,JSON.stringify(r.data),'mock saw',JSON.stringify(seen));
await app.close();mock.close();process.exit(0);})();
