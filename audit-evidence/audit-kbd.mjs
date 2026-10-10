import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const BASE='http://localhost:3001', ROOT='C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const srv=spawn('node',['server.js'],{cwd:ROOT,env:{...process.env,LIFEADMIN_DB_PATH:process.env.AUDIT_DB,NODE_ENV:'development',PORT:'3001'},stdio:'ignore'});
for(let i=0;i<160;i++){try{const r=await fetch(BASE+'/api/config');if(r.ok)break;}catch{}await sleep(250);}
const b=await chromium.launch({channel:'msedge',headless:true});
const p=await(await b.newContext({viewport:{width:1280,height:900}})).newPage();
await p.goto(BASE,{waitUntil:'networkidle'});await p.click('#switch-mode');
await p.fill('#f-firstName','K');await p.fill('#f-lastName','B');await p.fill('#f-email',`kbd.${Date.now()}@test.local`);
await p.fill('#f-phone','+38344'+String(Math.floor(100000+Math.random()*899999)));await p.fill('#f-password','auditpass12345');await p.fill('#f-confirmPassword','auditpass12345');
await p.click('#submit-btn');await p.waitForSelector('.page-title');
await p.evaluate(async()=>{await fetch('/api/demo/seed',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});});
for(const [name,hash,openSel] of [['tasks','#/tasks','.row-item'],['billsense','#/billsense','.row-item'],['decisionflow','#/decisionflow','.row-item'],['goals','#/goals','.goal-card']]){
  await p.evaluate(h=>{location.hash=h;},hash);await p.waitForTimeout(900);
  await p.evaluate(()=>document.activeElement&&document.activeElement.blur());
  const stops=[];
  for(let i=0;i<60;i++){await p.keyboard.press('Tab');stops.push(await p.evaluate(()=>{const a=document.activeElement;if(!a)return 'none';const inMain=!!a.closest('#page-root');return (inMain?'[main] ':'')+a.tagName.toLowerCase()+(a.getAttribute('aria-label')?`(${a.getAttribute('aria-label')})`:`:${(a.textContent||'').trim().slice(0,16)}`);}));}
  const mainStops=stops.filter(s=>s.startsWith('[main]'));
  // try activating the first row with keyboard: focus first .row-title via Enter on each main stop
  console.log(`${name}: ${mainStops.length} focus stops inside the page content in 60 Tabs; unique: ${[...new Set(mainStops)].slice(0,12).join(' | ')}`);
}
// can a task detail be opened by keyboard? press Enter/Space on every focus stop inside tasks list and see if a modal opens
await p.evaluate(()=>{location.hash='#/tasks';});await p.waitForTimeout(900);
await p.evaluate(()=>document.activeElement&&document.activeElement.blur());
let opened=false;
for(let i=0;i<40&&!opened;i++){await p.keyboard.press('Tab');const inMain=await p.evaluate(()=>!!document.activeElement.closest('#page-root'));if(!inMain)continue;await p.keyboard.press('Enter');await p.waitForTimeout(150);if(await p.locator('.modal-panel').count()){opened=true;}}
console.log('Tasks: a task detail modal can be opened using only Tab + Enter:', opened);
srv.kill();await b.close();process.exit(0);
