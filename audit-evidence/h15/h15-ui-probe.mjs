import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const BASE='http://localhost:3001', ROOT='C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const srv=spawn('node',['server.js'],{cwd:ROOT,env:{...process.env,LIFEADMIN_DB_PATH:process.env.H15_DB,NODE_ENV:'development',PORT:'3001'},stdio:'ignore'});
for(let i=0;i<160;i++){try{const r=await fetch(BASE+'/api/config');if(r.ok)break;}catch{}await sleep(250);}
const b=await chromium.launch({channel:'msedge',headless:true});
async function user(name){const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();await p.goto(BASE,{waitUntil:'networkidle'});await p.click('#switch-mode');
 await p.fill('#f-firstName',name);await p.fill('#f-lastName','T');await p.fill('#f-email',`h15.${name}.${Date.now()}@test.local`);await p.fill('#f-phone','+38344'+String(Math.floor(100000+Math.random()*899999)));await p.fill('#f-password','h15pass123456');await p.fill('#f-confirmPassword','h15pass123456');await p.click('#submit-btn');await p.waitForSelector('.page-title');return p;}
const api=(p,path,m='GET',body)=>p.evaluate(async([a,b2,c])=>{const r=await fetch(a,{method:b2,headers:{'Content-Type':'application/json'},body:c?JSON.stringify(c):undefined});return {status:r.status,data:await r.json().catch(()=>null)};},[path,m,body]);
const O=await user('Olga'), M=await user('Mark');
const fam=(await api(O,'/api/family','POST',{name:'UI Fam'})).data.family;
await api(M,'/api/family/join','POST',{code:fam.inviteCode});
const mId=(await api(M,'/api/auth/me')).data.user.id;
// U1: private task WITH family_id (API-only state; also what the UI produces when a family task is edited to "no family")
const priv=(await api(O,'/api/tasks','POST',{title:'U1 private with family',familyId:fam.id,visibility:'private'})).data.task;
await O.evaluate(()=>{location.hash='#/tasks';});await O.reload({waitUntil:'networkidle'});
await O.click('text=U1 private with family');await O.waitForSelector('.section-title');await O.click('button:has-text("Edit")');await O.waitForSelector('#task-form');
const sel=await O.$eval('#task-form [name=familyId]',e=>({value:e.value,options:[...e.options].map(o=>o.textContent)}));
console.log('U1 edit form family select preselected value =',JSON.stringify(sel));
await O.fill('#task-form [name=description]','only changed the description');await O.click('#save-task-btn');await O.waitForTimeout(900);
const after=(await api(O,'/api/tasks')).data.tasks.find(t=>t.id===priv.id);
console.log('U1 after an ordinary edit (description only) by the OWNER: visibility =',after.visibility,'(was private); another member can now read it:',(await api(M,`/api/tasks/${priv.id}`)).status===200);
// U2: ordinary member edits the owner's family task, clears the family
const fam2=(await api(O,'/api/tasks','POST',{title:'U2 family task',familyId:fam.id,visibility:'family'})).data.task;
await M.evaluate(()=>{location.hash='#/tasks';});await M.reload({waitUntil:'networkidle'});
await M.click('text=U2 family task');await M.waitForSelector('.section-title');
const btns=await M.locator('.modal-panel button').allTextContents();
console.log('U2 buttons a non-owner member sees in the task detail:',JSON.stringify(btns.map(x=>x.trim()).filter(Boolean)));
await M.click('button:has-text("Edit")');await M.waitForSelector('#task-form');await M.selectOption('#task-form [name=familyId]','');await M.click('#save-task-btn');await M.waitForTimeout(900);
const t2=db2=>db2;
const owner=(await api(O,`/api/tasks/${fam2.id}`));
console.log('U2 member cleared the family in the edit form -> task visibility now:',owner.data.task.visibility,'; task list for the family (Overview) as owner still includes it:',(await api(O,`/api/tasks?familyId=${fam.id}`)).data.tasks.some(t=>t.id===fam2.id),'; visible to the member who changed it:',(await api(M,`/api/tasks/${fam2.id}`)).status);
// U3: plain member sees the invite code card
await M.evaluate(()=>{location.hash='#/family';});await M.reload({waitUntil:'networkidle'});await M.waitForSelector('.family-tabs-wrap');
console.log('U3 plain member Overview shows invite code card:',await M.locator('.card:has(.card-title:has-text("Invite code")) code').count()===1,'; has New-invite-code button:',await M.locator('button:has-text("New invite code")').count());
srv.kill();await b.close();process.exit(0);
