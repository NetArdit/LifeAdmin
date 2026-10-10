import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const BASE='http://localhost:3001', ROOT='C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const srv=spawn('node',['server.js'],{cwd:ROOT,env:{...process.env,LIFEADMIN_DB_PATH:process.env.AUDIT_DB,NODE_ENV:'development',PORT:'3001'},stdio:'ignore'});
for(let i=0;i<160;i++){try{const r=await fetch(BASE+'/api/config');if(r.ok)break;}catch{}await sleep(250);}
const b=await chromium.launch({channel:'msedge',headless:true});
const p=await(await b.newContext({viewport:{width:1280,height:900}})).newPage();
await p.goto(BASE,{waitUntil:'networkidle'});await p.click('#switch-mode');
await p.fill('#f-firstName','K');await p.fill('#f-lastName','B');await p.fill('#f-email',`kbd2.${Date.now()}@test.local`);
await p.fill('#f-phone','+38344'+String(Math.floor(100000+Math.random()*899999)));await p.fill('#f-password','auditpass12345');await p.fill('#f-confirmPassword','auditpass12345');
await p.click('#submit-btn');await p.waitForSelector('.page-title');
await p.evaluate(async()=>{await fetch('/api/family',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Kbd family'})});});
await p.evaluate(()=>{location.hash='#/family';});await p.waitForSelector('.tab');await p.waitForTimeout(500);
const info=await p.evaluate(()=>[...document.querySelectorAll('.tab')].map(t=>({text:t.textContent.trim(),tag:t.tagName,tabindex:t.getAttribute('tabindex'),role:t.getAttribute('role')})));
console.log('family .tab elements:',JSON.stringify(info));
await p.evaluate(()=>document.activeElement&&document.activeElement.blur());
const reached=new Set();
for(let i=0;i<60;i++){await p.keyboard.press('Tab');const t=await p.evaluate(()=>{const a=document.activeElement;return a&&a.classList.contains('tab')?a.textContent.trim():null;});if(t)reached.add(t);}
console.log('tab labels that received keyboard focus in 60 Tab presses:',JSON.stringify([...reached]));
srv.kill();await b.close();process.exit(0);
