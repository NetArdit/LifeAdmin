// Mutation check: each mutation re-introduces one of the original defects. The named test file MUST fail.
const fs = require('fs');
const { spawnSync } = require('child_process');
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
process.chdir(ROOT);

const muts = [
  ['M1 NULL-unsafe predicate (COALESCE removed)', 'src/lib/taskAccess.js', "return `COALESCE((\n    CASE", "return `((\n    CASE", "  ), 0)`;", "  ))`;", 'test/task-access-predicate.test.js'],
  ['M2 old rule: owner/assignee keep access without membership', 'src/lib/taskAccess.js', "if (isFamilyScoped(task)) return isCurrentMember(userId, task.family_id);", "if (isFamilyScoped(task)) return task.owner_id === userId || task.assigned_to === userId || isCurrentMember(userId, task.family_id);", null, null, 'test/hardening15-authorization.test.js'],
  ['M3 visibility changeable by anyone who can see the task', 'src/routes/tasks.js', "if (!isOwner) throw forbidden('Only the task owner can change who can see a task.');", "", null, null, 'test/hardening15-authorization.test.js'],
  ['M4 assignee changeable by anyone who can see the task', 'src/routes/tasks.js', "if (!isOwner) throw forbidden('Only the task owner can change the assignee.');", "", null, null, 'test/hardening15-authorization.test.js'],
  ['M5 notifications not filtered', 'src/lib/linkedTaskFilter.js', "AND NOT ${taskAccessSql('lt', userId)}", "AND 0", null, null, 'test/hardening15-authorization.test.js'],
  ['M6 invite code returned to every member', 'src/routes/family.js', "if (viewer && viewer.role === 'owner' && f.owner_id === viewerId) out.inviteCode = f.invite_code;", "out.inviteCode = f.invite_code;", null, null, 'test/hardening15-authorization.test.js'],
  ['M7 legacy 8-char codes not rotated', 'src/db/index.js', "SELECT id FROM families WHERE length(invite_code) = 8", "SELECT id FROM families WHERE 0", null, null, 'test/hardening15-authorization.test.js'],
  ['M8 visibility echoed unchanged is treated as a change (presence check)', 'src/routes/tasks.js', "if (b.visibility !== undefined && b.visibility !== t.visibility) {", "if (b.visibility !== undefined) {", null, null, 'test/hardening15-authorization.test.js'],
  ['M9 orphaned-task delete open to any member', 'src/lib/taskAccess.js', "return !!m && m.role === 'owner';", "return !!m;", null, null, 'test/task-access-predicate.test.js'],
];

for (const [name, file, a, b, a2, b2, testFile] of muts) {
  const orig = fs.readFileSync(file, 'utf8');
  if (!orig.includes(a)) { console.log(`?? ${name}: anchor missing`); continue; }
  let mutated = orig.replace(a, () => b);
  if (a2) { if (!mutated.includes(a2)) { console.log(`?? ${name}: anchor2 missing`); continue; } mutated = mutated.replace(a2, () => b2); }
  fs.writeFileSync(file, mutated);
  let res;
  try { res = spawnSync(process.execPath, ['--test', testFile], { encoding: 'utf8', timeout: 240000 }); }
  finally { fs.writeFileSync(file, orig); }
  const failed = /ℹ fail (\d+)/.exec(res.stdout || '');
  const n = failed ? Number(failed[1]) : -1;
  console.log(`${n > 0 ? 'CAUGHT ' : 'MISSED!'}  ${name}  (failing tests: ${n})`);
}
