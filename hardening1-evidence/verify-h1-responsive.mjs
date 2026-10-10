import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const BASE='http://localhost:3001', ROOT='C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const SHOT='./screenshots-h1'; fs.mkdirSync(SHOT,{recursive:true});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const srv=spawn('node',['server.js'],{cwd:ROOT,env:{...process.env,LIFEADMIN_DB_PATH:process.env.H1_DB,NODE_ENV:'development',PORT:'3001'},stdio:'ignore'});
for(let i=0;i<160;i++){try{const r=await fetch(BASE+'/api/config');if(r.ok)break;}catch{}await sleep(250);}
const results=[];const log=(l,ok,d='')=>{results.push(ok);console.log(`[${ok?'PASS':'FAIL'}] ${l}${d?' — '+d:''}`);};
const b=await chromium.launch({channel:'msedge',headless:true});
const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();
await p.goto(BASE,{waitUntil:'networkidle'});await p.click('#switch-mode');
await p.fill('#f-firstName','Resp');await p.fill('#f-lastName','Owner');await p.fill('#f-email',`h1r.${Date.now()}@test.local`);
await p.fill('#f-phone','+38344'+String(Math.floor(100000+Math.random()*899999)));await p.fill('#f-password','h1pass123456');await p.fill('#f-confirmPassword','h1pass123456');
await p.click('#submit-btn');await p.waitForSelector('.page-title');
await p.evaluate(async()=>{await fetch('/api/family',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'The Extraordinarily Long Family Name Household '+'X'.repeat(40)})});});
const ov=()=>p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
for(const w of [320,375,414,768,1280]){
  const h=w>=768?900:740;await p.setViewportSize({width:w,height:h});
  await p.evaluate(()=>{location.hash='#/family';});await p.reload({waitUntil:'networkidle'});await p.waitForSelector('button:has-text("New invite code")');
  const box=await p.locator('button:has-text("New invite code")').boundingBox();
  const codeBox=await p.locator('.card:has(.card-title:has-text("Invite code")) code').boundingBox();
  log(`${w}px: Overview tab has no horizontal overflow; "New invite code" (h=${Math.round(box.height)}) and the code sit inside the viewport`,(await ov())<=1&&box.x>=0&&box.x+box.width<=w&&codeBox.x>=0&&codeBox.x+codeBox.width<=w);
  await p.click('button:has-text("New invite code")');await p.waitForSelector('.modal-panel');await p.waitForTimeout(350);
  const pn=await p.locator('.modal-panel').boundingBox();const cb=await p.locator('.modal-footer button:has-text("Create new code")').boundingBox();
  log(`${w}px: rotation dialog fits with both buttons reachable`,pn.x>=0&&pn.x+pn.width<=w+0.5&&pn.y+pn.height<=h+0.5&&cb.x>=0&&cb.x+cb.width<=w&&(await ov())<=1);
  if(w===320||w===1280)await p.screenshot({path:`${SHOT}/resp-${w}-rotate-dialog.png`});
  await p.keyboard.press('Escape');
  // join dialog
  await p.click('button:has-text("Join with a code")');await p.waitForSelector('.modal-panel');await p.waitForTimeout(300);
  const jp=await p.locator('.modal-panel').boundingBox();
  log(`${w}px: join dialog fits`,jp.x>=0&&jp.x+jp.width<=w+0.5&&(await ov())<=1);
  await p.keyboard.press('Escape');
}
// keyboard: button focusable, Enter opens the dialog, focus lands on Cancel, Escape returns focus
await p.setViewportSize({width:1280,height:900});await p.evaluate(()=>{location.hash='#/family';});await p.reload({waitUntil:'networkidle'});
await p.waitForSelector('button:has-text("New invite code")');
await p.locator('button:has-text("New invite code")').focus();await p.keyboard.press('Enter');await p.waitForSelector('.modal-panel');
const act=await p.evaluate(()=>document.activeElement.textContent.trim());
log('keyboard: focused "New invite code" opens the dialog with focus on the safe choice (Cancel)',act==='Cancel',act);
await p.keyboard.press('Escape');
const back=await p.evaluate(()=>document.activeElement.textContent.trim());
log('Escape returns focus to the button',back==='New invite code',back);
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
srv.kill();await b.close();process.exit(0);
